// 只修复JavaScript逻辑，不破坏CSS样式
const fs = require('fs');

function fixOnlyJavaScriptLogic() {
    console.log('🔧 只修复JavaScript逻辑，保持CSS样式不变...');
    
    try {
        let content = fs.readFileSync('pricing.html', 'utf8');
        
        // 在现有的<script>标签中添加用户状态恢复逻辑
        const userStateScript = `
        // 用户状态恢复逻辑
        let currentUser = null;
        
        // 页面加载时恢复用户状态
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Pricing页面加载，恢复用户状态...');
            restoreUserState();
        });
        
        // 从localStorage恢复用户状态
        function restoreUserState() {
            try {
                const userData = localStorage.getItem('flux_krea_user');
                if (userData) {
                    currentUser = JSON.parse(userData);
                    console.log('✅ 用户状态已恢复:', currentUser.email);
                    console.log('💰 用户积分:', currentUser.credits);
                    
                    // 更新积分显示
                    updateCreditsDisplay();
                    
                    // 更新登录状态显示
                    updateSigninDisplay();
                    
                    return true;
                }
                return false;
            } catch (error) {
                console.error('❌ 恢复用户状态失败:', error);
                return false;
            }
        }
        
        // 更新积分显示
        function updateCreditsDisplay() {
            if (!currentUser) return;
            
            const creditsElements = document.querySelectorAll('#creditsAmount, .credits-amount');
            creditsElements.forEach(element => {
                if (element) {
                    element.textContent = currentUser.credits || 0;
                }
            });
        }
        
        // 更新登录状态显示
        function updateSigninDisplay() {
            if (!currentUser) return;
            
            const signinBtn = document.querySelector('.signin-btn');
            if (signinBtn) {
                signinBtn.innerHTML = \`
                    <img src="\${currentUser.avatar_url}" style="width: 18px; height: 18px; border-radius: 50%;" alt="Avatar">
                    <span>\${currentUser.name}</span>
                \`;
            }
        }
        
        // 修复Choose Pro按钮 - 重写createSubscription函数
        const originalCreateSubscription = window.createSubscription;
        window.createSubscription = async function(planType) {
            console.log('🎯 Choose Pro按钮被点击:', planType);
            
            // 检查用户登录状态
            if (!currentUser) {
                console.log('❌ 用户未登录');
                alert('请先登录后再购买订阅');
                return;
            }
            
            console.log('✅ 用户已登录，继续订阅流程');
            
            // 调用原有的函数
            if (originalCreateSubscription) {
                return await originalCreateSubscription(planType);
            } else if (typeof openSubscriptionModal === 'function') {
                return await openSubscriptionModal(planType);
            } else {
                alert('订阅功能初始化中，请稍后重试');
            }
        };
        
        // 修复checkSupabaseSession函数
        const originalCheckSupabaseSession = window.checkSupabaseSession;
        window.checkSupabaseSession = async function() {
            console.log('🔍 检查用户认证状态...');
            
            // 如果有用户状态，直接返回true
            if (currentUser && currentUser.email) {
                console.log('✅ 用户已登录:', currentUser.email);
                return true;
            }
            
            // 否则调用原有的检查逻辑
            if (originalCheckSupabaseSession) {
                return await originalCheckSupabaseSession();
            }
            
            return false;
        };`;
        
        // 在最后一个</script>标签前添加脚本
        const lastScriptIndex = content.lastIndexOf('</script>');
        if (lastScriptIndex !== -1) {
            content = content.slice(0, lastScriptIndex) + 
                     userStateScript + '\n        ' + 
                     content.slice(lastScriptIndex);
        }
        
        fs.writeFileSync('pricing.html', content, 'utf8');
        console.log('✅ JavaScript逻辑修复完成，CSS样式保持不变');
        
        return true;
        
    } catch (error) {
        console.error('❌ 修复失败:', error);
        return false;
    }
}

// 执行修复
if (fixOnlyJavaScriptLogic()) {
    console.log('🎉 修复完成！现在pricing页面应该有样式且功能正常');
} else {
    console.log('❌ 修复失败');
}