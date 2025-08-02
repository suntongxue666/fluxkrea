#!/usr/bin/env python3
"""
简化测试版本 - 强制显示日志
"""
import sys
import requests
from flask import Flask, request, jsonify, send_file
from PIL import Image
from io import BytesIO
import os
import uuid

app = Flask(__name__)

# 配置
HF_API_TOKEN = "your-huggingface-token-here"
UPLOAD_FOLDER = "generated_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def generate_image_hf(prompt, token, width=512, height=512):
    """使用 HF API 生成图像"""
    api_url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
    
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "num_inference_steps": 4,
            "guidance_scale": 0.0,
            "width": min(width, 1024),
            "height": min(height, 1024)
        }
    }
    
    print(f"🎨 API请求: {api_url}", flush=True)
    print(f"📦 负载: {payload}", flush=True)
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        print(f"📊 响应状态: {response.status_code}", flush=True)
        
        if response.status_code == 200:
            image = Image.open(BytesIO(response.content))
            filename = f"{uuid.uuid4()}.png"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            image.save(filepath)
            print(f"✅ 图片保存: {filename}", flush=True)
            return filename
        else:
            print(f"❌ API错误: {response.text[:200]}", flush=True)
            return None
            
    except Exception as e:
        print(f"❌ 异常: {e}", flush=True)
        return None

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI 图像生成器 - 测试版</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .container { text-align: center; }
            input[type="text"] { width: 60%; padding: 10px; margin: 10px; }
            button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
            button:hover { background: #0056b3; }
            #result { margin-top: 20px; }
            img { max-width: 100%; height: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>AI 图像生成器 - 测试版</h1>
            <form id="generateForm">
                <input type="text" id="prompt" placeholder="输入提示词..." required>
                <br>
                <button type="submit">生成图像</button>
            </form>
            <div id="result"></div>
        </div>
        
        <script>
            document.getElementById('generateForm').onsubmit = async function(e) {
                e.preventDefault();
                const prompt = document.getElementById('prompt').value;
                const result = document.getElementById('result');
                
                result.innerHTML = '<p>正在生成...</p>';
                
                try {
                    const response = await fetch('/generate', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({prompt: prompt, width: 512, height: 512})
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        result.innerHTML = `<img src="/image/${data.filename}" alt="Generated image">`;
                    } else {
                        result.innerHTML = `<p>错误: ${data.error}</p>`;
                    }
                } catch (error) {
                    result.innerHTML = '<p>网络错误</p>';
                }
            };
        </script>
    </body>
    </html>
    '''

@app.route('/generate', methods=['POST'])
def generate():
    print("=" * 50, flush=True)
    print("🔥🔥🔥 收到生成请求！！！", flush=True)
    print("=" * 50, flush=True)
    sys.stdout.flush()
    
    try:
        data = request.json
        print(f"📦 请求数据: {data}", flush=True)
        
        prompt = data.get('prompt', '')
        width = data.get('width', 512)
        height = data.get('height', 512)
        
        print(f"📝 提示词: '{prompt}'", flush=True)
        print(f"📏 尺寸: {width}x{height}", flush=True)
        
        if not prompt:
            print("❌ 提示词为空", flush=True)
            return jsonify({'success': False, 'error': '请输入提示词'})
        
        filename = generate_image_hf(prompt, HF_API_TOKEN, width, height)
        
        if filename:
            print(f"🎉 生成成功: {filename}", flush=True)
            return jsonify({'success': True, 'filename': filename})
        else:
            print("❌ 生成失败", flush=True)
            return jsonify({'success': False, 'error': '生成失败'})
            
    except Exception as e:
        print(f"💥 异常: {e}", flush=True)
        return jsonify({'success': False, 'error': str(e)})

@app.route('/image/<filename>')
def serve_image(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

if __name__ == '__main__':
    print("🚀🚀🚀 启动测试服务器！", flush=True)
    print("📱📱📱 访问: http://localhost:9999", flush=True)
    print("=" * 50, flush=True)
    sys.stdout.flush()
    
    app.run(debug=True, port=9999, host='127.0.0.1')