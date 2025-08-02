#!/usr/bin/env python3
"""
Hugging Face 登录脚本
"""
import sys
from huggingface_hub import login

def main():
    print("请输入你的 Hugging Face 令牌:")
    print("(令牌类似: hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)")
    print()
    
    token = input("令牌: ").strip()
    
    if not token:
        print("❌ 令牌不能为空")
        return
    
    if not token.startswith('hf_'):
        print("❌ 令牌格式不正确，应该以 'hf_' 开头")
        return
    
    try:
        print("🔄 正在登录...")
        login(token=token)
        print("✅ 登录成功！")
        print()
        print("现在你可以运行:")
        print("python3 inference.py -p 'beautiful landscape' --device cpu --width 512 --height 512 --num-steps 4")
        
    except Exception as e:
        print(f"❌ 登录失败: {e}")
        print("请检查令牌是否正确")

if __name__ == "__main__":
    main()