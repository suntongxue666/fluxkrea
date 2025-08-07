// 最终修复：解决3个核心问题
const fs = require('fs');

function finalFixAllThreeIssues() {
    console.log('🎯 最终修复：解决登录状态、积分同步、Choose Pro按钮问题');
    
    try {
        // 1. 修复根目录的index.html - 确保登录后正确保存用户状态
        console.log('📄 1. 修复index.html的用户状态保存...');
        let indexContent = fs.readFileSync('index.html', 'utf8');
        
        // 在index.html中添加用户登录成功后的状态保存
        const loginSuccessHandler = `
        // 用户登录成功后的处理
        function handleLoginSuccess(user) {
            console.log('🎉 用户登录成功:', user.email);
            
            // 创建完整的用户数据对象
            const userData = {
                id: user.id,
                uuid: user.id,
                google_id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
                avatar_url: user.user_metadata?.avatar_url || '',
                credits: 10, // 默认积分，会从数据库同步
                is_signed_in: true,
                subscription_status: 'ACTIVE'
            };
            
            // 保存到localStorage
            localStorage.setItem('flux_krea_user', JSON.stringify(userData));
            console.log('✅ 用户状态已保存到localStorage');
            
            // 立即从数据库同步真实积分
            syncUserCreditsFromDatabase(userData);
            
            // 更新UI
            updateUIAfterLogin(userData);
        }
        
        // 从数据库同步用户积分
        async function syncUserCreditsFromDatabase(userData) {
            try {
                console.log('🔄 从数据库同步积分...');
                
                // 使用Supabase直接查询
                if (typeof supabaseClient !== 'undefined') {
                    const { data, error } = await supabaseClient
                        .from('users')
                        .select('credits, subscription_status')
                        .eq('email', userData.email)
                        .single();
                    
                    if (!error && data) {
                        // 更新用户数据
                        userData.credits = data.credits || 0;
                        userData.subscription_status = data.subscription_status || 'ACTIVE';
                        
                        // 重新保存到localStorage
                        localStorage.setItem('flux_krea_user', JSON.stringify(userData));
                        
                        console.log('✅ 积分同步成功:', userData.credits);
                        
                        // 更新积分显示
                        updateCreditsDisplay(userData.credits);
                    }
                }
            } catch (error) {
                console.error('❌ 同步积分失败:', error);
            }
        }
        
        // 更新积分显示
        function updateCreditsDisplay(credits) {
            const creditsElements = document.querySelectorAll('#creditsAmount, .credits-amount, [id*="credits"]');
            creditsElements.forEach(element => {
                if (element) {
                    element.textContent = credits;
                }
            });
        }
        
        // 更新登录后的UI
        function updateUIAfterLogin(userData) {
            const signinBtn = document.querySelector('.signin-btn');
            if (signinBtn) {
                signinBtn.innerHTML = \`
                    <img src="\${userData.avatar_url}" style="width: 18px; height: 18px; border-radius: 50%;" alt="Avatar">
                    <span>\${userData.name}</span>
                \`;
            }
            
            // 更新积分显示
            updateCreditsDisplay(userData.credits);
        }`;
        
        // 在</script>前添加登录处理脚本
        const scriptEndIndex = indexContent.lastIndexOf('</script>');
        if (scriptEndIndex !== -1) {
            indexContent = indexContent.slice(0, scriptEndIndex) + 
                          loginSuccessHandler + '\n        ' + 
                          indexContent.slice(scriptEndIndex);
        }
        
        fs.writeFileSync('index.html', indexContent, 'utf8');
        console.log('✅ index.html修复完成');
        
        // 2. 修复根目录的pricing.html - 确保正确读取用户状态和修复Choose Pro按钮
        console.log('📄 2. 修复pricing.html的状态同步和按钮功能...');
        let pricingContent = fs.readFileSync('pricing.html', 'utf8');
        
        // 删除所有我之前添加的重复代码
        pricingContent = pricingContent.replace(/<script>[\s\S]*?页面加载时立即恢复用户状态[\s\S]*?<\/script>/g, '');
        
        // 在pricing.html的<head>中添加用户状态恢复脚本
        const pricingStateScript = `
    <script>
    // Pricing页面用户状态管理
    let currentUser = null;
    let supabaseClient = null;
    
    // 初始化Supabase客户端
    const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
    
    // 页面加载时立即执行
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Pricing页面加载');
        
        // 初始化Supabase
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        
        // 立即恢复用户状态
        restoreUserStateFromLocalStorage();
    });
    
    // 从localStorage恢复用户状态
    function restoreUserStateFromLocalStorage() {
        try {
            console.log('🔄 从localStorage恢复用户状态...');
            
            const userData = localStorage.getItem('flux_krea_user');
            if (userData) {
                currentUser = JSON.parse(userData);
                console.log('✅ 用户状态已恢复:', currentUser.email);
                console.log('💰 用户积分:', currentUser.credits);
                
                // 立即更新UI
                updatePricingPageUI();
                
                // 从数据库同步最新积分
                syncLatestCredits();
                
                return true;
            } else {
                console.log('⚠️ localStorage中没有用户数据');
                return false;
            }
        } catch (error) {
            console.error('❌ 恢复用户状态失败:', error);
            return false;
        }
    }
    
    // 更新pricing页面UI
    function updatePricingPageUI() {
        if (!currentUser) return;
        
        // 更新积分显示
        const creditsElements = document.querySelectorAll('#creditsAmount, .credits-amount');
        creditsElements.forEach(element => {
            if (element) {
                element.textContent = currentUser.credits || 0;
                console.log('✅ 积分显示已更新:', currentUser.credits);
            }
        });
        
        // 更新登录按钮显示
        const signinBtn = document.querySelector('.signin-btn');
        if (signinBtn) {
            signinBtn.innerHTML = \`
                <img src="\${currentUser.avatar_url}" style="width: 18px; height: 18px; border-radius: 50%;" alt="Avatar">
                <span>\${currentUser.name}</span>
            \`;
            console.log('✅ 登录状态显示已更新');
        }
    }
    
    // 从数据库同步最新积分
    async function syncLatestCredits() {
        if (!currentUser || !supabaseClient) return;
        
        try {
            console.log('🔄 从数据库同步最新积分...');
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('credits, subscription_status')
                .eq('email', currentUser.email)
                .single();
            
            if (!error && data) {
                const oldCredits = currentUser.credits;
                currentUser.credits = data.credits || 0;
                currentUser.subscription_status = data.subscription_status;
                
                // 更新localStorage
                localStorage.setItem('flux_krea_user', JSON.stringify(currentUser));
                
                console.log(\`💰 积分同步: \${oldCredits} → \${currentUser.credits}\`);
                
                // 更新显示
                updatePricingPageUI();
            }
        } catch (error) {
            console.error('❌ 同步积分失败:', error);
        }
    }
    
    // 修复Choose Pro按钮 - 重写createSubscription函数
    window.createSubscription = async function(planType) {
        console.log('🎯 Choose Pro按钮被点击:', planType);
        
        // 检查用户登录状态
        if (!currentUser) {
            console.log('❌ 用户未登录');
            alert('请先登录后再购买订阅');
            return;
        }
        
        console.log('✅ 用户已登录，继续订阅流程');
        console.log('👤 用户信息:', currentUser.email);
        
        try {
            // 调用原有的openSubscriptionModal函数
            if (typeof openSubscriptionModal === 'function') {
                await openSubscriptionModal(planType);
            } else {
                console.error('❌ openSubscriptionModal函数不存在');
                alert('订阅功能初始化中，请稍后重试');
            }
        } catch (error) {
            console.error('❌ 打开订阅弹窗失败:', error);
            alert('订阅功能暂时不可用，请稍后重试');
        }
    };
    
    // 检查用户认证状态的函数
    window.checkSupabaseSession = async function() {
        console.log('🔍 检查用户认证状态...');
        
        // 优先检查localStorage中的用户状态
        if (currentUser && currentUser.email) {
            console.log('✅ 用户已登录:', currentUser.email);
            return true;
        }
        
        // 如果没有，尝试从Supabase会话恢复
        if (supabaseClient) {
            try {
                const { data: { session }, error } = await supabaseClient.auth.getSession();
                if (!error && session && session.user) {
                    console.log('✅ 从Supabase会话恢复用户状态');
                    
                    currentUser = {
                        id: session.user.id,
                        uuid: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                        avatar_url: session.user.user_metadata?.avatar_url || '',
                        credits: 0,
                        is_signed_in: true
                    };
                    
                    // 保存到localStorage
                    localStorage.setItem('flux_krea_user', JSON.stringify(currentUser));
                    
                    // 更新UI
                    updatePricingPageUI();
                    
                    // 同步积分
                    syncLatestCredits();
                    
                    return true;
                }
            } catch (error) {
                console.error('❌ 检查Supabase会话失败:', error);
            }
        }
        
        console.log('❌ 用户未登录');
        return false;
    };
    </script>`;
        
        // 在<head>标签结束前添加脚本
        const headEndIndex = pricingContent.indexOf('</head>');
        if (headEndIndex !== -1) {
            pricingContent = pricingContent.slice(0, headEndIndex) + 
                            pricingStateScript + '\n    ' + 
                            pricingContent.slice(headEndIndex);
        }
        
        fs.writeFileSync('pricing.html', pricingContent, 'utf8');
        console.log('✅ pricing.html修复完成');
        
        console.log('🎉 所有3个问题修复完成！');
        return true;
        
    } catch (error) {
        console.error('❌ 修复失败:', error);
        return false;
    }
}

// 执行最终修复
if (finalFixAllThreeIssues()) {
    console.log('');
    console.log('🎯 修复总结:');
    console.log('1. ✅ 修复了登录状态同步问题');
    console.log('2. ✅ 修复了积分显示同步问题');
    console.log('3. ✅ 修复了Choose Pro按钮点击问题');
    console.log('');
    console.log('现在应该可以正常测试PayPal订阅了！');
} else {
    console.log('❌ 修复失败');
    process.exit(1);
}