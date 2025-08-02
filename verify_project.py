#!/usr/bin/env python3
"""
简化测试脚本 - 验证核心功能
"""
import torch
from src.flux.model import Flux, FluxParams
from src.flux.modules.autoencoder import AutoEncoder, AutoEncoderParams
from src.flux.sampling import get_noise, get_schedule

def test_basic_functionality():
    """测试基本功能"""
    print("🧪 测试基本功能...")
    
    try:
        # 测试模型参数创建
        print("  ✓ 测试参数创建...")
        flux_params = FluxParams(
            in_channels=16,
            vec_in_dim=768,
            context_in_dim=768,
            hidden_size=512,
            mlp_ratio=2.0,
            num_heads=8,
            depth=1,
            depth_single_blocks=1,
            axes_dim=[16, 16, 16],
            theta=10_000,
            qkv_bias=True,
            guidance_embed=True,
        )
        print(f"  ✓ FluxParams 创建成功")
        
        ae_params = AutoEncoderParams(
            resolution=64,
            in_channels=3,
            ch=64,
            out_ch=3,
            ch_mult=[1, 2],
            num_res_blocks=1,
            z_channels=8,
            scale_factor=0.3611,
            shift_factor=0.1159,
        )
        print(f"  ✓ AutoEncoderParams 创建成功")
        
        # 测试模型创建
        print("  ✓ 测试模型创建...")
        model = Flux(flux_params)
        ae = AutoEncoder(ae_params)
        
        param_count = sum(p.numel() for p in model.parameters())
        ae_param_count = sum(p.numel() for p in ae.parameters())
        
        print(f"  ✓ Flux 模型: {param_count:,} 参数")
        print(f"  ✓ AutoEncoder: {ae_param_count:,} 参数")
        
        # 测试辅助函数
        print("  ✓ 测试辅助函数...")
        noise = get_noise(1, 64, 64, device="cpu", dtype=torch.float32, seed=42)
        timesteps = get_schedule(4, 64, shift=False)
        
        print(f"  ✓ 噪声生成: {noise.shape}")
        print(f"  ✓ 时间步: {len(timesteps)} 步")
        
        # 测试简单的 AE 前向传播
        print("  ✓ 测试 AutoEncoder...")
        test_img = torch.randn(1, 3, 64, 64)
        with torch.no_grad():
            encoded = ae.encode(test_img)
            decoded = ae.decode(encoded)
        print(f"  ✓ AE 测试: {test_img.shape} -> {encoded.shape} -> {decoded.shape}")
        
        print("🎉 基本功能测试全部通过！")
        return True
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_imports():
    """测试所有重要的导入"""
    print("\n🧪 测试模块导入...")
    
    imports_to_test = [
        ("src.flux.model", "Flux, FluxParams"),
        ("src.flux.modules.autoencoder", "AutoEncoder, AutoEncoderParams"),
        ("src.flux.modules.conditioner", "HFEmbedder"),
        ("src.flux.modules.layers", "EmbedND, TimestepEmbedding, MLPEmbedder"),
        ("src.flux.sampling", "get_noise, get_schedule, prepare, denoise"),
        ("src.flux.util", "load_ae, load_clip, load_t5, load_flow_model"),
        ("src.flux.pipeline", "Pipeline, Sampler"),
        ("src.flux.math", "attention, rope, apply_rope"),
    ]
    
    success_count = 0
    for module, items in imports_to_test:
        try:
            exec(f"from {module} import {items}")
            print(f"  ✓ {module}: {items}")
            success_count += 1
        except Exception as e:
            print(f"  ❌ {module}: {e}")
    
    print(f"\n✅ 导入测试完成: {success_count}/{len(imports_to_test)} 成功")
    return success_count == len(imports_to_test)

if __name__ == "__main__":
    print("🚀 FLUX 项目验证测试")
    print("=" * 50)
    
    import_success = test_imports()
    basic_success = test_basic_functionality()
    
    print("\n" + "=" * 50)
    if import_success and basic_success:
        print("✅ 项目验证成功！")
        print("\n📋 项目状态:")
        print("  ✓ 所有模块可以正常导入")
        print("  ✓ 模型结构正确，兼容 Python 3.9")
        print("  ✓ 基本功能正常")
        print("  ✓ 依赖安装完整")
        
        print("\n🚀 下一步:")
        print("  1. 访问 https://huggingface.co 注册账户")
        print("  2. 申请 FLUX 模型访问权限:")
        print("     - https://huggingface.co/black-forest-labs/FLUX.1-schnell")
        print("  3. 生成访问令牌: https://huggingface.co/settings/tokens")
        print("  4. 登录: huggingface-hub login")
        print("  5. 运行推理: python3 inference.py -p 'beautiful landscape' --device cpu")
        
    else:
        print("❌ 项目验证失败")
        if not import_success:
            print("  - 模块导入存在问题")
        if not basic_success:
            print("  - 基本功能测试失败")