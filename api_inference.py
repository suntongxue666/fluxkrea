#!/usr/bin/env python3
"""
使用 Replicate API 进行 FLUX 推理 - 无需本地模型
"""
import os
import requests
from PIL import Image
from io import BytesIO

def generate_with_replicate(prompt, api_token):
    """使用 Replicate API 生成图像"""
    
    url = "https://api.replicate.com/v1/predictions"
    
    headers = {
        "Authorization": f"Token {api_token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "version": "black-forest-labs/flux-schnell",
        "input": {
            "prompt": prompt,
            "num_outputs": 1,
            "aspect_ratio": "1:1",
            "output_format": "png",
            "output_quality": 80
        }
    }
    
    print(f"Generating image for: '{prompt}'")
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 201:
        prediction = response.json()
        prediction_url = prediction["urls"]["get"]
        
        # 轮询结果
        while True:
            result = requests.get(prediction_url, headers=headers)
            prediction = result.json()
            
            if prediction["status"] == "succeeded":
                image_url = prediction["output"][0]
                
                # 下载图像
                img_response = requests.get(image_url)
                image = Image.open(BytesIO(img_response.content))
                
                output_path = f"generated_{prompt.replace(' ', '_')[:20]}.png"
                image.save(output_path)
                print(f"Image saved to: {output_path}")
                return output_path
                
            elif prediction["status"] == "failed":
                print(f"Generation failed: {prediction.get('error', 'Unknown error')}")
                return None
                
            print("Waiting for generation to complete...")
            import time
            time.sleep(2)
    else:
        print(f"API request failed: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    # 需要在 https://replicate.com 注册并获取 API token
    api_token = "YOUR_REPLICATE_API_TOKEN"
    
    if api_token == "YOUR_REPLICATE_API_TOKEN":
        print("请先设置你的 Replicate API token")
        print("1. 访问 https://replicate.com")
        print("2. 注册账号并获取 API token")
        print("3. 将 token 填入此文件的 api_token 变量")
    else:
        prompt = input("Enter your prompt: ")
        generate_with_replicate(prompt, api_token)