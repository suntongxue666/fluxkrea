import math
from typing import Callable, List, Dict

import torch
from einops import rearrange, repeat
from torch import Tensor
from tqdm import tqdm
from .model import Flux
from .modules.conditioner import HFEmbedder

def get_noise(
    num_samples: int,
    height: int,
    width: int,
    device: torch.device,
    dtype: torch.dtype,
    seed: int = None,
):
    generator = torch.Generator(device=device).manual_seed(seed) if seed else None
    return torch.randn(
        num_samples,
        16,
        # allow for packing
        2 * math.ceil(height / 16),
        2 * math.ceil(width / 16),
        device=device,
        dtype=dtype,
        generator=generator
    )


def prepare(t5: HFEmbedder, clip: HFEmbedder, img: Tensor, prompt: List[str]) -> Dict[str, Tensor]:
    bs, c, h, w = img.shape
    img = rearrange(img, "b c (h ph) (w pw) -> b (h w) (c ph pw)", ph=2, pw=2)

    img_ids = torch.zeros(h // 2, w // 2, 3)
    img_ids[..., 1] = img_ids[..., 1] + torch.arange(h // 2)[:, None]
    img_ids[..., 2] = img_ids[..., 2] + torch.arange(w // 2)[None, :]
    img_ids = repeat(img_ids, "h w c -> b (h w) c", b=bs)

    txt = t5(prompt)
    txt_ids = torch.zeros(bs, t5.max_length, 3)
    vec = clip(prompt)

    outputs = {
        "img": img,
        "img_ids": img_ids.to(img.device),
        "txt": txt.to(img.device),
        "txt_ids": txt_ids.to(img.device),
        "vec": vec.to(img.device),
    }
    
    return outputs

def time_shift(mu: float, sigma: float, t: Tensor):
    return math.exp(mu) / (math.exp(mu) + (1 / t - 1) ** sigma)

def get_lin_function(
    x1: float = 256, y1: float = 0.5, x2: float = 4096, y2: float = 1.15
) -> Callable[[float], float]:
    m = (y2 - y1) / (x2 - x1)
    b = y1 - m * x1
    return lambda x: m * x + b


def get_schedule(
    num_steps: int,
    image_seq_len: int,
    base_shift: float = 0.5,
    max_shift: float = 1.15,
    sigma: float = 1.0,
    shift: bool = True,
) -> List[float]:
    # extra step for zerod
    timesteps = torch.linspace(1, 0, num_steps + 1)

    # shifting the schedule to favor high timesteps for higher signal images
    if shift:
        # eastimate mu based on linear estimation between two points
        mu = get_lin_function(y1=base_shift, y2=max_shift)(image_seq_len)
        timesteps = time_shift(mu, sigma, timesteps)

    return timesteps.tolist()


def denoise(
    model: Flux,
    # model input
    img: Tensor,
    img_ids: Tensor,
    txt: Tensor,
    txt_ids: Tensor,
    vec: Tensor,
    # sampling parameters
    timesteps: List[float],
    guidance: float = 4.0,
):
    b, *_ = img.shape
    guidance = torch.full((b,), guidance, device=img.device, dtype=img.dtype)
    for tcurr, tprev in tqdm(zip(timesteps[:-1], timesteps[1:]), total=len(timesteps) - 1):
        tvec = torch.full((b,), tcurr, dtype=img.dtype, device=img.device)
        pred = model(
            img=img,
            img_ids=img_ids,
            txt=txt,
            txt_ids=txt_ids,
            y=vec,
            timesteps=tvec,
            guidance=guidance,
        )
        img = img + (tprev - tcurr) * pred
        
    return img

def unpack(x: Tensor, height: int, width: int, highres: bool = False) -> Tensor:
    return rearrange(
        x,
        "b (h w) (c ph pw) -> b c (h ph) (w pw)",
        h=math.ceil(height / (32 if highres else 16)),
        w=math.ceil(width / (32 if highres else 16)),
        ph=2,
        pw=2,
    )
