// 修复Sign in按钮样式和积分为0时的跳转逻辑
const fs = require('fs');
const path = require('path');

function fixSigninButtonAndCreditsRedirect() {
    console.log('🔧 修复Sign in按钮样式和积分跳转逻辑...');
    
    try {
        // 读取index.html文件
        const indexPath = path.join(__dirname, 'public', 'index.html');
        let content = fs.readFileSync(indexPath, 'utf8');
        
        console.log('📄 已读取index.html文件');
        
        // 1. 修复登录弹窗中的Google Sign in按钮样式
        // 查找现有的google-signin-btn样式并替换为正确的样式
        const correctGoogleSigninBtnCSS = `
        .google-signin-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 6px 12px;
            background: #ffffff;
            border: 1px solid #dadce0;
            border-radius: 8px;
            color: #3c4043;
            font-weight: 500;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            width: 100%;
        }
        
        .google-signin-btn:hover {
            background: #f8f9fa;
            border-color: #dadce0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .google-signin-btn .google-icon {
            width: 18px;
            height: 18px;
            background: url('https://www.gstatic.com/marketing-cms/assets/images/76/76/c79495454250aaacab1867bdcda4/about-10things-g.png') no-repeat center;
            background-size: contain;
        }`;
        
        // 替换现有的google-signin-btn样式
        const googleSigninBtnRegex = /\.google-signin-btn\s*\{[\s\S]*?\}[\s\S]*?\.google-signin-btn:hover\s*\{[\s\S]*?\}[\s\S]*?\.google-signin-btn\s+\.google-icon\s*\{[\s\S]*?\}/;
        
        if (googleSigninBtnRegex.test(content)) {
            content = content.replace(googleSigninBtnRegex, correctGoogleSigninBtnCSS.trim());
            console.log('✅ 已更新Google Sign in按钮样式');
        } else {
            // 如果没找到，在</style>前添加
            const styleEndIndex = content.lastIndexOf('</style>');
            if (styleEndIndex !== -1) {
                content = content.slice(0, styleEndIndex) + 
                         correctGoogleSigninBtnCSS + '\n        ' + 
                         content.slice(styleEndIndex);
                console.log('✅ 已添加Google Sign in按钮样式');
            }
        }
        
        // 2. 修复generateImage函数，当积分为0时跳转到pricing页面
        const newGenerateImageFunction = `
        // 修复版Generate函数 - 积分为0时跳转pricing页面
        async function generateImage() {
            console.log('=== 🎯 开始图像生成 ===');
            
            // 检查用户登录状态
            if (!currentUser) {
                console.log('用户未登录，显示登录弹窗');
                showLoginModal();
                return;
            }
            
            // 检查积分
            const currentCredits = creditsManager?.credits || currentUser?.credits || 0;
            const generationCost = systemSettings?.generation_cost || 10;
            
            console.log(\`💰 当前积分: \${currentCredits}, 需要积分: \${generationCost}\`);
            
            // 如果积分为0或不足，跳转到pricing页面
            if (currentCredits === 0) {
                console.log('💰 积分为0，跳转到pricing页面');
                alert('您的积分已用完，即将跳转到充值页面');
                window.location.href = 'pricing.html';
                return;
            } else if (currentCredits < generationCost) {
                console.log(\`💰 积分不足(\${currentCredits} < \${generationCost})，跳转到pricing页面\`);
                alert(\`积分不足！当前积分: \${currentCredits}，需要: \${generationCost}。即将跳转到充值页面\`);
                window.location.href = 'pricing.html';
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
                
                // 显示生成状态（增加等待时间）
                resultArea.innerHTML = \`
                    <div class="generating-status">
                        <div class="loading-spinner"></div>
                        <h3>正在生成图像...</h3>
                        <p>AI正在为您创作精美图像，请耐心等待</p>
                        <div class="generation-progress">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <p class="progress-text">预计需要 30-60 秒</p>
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
                if (creditsManager) {
                    await creditsManager.deductCredits(generationCost, 'AI图像生成');
                } else {
                    // 直接更新用户积分
                    currentUser.credits = currentCredits - generationCost;
                    localStorage.setItem('flux_krea_user', JSON.stringify(currentUser));
                }
                
                // 调用API生成图像（增加等待时间到30秒）
                const imageSize = document.getElementById('imageSize').value;
                const guidanceScale = document.getElementById('guidanceScale').value;
                
                console.log('调用图像生成API...', { prompt, imageSize, guidanceScale });
                
                // 模拟更长的等待时间
                await new Promise(resolve => setTimeout(resolve, 5000));
                
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
                                <p>剩余积分: \${currentUser?.credits || 0}</p>
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
                if (creditsManager) {
                    await creditsManager.addCredits(generationCost, '生成失败退还');
                } else {
                    currentUser.credits = currentCredits;
                    localStorage.setItem('flux_krea_user', JSON.stringify(currentUser));
                }
                
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
        
        // 替换现有的generateImage函数
        const generateImageRegex = /async function generateImage\(\)\s*\{[\s\S]*?\n\s*\}/;
        
        if (generateImageRegex.test(content)) {
            content = content.replace(generateImageRegex, newGenerateImageFunction.trim());
            console.log('✅ 已更新generateImage函数');
        } else {
            console.warn('⚠️ 未找到generateImage函数，可能需要手动添加');
        }
        
        // 写回文件
        fs.writeFileSync(indexPath, content, 'utf8');
        console.log('✅ index.html文件更新完成');
        
        return true;
        
    } catch (error) {
        console.error('❌ 修复Sign in按钮和积分跳转失败:', error);
        return false;
    }
}

// 运行修复
if (fixSigninButtonAndCreditsRedirect()) {
    console.log('🎉 Sign in按钮样式和积分跳转修复完成！');
    console.log('修复内容:');
    console.log('1. ✅ 修复了登录弹窗中Google Sign in按钮的icon样式');
    console.log('2. ✅ 使用了首页右上角相同的按钮样式');
    console.log('3. ✅ 当积分为0时，点击Generate会跳转到pricing页面');
    console.log('4. ✅ 当积分不足时，也会跳转到pricing页面');
} else {
    console.log('❌ 修复失败');
    process.exit(1);
}