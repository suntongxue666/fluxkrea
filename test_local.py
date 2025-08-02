#!/usr/bin/env python3
"""
本地测试脚本 - 不依赖外部模型下载
"""
import torch
from src.flux.model import Flux, FluxParams
from src.flux.modules.autoencoder import AutoEncoder, AutoEncoderParams
from src.flux.modules.conditioner import HFEmbedder
from src.flux.sampling import get_noise, get_schedule

def test_model_creation():
    """测试模型创建是否正常"""
    print("🧪 测试模型创建...")
    
    # 创建小一点的测试参数
    flux_params = FluxParams(
        in_channels=16,  # 减小
        vec_in_dim=768,
        context_in_dim=768,  # 减小
        hidden_size=512,  # 减小
        mlp_ratio=2.0,  # 减小
        num_heads=8,  # 减小
        depth=2,  # 减小
        depth_single_blocks=2,  # 减小
        axes_dim=[16, 28, 28],  # 减小
        theta=10_000,
        qkv_bias=True,
        guidance_embed=True,
    )
    
    ae_params = AutoEncoderParams(
        resolution=64,  # 减小
        in_channels=3,
        ch=64,  # 减小
        out_ch=3,
        ch_mult=[1, 2],  # 减小
        num_res_blocks=1,  # 减小
        z_channels=8,  # 减小
        scale_factor=0.3611,
        shift_factor=0.1159,
    )
    
    try:
        # 测试 Flux 模型创建
        print("  ✓ 创建 Flux 模型...")
        model = Flux(flux_params)
        print(f"  ✓ Flux 模型创建成功: {sum(p.numel() for p in model.parameters()):,} 参数")
        
        # 测试 AutoEncoder 创建
        print("  ✓ 创建 AutoEncoder...")
        ae = AutoEncoder(ae_params)
        print(f"  ✓ AutoEncoder 创建成功: {sum(p.numel() for p in ae.parameters()):,} 参数")
        
        # 测试数据流
        print("  ✓ 测试数据流...")
        batch_size = 1
        img_size = 32
        seq_len = (img_size // 2) * (img_size // 2)
        
        # 创建测试输入
        img = torch.randn(batch_size, seq_len, flux_params.in_channels)
        img_ids = torch.zeros(batch_size, seq_len, 3)
        txt = torch.randn(batch_size, 77, flux_params.context_in_dim)
        txt_ids = torch.zeros(batch_size, 77, 3) 
        timesteps = torch.randn(batch_size)
        y = torch.randn(batch_size, flux_params.vec_in_dim)
        guidance = torch.randn(batch_size) if flux_params.guidance_embed else None
        
        # 前向传播测试
        with torch.no_grad():
            output = model(img, img_ids, txt, txt_ids, timesteps, y, guidance)
            print(f"  ✓ 模型前向传播成功: 输出形状 {output.shape}")
        
        # 测试 AutoEncoder
        test_img = torch.randn(1, 3, 64, 64)
        with torch.no_grad():
            encoded = ae.encode(test_img)
            decoded = ae.decode(encoded)
            print(f"  ✓ AutoEncoder 测试成功: {test_img.shape} -> {encoded.shape} -> {decoded.shape}")
        
        print("🎉 所有测试通过！代码结构正确。")
        return True
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_sampling_functions():
    """测试采样相关函数"""
    print("\n🧪 测试采样函数...")
    
    try:
        # 测试噪声生成
        noise = get_noise(1, 64, 64, device="cpu", dtype=torch.float32, seed=42)
        print(f"  ✓ 噪声生成成功: {noise.shape}")
        
        # 测试时间步生成
        timesteps = get_schedule(4, 64*64//4, shift=False)
        print(f"  ✓ 时间步生成成功: {len(timesteps)} 步")
        
        print("🎉 采样函数测试通过！")
        return True
        
    except Exception as e:
        print(f"❌ 采样函数测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 开始测试 FLUX 代码结构...")
    print("=" * 50)
    
    success1 = test_model_creation()
    success2 = test_sampling_functions()
    
    print("\n" + "=" * 50)
    if success1 and success2:
        print("✅ 所有测试通过！你的 FLUX 实现已准备就绪。")
        print("\n📝 要运行完整推理，你需要:")
        print("1. 在 https://huggingface.co 注册账户")
        print("2. 申请访问 FLUX 模型权限")
        print("3. 使用 'huggingface-hub login' 登录")
        print("4. 然后运行: python3 inference.py -p 'your prompt' --device cpu")
    else:
        print("❌ 部分测试失败，请检查代码。")