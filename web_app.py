#!/usr/bin/env python3
"""
简单的 FLUX 文生图 Web 应用
"""
from flask import Flask, render_template, request, jsonify, send_file
import os
import requests
from PIL import Image
from io import BytesIO
import uuid

app = Flask(__name__)

# 配置
REPLICATE_API_TOKEN = "YOUR_REPLICATE_API_TOKEN"  # 替换为你的 token
UPLOAD_FOLDER = "generated_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def generate_image(prompt):
    """调用 Replicate API 生成图像"""
    url = "https://api.replicate.com/v1/predictions"
    
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    data = {
        "version": "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        "input": {
            "prompt": prompt,
            "num_outputs": 1,
            "aspect_ratio": "1:1",
            "output_format": "png"
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 201:
        prediction = response.json()
        prediction_url = prediction["urls"]["get"]
        
        # 轮询结果
        import time
        while True:
            result = requests.get(prediction_url, headers=headers)
            prediction = result.json()
            
            if prediction["status"] == "succeeded":
                image_url = prediction["output"][0]
                
                # 下载并保存图像
                img_response = requests.get(image_url)
                image = Image.open(BytesIO(img_response.content))
                
                filename = f"{uuid.uuid4()}.png"
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                image.save(filepath)
                
                return filename
                
            elif prediction["status"] == "failed":
                return None
                
            time.sleep(2)
    
    return None

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>FLUX 文生图</title>
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
            <h1>FLUX 文生图</h1>
            <form id="generateForm">
                <input type="text" id="prompt" placeholder="输入你的提示词..." required>
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
                
                result.innerHTML = '<p>正在生成图像，请稍候...</p>';
                
                try {
                    const response = await fetch('/generate', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({prompt: prompt})
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        result.innerHTML = `
                            <h3>生成完成！</h3>
                            <img src="/image/${data.filename}" alt="Generated image">
                        `;
                    } else {
                        result.innerHTML = '<p>生成失败，请重试</p>';
                    }
                } catch (error) {
                    result.innerHTML = '<p>发生错误，请重试</p>';
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
    
    filename = generate_image(prompt)
    
    if filename:
        return jsonify({'success': True, 'filename': filename})
    else:
        return jsonify({'success': False, 'error': 'Generation failed'})

@app.route('/image/<filename>')
def serve_image(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

if __name__ == '__main__':
    if REPLICATE_API_TOKEN == "YOUR_REPLICATE_API_TOKEN":
        print("请先设置 REPLICATE_API_TOKEN")
    else:
        app.run(debug=True, port=5000)