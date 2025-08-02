#!/usr/bin/env python3
"""
快速测试HF token是否有效
"""
import requests

HF_API_TOKEN = "your-huggingface-token-here"

def test_hf_token():
    """测试HF token"""
    api_url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
    
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    
    payload = {
        "inputs": "a cat",
        "parameters": {
            "num_inference_steps": 4,
            "guidance_scale": 0.0,
            "width": 512,
            "height": 512
        }
    }
    
    print("🔍 测试HF API连接...")
    print(f"🔑 Token: {HF_API_TOKEN[:20]}...")
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        
        print(f"📊 状态码: {response.status_code}")
        print(f"📋 响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Token有效，API调用成功")
            print(f"📏 响应大小: {len(response.content)} bytes")
        elif response.status_code == 401:
            print("❌ Token无效或过期")
        elif response.status_code == 503:
            print("⏳ 模型正在加载中")
        else:
            print(f"❌ API错误: {response.text[:300]}")
            
    except Exception as e:
        print(f"❌ 连接错误: {e}")

if __name__ == "__main__":
    test_hf_token()