#!/usr/bin/env python3
"""
测试本地FLUX模型集成
"""
import torch
from pathlib import Path
from src.flux.util import load_ae, load_clip, load_t5, load_flow_model
from src.flux.pipeline import Sampler
import uuid
import os

def test_local_generation():
    """测试本地模型生成"""
    try:
        print("🔄 开始测试本地FLUX模型...")
        
        # 配置
        device = "cuda" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.bfloat16
        
        print(f"📱 设备: {device}")
        print(f"🔢 数据类型: {torch_dtype}")
        
        # 加载模型
        print("⏳ 加载模型...")
        
        print("  - 加载AE...")
        ae = load_ae("flux-schnell", device=device)
        
        print("  - 加载CLIP...")
        clip = load_clip(device=device)
        
        print("  - 加载T5...")
        t5 = load_t5(device=device)
        
        print("  - 加载MMDiT...")
        model = load_flow_model("flux-schnell", device=device)
        
        # 移动模型到指定数据类型
        print("🔄 转换数据类型...")
        ae = ae.to(dtype=torch_dtype)
        clip = clip.to(dtype=torch_dtype)
        t5 = t5.to(dtype=torch_dtype)
        model = model.to(dtype=torch_dtype)
        
        # 创建采样器
        print("🎯 创建采样器...")
        sampler = Sampler(
            model=model,
            ae=ae,
            clip=clip,
            t5=t5,
            device=device,
            dtype=torch_dtype,
        )
        
        print("✅ 模型加载完成")
        
        # 生成测试图像
        prompt = "a beautiful sunset over mountains"
        print(f"🎨 生成测试图像: '{prompt}'")
        
        image = sampler(
            prompt=prompt,
            width=512,
            height=512,
            guidance=4.5,
            num_steps=4,
            seed=42,
        )
        
        # 保存图像
        output_dir = "generated_images"
        os.makedirs(output_dir, exist_ok=True)
        
        filename = f"test_{uuid.uuid4()}.png"
        filepath = os.path.join(output_dir, filename)
        image.save(filepath)
        
        print(f"✅ 测试成功！图像已保存到: {filepath}")
        return True
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False

if __name__ == "__main__":
    test_local_generation()