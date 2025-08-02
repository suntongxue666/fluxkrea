#!/usr/bin/env python3
"""
简化版 FLUX 文生图 Web 应用
"""
from flask import Flask, request, jsonify, send_file
import requests
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
    import time
    
    # 备用模型列表
    models = [
        "stabilityai/stable-diffusion-xl-base-1.0",
        "runwayml/stable-diffusion-v1-5"
    ]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    for model in models:
        api_url = f"https://api-inference.huggingface.co/models/{model}"
        print(f"尝试模型: {model}")
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "num_inference_steps": 20,
                "guidance_scale": 7.5,
                "width": width,
                "height": height
            }
        }
        
        try:
            response = requests.post(api_url, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                image = Image.open(BytesIO(response.content))
                filename = f"{uuid.uuid4()}.png"
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                image.save(filepath)
                print(f"✅ 生成成功: {model}")
                return filename
            elif response.status_code == 503:
                print("模型加载中，等待...")
                time.sleep(20)
                continue
            else:
                print(f"错误: {response.status_code}")
                continue
                
        except Exception as e:
            print(f"异常: {e}")
            continue
    
    return None

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FLUX AI 图像生成器</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            h1 {
                text-align: center;
                color: #333;
                margin-bottom: 30px;
                font-size: 2.5rem;
            }
            .main-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-top: 30px;
            }
            .input-section, .result-section {
                padding: 30px;
                border: 2px solid #e5e7eb;
                border-radius: 15px;
            }
            .input-section h2, .result-section h2 {
                margin-bottom: 20px;
                color: #374151;
            }
            textarea {
                width: 100%;
                min-height: 120px;
                padding: 15px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                font-size: 16px;
                resize: vertical;
                margin-bottom: 20px;
            }
            textarea:focus {
                outline: none;
                border-color: #667eea;
            }
            .settings {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            select {
                padding: 10px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
            }
            .generate-btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.3s;
            }
            .generate-btn:hover {
                transform: translateY(-2px);
            }
            .generate-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
            .result-image {
                width: 100%;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            }
            .placeholder {
                text-align: center;
                color: #9ca3af;
                padding: 60px 20px;
            }
            .loading {
                text-align: center;
                color: #667eea;
                padding: 60px 20px;
            }
            .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e5e7eb;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @media (max-width: 768px) {
                .main-grid { grid-template-columns: 1fr; }
                .settings { grid-template-columns: 1fr; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎨 FLUX AI 图像生成器</h1>
            <p style="text-align: center; color: #6b7280; margin-bottom: 30px;">
                使用先进的 AI 技术，将您的创意想法转化为精美图像
            </p>
            
            <div class="main-grid">
                <div class="input-section">
                    <h2>📝 创作设置</h2>
                    <textarea id="prompt" placeholder="描述您想要生成的图像，例如：一只可爱的小猫坐在彩虹上"></textarea>
                    
                    <div class="settings">
                        <div>
                            <label>图像尺寸</label>
                            <select id="size">
                                <option value="512x512">正方形 (512×512)</option>
                                <option value="768x512">横向 (768×512)</option>
                                <option value="512x768">竖向 (512×768)</option>
                            </select>
                        </div>
                    </div>
                    
                    <button class="generate-btn" id="generateBtn">🚀 生成图像</button>
                    
                    <div style="margin-top: 20px;">
                        <h3>💡 示例提示词</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                            <button onclick="setPrompt('a cute cat sitting on a rainbow')" style="padding: 5px 10px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 15px; cursor: pointer;">可爱小猫</button>
                            <button onclick="setPrompt('futuristic city at sunset')" style="padding: 5px 10px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 15px; cursor: pointer;">未来城市</button>
                            <button onclick="setPrompt('beautiful mountain landscape')" style="padding: 5px 10px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 15px; cursor: pointer;">山景风光</button>
                        </div>
                    </div>
                </div>
                
                <div class="result-section">
                    <h2>🖼️ 生成结果</h2>
                    <div id="resultArea">
                        <div class="placeholder">
                            <div style="font-size: 4rem; margin-bottom: 20px;">🎨</div>
                            <h3>等待生成</h3>
                            <p>输入提示词并点击生成按钮</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            function setPrompt(text) {
                document.getElementById('prompt').value = text;
            }
            
            document.getElementById('generateBtn').addEventListener('click', async () => {
                const prompt = document.getElementById('prompt').value;
                const size = document.getElementById('size').value;
                const resultArea = document.getElementById('resultArea');
                const generateBtn = document.getElementById('generateBtn');
                
                if (!prompt.trim()) {
                    alert('请输入提示词');
                    return;
                }
                
                generateBtn.disabled = true;
                generateBtn.textContent = '🔄 生成中...';
                
                resultArea.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <h3>正在生成图像...</h3>
                        <p>请耐心等待 30-60 秒</p>
                    </div>
                `;
                
                try {
                    const [width, height] = size.split('x').map(Number);
                    
                    const response = await fetch('/generate', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            prompt: prompt,
                            width: width,
                            height: height
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultArea.innerHTML = `
                            <img src="/image/${data.filename}" alt="Generated image" class="result-image">
                            <div style="margin-top: 15px; text-align: center;">
                                <p style="color: #6b7280; font-size: 14px;">
                                    <strong>提示词:</strong> ${prompt}
                                </p>
                                <p style="color: #6b7280; font-size: 12px; margin-top: 5px;">
                                    尺寸: ${width}×${height}
                                </p>
                                <a href="/image/${data.filename}" download style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #10b981; color: white; text-decoration: none; border-radius: 5px;">下载图像</a>
                            </div>
                        `;
                    } else {
                        resultArea.innerHTML = `
                            <div style="text-align: center; color: #ef4444; padding: 40px;">
                                <div style="font-size: 2rem; margin-bottom: 15px;">❌</div>
                                <h3>生成失败</h3>
                                <p>${data.error}</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    resultArea.innerHTML = `
                        <div style="text-align: center; color: #ef4444; padding: 40px;">
                            <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                            <h3>网络错误</h3>
                            <p>请检查网络连接并重试</p>
                        </div>
                    `;
                } finally {
                    generateBtn.disabled = false;
                    generateBtn.textContent = '🚀 生成图像';
                }
            });
        </script>
    </body>
    </html>
    '''

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt', '')
    width = data.get('width', 512)
    height = data.get('height', 512)
    
    if not prompt:
        return jsonify({'success': False, 'error': '请输入提示词'})
    
    filename = generate_image_hf(prompt, HF_API_TOKEN, width, height)
    
    if filename:
        return jsonify({'success': True, 'filename': filename})
    else:
        return jsonify({'success': False, 'error': '生成失败，请稍后重试'})

@app.route('/image/<filename>')
def serve_image(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

if __name__ == '__main__':
    print("🚀 启动简化版 FLUX 文生图服务...")
    print("📱 访问: http://localhost:5000")
    app.run(debug=True, port=5000)