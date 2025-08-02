#!/usr/bin/env python3
"""
基于 Hugging Face API 的 FLUX 文生图 Web 应用
"""
from flask import Flask, render_template, request, jsonify, send_file
import requests
from PIL import Image
from io import BytesIO
import os
import uuid

app = Flask(__name__)

# 配置
HF_API_TOKEN = "your-huggingface-token-here"  # 替换为你的 token
UPLOAD_FOLDER = "generated_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def generate_image_hf(prompt, token):
    """使用 HF API 生成图像"""
    api_url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
    
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "num_inference_steps": 4,
            "guidance_scale": 0.0,
            "width": 1024,
            "height": 1024
        }
    }
    
    response = requests.post(api_url, headers=headers, json=payload, timeout=60)
    
    if response.status_code == 200:
        # 保存图像
        image = Image.open(BytesIO(response.content))
        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        image.save(filepath)
        return filename
    else:
        print(f"API Error: {response.status_code}")
        return None

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>FLUX 文生图 - Hugging Face API</title>
        <meta charset="utf-8">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
                background: #f5f5f5;
            }
            .container { 
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center; 
            }
            h1 { color: #333; margin-bottom: 30px; }
            input[type="text"] { 
                width: 70%; 
                padding: 12px; 
                margin: 10px; 
                border: 2px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
            }
            button { 
                padding: 12px 24px; 
                background: #ff6b35; 
                color: white; 
                border: none; 
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin: 10px;
            }
            button:hover { background: #e55a2b; }
            button:disabled { background: #ccc; cursor: not-allowed; }
            #result { margin-top: 30px; }
            img { 
                max-width: 100%; 
                height: auto; 
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .loading { 
                color: #666; 
                font-style: italic; 
            }
            .error { 
                color: #d32f2f; 
                background: #ffebee;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
            }
            .success {
                color: #2e7d32;
                margin: 10px 0;
            }
            .info {
                background: #e3f2fd;
                color: #1565c0;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                text-align: left;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎨 FLUX 文生图</h1>
            <div class="info">
                <strong>使用说明:</strong><br>
                • 输入英文提示词效果更好<br>
                • 生成时间约 10-30 秒<br>
                • 使用 Hugging Face 免费 API
            </div>
            
            <form id="generateForm">
                <input type="text" id="prompt" placeholder="例如: a cute cat sitting on a rainbow" required>
                <br>
                <button type="submit" id="generateBtn">生成图像</button>
            </form>
            <div id="result"></div>
        </div>
        
        <script>
            document.getElementById('generateForm').onsubmit = async function(e) {
                e.preventDefault();
                const prompt = document.getElementById('prompt').value;
                const result = document.getElementById('result');
                const btn = document.getElementById('generateBtn');
                
                // 禁用按钮
                btn.disabled = true;
                btn.textContent = '生成中...';
                
                result.innerHTML = '<p class="loading">🎨 正在生成图像，请稍候...</p>';
                
                try {
                    const response = await fetch('/generate', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({prompt: prompt})
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        result.innerHTML = `
                            <p class="success">✅ 生成完成！</p>
                            <img src="/image/${data.filename}" alt="Generated image">
                            <p><strong>提示词:</strong> ${prompt}</p>
                        `;
                    } else {
                        result.innerHTML = `<div class="error">❌ 生成失败: ${data.error}</div>`;
                    }
                } catch (error) {
                    result.innerHTML = '<div class="error">❌ 网络错误，请重试</div>';
                } finally {
                    // 恢复按钮
                    btn.disabled = false;
                    btn.textContent = '生成图像';
                }
            };
        </script>
    </body>
    </html>
    '''

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt', '')
    
    if not prompt:
        return jsonify({'success': False, 'error': 'No prompt provided'})
    
    if HF_API_TOKEN == "YOUR_HF_TOKEN_HERE":
        return jsonify({'success': False, 'error': 'Please set your Hugging Face API token'})
    
    filename = generate_image_hf(prompt, HF_API_TOKEN)
    
    if filename:
        return jsonify({'success': True, 'filename': filename})
    else:
        return jsonify({'success': False, 'error': 'Generation failed. Model might be loading.'})

@app.route('/image/<filename>')
def serve_image(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

if __name__ == '__main__':
    if HF_API_TOKEN == "YOUR_HF_TOKEN_HERE":
        print("⚠️  请先设置你的 Hugging Face API token:")
        print("1. 访问 https://huggingface.co/settings/tokens")
        print("2. 创建一个 Read 权限的 token")
        print("3. 在此文件中替换 HF_API_TOKEN 的值")
        print("4. 重新运行: python3 hf_web_app.py")
    else:
        print("🚀 启动 FLUX 文生图服务...")
        print("📱 访问: http://localhost:5001")
        app.run(debug=True, port=5001)