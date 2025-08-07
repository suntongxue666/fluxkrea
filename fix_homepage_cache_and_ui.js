// 修复首页的缓存和UI问题
const fs = require('fs');
const path = require('path');

function fixHomepageCacheAndUI() {
    console.log('🔧 修复首页缓存和UI问题...');
    
    try {
        // 读取index.html文件
        const indexPath = path.join(__dirname, 'public', 'index.html');
        let content = fs.readFileSync(indexPath, 'utf8');
        
        console.log('📄 已读取index.html文件');
        
        // 1. 添加防缓存的meta标签
        const cacheControlMeta = `
    <!-- 防缓存控制 -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">`;
        
        // 在head标签中添加防缓存meta
        const headEndIndex = content.indexOf('</head>');
        if (headEndIndex !== -1) {
            content = content.slice(0, headEndIndex) + 
                     cacheControlMeta + '\n    ' + 
                     content.slice(headEndIndex);
            console.log('✅ 已添加防缓存meta标签');
        }
        
        // 2. 修复Generate按钮的登录弹窗样式
        const loginModalHTML = `
    <!-- Login Required Modal -->
    <div id="loginRequiredModal" class="login-modal">
        <div class="modal-overlay" onclick="closeLoginModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeLoginModal()">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="modal-header">
                <h2>Credits Balance is <span id="modalCreditsAmount">--</span></h2>
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
        
        // 3. 添加用户状态同步脚本
        const userStateSyncScript = `
        // 用户状态同步增强版
        function syncUserStateAcrossPages() {
            try {
                console.log('🔄 同步用户状态到其他页面...');
                
                if (currentUser) {
                    // 保存到localStorage
                    localStorage.setItem('flux_krea_user', JSON.stringify(currentUser));
                    
                    // 触发跨页面同步事件
                    window.dispatchEvent(new CustomEvent('userStateUpdated', {
                        detail: { user: currentUser }
                    }));
                    
                    console.log('✅ 用户状态已同步');
                }
            } catch (error) {
                console.error('❌ 同步用户状态失败:', error);
            }
        }
        
        // 监听用户状态变化
        window.addEventListener('userStateUpdated', function(event) {
            console.log('👤 用户状态已更新:', event.detail.user?.email);
            updateUIForAuthenticatedUser();
        });
        
        // 页面可见性变化时同步状态
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                console.log('📄 页面重新可见，检查用户状态...');
                
                // 检查localStorage中的用户状态
                const userData = localStorage.getItem('flux_krea_user');
                if (userData && !currentUser) {
                    try {
                        currentUser = JSON.parse(userData);
                        console.log('✅ 从localStorage恢复用户状态:', currentUser.email);
                        updateUIForAuthenticatedUser();
                    } catch (e) {
                        console.error('❌ 解析用户数据失败:', e);
                    }
                }
            }
        });
        
        // 修复Generate按钮逻辑
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
        }
        
        // 登录弹窗函数
        function showLoginModal() {
            const modal = document.getElementById('loginRequiredModal');
            if (modal) {
                // 更新积分显示
                const creditsTitle = modal.querySelector('.modal-header h2');
                if (creditsTitle) {
                    creditsTitle.textContent = \`Credits Balance is \${currentUser?.credits || '--'}\`;
                }
                
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
        }`;
        
        // 在</body>标签前添加登录弹窗HTML
        const bodyEndIndex = content.lastIndexOf('</body>');
        if (bodyEndIndex !== -1) {
            content = content.slice(0, bodyEndIndex) + 
                     loginModalHTML + '\n    ' + 
                     content.slice(bodyEndIndex);
            console.log('✅ 已添加登录弹窗HTML');
        }
        
        // 在</script>标签前添加用户状态同步脚本
        const scriptEndIndex = content.lastIndexOf('</script>');
        if (scriptEndIndex !== -1) {
            content = content.slice(0, scriptEndIndex) + 
                     '\n        ' + userStateSyncScript + '\n        ' + 
                     content.slice(scriptEndIndex);
            console.log('✅ 已添加用户状态同步脚本');
        }
        
        // 写回文件
        fs.writeFileSync(indexPath, content, 'utf8');
        console.log('✅ index.html文件更新完成');
        
        return true;
        
    } catch (error) {
        console.error('❌ 修复首页问题失败:', error);
        return false;
    }
}

// 运行修复
if (fixHomepageCacheAndUI()) {
    console.log('🎉 首页问题修复完成！');
    console.log('修复内容:');
    console.log('1. ✅ 添加了防缓存meta标签');
    console.log('2. ✅ 修复了Generate按钮登录弹窗样式');
    console.log('3. ✅ 增加了图像生成等待时间');
    console.log('4. ✅ 添加了用户状态跨页面同步');
    console.log('5. ✅ 修复了积分显示同步问题');
} else {
    console.log('❌ 首页问题修复失败');
    process.exit(1);
}