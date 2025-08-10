#!/usr/bin/env python3
"""
快速验证集成的Krea风格Web应用
"""
from flask import Flask, render_template, request, jsonify, send_file
import os
import uuid
import time
import logging
from PIL import Image, ImageDraw, ImageFont
import numpy as np

app = Flask(__name__)

# 配置
UPLOAD_FOLDER = "generated_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_demo_image(prompt, width=512, height=512, steps=4):
    """生成演示图像（不使用实际AI模型）"""
    try:
        logger.info(f"生成演示图像: '{prompt}' ({width}x{height})")
        
        # 模拟生成时间
        time.sleep(2)
        
        # 创建一个简单的演示图像
        image = Image.new('RGB', (width, height), color=(135, 206, 250))  # 天蓝色背景
        draw = ImageDraw.Draw(image)
        
        # 绘制一些装饰
        for i in range(0, width, 50):
            for j in range(0, height, 50):
                draw.ellipse([i, j, i+30, j+30], fill=(255, 255, 255, 100))
        
        # 添加文本
        try:
            # 尝试使用系统字体
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        # 绘制提示词
        text_lines = prompt.split()
        y_offset = height // 2 - 20
        for i, word in enumerate(text_lines[:3]):  # 最多显示3个词
            draw.text((width//2 - len(word)*6, y_offset + i*30), word, 
                     fill=(255, 255, 255), font=font, anchor="mm")
        
        # 保存图像
        filename = f"demo_{uuid.uuid4()}.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        image.save(filepath)
        
        logger.info(f"✅ 演示图像已保存: {filename}")
        return filename
        
    except Exception as e:
        logger.error(f"❌ 生成演示图像失败: {e}")
        return None

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>本地 AI 图像生成器 - 演示版</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; }
            
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { font-size: 2.5rem; color: #6366f1; margin-bottom: 10px; }
            .header p { color: #6b7280; font-size: 1.1rem; }
            
            .demo-notice { 
                background: #fef3c7; 
                border: 1px solid #f59e0b; 
                border-radius: 8px; 
                padding: 15px; 
                margin-bottom: 30px; 
                text-align: center;
                color: #92400e;
            }
            
            .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .card { background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            
            .prompt-input { 
                width: 100%; 
                min-height: 100px; 
                padding: 15px; 
                border: 2px solid #e5e7eb; 
                border-radius: 8px; 
                font-size: 14px; 
                margin-bottom: 20px;
                resize: vertical;
            }
            
            .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .setting-item select { width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; }
            
            .generate-btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .generate-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(99, 102, 241, 0.3); }
            .generate-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
            
            .result-area { min-height: 300px; display: flex; align-items: center; justify-content: center; }
            .placeholder { text-align: center; color: #9ca3af; }
            .placeholder i { font-size: 3rem; margin-bottom: 15px; }
            
            .loading { text-align: center; color: #6366f1; }
            .spinner { 
                width: 40px; height: 40px; 
                border: 3px solid #e5e7eb; 
                border-top: 3px solid #6366f1; 
                border-radius: 50%; 
                animation: spin 1s linear infinite; 
                margin: 0 auto 15px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            
            .result-image { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
            .image-info { margin-top: 15px; text-align: center; color: #6b7280; font-size: 14px; }
            
            @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><i class="fas fa-magic"></i> 本地 AI 图像生成器</h1>
                <p>演示版本 - 展示前端界面和API集成</p>
            </div>
            
            <div class="demo-notice">
                <i class="fas fa-info-circle"></i>
                <strong>演示模式:</strong> 这是一个功能演示版本，生成的是示例图像而非真实AI生成图像
            </div>
            
            <div class="main-grid">
                <div class="card">
                    <h2><i class="fas fa-pen"></i> 图像生成</h2>
                    <form id="generateForm">
                        <textarea id="prompt" class="prompt-input" placeholder="输入你想要生成的图像描述..." required></textarea>
                        
                        <div class="settings-grid">
                            <div class="setting-item">
                                <label>图像尺寸</label>
                                <select id="size">
                                    <option value="512x512">512×512</option>
                                    <option value="768x768">768×768</option>
                                    <option value="1024x1024">1024×1024</option>
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
                </div>
                
                <div class="card">
                    <h2><i class="fas fa-image"></i> 生成结果</h2>
                    <div id="resultArea" class="result-area">
                        <div class="placeholder">
                            <i class="fas fa-image"></i>
                            <h3>等待生成</h3>
                            <p>输入提示词并点击生成按钮</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            document.getElementById('generateForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const prompt = document.getElementById('prompt').value;
                const size = document.getElementById('size').value;
                const steps = parseInt(document.getElementById('steps').value);
                const resultArea = document.getElementById('resultArea');
                const generateBtn = document.getElementById('generateBtn');
                
                if (!prompt.trim()) {
                    alert('请输入提示词');
                    return;
                }
                
                // 显示加载状态
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
                
                resultArea.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <h3>正在生成图像...</h3>
                        <p>演示模式，约需2-3秒</p>
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
                            height: height,
                            steps: steps
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultArea.innerHTML = `
                            <div>
                                <img src="/image/${data.filename}" alt="Generated image" class="result-image">
                                <div class="image-info">
                                    <p><strong>提示词:</strong> ${prompt}</p>
                                    <p><strong>尺寸:</strong> ${width}×${height} | <strong>步数:</strong> ${steps}</p>
                                </div>
                            </div>
                        `;
                    } else {
                        resultArea.innerHTML = `
                            <div style="text-align: center; color: #ef4444;">
                                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                                <h3>生成失败</h3>
                                <p>${data.error}</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    resultArea.innerHTML = `
                        <div style="text-align: center; color: #ef4444;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                            <h3>网络错误</h3>
                            <p>请检查连接并重试</p>
                        </div>
                    `;
                } finally {
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
    width = data.get('width', 512)
    height = data.get('height', 512)
    steps = data.get('steps', 4)
    
    if not prompt:
        return jsonify({'success': False, 'error': '请输入提示词'})
    
    filename = generate_demo_image(prompt, width, height, steps)
    
    if filename:
        return jsonify({'success': True, 'filename': filename})
    else:
        return jsonify({'success': False, 'error': '生成失败，请重试'})

@app.route('/image/<filename>')
def serve_image(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

if __name__ == '__main__':
    print("🚀 启动演示版本...")
    print("📱 访问: http://localhost:5555")
    print("💡 这是一个演示版本，展示前端界面和API集成")
    app.run(debug=True, port=5555, host='0.0.0.0')