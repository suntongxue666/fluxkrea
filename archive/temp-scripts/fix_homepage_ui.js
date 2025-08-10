// 修复首页UI问题的脚本
const fs = require('fs');
const path = require('path');

function fixHomepageUI() {
    console.log('🔧 开始修复首页UI问题...');
    
    try {
        // 读取首页文件
        const indexPath = path.join(__dirname, 'public', 'index.html');
        let content = fs.readFileSync(indexPath, 'utf8');
        
        console.log('📄 已读取首页文件');
        
        // 1. 修复登录弹窗样式 - 添加登录弹窗的HTML和CSS
        const loginModalHTML = `
    <!-- Login Required Modal -->
    <div id="loginRequiredModal" class="login-modal">
        <div class="modal-overlay" onclick="closeLoginModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeLoginModal()">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="modal-header">
                <h2>Credits Balance is 20</h2>
                <p>Sign in to continue generating amazing AI images</p>
            </div>
            
            <div class="login-benefits">
                <div class="benefit-item">
                    <i class="fas fa-bolt"></i>
                    <span>Keep your credits across sessions</span>
                </div>
                <div class="benefit-item">
                    <i class="fas fa-history"></i>
                    <span>Access your generation history</span>
                </div>
                <div class="benefit-item">
                    <i class="fas fa-crown"></i>
                    <span>Unlock premium features</span>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="google-signin-btn" onclick="signInWithGoogle()">
                    <div class="google-icon"></div>
                    Sign in with Google
                </button>
                <button class="secondary-btn" onclick="closeLoginModal()">
                    Maybe Later
                </button>
            </div>
        </div>
    </div>`;
        
        // 2. 添加登录弹窗的CSS样式
        const loginModalCSS = `
        /* Login Modal Styles */
        .login-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
        }
        
        .login-modal.active {
            display: flex;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
        }
        
        .modal-content {
            position: relative;
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 480px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: #f1f5f9;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #64748b;
            transition: all 0.2s;
        }
        
        .modal-close:hover {
            background: #e2e8f0;
            color: #374151;
        }
        
        .modal-header {
            text-align: center;
            margin-bottom: 32px;
        }
        
        .modal-header h2 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #1a202c;
        }
        
        .modal-header p {
            color: #64748b;
            font-size: 16px;
        }
        
        .login-benefits {
            margin: 32px 0;
        }
        
        .benefit-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 0;
            color: #374151;
        }
        
        .benefit-item i {
            width: 24px;
            color: #6366f1;
            font-size: 18px;
        }
        
        .modal-actions {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .google-signin-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 14px 24px;
            background: #ffffff;
            border: 1px solid #dadce0;
            border-radius: 8px;
            color: #3c4043;
            font-weight: 500;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .google-signin-btn:hover {
            background: #f8f9fa;
            border-color: #dadce0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .google-signin-btn .google-icon {
            width: 20px;
            height: 20px;
            background: url('https://www.gstatic.com/marketing-cms/assets/images/76/76/c79495454250aaacab1867bdcda4/about-10things-g.png') no-repeat center;
            background-size: contain;
        }
        
        .secondary-btn {
            padding: 14px 24px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            color: #64748b;
            font-weight: 500;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .secondary-btn:hover {
            background: #e2e8f0;
            color: #374151;
        }`;
        
        // 3. 添加登录弹窗的JavaScript函数
        const loginModalJS = `
        // Login Modal Functions
        function showLoginModal() {
            const modal = document.getElementById('loginRequiredModal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
        
        function closeLoginModal() {
            const modal = document.getElementById('loginRequiredModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }
        
        // 修改Generate按钮逻辑
        async function generateImage() {
            console.log('=== 🎯 开始图像生成 ===');
            
            // 检查用户登录状态
            if (!currentUser) {
                console.log('用户未登录，显示登录弹窗');
                showLoginModal();
                return;
            }
            
            // 检查积分
            const currentCredits = creditsManager?.credits || 0;
            const generationCost = systemSettings?.generation_cost || 10;
            
            if (currentCredits < generationCost) {
                alert(\`积分不足！当前积分: \${currentCredits}，需要: \${generationCost}\`);
                return;
            }
            
            const prompt = document.getElementById('promptInput').value.trim();
            if (!prompt) {
                alert('请输入图像描述');
                return;
            }
            
            const resultArea = document.getElementById('resultArea');
            const generateBtn = document.getElementById('generateBtn');
            
            try {
                // 禁用按钮
                generateBtn.disabled = true;
                generateBtn.innerHTML = \`
                    <span class="btn-content">
                        <div class="loading-spinner"></div>
                        Generating...
                    </span>
                \`;
                
                // 显示生成状态
                resultArea.innerHTML = \`
                    <div class="generating-status">
                        <div class="loading-spinner"></div>
                        <h3>正在生成图像...</h3>
                        <p>请稍候，AI正在为您创作精美图像</p>
                        <div class="generation-progress">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <p class="progress-text">预计需要 15-30 秒</p>
                        </div>
                    </div>
                \`;
                
                // 添加进度动画
                setTimeout(() => {
                    const progressFill = document.querySelector('.progress-fill');
                    if (progressFill) {
                        progressFill.style.width = '100%';
                    }
                }, 100);
                
                // 扣除积分
                await creditsManager.deductCredits(generationCost, 'AI图像生成');
                
                // 调用API生成图像（增加等待时间）
                const imageSize = document.getElementById('imageSize').value;
                const guidanceScale = document.getElementById('guidanceScale').value;
                
                console.log('调用图像生成API...', { prompt, imageSize, guidanceScale });
                
                // 模拟更长的等待时间
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const result = await callImageGenerationAPI(prompt, imageSize, guidanceScale);
                
                if (result && result.imageUrl) {
                    // 显示成功结果
                    resultArea.innerHTML = \`
                        <div class="result-success">
                            <img src="\${result.imageUrl}" alt="Generated Image" class="generated-image" />
                            <div class="result-actions">
                                <button class="action-btn" onclick="downloadImage('\${result.imageUrl}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                <button class="action-btn" onclick="shareImage('\${result.imageUrl}')">
                                    <i class="fas fa-share"></i> Share
                                </button>
                            </div>
                            <div class="generation-info">
                                <p>生成时间: \${new Date().toLocaleTimeString()}</p>
                                <p>消耗积分: \${generationCost}</p>
                                <p>剩余积分: \${creditsManager.credits}</p>
                            </div>
                        </div>
                    \`;
                    
                    console.log('✅ 图像生成成功');
                } else {
                    throw new Error('生成失败，请重试');
                }
                
            } catch (error) {
                console.error('❌ 图像生成失败:', error);
                
                // 显示错误状态
                resultArea.innerHTML = \`
                    <div class="result-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>生成失败</h3>
                        <p>\${error.message}</p>
                        <button onclick="generateImage()" class="action-btn">
                            <i class="fas fa-redo"></i> 重试
                        </button>
                    </div>
                \`;
                
                // 退还积分
                await creditsManager.addCredits(generationCost, '生成失败退还');
                
            } finally {
                // 恢复按钮
                generateBtn.disabled = false;
                generateBtn.innerHTML = \`
                    <span class="btn-content">
                        <i class="fas fa-bolt"></i>
                        Generate
                    </span>
                    <span class="credits-cost">-\${generationCost} credits</span>
                \`;
            }
        }`;
        
        // 4. 添加进度条样式
        const progressCSS = `
        .generation-progress {
            margin-top: 24px;
            width: 100%;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e2e8f0;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            width: 0%;
            transition: width 20s ease-out;
        }
        
        .progress-text {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin: 0;
        }`;
        
        // 查找插入位置并添加内容
        
        // 1. 在</style>标签前添加CSS
        const styleEndIndex = content.lastIndexOf('</style>');
        if (styleEndIndex !== -1) {
            content = content.slice(0, styleEndIndex) + 
                     loginModalCSS + '\n        ' + 
                     progressCSS + '\n        ' + 
                     content.slice(styleEndIndex);
            console.log('✅ 已添加登录弹窗CSS样式');
        }
        
        // 2. 在</body>标签前添加HTML
        const bodyEndIndex = content.lastIndexOf('</body>');
        if (bodyEndIndex !== -1) {
            content = content.slice(0, bodyEndIndex) + 
                     loginModalHTML + '\n    ' + 
                     content.slice(bodyEndIndex);
            console.log('✅ 已添加登录弹窗HTML');
        }
        
        // 3. 替换现有的generateImage函数
        const generateFunctionRegex = /async function generateImage\(\)[^}]*\{[\s\S]*?\n        \}/;
        if (generateFunctionRegex.test(content)) {
            content = content.replace(generateFunctionRegex, loginModalJS.trim());
            console.log('✅ 已更新generateImage函数');
        } else {
            // 如果没找到，在</script>前添加
            const scriptEndIndex = content.lastIndexOf('</script>');
            if (scriptEndIndex !== -1) {
                content = content.slice(0, scriptEndIndex) + 
                         '\n        ' + loginModalJS + '\n        ' + 
                         content.slice(scriptEndIndex);
                console.log('✅ 已添加登录弹窗JavaScript');
            }
        }
        
        // 写回文件
        fs.writeFileSync(indexPath, content, 'utf8');
        console.log('✅ 首页文件更新完成');
        
        return true;
        
    } catch (error) {
        console.error('❌ 修复首页UI失败:', error);
        return false;
    }
}

// 运行修复
if (fixHomepageUI()) {
    console.log('🎉 首页UI修复完成！');
    console.log('修复内容:');
    console.log('1. ✅ 添加了登录弹窗样式（使用Google登录样式）');
    console.log('2. ✅ 优化了Generate按钮逻辑（增加等待时间和进度显示）');
    console.log('3. ✅ 改进了用户体验（积分检查、错误处理）');
} else {
    console.log('❌ 首页UI修复失败');
    process.exit(1);
}