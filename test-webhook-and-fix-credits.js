/**
 * 测试webhook并修复积分同步问题
 * 提供具体的解决方案
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhookAndFixCredits() {
    console.log('🧪 测试webhook并修复积分同步问题\n');
    
    // 1. 模拟PayPal webhook事件
    console.log('📋 1. 模拟PayPal webhook事件...');
    
    const mockWebhookData = {
        event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
        resource: {
            id: 'I-TEST123456789',
            plan_id: 'P-5S785818YS7424947NCJBKQA',
            custom_id: JSON.stringify({
                user_id: 'user_1754317980544_0c4ykzot654', // 使用实际的用户ID
                email: 'test@example.com'
            })
        }
    };
    
    console.log('模拟webhook数据:', JSON.stringify(mockWebhookData, null, 2));
    
    // 2. 直接调用webhook处理逻辑
    console.log('\n📋 2. 直接处理webhook事件...');
    
    try {
        await processWebhookEvent(mockWebhookData);
    } catch (error) {
        console.log('❌ Webhook处理失败:', error.message);
    }
    
    // 3. 检查实际用户并修复积分
    console.log('\n📋 3. 检查实际用户并修复积分...');
    
    // 查找最近的用户
    const { data: recentUsers, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
    
    if (userError) {
        console.log('❌ 查询用户失败:', userError.message);
        return;
    }
    
    if (recentUsers && recentUsers.length > 0) {
        console.log(`✅ 找到 ${recentUsers.length} 个最近的用户:`);
        
        for (const user of recentUsers) {
            console.log(`\n用户: ${user.email || 'N/A'}`);
            console.log(`UUID: ${user.uuid}`);
            console.log(`当前积分: ${user.credits}`);
            console.log(`订阅状态: ${user.subscription_status}`);
            
            // 检查是否有购买记录但积分不足
            if (user.credits < 100) { // 假设购买后应该有至少100积分
                console.log('⚠️ 用户积分可能不足，检查是否需要补充...');
                
                // 检查是否有相关的订阅记录
                const { data: subscriptions } = await supabase
                    .from('user_subscriptions')
                    .select('*')
                    .eq('google_user_id', user.uuid);
                
                if (subscriptions && subscriptions.length > 0) {
                    console.log('✅ 找到订阅记录，但积分未同步');
                    console.log('建议手动添加积分');
                    
                    // 提供修复选项
                    console.log(`\n🔧 修复命令:`);
                    console.log(`addCreditsToUser('${user.uuid}', 1000, '订阅积分补充');`);
                }
            }
        }
    }
    
    // 4. 提供完整的修复方案
    console.log('\n📋 4. 完整修复方案...');
    
    console.log('🎯 问题根因分析:');
    console.log('1. PayPal webhook没有被正确接收（可能是URL配置问题）');
    console.log('2. 即使webhook被接收，处理逻辑可能有问题');
    console.log('3. 数据库权限或RLS策略可能阻止了写入');
    console.log('');
    
    console.log('🔧 立即修复方案:');
    console.log('');
    console.log('方案1: 手动为用户添加积分');
    console.log('如果你知道哪个用户购买了订阅但没收到积分：');
    console.log('1. 找到用户邮箱或UUID');
    console.log('2. 运行: node test-webhook-and-fix-credits.js');
    console.log('3. 使用提供的修复命令');
    console.log('');
    
    console.log('方案2: 修复webhook配置');
    console.log('1. 确保应用部署到可访问的URL');
    console.log('2. 在PayPal开发者控制台配置正确的webhook URL');
    console.log('3. 测试webhook端点是否可访问');
    console.log('');
    
    console.log('方案3: 检查数据库权限');
    console.log('1. 确保Supabase RLS策略允许webhook写入');
    console.log('2. 检查API密钥权限');
    console.log('3. 验证表结构完整性');
    
    // 5. 创建修复函数
    global.addCreditsToUser = addCreditsToUser;
    global.checkUserByEmail = checkUserByEmail;
    global.simulateWebhook = simulateWebhook;
    
    console.log('\n✅ 修复函数已创建:');
    console.log('- addCreditsToUser(userUuid, credits, description)');
    console.log('- checkUserByEmail(email)');
    console.log('- simulateWebhook(userEmail, planType)');
    
    console.log('\n💡 使用示例:');
    console.log('// 检查用户');
    console.log('await checkUserByEmail("user@example.com")');
    console.log('');
    console.log('// 添加积分');
    console.log('await addCreditsToUser("user_uuid_here", 1000, "Pro Plan订阅补充")');
    console.log('');
    console.log('// 模拟webhook');
    console.log('await simulateWebhook("user@example.com", "pro")');
}

// 处理webhook事件
async function processWebhookEvent(eventData) {
    const { event_type, resource } = eventData;
    
    if (event_type !== 'BILLING.SUBSCRIPTION.ACTIVATED') {
        console.log('⚠️ 非订阅激活事件，跳过处理');
        return;
    }
    
    console.log('处理订阅激活事件...');
    
    const planDetails = {
        'P-5S785818YS7424947NCJBKQA': { name: 'Pro Plan', credits: 1000 },
        'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000 }
    };
    
    const plan = planDetails[resource.plan_id];
    if (!plan) {
        console.log('❌ 未知的计划ID:', resource.plan_id);
        return;
    }
    
    let userInfo;
    try {
        userInfo = JSON.parse(resource.custom_id);
    } catch (e) {
        console.log('❌ 无法解析用户信息:', resource.custom_id);
        return;
    }
    
    console.log('✅ 计划信息:', plan);
    console.log('✅ 用户信息:', userInfo);
    
    // 查找用户
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uuid', userInfo.user_id);
    
    if (userError || !users || users.length === 0) {
        console.log('❌ 找不到用户:', userInfo.user_id);
        return;
    }
    
    const user = users[0];
    const newCredits = (user.credits || 0) + plan.credits;
    
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
        console.log('❌ 更新用户积分失败:', updateError.message);
        return;
    }
    
    // 记录交易
    const { error: transError } = await supabase
        .from('credit_transactions')
        .insert({
            user_uuid: user.uuid,
            transaction_type: 'EARN',
            amount: plan.credits,
            balance_after: newCredits,
            description: `${plan.name}订阅激活`,
            source: 'paypal_webhook'
        });
    
    if (transError) {
        console.log('⚠️ 积分交易记录失败:', transError.message);
    }
    
    console.log(`✅ 成功处理订阅激活: ${user.email} 获得 ${plan.credits} 积分`);
}

// 为用户添加积分
async function addCreditsToUser(userUuid, credits, description = '手动添加积分') {
    try {
        console.log(`🔧 为用户 ${userUuid} 添加 ${credits} 积分...`);
        
        // 查找用户
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userUuid);
        
        if (userError || !users || users.length === 0) {
            console.log('❌ 找不到用户:', userUuid);
            return false;
        }
        
        const user = users[0];
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + credits;
        
        // 更新积分
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
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
                user_uuid: userUuid,
                transaction_type: 'EARN',
                amount: credits,
                balance_after: newCredits,
                description: description,
                source: 'manual_fix'
            });
        
        if (transError) {
            console.log('⚠️ 交易记录失败:', transError.message);
        }
        
        console.log(`✅ 成功添加积分: ${currentCredits} → ${newCredits}`);
        return true;
        
    } catch (error) {
        console.log('❌ 添加积分失败:', error.message);
        return false;
    }
}

// 通过邮箱检查用户
async function checkUserByEmail(email) {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);
        
        if (error || !users || users.length === 0) {
            console.log('❌ 找不到用户:', email);
            return null;
        }
        
        const user = users[0];
        console.log('✅ 用户信息:');
        console.log(`   邮箱: ${user.email}`);
        console.log(`   UUID: ${user.uuid}`);
        console.log(`   积分: ${user.credits}`);
        console.log(`   状态: ${user.subscription_status}`);
        
        return user;
    } catch (error) {
        console.log('❌ 查询失败:', error.message);
        return null;
    }
}

// 模拟webhook处理
async function simulateWebhook(userEmail, planType = 'pro') {
    try {
        const user = await checkUserByEmail(userEmail);
        if (!user) return;
        
        const planId = planType === 'pro' ? 'P-5S785818YS7424947NCJBKQA' : 'P-3NJ78684DS796242VNCJBKQQ';
        const credits = planType === 'pro' ? 1000 : 5000;
        
        const mockData = {
            event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
            resource: {
                id: `I-MOCK-${Date.now()}`,
                plan_id: planId,
                custom_id: JSON.stringify({
                    user_id: user.uuid,
                    email: user.email
                })
            }
        };
        
        await processWebhookEvent(mockData);
    } catch (error) {
        console.log('❌ 模拟webhook失败:', error.message);
    }
}

// 执行测试
testWebhookAndFixCredits().catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
});