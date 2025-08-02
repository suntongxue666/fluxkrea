#!/usr/bin/env python3
"""
使用 Hugging Face Inference API 进行 FLUX 推理
"""
import requests
import json
from PIL import Image
from io import BytesIO
import base64

class HuggingFaceFlux:
    def __init__(self, api_token):
        self.api_token = api_token
        self.headers = {"Authorization": f"Bearer {api_token}"}
        
    def generate_image(self, prompt, model="black-forest-labs/FLUX.1-schnell"):
        """使用 HF Inference API 生成图像"""
        
        # Inference API URL
        api_url = f"https://api-inference.huggingface.co/models/{model}"
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "num_inference_steps": 4,  # FLUX-schnell 推荐 4 步
                "guidance_scale": 0.0,     # schnell 版本不需要 guidance
                "width": 1024,
                "height": 1024
            }
        }
        
        print(f"Generating image for: '{prompt}'")
        print("This may take 10-30 seconds...")
        
        response = requests.post(
            api_url, 
            headers=self.headers, 
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            # 响应是图像字节
            image = Image.open(BytesIO(response.content))
            output_path = f"hf_generated_{prompt.replace(' ', '_')[:20]}.png"
            image.save(output_path)
            print(f"✅ Image saved to: {output_path}")
            return output_path
            
        elif response.status_code == 503:
            print("❌ Model is loading, please try again in a few minutes")
            return None
            
        else:
            print(f"❌ API request failed: {response.status_code}")
            try:
                error_info = response.json()
                print(f"Error: {error_info}")
            except:
                print(f"Response: {response.text}")
            return None
    
    def check_model_status(self, model="black-forest-labs/FLUX.1-schnell"):
        """检查模型状态"""
        api_url = f"https://api-inference.huggingface.co/models/{model}"
        
        response = requests.get(api_url, headers=self.headers)
        
        if response.status_code == 200:
            print("✅ Model is ready")
            return True
        elif response.status_code == 503:
            print("⏳ Model is loading...")
            return False
        else:
            print(f"❌ Error checking model: {response.status_code}")
            return False

def main():
    # 你的 HF token (从 https://huggingface.co/settings/tokens 获取)
    api_token = input("请输入你的 Hugging Face API token: ").strip()
    
    if not api_token:
        print("请设置你的 Hugging Face API token:")
        print("1. 访问 https://huggingface.co/settings/tokens")
        print("2. 创建一个新的 token (Read 权限即可)")
        print("3. 重新运行此脚本并输入 token")
        return
    
    flux = HuggingFaceFlux(api_token)
    
    # 检查模型状态
    if not flux.check_model_status():
        print("Model is not ready. Please wait and try again.")
        return
    
    # 生成图像
    prompt = input("Enter your prompt: ")
    result = flux.generate_image(prompt)
    
    if result:
        print(f"Success! Image saved as: {result}")
    else:
        print("Generation failed.")

if __name__ == "__main__":
    main()