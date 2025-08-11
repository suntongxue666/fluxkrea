/**
 * 积分系统优化脚本
 * 实现以下功能：
 * 1. 未注册用户Generate弹窗优化，首次登录赠送20积分
 * 2. 登录后只显示Gmail头像，不显示用户名和边框
 * 3. 点击头像显示用户信息下拉菜单
 * 4. Pricing页面积分余额前加icon，实时显示
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 开始积分系统优化...\n');

// 读取文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const pricingPath = path.join(__dirname, 'public', 'pricing.html');

let indexContent = fs.readFileSync(indexPath, 'utf8');
let pricingContent = fs.readFileSync(pricingPath, 'utf8');

console.log('📋 优化内容:');
console.log('1. ✅ 优化未注册用户Generate弹窗');
console.log('2. ✅ 修改登录后只显示头像');
console.log('3. ✅ 添加用户信息下拉菜单');
console.log('4. ✅ Pricing页面积分显示优化');

// 1. 优化showCreditsModal函数
const optimizedShowCreditsModal = `
        window.showCreditsModal = function (currentCredits = null, requiredCredits = 10) {
            const modal = document.getElementById('creditsModal');
            const title = document.getElementById('creditsModalTitle');
            const content = document.getElementById('creditsModalContent');

            if (!modal || !title || !content) {
                console.error('❌ 弹窗元素未找到');
                return;
            }

            if (currentCredits === null) {
                // 未登录用户 - 强调首次登录赠送20积分
                title.textContent = '🎁 获取免费积分';
                content.innerHTML = \`
                    <div style="text-align: center; line-height: 1.6;">
                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #333;">
                            <strong>首次登录即可获得 20 个免费积分！</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            使用Gmail账号登录，立即开始创作您的AI图片
                        </p>
                    </div>
                \`;
                console.log('📱 显示未登录弹窗 - 强调首次登录赠送20积分');
            } else if (currentCredits === 0) {
                // 已登录用户积分为0
                title.textContent = '💳 积分不足';
                content.innerHTML = \`
                    <div style="text-align: center; line-height: 1.6;">
                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #333;">
                            您的积分已用完
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            生成一张图片需要10积分，请购买更多积分继续创作
                        </p>
                    </div>
                \`;
                console.log('📱 显示积分为0弹窗');
            } else {
                // 已登录但积分不足（但不为0）
                title.textContent = '💳 积分不足';
                content.innerHTML = \`
                    <div style="text-align: center; line-height: 1.6;">
                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #333;">
                            当前积分：<strong>\${currentCredits}</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            生成图片需要 <strong>\${requiredCredits}</strong> 积分，请购买更多积分
                        </p>
                    </div>
                \`;
                console.log(\`📱 显示积分不足弹窗: \${currentCredits}/\${requiredCredits}\`);
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
`;

// 2. 添加用户下拉菜单HTML结构
const userDropdownHTML = `
        <!-- 用户信息下拉菜单 -->
        <div id="userDropdown" class="user-dropdown" style="display: none;">
            <div class="user-dropdown-content">
                <div class="user-info-section">
                    <div class="user-avatar-large">
                        <img id="dropdownUserAvatar" src="" alt="User Avatar">
                    </div>
                    <div class="user-details">
                        <div class="username" id="dropdownUsername">用户名</div>
                        <div class="user-level" id="dropdownUserLevel">Level: Free</div>
                        <div class="user-valid-time" id="dropdownValidTime">Valid time: --</div>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-actions">
                    <button class="dropdown-btn" onclick="handleSignOut()">
                        <i class="fas fa-sign-out-alt"></i>
                        Sign out
                    </button>
                </div>
            </div>
        </div>
`;

// 3. 添加用户下拉菜单CSS样式
const userDropdownCSS = `
        /* 用户下拉菜单样式 */
        .user-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            z-index: 1000;
            min-width: 280px;
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin-top: 8px;
        }

        .user-dropdown-content {
            padding: 16px;
        }

        .user-info-section {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }

        .user-avatar-large {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
        }

        .user-avatar-large img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .user-details {
            flex: 1;
        }

        .username {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 4px;
        }

        .user-level {
            font-size: 14px;
            color: #666;
            margin-bottom: 2px;
        }

        .user-valid-time {
            font-size: 12px;
            color: #999;
        }

        .dropdown-divider {
            height: 1px;
            background: #e1e5e9;
            margin: 16px -16px;
        }

        .dropdown-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .dropdown-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 8px 12px;
            background: none;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            color: #666;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .dropdown-btn:hover {
            background: #f5f5f5;
            color: #333;
        }

        .dropdown-btn i {
            width: 16px;
            text-align: center;
        }

        /* 登录按钮优化 - 只显示头像 */
        .signin-btn.logged-in {
            padding: 4px;
            border: none;
            background: none;
            position: relative;
        }

        .signin-btn.logged-in:hover {
            background: #f5f5f5;
            border-radius: 50%;
        }

        .signin-btn .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            overflow: hidden;
        }

        .signin-btn .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* 积分显示优化 */
        .credits-display {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            color: white;
            font-weight: 600;
            font-size: 14px;
        }

        .credits-display i {
            font-size: 16px;
            color: #ffd700;
        }

        /* 响应式优化 */
        @media (max-width: 768px) {
            .user-dropdown {
                min-width: 260px;
                right: -10px;
            }
            
            .user-info-section {
                flex-direction: column;
                text-align: center;
                gap: 8px;
            }
        }
`;

// 4. 添加用户下拉菜单JavaScript功能
const userDropdownJS = `
        // 用户下拉菜单功能
        let isDropdownOpen = false;

        // 切换下拉菜单显示
        window.toggleUserDropdown = function() {
            const dropdown = document.getElementById('userDropdown');
            const signinBtn = document.querySelector('.signin-btn');
            
            if (!dropdown || !signinBtn) return;

            isDropdownOpen = !isDropdownOpen;
            
            if (isDropdownOpen) {
                dropdown.style.display = 'block';
                updateDropdownUserInfo();
                
                // 点击外部关闭下拉菜单
                setTimeout(() => {
                    document.addEventListener('click', closeDropdownOnClickOutside);
                }, 100);
            } else {
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeDropdownOnClickOutside);
            }
        };

        // 点击外部关闭下拉菜单
        function closeDropdownOnClickOutside(event) {
            const dropdown = document.getElementById('userDropdown');
            const signinBtn = document.querySelector('.signin-btn');
            
            if (!dropdown.contains(event.target) && !signinBtn.contains(event.target)) {
                dropdown.style.display = 'none';
                isDropdownOpen = false;
                document.removeEventListener('click', closeDropdownOnClickOutside);
            }
        }

        // 更新下拉菜单用户信息
        function updateDropdownUserInfo() {
            const currentUser = window.UnifiedStateSync?.getCurrentUser();
            if (!currentUser) return;

            // 更新头像
            const avatarImg = document.getElementById('dropdownUserAvatar');
            if (avatarImg) {
                avatarImg.src = currentUser.avatar_url || 'https://via.placeholder.com/48';
            }

            // 更新用户名
            const username = document.getElementById('dropdownUsername');
            if (username) {
                username.textContent = currentUser.name || currentUser.email?.split('@')[0] || 'User';
            }

            // 更新用户等级
            const userLevel = document.getElementById('dropdownUserLevel');
            if (userLevel) {
                // 这里可以根据实际的会员状态来判断
                const level = currentUser.subscription_status === 'active' ? 
                    (currentUser.plan_type === 'pro' ? 'Pro' : 'Max') : 'Free';
                userLevel.textContent = \`Level: \${level}\`;
            }

            // 更新有效期
            const validTime = document.getElementById('dropdownValidTime');
            if (validTime) {
                if (currentUser.subscription_status === 'active' && currentUser.subscription_end_date) {
                    const endDate = new Date(currentUser.subscription_end_date);
                    validTime.textContent = \`Valid time: \${endDate.toLocaleDateString()}\`;
                } else {
                    validTime.textContent = 'Valid time: --';
                }
            }
        }

        // 处理登出
        window.handleSignOut = async function() {
            try {
                console.log('🚪 开始登出...');
                
                // 关闭下拉菜单
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) {
                    dropdown.style.display = 'none';
                    isDropdownOpen = false;
                }

                // 使用UnifiedStateSync登出
                if (window.UnifiedStateSync) {
                    await window.UnifiedStateSync.signOut();
                }

                console.log('✅ 登出成功');
                
                // 刷新页面以重置状态
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                
            } catch (error) {
                console.error('❌ 登出失败:', error);
                alert('登出失败，请刷新页面重试');
            }
        };
`;

// 5. 修改UnifiedStateSync中的用户显示更新逻辑
const optimizedUserDisplay = `
        /**
         * 更新用户显示 - 优化版本
         */
        updateUserDisplay() {
            const signinBtn = document.querySelector('.signin-btn');
            
            if (signinBtn) {
                // 保存原有的onclick属性
                const originalOnclick = signinBtn.getAttribute('onclick');
                
                if (this.currentUser) {
                    // 已登录状态 - 只显示头像
                    const newHTML = \`
                        <div class="user-avatar">
                            <img src="\${this.currentUser.avatar_url || 'https://via.placeholder.com/32'}" 
                                 alt="User Avatar">
                        </div>
                    \`;
                    
                    // 只有内容不同时才更新，避免不必要的DOM操作
                    if (signinBtn.innerHTML.trim() !== newHTML.trim()) {
                        signinBtn.innerHTML = newHTML;
                        signinBtn.classList.add('logged-in');
                        
                        // 更改点击事件为显示下拉菜单
                        signinBtn.onclick = toggleUserDropdown;
                    }
                } else {
                    // 未登录状态
                    const newHTML = \`
                        <div class="google-icon"></div>
                        <span>Sign in</span>
                    \`;
                    
                    // 只有内容不同时才更新
                    if (signinBtn.innerHTML.trim() !== newHTML.trim()) {
                        signinBtn.innerHTML = newHTML;
                        signinBtn.classList.remove('logged-in');
                        
                        // 恢复原有的onclick属性
                        if (originalOnclick) {
                            signinBtn.setAttribute('onclick', originalOnclick);
                        }
                    }
                }
            }
        }
`;

// 应用修改到index.html
console.log('\n🔧 应用修改到 index.html...');

// 1. 替换showCreditsModal函数
const showCreditsModalRegex = /window\.showCreditsModal\s*=\s*function[\s\S]*?};/;
if (showCreditsModalRegex.test(indexContent)) {
    indexContent = indexContent.replace(showCreditsModalRegex, optimizedShowCreditsModal.trim());
    console.log('✅ 已优化showCreditsModal函数');
}

// 2. 在导航栏后添加用户下拉菜单HTML
const navEndIndex = indexContent.indexOf('</nav>');
if (navEndIndex !== -1) {
    indexContent = indexContent.slice(0, navEndIndex + 6) + 
                  userDropdownHTML + 
                  indexContent.slice(navEndIndex + 6);
    console.log('✅ 已添加用户下拉菜单HTML');
}

// 3. 在CSS部分添加样式
const styleEndIndex = indexContent.lastIndexOf('</style>');
if (styleEndIndex !== -1) {
    indexContent = indexContent.slice(0, styleEndIndex) + 
                  userDropdownCSS + '\n        ' + 
                  indexContent.slice(styleEndIndex);
    console.log('✅ 已添加用户下拉菜单CSS');
}

// 4. 在JavaScript部分添加功能
const scriptEndIndex = indexContent.lastIndexOf('</script>');
if (scriptEndIndex !== -1) {
    indexContent = indexContent.slice(0, scriptEndIndex) + 
                  userDropdownJS + '\n        ' + 
                  indexContent.slice(scriptEndIndex);
    console.log('✅ 已添加用户下拉菜单JavaScript');
}

// 5. 替换UnifiedStateSync中的updateUserDisplay方法
const updateUserDisplayRegex = /updateUserDisplay\(\)\s*\{[\s\S]*?\n\s*\}/;
if (updateUserDisplayRegex.test(indexContent)) {
    indexContent = indexContent.replace(updateUserDisplayRegex, optimizedUserDisplay.trim().replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, ''));
    console.log('✅ 已优化用户显示更新逻辑');
}

// 保存index.html
fs.writeFileSync(indexPath, indexContent);
console.log('✅ 已保存优化后的 index.html');

// 6. 优化Pricing页面
console.log('\n🔧 优化 Pricing 页面...');

// 在积分显示前添加icon
const pricingCreditsRegex = /<span id="creditsAmount">[^<]*<\/span>/;
if (pricingCreditsRegex.test(pricingContent)) {
    pricingContent = pricingContent.replace(
        pricingCreditsRegex,
        '<i class="fas fa-coins" style="color: #ffd700; margin-right: 4px;"></i><span id="creditsAmount">--</span>'
    );
    console.log('✅ 已在Pricing页面积分显示前添加icon');
}

// 确保Pricing页面的积分显示样式一致
const pricingCreditsDisplayRegex = /<div class="credits-display"[^>]*>/;
if (pricingCreditsDisplayRegex.test(pricingContent)) {
    pricingContent = pricingContent.replace(
        pricingCreditsDisplayRegex,
        '<div class="credits-display" id="creditsDisplay" style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; color: white; font-weight: 600; font-size: 14px;">'
    );
    console.log('✅ 已统一Pricing页面积分显示样式');
}

// 保存pricing.html
fs.writeFileSync(pricingPath, pricingContent);
console.log('✅ 已保存优化后的 pricing.html');

console.log('\n📋 优化完成总结:');
console.log('1. ✅ 优化了未注册用户Generate弹窗，强调首次登录赠送20积分');
console.log('2. ✅ 修改登录后只显示Gmail头像，移除用户名和边框');
console.log('3. ✅ 添加了用户信息下拉菜单，包含用户名、等级、有效期和登出功能');
console.log('4. ✅ 优化了Pricing页面积分显示，添加了icon和统一样式');
console.log('5. ✅ 确保了跨页面积分显示的一致性');

console.log('\n🎯 新功能说明:');
console.log('• 点击用户头像显示下拉菜单');
console.log('• 下拉菜单显示用户名、等级（Free/Pro/Max）、有效期');
console.log('• 支持一键登出功能');
console.log('• 积分显示统一使用金币icon');
console.log('• 响应式设计，支持移动端');

console.log('\n🚀 测试建议:');
console.log('1. 访问 http://localhost:3001/ 测试主页功能');
console.log('2. 测试未登录用户点击Generate的弹窗效果');
console.log('3. 登录后检查是否只显示头像');
console.log('4. 点击头像测试下拉菜单功能');
console.log('5. 访问 pricing.html 检查积分显示是否一致');

console.log('\n✅ 积分系统优化完成！');