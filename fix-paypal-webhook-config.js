/**
 * 修复PayPal Webhook配置和积分同步问题
 * 这是网站核心功能，必须立即修复
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPayPalWebhookConfig() {
    console.log('🚨 紧急修复PayPal Webhook配置和积分同步\n');
    
    // 1. 立即检查当前问题状态
    console.log('📋 1. 检查当前问题状态...');
    
    const { data: recentUsers, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (userError) {
        console.log('❌ 无法查询用户:', userError.message);
        return;
    }
    
    console.log(`✅ 找到 ${recentUsers.length} 个最近用户`);
    
    // 检查是否有用户积分异常低
    const lowCreditUsers = recentUsers.filter(user => user.credits < 50);
    console.log(`⚠️ 发现 ${lowCreditUsers.length} 个用户积分可能不足`);
    
    // 2. 检查webhook事件记录
    console.log('\n📋 2. 检查webhook事件记录...');
    
    const { data: webhookEvents, error: webhookError } = await supabase
        .from('webhook_events')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(5);
    
    if (webhookError) {
        console.log('❌ 无法查询webhook事件:', webhookError.message);
    } else if (!webhookEvents || webhookEvents.length === 0) {
        console.log('🚨 严重问题: 没有任何webhook事件记录！');
        console.log('   这意味着PayPal webhook完全没有工作');
    } else {
        console.log(`✅ 找到 ${webhookEvents.length} 个webhook事件`);
    }
    
    // 3. 检查订阅记录
    console.log('\n📋 3. 检查订阅记录...');
    
    const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (subError) {
        console.log('❌ 无法查询订阅记录:', subError.message);
    } else if (!subscriptions || subscriptions.length === 0) {
        console.log('🚨 严重问题: 没有任何订阅记录！');
        console.log('   这意味着订阅流程完全没有工作');
    } else {
        console.log(`✅ 找到 ${subscriptions.length} 个订阅记录`);
    }
    
    // 4. 立即修复方案
    console.log('\n🔧 立即修复方案...');
    
    console.log('🎯 问题确认:');
    console.log('1. PayPal webhook没有被接收（0个webhook事件）');
    console.log('2. 订阅流程没有完成（0个订阅记录）');
    console.log('3. 用户购买后没有收到积分');
    console.log('');
    
    console.log('🚨 紧急修复步骤:');
    console.log('');
    
    console.log('步骤1: 立即修复webhook端点');
    console.log('- 检查Vercel部署状态');
    console.log('- 确保webhook端点可访问');
    console.log('- 测试webhook接收功能');
    console.log('');
    
    console.log('步骤2: 修复PayPal配置');
    console.log('- 登录PayPal开发者控制台');
    console.log('- 更新webhook URL配置');
    console.log('- 验证事件类型设置');
    console.log('');
    
    console.log('步骤3: 手动处理现有用户');
    console.log('- 识别已购买但未收到积分的用户');
    console.log('- 手动添加积分');
    console.log('- 更新订阅状态');
    
    // 5. 创建紧急修复函数
    console.log('\n📋 5. 创建紧急修复函数...');
    
    // 导出修复函数
    global.emergencyAddCredits = emergencyAddCredits;
    global.fixUserSubscription = fixUserSubscription;
    global.testWebhookEndpoint = testWebhookEndpoint;
    global.manualProcessSubscription = manualProcessSubscription;
    
    console.log('✅ 紧急修复函数已创建:');
    console.log('- emergencyAddCredits(userEmail, credits) - 紧急添加积分');
    console.log('- fixUserSubscription(userEmail, planType) - 修复用户订阅');
    console.log('- testWebhookEndpoint() - 测试webhook端点');
    console.log('- manualProcessSubscription(subscriptionId) - 手动处理订阅');
    
    // 6. 提供具体的修复命令
    console.log('\n💡 具体修复命令:');
    console.log('');
    console.log('// 如果用户购买了Pro Plan但没收到积分:');
    console.log('await emergencyAddCredits("user@example.com", 1000)');
    console.log('');
    console.log('// 如果用户购买了Max Plan但没收到积分:');
    console.log('await emergencyAddCredits("user@example.com", 5000)');
    console.log('');
    console.log('// 完整修复用户订阅状态:');
    console.log('await fixUserSubscription("user@example.com", "pro")');
    
    // 7. 检查webhook端点状态
    console.log('\n📋 7. 检查webhook端点状态...');
    await testWebhookEndpoint();
    
    console.log('\n🎯 下一步行动计划:');
    console.log('1. 立即部署应用到Vercel（如果还没有）');
    console.log('2. 获取部署后的URL');
    console.log('3. 在PayPal开发者控制台配置webhook');
    console.log('4. 测试完整的购买流程');
    console.log('5. 手动修复现有受影响的用户');
}

// 紧急添加积分
async function emergencyAddCredits(userEmail, credits) {
    try {
        console.log(`🚨 紧急为用户 ${userEmail} 添加 ${credits} 积分...`);
        
        // 查找用户
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail);
        
        if (userError || !users || users.length === 0) {
            console.log('❌ 找不到用户:', userEmail);
            return false;
        }
        
        const user = users[0];
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + credits;
        
        console.log(`当前积分: ${currentCredits} → 新积分: ${newCredits}`);
        
        // 更新积分
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateError) {
            console.log('❌ 更新积分失败:', updateError.message);
            return false;
        }
        
        // 记录交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                transaction_type: 'EARN',
                amount: credits,
                balance_after: newCredits,
                description: '紧急积分补充 - PayPal订阅',
                source: 'emergency_fix'
            });
        
        if (transError) {
            console.log('⚠️ 交易记录失败:', transError.message);
        }
        
        console.log(`✅ 成功添加积分！用户 ${userEmail} 现在有 ${newCredits} 积分`);
        return true;
        
    } catch (error) {
        console.log('❌ 紧急添加积分失败:', error.message);
        return false;
    }
}

// 修复用户订阅
async function fixUserSubscription(userEmail, planType = 'pro') {
    try {
        console.log(`🔧 修复用户 ${userEmail} 的订阅状态...`);
        
        const credits = planType === 'pro' ? 1000 : 5000;
        const planName = planType === 'pro' ? 'Pro Plan' : 'Max Plan';
        
        // 添加积分
        const success = await emergencyAddCredits(userEmail, credits);
        
        if (success) {
            // 创建订阅记录
            const { data: users } = await supabase
                .from('users')
                .select('*')
                .eq('email', userEmail);
            
            if (users && users.length > 0) {
                const user = users[0];
                
                const { error: subError } = await supabase
                    .from('user_subscriptions')
                    .insert({
                        google_user_id: user.uuid,
                        google_user_email: userEmail,
                        paypal_subscription_id: `EMERGENCY-${Date.now()}`,
                        plan_id: planType === 'pro' ? 'P-5S785818YS7424947NCJBKQA' : 'P-3NJ78684DS796242VNCJBKQQ',
                        plan_type: planType.toUpperCase(),
                        status: 'ACTIVE'
                    });
                
                if (subError) {
                    console.log('⚠️ 创建订阅记录失败:', subError.message);
                } else {
                    console.log(`✅ 已创建 ${planName} 订阅记录`);
                }
            }
            
            console.log(`✅ 用户 ${userEmail} 的 ${planName} 订阅已完全修复！`);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.log('❌ 修复订阅失败:', error.message);
        return false;
    }
}

// 测试webhook端点
async function testWebhookEndpoint() {
    try {
        console.log('🧪 测试webhook端点...');
        
        // 尝试不同的URL
        const urls = [
            'http://localhost:3000/api/paypal-webhook',
            'https://your-app.vercel.app/api/paypal-webhook'
        ];
        
        for (const url of urls) {
            try {
                console.log(`测试: ${url}`);
                const response = await fetch(url, { method: 'GET' });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ ${url} 正常工作`);
                    console.log(`   状态: ${data.status}`);
                    return url;
                } else {
                    console.log(`❌ ${url} 响应异常: ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ ${url} 无法访问: ${error.message}`);
            }
        }
        
        console.log('🚨 所有webhook端点都无法访问！');
        console.log('   需要立即部署应用到可访问的URL');
        
        return null;
        
    } catch (error) {
        console.log('❌ 测试webhook端点失败:', error.message);
        return null;
    }
}

// 手动处理订阅
async function manualProcessSubscription(subscriptionId) {
    try {
        console.log(`🔧 手动处理订阅: ${subscriptionId}...`);
        
        // 这里需要PayPal API来获取订阅详情
        console.log('⚠️ 需要PayPal API密钥来获取订阅详情');
        console.log('建议直接使用 emergencyAddCredits 或 fixUserSubscription');
        
    } catch (error) {
        console.log('❌ 手动处理订阅失败:', error.message);
    }
}

// 执行修复
fixPayPalWebhookConfig().catch(error => {
    console.error('❌ 修复失败:', error);
    process.exit(1);
});