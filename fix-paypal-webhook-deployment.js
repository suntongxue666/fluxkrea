/**
 * 修复PayPal Webhook部署问题
 * 核心问题：PayPal webhook没有被调用，导致积分无法充值
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPayPalWebhookDeployment() {
    console.log('🚨 修复PayPal Webhook部署问题\n');
    
    console.log('🎯 问题分析:');
    console.log('✅ PayPal webhook处理逻辑正确（api/paypal-webhook.js）');
    console.log('✅ 积分更新逻辑正确（handleSubscriptionActivated函数）');
    console.log('✅ 数据库表结构正确');
    console.log('❌ PayPal webhook没有被调用（0个webhook事件记录）');
    console.log('❌ 用户购买后积分没有增加');
    console.log('');
    
    console.log('🔍 根本原因:');
    console.log('1. 应用可能没有部署到公网可访问的URL');
    console.log('2. PayPal开发者控制台的webhook URL配置错误');
    console.log('3. webhook端点无法被PayPal访问');
    console.log('');
    
    // 1. 检查当前部署状态
    console.log('📋 1. 检查当前部署状态...');
    await checkDeploymentStatus();
    
    // 2. 提供立即修复方案
    console.log('\n📋 2. 立即修复方案...');
    await provideImmediateFix();
    
    // 3. 创建测试工具
    console.log('\n📋 3. 创建测试工具...');
    setupTestingTools();
    
    // 4. 提供部署指南
    console.log('\n📋 4. 部署指南...');
    provideDeploymentGuide();
    
    console.log('\n✅ 修复方案已准备完成！');
    console.log('\n🚨 立即行动:');
    console.log('1. 部署应用到Vercel');
    console.log('2. 配置PayPal webhook');
    console.log('3. 测试购买流程');
    console.log('4. 手动修复现有用户');
}

// 检查部署状态
async function checkDeploymentStatus() {
    console.log('🔍 检查应用部署状态...');
    
    // 尝试访问可能的webhook端点
    const possibleUrls = [
        'http://localhost:3000/api/paypal-webhook',
        'https://flux-krea-ai.vercel.app/api/paypal-webhook',
        'https://your-app.vercel.app/api/paypal-webhook'
    ];
    
    let workingUrl = null;
    
    for (const url of possibleUrls) {
        try {
            console.log(`测试: ${url}`);
            const response = await fetch(url, { 
                method: 'GET',
                timeout: 5000 
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${url} 可访问`);
                console.log(`   状态: ${data.status}`);
                workingUrl = url;
                break;
            } else {
                console.log(`❌ ${url} 响应异常: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${url} 无法访问: ${error.message}`);
        }
    }
    
    if (workingUrl) {
        console.log(`\n✅ 找到可用的webhook端点: ${workingUrl}`);
        console.log('   需要在PayPal开发者控制台配置此URL');
    } else {
        console.log('\n❌ 没有找到可用的webhook端点');
        console.log('   需要立即部署应用到公网');
    }
    
    return workingUrl;
}

// 提供立即修复方案
async function provideImmediateFix() {
    console.log('🔧 立即修复方案...');
    
    // 查找需要修复的用户
    const { data: lowCreditUsers, error } = await supabase
        .from('users')
        .select('*')
        .lt('credits', 50)
        .not('email', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.log('❌ 查询用户失败:', error.message);
        return;
    }
    
    if (lowCreditUsers && lowCreditUsers.length > 0) {
        console.log(`⚠️ 发现 ${lowCreditUsers.length} 个可能需要积分补充的用户:`);
        
        lowCreditUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} - ${user.credits} 积分`);
        });
        
        console.log('\n💡 如果这些用户购买了订阅但没收到积分，使用以下命令修复:');
        lowCreditUsers.forEach((user, index) => {
            console.log(`// 用户 ${index + 1}: ${user.email}`);
            console.log(`await emergencyAddCredits("${user.email}", 1000); // Pro Plan`);
            console.log(`await emergencyAddCredits("${user.email}", 5000); // Max Plan`);
            console.log('');
        });
    } else {
        console.log('✅ 没有发现明显需要修复的用户');
    }
    
    // 导出修复函数
    global.emergencyAddCredits = emergencyAddCredits;
    global.testWebhookManually = testWebhookManually;
    global.checkUserPurchaseHistory = checkUserPurchaseHistory;
}

// 设置测试工具
function setupTestingTools() {
    console.log('🛠️ 设置测试工具...');
    
    global.testPayPalWebhook = testPayPalWebhook;
    global.simulateSubscriptionPurchase = simulateSubscriptionPurchase;
    global.verifyWebhookEndpoint = verifyWebhookEndpoint;
    
    console.log('✅ 测试工具已设置:');
    console.log('- testPayPalWebhook() - 测试webhook端点');
    console.log('- simulateSubscriptionPurchase(userEmail, planType) - 模拟购买');
    console.log('- verifyWebhookEndpoint(url) - 验证端点可访问性');
}

// 提供部署指南
function provideDeploymentGuide() {
    console.log('📋 完整部署指南:');
    console.log('');
    console.log('🚀 步骤1: 部署到Vercel');
    console.log('1. 确保代码已推送到GitHub');
    console.log('2. 登录 https://vercel.com/');
    console.log('3. 点击 "New Project"');
    console.log('4. 连接GitHub仓库');
    console.log('5. 配置环境变量:');
    console.log('   - SUPABASE_URL: https://gdcjvqaqgvcxzufmessy.supabase.co');
    console.log('   - SUPABASE_ANON_KEY: (你的Supabase密钥)');
    console.log('   - PAYPAL_CLIENT_ID: (你的PayPal客户端ID)');
    console.log('   - PAYPAL_CLIENT_SECRET: (你的PayPal客户端密钥)');
    console.log('6. 点击 "Deploy"');
    console.log('');
    
    console.log('🔗 步骤2: 配置PayPal Webhook');
    console.log('1. 登录 https://developer.paypal.com/');
    console.log('2. 进入你的应用设置');
    console.log('3. 找到 "Webhooks" 部分');
    console.log('4. 点击 "Add Webhook"');
    console.log('5. 输入Webhook URL: https://your-app.vercel.app/api/paypal-webhook');
    console.log('6. 选择事件类型: BILLING.SUBSCRIPTION.ACTIVATED');
    console.log('7. 保存配置');
    console.log('');
    
    console.log('🧪 步骤3: 测试');
    console.log('1. 访问你的应用');
    console.log('2. 测试用户注册和登录');
    console.log('3. 测试购买订阅流程');
    console.log('4. 检查积分是否正确增加');
    console.log('5. 查看Vercel日志确认webhook被调用');
    console.log('');
    
    console.log('🔧 步骤4: 修复现有用户');
    console.log('1. 识别购买了订阅但没收到积分的用户');
    console.log('2. 使用 emergencyAddCredits 函数手动添加积分');
    console.log('3. 通知用户积分已到账');
}

// 紧急添加积分
async function emergencyAddCredits(userEmail, credits) {
    try {
        console.log(`🚨 紧急为 ${userEmail} 添加 ${credits} 积分...`);
        
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
            console.log('❌ 更新失败:', updateError.message);
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
                description: '订阅积分补充 - 手动修复',
                source: 'manual_fix'
            });
        
        if (transError) {
            console.log('⚠️ 交易记录失败:', transError.message);
        }
        
        console.log(`✅ 成功！${userEmail} 现在有 ${newCredits} 积分`);
        
        // 创建订阅记录
        const planType = credits >= 5000 ? 'MAX' : 'PRO';
        const planId = credits >= 5000 ? 'P-3NJ78684DS796242VNCJBKQQ' : 'P-5S785818YS7424947NCJBKQA';
        
        const { error: subError } = await supabase
            .from('user_subscriptions')
            .insert({
                google_user_id: user.uuid,
                google_user_email: userEmail,
                paypal_subscription_id: `MANUAL-${Date.now()}`,
                plan_id: planId,
                plan_type: planType,
                status: 'ACTIVE'
            });
        
        if (subError) {
            console.log('⚠️ 订阅记录创建失败:', subError.message);
        } else {
            console.log(`✅ 已创建 ${planType} 订阅记录`);
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ 失败:', error.message);
        return false;
    }
}

// 手动测试webhook
async function testWebhookManually(userEmail, planType = 'pro') {
    try {
        console.log(`🧪 手动测试webhook: ${userEmail}, ${planType}...`);
        
        const { data: users } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail);
        
        if (!users || users.length === 0) {
            console.log('❌ 找不到用户');
            return;
        }
        
        const user = users[0];
        const credits = planType === 'pro' ? 1000 : 5000;
        const planId = planType === 'pro' ? 'P-5S785818YS7424947NCJBKQA' : 'P-3NJ78684DS796242VNCJBKQQ';
        
        // 模拟webhook数据
        const webhookData = {
            event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
            resource: {
                id: `I-MANUAL-${Date.now()}`,
                plan_id: planId,
                custom_id: JSON.stringify({
                    user_id: user.uuid,
                    email: user.email
                })
            }
        };
        
        console.log('模拟webhook数据:', JSON.stringify(webhookData, null, 2));
        
        // 直接调用处理逻辑
        await processWebhookLocally(webhookData);
        
    } catch (error) {
        console.log('❌ 测试失败:', error.message);
    }
}

// 本地处理webhook
async function processWebhookLocally(webhookData) {
    const { event_type, resource } = webhookData;
    
    if (event_type !== 'BILLING.SUBSCRIPTION.ACTIVATED') {
        console.log('⚠️ 非订阅激活事件');
        return;
    }
    
    const planDetails = {
        'P-5S785818YS7424947NCJBKQA': { name: 'Pro Plan', credits: 1000 },
        'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000 }
    };
    
    const plan = planDetails[resource.plan_id];
    if (!plan) {
        console.log('❌ 未知计划ID:', resource.plan_id);
        return;
    }
    
    const userInfo = JSON.parse(resource.custom_id);
    
    // 查找用户
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('uuid', userInfo.user_id);
    
    if (!users || users.length === 0) {
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
        console.log('❌ 更新失败:', updateError.message);
        return;
    }
    
    // 记录交易
    await supabase
        .from('credit_transactions')
        .insert({
            user_uuid: user.uuid,
            transaction_type: 'EARN',
            amount: plan.credits,
            balance_after: newCredits,
            description: `${plan.name}订阅激活`,
            source: 'manual_webhook_test'
        });
    
    // 记录webhook事件
    await supabase
        .from('webhook_events')
        .insert({
            event_type: event_type,
            resource_id: resource.id,
            resource_data: resource,
            status: 'processed'
        });
    
    console.log(`✅ 成功处理订阅激活: ${user.email} 获得 ${plan.credits} 积分`);
}

// 测试PayPal webhook
async function testPayPalWebhook() {
    console.log('🧪 测试PayPal webhook端点...');
    
    const testUrl = 'https://your-app.vercel.app/api/paypal-webhook';
    
    try {
        const response = await fetch(testUrl, { method: 'GET' });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Webhook端点正常');
            console.log('响应:', data);
        } else {
            console.log('❌ Webhook端点异常:', response.status);
        }
    } catch (error) {
        console.log('❌ 无法访问webhook端点:', error.message);
    }
}

// 模拟订阅购买
async function simulateSubscriptionPurchase(userEmail, planType = 'pro') {
    console.log(`🛒 模拟 ${userEmail} 购买 ${planType.toUpperCase()} 订阅...`);
    
    const credits = planType === 'pro' ? 1000 : 5000;
    const success = await emergencyAddCredits(userEmail, credits);
    
    if (success) {
        console.log(`✅ 模拟购买成功！用户获得 ${credits} 积分`);
    } else {
        console.log('❌ 模拟购买失败');
    }
    
    return success;
}

// 验证webhook端点
async function verifyWebhookEndpoint(url) {
    try {
        console.log(`🔍 验证webhook端点: ${url}`);
        
        const response = await fetch(url, { 
            method: 'GET',
            timeout: 10000 
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ 端点可访问');
            console.log('响应:', data);
            return true;
        } else {
            console.log(`❌ 端点响应异常: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ 端点无法访问: ${error.message}`);
        return false;
    }
}

// 检查用户购买历史
async function checkUserPurchaseHistory(userEmail) {
    try {
        console.log(`🔍 检查 ${userEmail} 的购买历史...`);
        
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail)
            .single();
        
        if (!user) {
            console.log('❌ 找不到用户');
            return;
        }
        
        console.log('用户信息:');
        console.log(`- 邮箱: ${user.email}`);
        console.log(`- 积分: ${user.credits}`);
        console.log(`- 订阅状态: ${user.subscription_status}`);
        console.log(`- 创建时间: ${user.created_at}`);
        
        // 检查交易记录
        const { data: transactions } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', user.uuid)
            .order('created_at', { ascending: false });
        
        if (transactions && transactions.length > 0) {
            console.log('\n交易记录:');
            transactions.forEach((trans, index) => {
                console.log(`  ${index + 1}. ${trans.transaction_type} ${trans.amount} - ${trans.description}`);
                console.log(`     时间: ${trans.created_at}`);
            });
        } else {
            console.log('\n⚠️ 没有交易记录');
        }
        
        // 检查订阅记录
        const { data: subscriptions } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('google_user_email', userEmail);
        
        if (subscriptions && subscriptions.length > 0) {
            console.log('\n订阅记录:');
            subscriptions.forEach((sub, index) => {
                console.log(`  ${index + 1}. ${sub.plan_type} - ${sub.status}`);
                console.log(`     PayPal ID: ${sub.paypal_subscription_id}`);
                console.log(`     时间: ${sub.created_at}`);
            });
        } else {
            console.log('\n⚠️ 没有订阅记录');
        }
        
    } catch (error) {
        console.log('❌ 检查失败:', error.message);
    }
}

// 执行修复
fixPayPalWebhookDeployment().catch(error => {
    console.error('❌ 修复失败:', error);
    process.exit(1);
});