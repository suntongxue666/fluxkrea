import torch
from einops import rearrange
from PIL import Image

from src.flux.sampling import denoise, get_noise, get_schedule, prepare, unpack
from src.flux.util import (
    load_ae,
    load_clip,
    load_flow_model,
    load_t5,
)

class Pipeline:
    def __init__(
        self,
        model_type,
        device,
        sigma: float = 1.0,
        y1: float = 0.5,
        y2: float = 1.15,
        dtype: torch.dtype = torch.bfloat16,
    ):
        self.device = torch.device(device)
        self.clip = load_clip(self.device)
        self.t5 = load_t5(self.device, max_length=512)
        self.ae = load_ae(model_type, device=self.device)
        self.model = load_flow_model(model_type, device=self.device)

        self.y1 = y1
        self.y2 = y2
        self.sigma = sigma
        self.dtype = dtype

    def __call__(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
        guidance: float = 4.5,
        num_steps: int = 32,
        seed: int = 42,
    ):
        width = 16 * (width // 16)
        height = 16 * (height // 16)

        x = get_noise(1, height, width, device=self.device, dtype=self.dtype, seed=seed)
        b, c, h, w = x.shape
        timesteps = get_schedule(
            num_steps,
            (w // 2) * (h // 2),
            base_shift = self.y1,
            max_shift = self.y2,
            sigma = self.sigma,
        )

        with torch.no_grad():
            inp = prepare(t5=self.t5, clip=self.clip, img=x, prompt=[prompt])
            x = denoise(
                self.model,
                **inp,
                timesteps=timesteps,
                guidance=guidance,
            )

            x = unpack(x, height, width)
            x = self.ae.decode(x)

        x1 = x.clamp(-1, 1)
        x1 = rearrange(x1[-1], "c h w -> h w c")
        img = Image.fromarray((127.5 * (x1 + 1.0)).cpu().byte().numpy())

        return img        
        

class Sampler(Pipeline):
    def __init__(self, clip, t5, ae, model, device, dtype,  y1: float = 0.5, y2: float = 1.15, sigma: float = 1.0):
        self.clip = clip
        self.t5 = t5
        self.ae = ae
        self.model = model
        self.model.eval()
        self.device = device
        self.y1 = y1
        self.y2 = y2
        self.sigma = sigma
        self.dtype = dtype