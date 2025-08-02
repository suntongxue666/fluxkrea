#!/usr/bin/env python3
"""
现代化的 FLUX 文生图 Web 应用 - 参考 krea.ai 设计风格
"""
from flask import Flask, render_template, request, jsonify, send_file
import requests
from PIL import Image
from io import BytesIO
import os
import uuid
import time

app = Flask(__name__)

# 配置
HF_API_TOKEN = os.getenv('HF_API_TOKEN', 'your-huggingface-token-here')
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
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI 图像生成器 - FLUX</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
                color: white;
            }
            
            .header h1 {
                font-size: 3rem;
                font-weight: 700;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .header p {
                font-size: 1.2rem;
                opacity: 0.9;
            }
            
            .main-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                align-items: start;
            }
            
            .input-section {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .input-group {
                margin-bottom: 25px;
            }
            
            .input-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #555;
            }
            
            .prompt-input {
                width: 100%;
                padding: 15px;
                border: 2px solid #e1e5e9;
                border-radius: 12px;
                font-size: 16px;
                transition: all 0.3s ease;
                resize: vertical;
                min-height: 120px;
            }
            
            .prompt-input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .settings-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 25px;
            }
            
            .setting-item select, .setting-item input {
                width: 100%;
                padding: 10px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 14px;
            }
            
            .generate-btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .generate-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
            }
            
            .generate-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
            
            .result-section {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                min-height: 500px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .placeholder {
                text-align: center;
                color: #999;
            }
            
            .placeholder i {
                font-size: 4rem;
                margin-bottom: 20px;
                opacity: 0.5;
            }
            
            .loading {
                text-align: center;
                color: #667eea;
            }
            
            .loading .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .result-image {
                max-width: 100%;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                transition: transform 0.3s ease;
            }
            
            .result-image:hover {
                transform: scale(1.02);
            }
            
            .image-info {
                margin-top: 20px;
                text-align: center;
                color: #666;
            }
            
            .download-btn {
                margin-top: 15px;
                padding: 10px 20px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: background 0.3s ease;
            }
            
            .download-btn:hover {
                background: #218838;
            }
            
            .examples {
                margin-top: 20px;
            }
            
            .examples h3 {
                margin-bottom: 15px;
                color: #555;
            }
            
            .example-prompts {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .example-prompt {
                padding: 8px 12px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 20px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .example-prompt:hover {
                background: #667eea;
                color: white;
            }
            
            .error {
                color: #dc3545;
                background: #f8d7da;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                text-align: center;
            }
            
            @media (max-width: 768px) {
                .main-content {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                
                .header h1 {
                    font-size: 2rem;
                }
                
                .settings-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><i class="fas fa-magic"></i> AI 图像生成器</h1>
                <p>基于 FLUX 模型的高质量图像生成</p>
            </div>
            
            <div class="main-content">
                <div class="input-section">
                    <form id="generateForm">
                        <div class="input-group">
                            <label for="prompt">
                                <i class="fas fa-pen"></i> 描述你想要的图像
                            </label>
                            <textarea 
                                id="prompt" 
                                class="prompt-input" 
                                placeholder="例如: A beautiful sunset over mountains with a lake in the foreground, digital art style"
                                required
                            ></textarea>
                        </div>
                        
                        <div class="settings-grid">
                            <div class="setting-item">
                                <label>图像尺寸</label>
                                <select id="size">
                                    <option value="1024x1024">1024×1024 (正方形)</option>
                                    <option value="1024x768">1024×768 (横向)</option>
                                    <option value="768x1024">768×1024 (竖向)</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <label>生成步数</label>
                                <select id="steps">
                                    <option value="4" selected>4 (快速)</option>
                                    <option value="8">8 (平衡)</option>
                                    <option value="12">12 (高质量)</option>
                                </select>
                            </div>
                        </div>
                        
                        <button type="submit" class="generate-btn" id="generateBtn">
                            <i class="fas fa-magic"></i> 生成图像
                        </button>
                    </form>
                    
                    <div class="examples">
                        <h3><i class="fas fa-lightbulb"></i> 示例提示词</h3>
                        <div class="example-prompts">
                            <span class="example-prompt">A cute cat sitting on a rainbow</span>
                            <span class="example-prompt">Futuristic city at sunset</span>
                            <span class="example-prompt">Abstract digital art with vibrant colors</span>
                            <span class="example-prompt">Portrait of a wise old wizard</span>
                            <span class="example-prompt">Peaceful forest with morning mist</span>
                        </div>
                    </div>
                </div>
                
                <div class="result-section" id="resultSection">
                    <div class="placeholder">
                        <i class="fas fa-image"></i>
                        <h3>生成的图像将显示在这里</h3>
                        <p>输入提示词并点击生成按钮开始创作</p>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            // 示例提示词点击事件
            document.querySelectorAll('.example-prompt').forEach(prompt => {
                prompt.addEventListener('click', () => {
                    document.getElementById('prompt').value = prompt.textContent;
                });
            });
            
            // 表单提交事件
            document.getElementById('generateForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const prompt = document.getElementById('prompt').value;
                const size = document.getElementById('size').value;
                const steps = document.getElementById('steps').value;
                const resultSection = document.getElementById('resultSection');
                const generateBtn = document.getElementById('generateBtn');
                
                // 禁用按钮并显示加载状态
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
                
                resultSection.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <h3>正在生成图像...</h3>
                        <p>这可能需要 10-30 秒，请耐心等待</p>
                    </div>
                `;
                
                try {
                    const response = await fetch('/generate', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            prompt: prompt,
                            size: size,
                            steps: parseInt(steps)
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultSection.innerHTML = `
                            <img src="/image/${data.filename}" alt="Generated image" class="result-image">
                            <div class="image-info">
                                <p><strong>提示词:</strong> ${prompt}</p>
                                <p><strong>尺寸:</strong> ${size} | <strong>步数:</strong> ${steps}</p>
                                <a href="/image/${data.filename}" download class="download-btn">
                                    <i class="fas fa-download"></i> 下载图像
                                </a>
                            </div>
                        `;
                    } else {
                        resultSection.innerHTML = `
                            <div class="error">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h3>生成失败</h3>
                                <p>${data.error}</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    resultSection.innerHTML = `
                        <div class="error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>网络错误</h3>
                            <p>请检查网络连接并重试</p>
                        </div>
                    `;
                } finally {
                    // 恢复按钮状态
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '<i class="fas fa-magic"></i> 生成图像';
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
    size = data.get('size', '1024x1024')
    steps = data.get('steps', 4)
    
    if not prompt:
        return jsonify({'success': False, 'error': '请输入提示词'})
    
    # 解析尺寸
    width, height = map(int, size.split('x'))
    
    filename = generate_image_hf(prompt, HF_API_TOKEN)
    
    if filename:
        return jsonify({'success': True, 'filename': filename})
    else:
        return jsonify({'success': False, 'error': '生成失败，模型可能正在加载中，请稍后重试'})

@app.route('/image/<filename>')
def serve_image(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

if __name__ == '__main__':
    print("🚀 启动现代化 FLUX 文生图服务...")
    print("📱 访问: http://localhost:9000")
    app.run(debug=False, port=9000, host='127.0.0.1', threaded=True)