/**
 * 订阅功能直接修复脚本
 * 
 * 这个脚本可以直接在浏览器控制台中运行，用于修复订阅功能
 */

// 修复订阅按钮点击处理
function fixSubscriptionButtons() {
    console.log('🚀 开始修复订阅按钮...');
    
    // 查找所有可能的订阅按钮
    const buttons = [
        ...document.querySelectorAll('.subscription-btn'),
        ...document.querySelectorAll('.buy-credits-btn'),
        ...document.querySelectorAll('[data-plan-id]')
    ];
    
    if (buttons.length === 0) {
        console.log('⚠️ 未找到任何订阅按钮');
        return false;
    }
    
    console.log(`✅ 找到 ${buttons.length} 个订阅按钮`);
    
    buttons.forEach(button => {
        // 移除现有的点击处理函数
        const oldClickHandler = button.onclick;
        button.onclick = null;
        
        // 添加新的点击处理函数
        button.addEventListener('click', async function(event) {
            event.preventDefault();
            
            // 显示加载状态
            const originalText = button.innerHTML;
            button.innerHTML = '<span class="loading-spinner"></span> Processing...';
            button.disabled = true;
            
            try {
                // 获取计划ID
                const planId = button.dataset.planId || button.getAttribute('data-plan-id');
                const planType = button.dataset.planType || button.getAttribute('data-plan-type') || 'PRO';
                
                if (!planId) {
                    throw new Error('未找到计划ID');
                }
                
                // 获取用户信息
                let user = null;
                
                if (window.UnifiedStateSync) {
                    user = window.UnifiedStateSync.getCurrentUser();
                } else if (window.currentUser) {
                    user = window.currentUser;
                } else {
                    // 尝试从Supabase获取用户
                    let supabaseClient = window.supabaseClient;
                    
                    if (!supabaseClient && window.supabase) {
                        const url = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
                        const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
                        supabaseClient = window.supabase.createClient(url, key);
                    }
                    
                    if (supabaseClient && supabaseClient.auth) {
                        const { data: { session } } = await supabaseClient.auth.getSession();
                        if (session?.user) {
                            user = session.user;
                        }
                    }
                }
                
                if (!user) {
                    throw new Error('用户未登录');
                }
                
                // 准备订阅数据
                const subscriptionData = {
                    googleUserId: user.id || user.uuid,
                    googleUserEmail: user.email,
                    paypalSubscriptionId: 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15),
                    planId,
                    planType
                };
                
                console.log('📤 发送订阅请求:', subscriptionData);
                
                // 直接重定向到PayPal
                redirectToPayPal(planId, subscriptionData.googleUserId, subscriptionData.googleUserEmail);
                
            } catch (error) {
                console.error('❌ 创建订阅失败:', error);
                alert('创建订阅失败: ' + error.message);
                
                // 恢复按钮状态
                button.innerHTML = originalText;
                button.disabled = false;
            }
        });
        
        console.log('✅ 修复订阅按钮:', button);
    });
    
    return true;
}

/**
 * 重定向到PayPal支付页面
 */
function redirectToPayPal(planId, userId, userEmail) {
    // 构建PayPal支付URL
    const baseUrl = 'https://www.paypal.com/cgi-bin/webscr';
    
    // 确定商品ID和价格
    let itemName, itemAmount;
    
    if (planId === 'P-5S785818YS7424947NCJBKQA') {
        itemName = 'Pro Plan - 1000 Credits';
        itemAmount = '9.99';
    } else if (planId === 'P-3NJ78684DS796242VNCJBKQQ') {
        itemName = 'Max Plan - 5000 Credits';
        itemAmount = '29.99';
    } else {
        itemName = 'Subscription Plan';
        itemAmount = '9.99';
    }
    
    // 创建用户数据JSON
    const customData = JSON.stringify({
        user_id: userId,
        email: userEmail,
        plan_id: planId
    });
    
    // 构建查询参数
    const params = new URLSearchParams({
        cmd: '_xclick-subscriptions',
        business: 'sb-43wjqz28357913@business.example.com', // 测试账号
        item_name: itemName,
        custom: customData,
        currency_code: 'USD',
        a3: itemAmount,
        p3: 1,
        t3: 'M', // 月度订阅
        src: 1, // 重复付款
        no_note: 1,
        return: window.location.origin + '/account?success=true',
        cancel_return: window.location.origin + '/pricing?canceled=true',
        notify_url: window.location.origin + '/api/paypal-webhook'
    });
    
    // 重定向到PayPal
    const paypalUrl = baseUrl + '?' + params.toString();
    console.log('🔄 重定向到PayPal:', paypalUrl);
    
    window.location.href = paypalUrl;
}

// 执行修复
console.log('🔧 开始修复订阅功能...');
const result = fixSubscriptionButtons();
console.log(result ? '✅ 订阅功能修复成功！' : '❌ 订阅功能修复失败');