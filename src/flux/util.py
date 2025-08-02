import os
from dataclasses import dataclass
from typing import Union

import torch
from huggingface_hub import hf_hub_download
from safetensors.torch import load_file

from .model import Flux, FluxParams
from .modules.autoencoder import AutoEncoder, AutoEncoderParams
from .modules.conditioner import HFEmbedder

@dataclass
class ModelSpec:
    params: FluxParams
    ae_params: AutoEncoderParams
    ckpt_path: Union[str, None] = None
    ae_path: Union[str, None] = None
    repo_id: Union[str, None] = None
    repo_flow: Union[str, None] = None
    repo_ae: Union[str, None] = None
    repo_id_ae: Union[str, None] = None


configs = {
    "flux-krea-dev": ModelSpec(
        params=FluxParams(
            in_channels=64,
            vec_in_dim=768,
            context_in_dim=4096,
            hidden_size=3072,
            mlp_ratio=4.0,
            num_heads=24,
            depth=19,
            depth_single_blocks=38,
            axes_dim=[16, 56, 56],
            theta=10_000,
            qkv_bias=True,
            guidance_embed=True,
        ),
        ae_params=AutoEncoderParams(
            resolution=256,
            in_channels=3,
            ch=128,
            out_ch=3,
            ch_mult=[1, 2, 4, 4],
            num_res_blocks=2,
            z_channels=16,
            scale_factor=0.3611,
            shift_factor=0.1159,
        ),
        ckpt_path=os.getenv("FLUX"),
        ae_path=os.getenv("AE"),
        repo_id="black-forest-labs/FLUX.1-Krea-dev",
        repo_id_ae="black-forest-labs/FLUX.1-Krea-dev",
        repo_ae="ae.safetensors",
        repo_flow="flux1-krea-dev.safetensors"
    ),
    "flux-schnell": ModelSpec(
        params=FluxParams(
            in_channels=64,
            vec_in_dim=768,
            context_in_dim=4096,
            hidden_size=3072,
            mlp_ratio=4.0,
            num_heads=24,
            depth=19,
            depth_single_blocks=38,
            axes_dim=[16, 56, 56],
            theta=10_000,
            qkv_bias=True,
            guidance_embed=False,  # schnell version doesn't use guidance
        ),
        ae_params=AutoEncoderParams(
            resolution=256,
            in_channels=3,
            ch=128,
            out_ch=3,
            ch_mult=[1, 2, 4, 4],
            num_res_blocks=2,
            z_channels=16,
            scale_factor=0.3611,
            shift_factor=0.1159,
        ),
        ckpt_path=os.getenv("FLUX"),
        ae_path=os.getenv("AE"),
        repo_id="black-forest-labs/FLUX.1-schnell",
        repo_id_ae="black-forest-labs/FLUX.1-schnell",
        repo_ae="ae.safetensors",
        repo_flow="flux1-schnell.safetensors"
    ),
}

def load_from_repo_id(repo_id, checkpoint_name):
    ckpt_path = hf_hub_download(repo_id, checkpoint_name)
    sd = load_file(ckpt_path, device='cpu')
    return sd    

def load_flow_model(name: str, device: Union[str, torch.device] = "cuda", hf_download: bool = True):
    ckpt_path = configs[name].ckpt_path
    if (
        ckpt_path is None
        and configs[name].repo_id is not None
        and configs[name].repo_flow is not None
        and hf_download
    ):
        ckpt_path = hf_hub_download(configs[name].repo_id, configs[name].repo_flow)

    if ckpt_path is not None:
        sd = load_file(ckpt_path, device=str(device))
        config = configs[name].params
        config.in_channels = sd["img_in.weight"].shape[1]

    print("Initialising model")
    with torch.device("meta"):
        model = Flux(config)
    model = model.to(dtype=torch.bfloat16)

    if ckpt_path is not None:
        print(f"Loading flow checkpoint to model from {ckpt_path}")
        model.load_state_dict(sd, strict=False, assign=True)
    
    return model

def load_t5(device: Union[str, torch.device] = "cuda", max_length: int = 512) -> HFEmbedder:
    embedder = HFEmbedder("google/t5-v1_1-xxl", max_length=max_length, torch_dtype=torch.bfloat16, device=device)
    return embedder

def load_clip(device: Union[str, torch.device] = "cuda") -> HFEmbedder:
    embedder = HFEmbedder("openai/clip-vit-large-patch14", max_length=77, torch_dtype=torch.bfloat16, device=device)
    return embedder

def load_ae(name: str, device: Union[str, torch.device] = "cuda", hf_download: bool = True) -> AutoEncoder:
    ckpt_path = configs[name].ae_path
    if (
        ckpt_path is None
        and configs[name].repo_id is not None
        and configs[name].repo_ae is not None
        and hf_download
    ):
        ckpt_path = hf_hub_download(configs[name].repo_id_ae, configs[name].repo_ae)

    with torch.device("meta"):
        ae = AutoEncoder(configs[name].ae_params)
        ae = ae.to_empty(device=device)
        ae = ae.to(dtype=torch.bfloat16)

    if ckpt_path is not None:
        print(f"Loading AE checkpoint from path {ckpt_path}")
        sd = load_file(ckpt_path, device=str(device))
        ae.load_state_dict(sd, strict=False, assign=True)

    return ae