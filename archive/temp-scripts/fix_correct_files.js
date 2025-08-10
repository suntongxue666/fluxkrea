// 修复正确的文件 - 根目录的index.html和pricing.html
const fs = require('fs');

function fixCorrectFiles() {
    console.log('🔧 修复正确的文件...');
    
    // 1. 修复根目录的index.html
    console.log('📄 修复 index.html...');
    let indexContent = fs.readFileSync('index.html', 'utf8');
    
    // 在index.html中添加用户状态保存逻辑
    const userStateSaveScript = `
    // 用户登录后保存状态到localStorage
    function saveUserStateToStorage(user) {
        try {
            const userData = {
                id: user.id,
                uuid: user.id, // Google ID作为UUID
                email: user.email,
                name: user.user_metadata?.full_name || user.email,
                avatar_url: user.user_metadata?.avatar_url,
                credits: 10, // 默认积分，会从数据库同步
                is_signed_in: true
            };
            localStorage.setItem('flux_krea_user', JSON.stringify(userData));
            console.log('✅ 用户状态已保存到localStorage:', userData);
        } catch (error) {
            console.error('❌ 保存用户状态失败:', error);
        }
    }
    
    // 修改现有的登录成功处理
    async function handleAuthSuccess(user) {
        console.log('🎉 登录成功:', user.email);
        
        // 保存到localStorage
        saveUserStateToStorage(user);
        
        // 更新UI
        updateUIForAuthenticatedUser();
        
        // 从数据库同步最新积分
        await syncUserCreditsFromDatabase(user);
    }
    
    // 同步用户积分
    async function syncUserCreditsFromDatabase(user) {
        try {
            const response = await fetch('/api/get-user-credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIdentifier: user.id })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // 更新localStorage中的积分
                    const userData = JSON.parse(localStorage.getItem('flux_krea_user'));
                    userData.credits = data.credits;
                    localStorage.setItem('flux_krea_user', JSON.stringify(userData));
                    console.log('✅ 积分已同步:', data.credits);
                }
            }
        } catch (error) {
            console.error('❌ 同步积分失败:', error);
        }
    }`;
    
    // 在</script>前添加脚本
    const scriptEndIndex = indexContent.lastIndexOf('</script>');
    if (scriptEndIndex !== -1) {
        indexContent = indexContent.slice(0, scriptEndIndex) + 
                      userStateSaveScript + '\n    ' + 
                      indexContent.slice(scriptEndIndex);
    }
    
    fs.writeFileSync('index.html', indexContent, 'utf8');
    console.log('✅ index.html 修复完成');
    
    // 2. 修复根目录的pricing.html
    console.log('📄 修复 pricing.html...');
    let pricingContent = fs.readFileSync('pricing.html', 'utf8');
    
    // 在pricing.html开头添加用户状态恢复脚本
    const userStateRestoreScript = `
    <script>
    // 页面加载时立即恢复用户状态
    let currentUser = null;
    
    // 立即从localStorage恢复用户状态
    function restoreUserState() {
        try {
            const userData = localStorage.getItem('flux_krea_user');
            if (userData) {
                currentUser = JSON.parse(userData);
                console.log('✅ 用户状态已恢复:', currentUser.email);
                console.log('💰 用户积分:', currentUser.credits);
                
                // 立即更新积分显示
                updateCreditsDisplay();
                
                // 立即更新登录状态显示
                updateSigninButton();
                
                return true;
            }
            console.log('⚠️ 没有找到用户状态');
            return false;
        } catch (error) {
            console.error('❌ 恢复用户状态失败:', error);
            return false;
        }
    }
    
    // 更新积分显示
    function updateCreditsDisplay() {
        const creditsElements = document.querySelectorAll('#creditsAmount, .credits-amount');
        const credits = currentUser ? currentUser.credits : 20;
        
        creditsElements.forEach(element => {
            if (element) {
                element.textContent = credits;
            }
        });
        
        console.log('✅ 积分显示已更新:', credits);
    }
    
    // 更新登录按钮显示
    function updateSigninButton() {
        const signinBtn = document.querySelector('.signin-btn');
        if (signinBtn && currentUser) {
            signinBtn.innerHTML = \`
                <img src="\${currentUser.avatar_url}" style="width: 18px; height: 18px; border-radius: 50%;" alt="Avatar">
                <span>\${currentUser.name || currentUser.email.split('@')[0]}</span>
            \`;
        }
    }
    
    // 修复Choose Pro按钮
    async function createSubscription(planType) {
        console.log('🎯 点击Choose Pro按钮:', planType);
        
        if (!currentUser) {
            console.log('❌ 用户未登录，显示登录提示');
            alert('请先登录');
            return;
        }
        
        console.log('✅ 用户已登录，继续订阅流程');
        // 这里继续原有的订阅逻辑
        try {
            await openSubscriptionModal(planType);
        } catch (error) {
            console.error('❌ 打开订阅弹窗失败:', error);
            alert('订阅功能暂时不可用，请稍后重试');
        }
    }
    
    // 页面加载时立即执行
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Pricing页面加载完成');
        
        // 立即恢复用户状态
        const restored = restoreUserState();
        
        if (restored) {
            console.log('✅ 用户状态同步成功');
        } else {
            console.log('⚠️ 用户未登录状态');
        }
    });
    
    // 页面显示时也检查一次
    window.addEventListener('pageshow', function() {
        console.log('📄 页面显示，检查用户状态');
        restoreUserState();
    });
    </script>`;
    
    // 在<head>标签后添加脚本
    const headEndIndex = pricingContent.indexOf('</head>');
    if (headEndIndex !== -1) {
        pricingContent = pricingContent.slice(0, headEndIndex) + 
                        userStateRestoreScript + '\n' + 
                        pricingContent.slice(headEndIndex);
    }
    
    fs.writeFileSync('pricing.html', pricingContent, 'utf8');
    console.log('✅ pricing.html 修复完成');
    
    return true;
}

// 执行修复
if (fixCorrectFiles()) {
    console.log('🎉 正确文件修复完成！');
    console.log('现在用户状态应该能在首页和pricing页面之间正确同步了');
} else {
    console.log('❌ 修复失败');
}