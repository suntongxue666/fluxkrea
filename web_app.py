#支持 .env 的代码-本地文件添加Replicate API token
from dotenv import load_dotenv, dotenv_values
import os

load_dotenv()

print("Loaded .env values:", dotenv_values())

api_token = os.getenv("REPLICATE_API_TOKEN")
print("api_token from os.getenv:", api_token)

if not api_token:
    print("Please set REPLICATE_API_TOKEN")
    exit(1)


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
from datetime import datetime

app = Flask(__name__)

# 配置
REPLICATE_API_TOKEN = api_token  # 使用从环境变量读取的 token
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

@app.route('/api/generate-image', methods=['POST'])
def generate_image_api():
    data = request.json
    prompt = data.get('prompt', '')
    width = data.get('width', 1024)
    height = data.get('height', 1024)
    steps = data.get('num_inference_steps', 4)
    
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    
    filename = generate_image(prompt)
    
    if filename:
        # 返回前端期望的格式
        return jsonify({
            'image_url': f'/image/{filename}',
            'url': f'/image/{filename}',
            'success': True
        })
    else:
        return jsonify({'error': 'Generation failed'}), 500

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

# Subscription Management API Endpoints

@app.route('/api/save-subscription', methods=['POST'])
def save_subscription():
    """Save subscription information"""
    try:
        data = request.json
        subscription_id = data.get('subscriptionId')
        plan_type = data.get('planType')
        user_id = data.get('userId')
        user_email = data.get('userEmail')
        
        if not all([subscription_id, plan_type, user_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # TODO: Save to database
        # For now, just log the subscription info
        subscription_data = {
            'subscription_id': subscription_id,
            'plan_type': plan_type,
            'user_id': user_id,
            'user_email': user_email,
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'credits': 1000 if plan_type == 'pro' else 5000
        }
        
        print(f"Saving subscription: {subscription_data}")
        
        # TODO: Implement actual database save
        # Example with SQLite/PostgreSQL:
        # cursor.execute("""
        #     INSERT INTO subscriptions (subscription_id, plan_type, user_id, user_email, status, created_at, credits)
        #     VALUES (?, ?, ?, ?, ?, ?, ?)
        # """, (subscription_id, plan_type, user_id, user_email, 'pending', datetime.now(), subscription_data['credits']))
        
        return jsonify({
            'success': True,
            'subscription': subscription_data
        })
        
    except Exception as e:
        print(f"Error saving subscription: {e}")
        return jsonify({'error': 'Failed to save subscription'}), 500

@app.route('/api/subscription-status/<user_id>', methods=['GET'])
def get_subscription_status(user_id):
    """Get user's subscription status"""
    try:
        # TODO: Query from database
        # For now, return mock data
        subscription = {
            'user_id': user_id,
            'plan_type': 'pro',
            'status': 'active',
            'credits_remaining': 850,
            'credits_total': 1000,
            'next_billing_date': '2025-02-05',
            'subscription_id': 'I-BW452GLLEP1G'
        }
        
        return jsonify(subscription)
        
    except Exception as e:
        print(f"Error getting subscription status: {e}")
        return jsonify({'error': 'Failed to get subscription status'}), 500

@app.route('/api/update-subscription-status', methods=['POST'])
def update_subscription_status():
    """Update subscription status (called by webhook)"""
    try:
        data = request.json
        subscription_id = data.get('subscription_id')
        status = data.get('status')
        
        if not subscription_id or not status:
            return jsonify({'error': 'Missing subscription_id or status'}), 400
        
        # TODO: Update database
        print(f"Updating subscription {subscription_id} to status: {status}")
        
        # TODO: Implement actual database update
        # cursor.execute("""
        #     UPDATE subscriptions 
        #     SET status = ?, updated_at = ? 
        #     WHERE subscription_id = ?
        # """, (status, datetime.now(), subscription_id))
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Error updating subscription status: {e}")
        return jsonify({'error': 'Failed to update subscription status'}), 500

@app.route('/api/user-credits/<user_id>', methods=['GET'])
def get_user_credits(user_id):
    """Get user's credit balance"""
    try:
        # TODO: Query from database
        # For now, return mock data based on subscription
        credits = {
            'user_id': user_id,
            'credits_remaining': 850,
            'credits_total': 1000,
            'plan_type': 'pro',
            'last_reset': '2025-01-05'
        }
        
        return jsonify(credits)
        
    except Exception as e:
        print(f"Error getting user credits: {e}")
        return jsonify({'error': 'Failed to get user credits'}), 500

@app.route('/api/deduct-credits', methods=['POST'])
def deduct_credits():
    """Deduct credits for image generation"""
    try:
        data = request.json
        user_id = data.get('user_id')
        credits_to_deduct = data.get('credits', 10)  # Default 10 credits per generation
        
        if not user_id:
            return jsonify({'error': 'Missing user_id'}), 400
        
        # TODO: Check user's credit balance and deduct
        # For now, just log the deduction
        print(f"Deducting {credits_to_deduct} credits from user {user_id}")
        
        # TODO: Implement actual credit deduction
        # cursor.execute("""
        #     UPDATE user_credits 
        #     SET credits_remaining = credits_remaining - ? 
        #     WHERE user_id = ? AND credits_remaining >= ?
        # """, (credits_to_deduct, user_id, credits_to_deduct))
        
        return jsonify({
            'success': True,
            'credits_deducted': credits_to_deduct,
            'credits_remaining': 840  # Mock remaining credits
        })
        
    except Exception as e:
        print(f"Error deducting credits: {e}")
        return jsonify({'error': 'Failed to deduct credits'}), 500

if __name__ == '__main__':
    if REPLICATE_API_TOKEN == "YOUR_REPLICATE_API_TOKEN":
        print("请先设置 REPLICATE_API_TOKEN")
    else:
        app.run(debug=True, port=5000)