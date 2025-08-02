import torch
from typing import Union, List
from torch import Tensor, nn
from transformers import CLIPTextModel, CLIPTokenizer, T5EncoderModel, T5Tokenizer

class HFEmbedder(nn.Module):
    def __init__(self, version: str, max_length: int, torch_dtype = torch.bfloat16, device: Union[str, torch.device] = "cuda", **hf_kwargs):
        super().__init__()
        self.is_clip = version.startswith("openai")
        self.max_length = max_length
        self.output_key = "pooler_output" if self.is_clip else "last_hidden_state"

        if self.is_clip:
            self.tokenizer: CLIPTokenizer = CLIPTokenizer.from_pretrained(version, max_length=max_length)
            self.hf_module: CLIPTextModel = self.load_clip(version, device=device, torch_dtype=torch_dtype, **hf_kwargs)
        else:
            self.tokenizer: T5Tokenizer = T5Tokenizer.from_pretrained(version, max_length=max_length)
            self.hf_module: T5EncoderModel = self.load_t5(version, device=device, torch_dtype=torch_dtype, **hf_kwargs)

        self.hf_module = self.hf_module.eval().requires_grad_(False)
        self.device = self.hf_module.device
        self.hf_module.compile()


    def load_t5(self, version: str, device: Union[str, torch.device] = "cuda", torch_dtype = torch.bfloat16, **hf_kwargs):
        t5 = T5EncoderModel.from_pretrained(version, torch_dtype=torch_dtype, **hf_kwargs)
        return t5.to(device)
    
    def load_clip(self, version: str, device: Union[str, torch.device] = "cuda", torch_dtype = torch.bfloat16, **hf_kwargs):
        clip = CLIPTextModel.from_pretrained(version, torch_dtype=torch_dtype, **hf_kwargs)
        return clip.to(device)

    def forward(self, text: List[str]) -> Tensor:
        batch_encoding = self.tokenizer(
            text,
            truncation=True,
            max_length=self.max_length,
            return_length=False,
            return_overflowing_tokens=False,
            padding="max_length",
            return_tensors="pt",
        )

        input_ids = batch_encoding["input_ids"].to(self.hf_module.device)

        outputs = self.hf_module(
            input_ids=input_ids,
            attention_mask=None,
            output_hidden_states=False,
        )

        return outputs[self.output_key]