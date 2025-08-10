#!/usr/bin/env python3
"""
仿 Krea.ai 风格的 FLUX 文生图 Web 应用 - 使用本地模型
"""
from flask import Flask, render_template, request, jsonify, send_file
import requests
from PIL import Image
from io import BytesIO
import torch
from pathlib import Path
import os
import uuid
import threading
import logging

app = Flask(__name__)

# 配置
HF_API_TOKEN = "your-huggingface-token-here"
UPLOAD_FOLDER = "generated_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
models_loaded = False
ae = None
clip = None
t5 = None
model = None
sampler = None
model_lock = threading.Lock()

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_models():
    """加载本地FLUX模型"""
    global models_loaded, ae, clip, t5, model, sampler
    
    with model_lock:
        if models_loaded:
            return True
            
        try:
            logger.info("开始加载模型...")
            
            # 加载模型
            logger.info("加载AE...")
            ae = load_ae("flux-schnell", device=DEVICE)
            
            logger.info("加载CLIP...")
            clip = load_clip(device=DEVICE)
            
            logger.info("加载T5...")
            t5 = load_t5(device=DEVICE)
            
            logger.info("加载MMDiT...")
            model = load_flow_model("flux-schnell", device=DEVICE)
            
            # 移动模型到指定数据类型
            ae = ae.to(dtype=TORCH_DTYPE)
            clip = clip.to(dtype=TORCH_DTYPE)
            t5 = t5.to(dtype=TORCH_DTYPE)
            model = model.to(dtype=TORCH_DTYPE)
            
            # 创建采样器
            sampler = Sampler(
                model=model,
                ae=ae,
                clip=clip,
                t5=t5,
                device=DEVICE,
                dtype=TORCH_DTYPE,
            )
            
            models_loaded = True
            logger.info("✅ 模型加载完成")
            return True
            
        except Exception as e:
            logger.error(f"❌ 模型加载失败: {e}")
            return False

def generate_image_hf(prompt, token, width=512, height=512, steps=4):
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
    
    try:
        print(f"🎨 生成图像: '{prompt}' ({width}x{height})")
        response = requests.post(api_url, headers=headers, json=payload, timeout=120)
        
        if response.status_code == 200:
            image = Image.open(BytesIO(response.content))
            filename = f"{uuid.uuid4()}.png"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            image.save(filepath)
            print(f"✅ 生成成功: {filename}")
            return filename
        elif response.status_code == 503:
            print("⏳ 模型正在加载中...")
            return None
        else:
            print(f"❌ API错误 {response.status_code}: {response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return None

def generate_image_local(prompt, width=1024, height=1024, guidance=4.5, num_steps=28, seed=42):
    """使用本地FLUX模型生成图像（备用）"""
    try:
        # 确保模型已加载
        if not models_loaded:
            if not load_models():
                return None
        
        logger.info(f"生成图像: '{prompt}'")
        logger.info(f"参数: {width}x{height}, guidance={guidance}, steps={num_steps}, seed={seed}")
        
        # 生成图像
        image = sampler(
            prompt=prompt,
            width=width,
            height=height,
            guidance=guidance,
            num_steps=num_steps,
            seed=seed,
        )
        
        # 保存图像
        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        image.save(filepath)
        
        logger.info(f"✅ 图像已保存: {filename}")
        return filename
        
    except Exception as e:
        logger.error(f"❌ 图像生成失败: {e}")
        return None

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Flux Krea AI - AI Image Generator</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8f9fa;
                color: #333;
                line-height: 1.6;
            }
            
            /* Header */
            .header {
                background: white;
                padding: 15px 0;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                position: sticky;
                top: 0;
                z-index: 100;
            }
            
            .nav {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 20px;
            }
            
            .logo {
                display: flex;
                align-items: center;
                font-size: 1.2rem;
                font-weight: 700;
                color: #6366f1;
            }
            
            .logo-icon {
                width: 32px;
                height: 32px;
                background: #6366f1;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                margin-right: 10px;
                font-size: 16px;
            }
            
            .nav-links {
                display: flex;
                gap: 30px;
                list-style: none;
            }
            
            .nav-links a {
                text-decoration: none;
                color: #6b7280;
                font-weight: 500;
                transition: color 0.3s;
            }
            
            .nav-links a:hover {
                color: #6366f1;
            }
            
            .get-started-btn {
                background: #6366f1;
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.3s;
            }
            
            .get-started-btn:hover {
                background: #5856eb;
                transform: translateY(-1px);
            }
            
            /* Hero Section */
            .hero {
                text-align: center;
                padding: 60px 20px 40px;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .hero-badge {
                display: inline-block;
                background: #e0e7ff;
                color: #6366f1;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
            }
            
            .hero h1 {
                font-size: 3.5rem;
                font-weight: 800;
                margin-bottom: 20px;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .hero p {
                font-size: 1.2rem;
                color: #6b7280;
                margin-bottom: 40px;
                line-height: 1.7;
            }
            
            /* Main Content */
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }
            
            .main-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 60px;
            }
            
            .card {
                background: white;
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                border: 1px solid #e5e7eb;
            }
            
            .card h2 {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .card-subtitle {
                color: #6b7280;
                margin-bottom: 25px;
                font-size: 14px;
            }
            
            /* Generation Mode */
            .mode-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 25px;
            }
            
            .mode-btn {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                background: white;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-weight: 600;
            }
            
            .mode-btn.active {
                border-color: #6366f1;
                background: #6366f1;
                color: white;
            }
            
            .mode-btn:hover:not(.active) {
                border-color: #6366f1;
                background: #f8faff;
            }
            
            /* Prompt Input */
            .prompt-section h3 {
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 12px;
                color: #374151;
            }
            
            .prompt-textarea {
                width: 100%;
                min-height: 120px;
                padding: 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                font-size: 14px;
                resize: vertical;
                transition: border-color 0.3s;
                font-family: inherit;
            }
            
            .prompt-textarea:focus {
                outline: none;
                border-color: #6366f1;
            }
            
            .copy-btn {
                margin-top: 10px;
                padding: 8px 16px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                color: #6b7280;
                transition: all 0.3s;
            }
            
            .copy-btn:hover {
                background: #e5e7eb;
            }
            
            /* Settings */
            .settings-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .setting-item label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
                color: #374151;
            }
            
            .setting-item select {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                font-size: 14px;
            }
            
            .slider-container {
                grid-column: span 2;
            }
            
            .slider {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: #e5e7eb;
                outline: none;
                -webkit-appearance: none;
            }
            
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #6366f1;
                cursor: pointer;
            }
            
            .slider-value {
                float: right;
                font-weight: 600;
                color: #6366f1;
            }
            
            /* Generate Button */
            .generate-btn {
                width: 100%;
                padding: 16px;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            
            .generate-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
            }
            
            .generate-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
            
            /* Result Section */
            .result-placeholder {
                text-align: center;
                padding: 60px 20px;
                color: #9ca3af;
            }
            
            .result-placeholder i {
                font-size: 4rem;
                margin-bottom: 20px;
                opacity: 0.5;
            }
            
            .result-image {
                width: 100%;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }
            
            .loading {
                text-align: center;
                padding: 60px 20px;
                color: #6366f1;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e5e7eb;
                border-top: 3px solid #6366f1;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .nav-links {
                    display: none;
                }
                
                .hero h1 {
                    font-size: 2.5rem;
                }
                
                .main-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                
                .settings-grid {
                    grid-template-columns: 1fr;
                }
                
                .mode-buttons {
                    flex-direction: column;
                }
            }
        </style>
    </head>
    <body>
        <!-- Header -->
        <header class="header">
            <nav class="nav">
                <div class="logo">
                    <div class="logo-icon">K</div>
                    Flux Krea AI
                </div>
                <ul class="nav-links">
                    <li><a href="#features">Features</a></li>
                    <li><a href="#showcase">Showcase</a></li>
                    <li><a href="#generator">Try Generator</a></li>
                    <li><a href="#full">Full Generator</a></li>
                    <li><a href="#faq">FAQ</a></li>
                </ul>
                <a href="#" class="get-started-btn">Get Started</a>
            </nav>
        </header>
        
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero-badge">Try It Now</div>
            <h1>本地 AI 图像生成器</h1>
            <p>基于本地 FLUX 模型的高质量图像生成，无需网络连接</p>
        </section>
        
        <!-- Main Content -->
        <div class="container">
            <div class="main-grid">
                <!-- Left Panel -->
                <div class="card">
                    <h2>
                        <i class="fas fa-magic"></i>
                        Generation Mode
                    </h2>
                    <p class="card-subtitle">Choose between text-to-image or image-to-image generation</p>
                    
                    <div class="mode-buttons">
                        <button class="mode-btn active" data-mode="text">
                            <i class="fas fa-pen"></i>
                            Text to Image
                        </button>
                        <button class="mode-btn" data-mode="image">
                            <i class="fas fa-image"></i>
                            Image to Image
                        </button>
                    </div>
                    
                    <div class="prompt-section">
                        <h3>Positive Prompt</h3>
                        <textarea 
                            class="prompt-textarea" 
                            id="prompt"
                            placeholder="360 image tiny planet, tiny round planet, urban, the pand in this pic walking tiny planet Norway northern lights, perfectly centered, centered in frame."
                        ></textarea>
                        <button class="copy-btn">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <h2>
                            <i class="fas fa-cog"></i>
                            Generation Settings
                        </h2>
                        
                        <div class="settings-grid">
                            <div class="setting-item">
                                <label>
                                    <i class="fas fa-expand-arrows-alt"></i>
                                    Image Size
                                </label>
                                <select id="imageSize">
                                    <option value="768x768">Square HD (768×768)</option>
                                    <option value="768x512">Landscape (768×512)</option>
                                    <option value="512x768">Portrait (512×768)</option>
                                    <option value="512x512">Square (512×512)</option>
                                </select>
                            </div>
                            
                            <div class="slider-container">
                                <label>
                                    <i class="fas fa-layer-group"></i>
                                    Inference Steps
                                    <span class="slider-value" id="stepsValue">50</span>
                                </label>
                                <input type="range" min="4" max="50" value="4" class="slider" id="stepsSlider">
                            </div>
                        </div>
                        
                        <button class="generate-btn" id="generateBtn">
                            <i class="fas fa-bolt"></i>
                            Generate Images
                        </button>
                    </div>
                </div>
                
                <!-- Right Panel -->
                <div class="card">
                    <h2>Generated Images</h2>
                    <p class="card-subtitle">Your AI-generated artwork will appear here</p>
                    
                    <div id="resultArea">
                        <div class="result-placeholder">
                            <i class="fas fa-image"></i>
                            <h3>No images generated yet</h3>
                            <p>Enter a prompt and click generate to create your first image</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- How it Works Section -->
        <section style="background: white; padding: 80px 0;">
            <div class="container">
                <div style="text-align: center; margin-bottom: 60px;">
                    <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; color: #1f2937;">
                        Generate AI images in 3 easy steps
                    </h2>
                    <p style="font-size: 1.2rem; color: #6b7280; max-width: 600px; margin: 0 auto;">
                        Create stunning visuals with our advanced AI technology in just a few clicks
                    </p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px;">
                    <div style="text-align: center; padding: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 2rem;">
                            <i class="fas fa-pen"></i>
                        </div>
                        <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; color: #1f2937;">
                            1. Write Your Prompt
                        </h3>
                        <p style="color: #6b7280; line-height: 1.6;">
                            Describe what you want to create. Be as detailed or as simple as you like - our AI understands natural language perfectly.
                        </p>
                    </div>
                    
                    <div style="text-align: center; padding: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 2rem;">
                            <i class="fas fa-cog"></i>
                        </div>
                        <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; color: #1f2937;">
                            2. Customize Settings
                        </h3>
                        <p style="color: #6b7280; line-height: 1.6;">
                            Choose your preferred image size, style, and quality settings. Fine-tune the generation process to match your vision.
                        </p>
                    </div>
                    
                    <div style="text-align: center; padding: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 2rem;">
                            <i class="fas fa-download"></i>
                        </div>
                        <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; color: #1f2937;">
                            3. Download & Share
                        </h3>
                        <p style="color: #6b7280; line-height: 1.6;">
                            Get your high-quality image in seconds. Download, share, or use it in your projects - it's yours to keep forever.
                        </p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Why FLUX Section -->
        <section style="background: #f8f9fa; padding: 80px 0;">
            <div class="container">
                <div style="text-align: center; margin-bottom: 60px;">
                    <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; color: #1f2937;">
                        Why use FLUX.1 Krea?
                    </h2>
                    <p style="font-size: 1.2rem; color: #6b7280; max-width: 600px; margin: 0 auto;">
                        Experience the next generation of AI image generation with superior quality and control
                    </p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 40px;">
                    <div class="feature-card">
                        <div class="feature-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e5e7eb'/%3E%3Ctext x='150' y='100' text-anchor='middle' dy='.3em' fill='%236b7280'%3EHigh Quality%3C/text%3E%3C/svg%3E" alt="High Quality" style="width: 100%; border-radius: 12px;">
                        </div>
                        <h3>Exceptional Image Quality</h3>
                        <p>Generate stunning, high-resolution images with incredible detail and photorealistic quality that rivals professional photography.</p>
                        <button class="demo-btn" onclick="demoGenerate('a photorealistic portrait of a woman with flowing hair, professional lighting, 8k quality')">
                            <i class="fas fa-play"></i> Try This Example
                        </button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e5e7eb'/%3E%3Ctext x='150' y='100' text-anchor='middle' dy='.3em' fill='%236b7280'%3EFast Generation%3C/text%3E%3C/svg%3E" alt="Fast Generation" style="width: 100%; border-radius: 12px;">
                        </div>
                        <h3>Lightning Fast Speed</h3>
                        <p>Get your images in seconds, not minutes. Our optimized FLUX model delivers professional results at unprecedented speed.</p>
                        <button class="demo-btn" onclick="demoGenerate('a futuristic city skyline at sunset, cyberpunk style, neon lights')">
                            <i class="fas fa-play"></i> Try This Example
                        </button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e5e7eb'/%3E%3Ctext x='150' y='100' text-anchor='middle' dy='.3em' fill='%236b7280'%3ECreative Control%3C/text%3E%3C/svg%3E" alt="Creative Control" style="width: 100%; border-radius: 12px;">
                        </div>
                        <h3>Precise Creative Control</h3>
                        <p>Fine-tune every aspect of your generation with advanced settings for style, composition, and artistic direction.</p>
                        <button class="demo-btn" onclick="demoGenerate('abstract digital art with vibrant colors, geometric patterns, modern design')">
                            <i class="fas fa-play"></i> Try This Example
                        </button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e5e7eb'/%3E%3Ctext x='150' y='100' text-anchor='middle' dy='.3em' fill='%236b7280'%3EText Understanding%3C/text%3E%3C/svg%3E" alt="Text Understanding" style="width: 100%; border-radius: 12px;">
                        </div>
                        <h3>Advanced Text Understanding</h3>
                        <p>Our AI understands complex prompts and nuanced descriptions, bringing your exact vision to life with remarkable accuracy.</p>
                        <button class="demo-btn" onclick="demoGenerate('a cozy coffee shop interior with warm lighting, books on shelves, vintage furniture')">
                            <i class="fas fa-play"></i> Try This Example
                        </button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e5e7eb'/%3E%3Ctext x='150' y='100' text-anchor='middle' dy='.3em' fill='%236b7280'%3EStyle Variety%3C/text%3E%3C/svg%3E" alt="Style Variety" style="width: 100%; border-radius: 12px;">
                        </div>
                        <h3>Unlimited Style Variety</h3>
                        <p>From photorealistic to artistic, from vintage to futuristic - create images in any style you can imagine.</p>
                        <button class="demo-btn" onclick="demoGenerate('oil painting of a mountain landscape, impressionist style, vibrant colors')">
                            <i class="fas fa-play"></i> Try This Example
                        </button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e5e7eb'/%3E%3Ctext x='150' y='100' text-anchor='middle' dy='.3em' fill='%236b7280'%3ECommercial Use%3C/text%3E%3C/svg%3E" alt="Commercial Use" style="width: 100%; border-radius: 12px;">
                        </div>
                        <h3>Commercial Usage Rights</h3>
                        <p>Use your generated images for any purpose - personal projects, commercial work, or client deliverables without restrictions.</p>
                        <button class="demo-btn" onclick="demoGenerate('professional product photography, white background, studio lighting, commercial quality')">
                            <i class="fas fa-play"></i> Try This Example
                        </button>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Testimonials Section -->
        <section style="background: white; padding: 80px 0;">
            <div class="container">
                <div style="text-align: center; margin-bottom: 60px;">
                    <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; color: #1f2937;">
                        Trusted by creators worldwide
                    </h2>
                    <p style="font-size: 1.2rem; color: #6b7280;">
                        Join thousands of artists, designers, and creators who use FLUX.1 Krea daily
                    </p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                    <div class="testimonial-card">
                        <div class="stars">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                        </div>
                        <p>"FLUX.1 Krea has revolutionized my creative workflow. The quality is incredible and the speed is unmatched. I can now create professional-grade images in seconds!"</p>
                        <div class="testimonial-author">
                            <div class="author-avatar">S</div>
                            <div>
                                <div class="author-name">Sarah Chen</div>
                                <div class="author-title">Digital Artist</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="testimonial-card">
                        <div class="stars">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                        </div>
                        <p>"As a marketing professional, I need high-quality visuals fast. FLUX.1 Krea delivers exactly what I need - stunning images that perfectly match my vision."</p>
                        <div class="testimonial-author">
                            <div class="author-avatar">M</div>
                            <div>
                                <div class="author-name">Mike Rodriguez</div>
                                <div class="author-title">Marketing Director</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="testimonial-card">
                        <div class="stars">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                        </div>
                        <p>"The level of detail and realism is mind-blowing. I've tried many AI image generators, but FLUX.1 Krea is in a league of its own."</p>
                        <div class="testimonial-author">
                            <div class="author-avatar">E</div>
                            <div>
                                <div class="author-name">Emily Watson</div>
                                <div class="author-title">Freelance Designer</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 50px;">
                    <div style="display: flex; justify-content: center; align-items: center; gap: 40px; flex-wrap: wrap;">
                        <div style="text-align: center;">
                            <div style="font-size: 2.5rem; font-weight: 800; color: #6366f1;">50K+</div>
                            <div style="color: #6b7280;">Active Users</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 2.5rem; font-weight: 800; color: #6366f1;">1M+</div>
                            <div style="color: #6b7280;">Images Generated</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 2.5rem; font-weight: 800; color: #6366f1;">4.9/5</div>
                            <div style="color: #6b7280;">User Rating</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 2.5rem; font-weight: 800; color: #6366f1;">99.9%</div>
                            <div style="color: #6b7280;">Uptime</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- FAQ Section -->
        <section style="background: #f8f9fa; padding: 80px 0;">
            <div class="container">
                <div style="text-align: center; margin-bottom: 60px;">
                    <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; color: #1f2937;">
                        Frequently Asked Questions
                    </h2>
                    <p style="font-size: 1.2rem; color: #6b7280;">
                        Everything you need to know about FLUX.1 Krea
                    </p>
                </div>
                
                <div style="max-width: 800px; margin: 0 auto;">
                    <div class="faq-item">
                        <div class="faq-question">
                            <h3>What is FLUX.1 Krea?</h3>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>FLUX.1 Krea is a state-of-the-art AI image generation model that creates high-quality, photorealistic images from text descriptions. It's designed to understand complex prompts and generate professional-grade visuals in seconds.</p>
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <h3>How fast is image generation?</h3>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>FLUX.1 Krea generates high-quality images in just 4-10 seconds, making it one of the fastest AI image generators available while maintaining exceptional quality.</p>
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <h3>Can I use generated images commercially?</h3>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>Yes! All images generated with FLUX.1 Krea can be used for commercial purposes without restrictions. You own the rights to your generated content.</p>
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <h3>What image sizes are supported?</h3>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>FLUX.1 Krea supports various aspect ratios including square (1024×1024), landscape (1024×768), and portrait (768×1024) formats, all in high resolution.</p>
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <h3>How do I write effective prompts?</h3>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>Be descriptive and specific. Include details about style, lighting, composition, and mood. For example: "A serene mountain lake at sunset, oil painting style, warm golden lighting, peaceful atmosphere."</p>
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <h3>Is there a free trial available?</h3>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="faq-answer">
                            <p>Yes! We offer free credits for new users to try FLUX.1 Krea. You can generate several images to experience the quality and speed before upgrading.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Footer -->
        <footer style="background: #1f2937; color: white; padding: 60px 0 30px;">
            <div class="container">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; margin-bottom: 40px;">
                    <div>
                        <div class="logo" style="color: white; margin-bottom: 20px;">
                            <div class="logo-icon">K</div>
                            Flux Krea AI
                        </div>
                        <p style="color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
                            Transform your creative vision into stunning reality with the power of advanced AI image generation.
                        </p>
                        <div style="display: flex; gap: 15px;">
                            <a href="#" style="color: #9ca3af; font-size: 1.2rem; transition: color 0.3s;"><i class="fab fa-twitter"></i></a>
                            <a href="#" style="color: #9ca3af; font-size: 1.2rem; transition: color 0.3s;"><i class="fab fa-facebook"></i></a>
                            <a href="#" style="color: #9ca3af; font-size: 1.2rem; transition: color 0.3s;"><i class="fab fa-instagram"></i></a>
                            <a href="#" style="color: #9ca3af; font-size: 1.2rem; transition: color 0.3s;"><i class="fab fa-linkedin"></i></a>
                        </div>
                    </div>
                    
                    <div>
                        <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 20px;">Product</h4>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Features</a></li>
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Pricing</a></li>
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">API</a></li>
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Documentation</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 20px;">Company</h4>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">About</a></li>
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Blog</a></li>
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Careers</a></li>
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Contact</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 20px;">Support</h4>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Help Center</a></li>
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Community</a></li>
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Privacy Policy</a></li>
                            <li style="margin-bottom: 10px;"><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.3s;">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #374151; padding-top: 30px; text-align: center; color: #9ca3af;">
                    <p>&copy; 2024 Flux Krea AI. All rights reserved. Powered by advanced AI technology.</p>
                </div>
            </div>
        </footer>
        
        <style>
            .feature-card {
                background: white;
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                border: 1px solid #e5e7eb;
                text-align: center;
                transition: transform 0.3s, box-shadow 0.3s;
            }
            
            .feature-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            }
            
            .feature-image {
                margin-bottom: 20px;
            }
            
            .feature-card h3 {
                font-size: 1.3rem;
                font-weight: 700;
                margin-bottom: 15px;
                color: #1f2937;
            }
            
            .feature-card p {
                color: #6b7280;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            
            .demo-btn {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .demo-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(99, 102, 241, 0.3);
            }
            
            .testimonial-card {
                background: white;
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                border: 1px solid #e5e7eb;
            }
            
            .stars {
                color: #fbbf24;
                margin-bottom: 20px;
                font-size: 1.1rem;
            }
            
            .testimonial-card p {
                color: #374151;
                line-height: 1.6;
                margin-bottom: 20px;
                font-style: italic;
            }
            
            .testimonial-author {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .author-avatar {
                width: 50px;
                height: 50px;
                background: #6366f1;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 1.2rem;
            }
            
            .author-name {
                font-weight: 600;
                color: #1f2937;
            }
            
            .author-title {
                color: #6b7280;
                font-size: 0.9rem;
            }
            
            .faq-item {
                background: white;
                border-radius: 12px;
                margin-bottom: 15px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                border: 1px solid #e5e7eb;
            }
            
            .faq-question {
                padding: 25px 30px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background 0.3s;
            }
            
            .faq-question:hover {
                background: #f8f9fa;
            }
            
            .faq-question h3 {
                font-size: 1.1rem;
                font-weight: 600;
                color: #1f2937;
                margin: 0;
            }
            
            .faq-question i {
                color: #6b7280;
                transition: transform 0.3s;
            }
            
            .faq-answer {
                padding: 0 30px 25px;
                display: none;
            }
            
            .faq-answer p {
                color: #6b7280;
                line-height: 1.6;
                margin: 0;
            }
            
            .faq-item.active .faq-answer {
                display: block;
            }
            
            .faq-item.active .faq-question i {
                transform: rotate(180deg);
            }
        </style>
        
        <script>
            // Mode switching
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
            
            // Steps slider
            const stepsSlider = document.getElementById('stepsSlider');
            const stepsValue = document.getElementById('stepsValue');
            
            stepsSlider.addEventListener('input', () => {
                stepsValue.textContent = stepsSlider.value;
            });
            
            // Generate button
            document.getElementById('generateBtn').addEventListener('click', async () => {
                const prompt = document.getElementById('prompt').value;
                const imageSize = document.getElementById('imageSize').value;
                const steps = parseInt(stepsSlider.value);
                const resultArea = document.getElementById('resultArea');
                const generateBtn = document.getElementById('generateBtn');
                
                if (!prompt.trim()) {
                    alert('Please enter a prompt');
                    return;
                }
                
                // Show loading
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
                
                resultArea.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <h3>正在生成图像...</h3>
                        <p>本地模型生成中，请耐心等待 30-60 秒</p>
                    </div>
                `;
                
                try {
                    const [width, height] = imageSize.split('x').map(Number);
                    
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
                            <img src="/image/${data.filename}" alt="Generated image" class="result-image">
                            <div style="margin-top: 15px; text-align: center;">
                                <p style="color: #6b7280; font-size: 14px;">
                                    <strong>Prompt:</strong> ${prompt}
                                </p>
                                <p style="color: #6b7280; font-size: 12px; margin-top: 5px;">
                                    Size: ${width}×${height} | Steps: ${steps}
                                </p>
                            </div>
                        `;
                    } else {
                        resultArea.innerHTML = `
                            <div style="text-align: center; color: #ef4444; padding: 40px;">
                                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                                <h3>Generation Failed</h3>
                                <p>${data.error}</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    resultArea.innerHTML = `
                        <div style="text-align: center; color: #ef4444; padding: 40px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                            <h3>Network Error</h3>
                            <p>Please check your connection and try again</p>
                        </div>
                    `;
                } finally {
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Generate Images';
                }
            });
            
            // Copy button
            document.querySelector('.copy-btn').addEventListener('click', () => {
                const prompt = document.getElementById('prompt');
                prompt.select();
                document.execCommand('copy');
                
                const btn = document.querySelector('.copy-btn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            });
            
            // Demo generation function
            function demoGenerate(prompt) {
                document.getElementById('prompt').value = prompt;
                document.getElementById('generateBtn').click();
                
                // Scroll to generator
                document.querySelector('.main-grid').scrollIntoView({ 
                    behavior: 'smooth' 
                });
            }
            
            // FAQ toggle
            document.querySelectorAll('.faq-question').forEach(question => {
                question.addEventListener('click', () => {
                    const faqItem = question.parentElement;
                    const isActive = faqItem.classList.contains('active');
                    
                    // Close all FAQ items
                    document.querySelectorAll('.faq-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Open clicked item if it wasn't active
                    if (!isActive) {
                        faqItem.classList.add('active');
                    }
                });
            });
            
            // Smooth scrolling for navigation links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                });
            });
            
            // Add window.demoGenerate for global access
            window.demoGenerate = demoGenerate;
        </script>
    </body>
    </html>
    '''

@app.route('/generate', methods=['POST'])
def generate():
    print("🔥 收到生成请求！")
    try:
        data = request.json
        print(f"📦 请求数据: {data}")
        
        prompt = data.get('prompt', '')
        width = data.get('width', 1024)
        height = data.get('height', 1024)
        steps = data.get('steps', 4)
        
        if not prompt:
            print("❌ 提示词为空")
            return jsonify({'success': False, 'error': '请输入提示词'})
        
        print(f"📝 收到生成请求: '{prompt}' ({width}x{height}, {steps}步)")
        
        # 直接使用HF API生成
        filename = generate_image_hf(prompt, HF_API_TOKEN, width, height, steps)
        
        if filename:
            print(f"🎉 生成成功: {filename}")
            return jsonify({'success': True, 'filename': filename})
        else:
            print("❌ 生成失败")
            return jsonify({'success': False, 'error': '生成失败，模型可能正在加载中，请稍后重试'})
            
    except Exception as e:
        print(f"💥 生成过程异常: {e}")
        return jsonify({'success': False, 'error': f'服务器错误: {str(e)}'})

@app.route('/image/<filename>')
def serve_image(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

if __name__ == '__main__':
    print("🚀 启动 Krea 风格 FLUX 文生图服务...")
    print("📱 访问: http://localhost:8088")
    print("⏳ 首次生成时需要加载模型，请耐心等待...")
    
    # 在后台线程中预加载模型
    def preload_models():
        logger.info("开始预加载模型...")
        load_models()
    
    threading.Thread(target=preload_models, daemon=True).start()
    
    app.run(debug=True, port=8088, host='127.0.0.1', threaded=True)