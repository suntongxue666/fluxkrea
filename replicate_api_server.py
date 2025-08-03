#!/usr/bin/env python3
"""
使用正确Replicate API的后端服务
"""
from flask import Flask, request, jsonify, send_file, render_template_string
from flask_cors import CORS
import os
import requests
from PIL import Image
from io import BytesIO
import uuid
import time

app = Flask(__name__)
CORS(app)

# 配置
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN", "YOUR_REPLICATE_API_TOKEN")
UPLOAD_FOLDER = "generated_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def generate_image_replicate(prompt, width=1024, height=1024):
    """使用 Replicate API 生成图像"""
    
    url = "https://api.replicate.com/v1/predictions"
    
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # 使用正确的版本ID和参数格式
    data = {
        "version": "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        "input": {
            "prompt": prompt,
            "width": min(width, 1024),
            "height": min(height, 1024),
            "num_outputs": 1,
            "aspect_ratio": "1:1",
            "output_format": "png",
            "output_quality": 80
        }
    }
    
    print(f"🎨 生成图像: '{prompt}' ({width}x{height})")
    
    try:
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 201:
            prediction = response.json()
            prediction_url = prediction["urls"]["get"]
            
            print(f"✅ 预测创建成功: {prediction['id']}")
            
            # 轮询结果
            while True:
                result = requests.get(prediction_url, headers=headers)
                prediction = result.json()
                
                print(f"📊 状态: {prediction['status']}")
                
                if prediction["status"] == "succeeded":
                    image_url = prediction["output"][0]
                    
                    # 下载图像
                    img_response = requests.get(image_url)
                    if img_response.status_code == 200:
                        image = Image.open(BytesIO(img_response.content))
                        
                        # 保存图像
                        filename = f"flux_{uuid.uuid4().hex[:8]}.png"
                        filepath = os.path.join(UPLOAD_FOLDER, filename)
                        image.save(filepath)
                        
                        print(f"✅ 图像保存成功: {filename}")
                        return filename
                    else:
                        print(f"❌ 下载图像失败: {img_response.status_code}")
                        return None
                        
                elif prediction["status"] == "failed":
                    error_msg = prediction.get('error', 'Unknown error')
                    print(f"❌ 生成失败: {error_msg}")
                    return None
                
                elif prediction["status"] in ["starting", "processing"]:
                    print("⏳ 等待生成完成...")
                    time.sleep(2)
                else:
                    print(f"⚠️ 未知状态: {prediction['status']}")
                    time.sleep(2)
        else:
            print(f"❌ API请求失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 生成过程出错: {str(e)}")
        return None

@app.route('/api/generate', methods=['POST'])
def generate():
    """处理生成请求"""
    print("🔥 收到生成请求")
    
    try:
        data = request.json
        print(f"📦 请求数据: {data}")
        
        prompt = data.get('prompt', '').strip()
        width = data.get('width', 1024)
        height = data.get('height', 1024)
        
        if not prompt:
            print("❌ 提示词为空")
            return jsonify({'success': False, 'error': '请输入提示词'})
        
        print(f"📝 提示词: '{prompt}' ({width}x{height})")
        
        if REPLICATE_API_TOKEN == "YOUR_REPLICATE_API_TOKEN":
            print("❌ API Token 未设置")
            return jsonify({'success': False, 'error': 'Replicate API Token 未设置，请设置环境变量 REPLICATE_API_TOKEN'})
        
        # 生成图像
        filename = generate_image_replicate(prompt, width, height)
        
        if filename:
            # 返回图像URL而不是filename
            image_url = f"/image/{filename}"
            print(f"✅ 生成成功: {image_url}")
            return jsonify({
                'success': True, 
                'image': image_url,
                'filename': filename
            })
        else:
            print("❌ 生成失败")
            return jsonify({'success': False, 'error': '图像生成失败，请重试'})
            
    except Exception as e:
        print(f"❌ 处理请求时出错: {str(e)}")
        return jsonify({'success': False, 'error': f'服务器错误: {str(e)}'})

@app.route('/image/<filename>')
def serve_image(filename):
    """提供图像文件"""
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        return send_file(filepath)
    else:
        return "Image not found", 404

@app.route('/')
def index():
    """主页"""
    return render_template_string("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Replicate FLUX API 服务器</title>
        <meta charset="utf-8">
    </head>
    <body>
        <h1>🎨 Replicate FLUX API 服务器</h1>
        <p>服务器正在运行中...</p>
        <p>API 端点: <code>POST /api/generate</code></p>
        
        <h3>测试请求示例:</h3>
        <pre>
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "width": 1024,
    "height": 1024
  }'
        </pre>
        
        <h3>配置状态:</h3>
        <ul>
            <li>API Token: {'✅ 已设置' if REPLICATE_API_TOKEN != 'YOUR_REPLICATE_API_TOKEN' else '❌ 未设置'}</li>
            <li>输出目录: {UPLOAD_FOLDER}</li>
        </ul>
    </body>
    </html>
    """)

if __name__ == '__main__':
    print("🚀 启动 Replicate FLUX API 服务器")
    print(f"📁 图像保存目录: {UPLOAD_FOLDER}")
    
    if REPLICATE_API_TOKEN == "YOUR_REPLICATE_API_TOKEN":
        print("⚠️  请设置环境变量 REPLICATE_API_TOKEN")
        print("   export REPLICATE_API_TOKEN=your_token_here")
    else:
        print("✅ API Token 已设置")
    
    app.run(host='0.0.0.0', port=5000, debug=True)