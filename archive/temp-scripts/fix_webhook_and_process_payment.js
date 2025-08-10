// 修复webhook并处理失败的支付事件
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 失败的PayPal事件数据
const failedEvents = [
    {
        event_type: "BILLING.SUBSCRIPTION.CREATED",
        resource: {
            id: "I-CN4C8T3NJTCP",
            plan_id: "P-5S785818YS7424947NCJBKQA",
            custom_id: "{\"user_id\":\"0e5cb85f-69bc-48de-90af-ff27bb0b4df5\",\"email\":\"sunwei7482@gmail.com\",\"plan_type\":\"pro\"}",
            status: "APPROVAL_PENDING"
        }
    },
    {
        event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
        resource: {
            id: "I-CN4C8T3NJTCP",
            plan_id: "P-5S785818YS7424947NCJBKQA",
            custom_id: "{\"user_id\":\"0e5cb85f-69bc-48de-90af-ff27bb0b4df5\",\"email\":\"sunwei7482@gmail.com\",\"plan_type\":\"pro\"}",
            status: "ACTIVE",
            billing_info: {
                last_payment: {
                    amount: {
                        currency_code: "USD",
                        value: "9.99"
                    }
                }
            }
        }
    },
    {
        event_type: "PAYMENT.SALE.COMPLETED",
        resource: {
            id: "3GJ877690B014130P",
            amount: {
                total: "9.99",
                currency: "USD"
            },
            custom: "{\"user_id\":\"0e5cb85f-69bc-48de-90af-ff27bb0b4df5\",\"email\":\"sunwei7482@gmail.com\",\"plan_type\":\"pro\"}",
            billing_agreement_id: "I-CN4C8T3NJTCP",
            state: "completed"
        }
    }
];

async function fixWebhookAndProcessPayment() {
    console.log('🔧 开始修复webhook并处理失败的支付事件...');
    
    try {
        // 1. 处理订阅激活事件（这是最重要的，应该添加积分）
        console.log('\n📋 1. 处理订阅激活事件...');
        const activationEvent = failedEvents.find(e => e.event_type === "BILLING.SUBSCRIPTION.ACTIVATED");
        
        if (activationEvent) {
            await processSubscriptionActivation(activationEvent.resource);
        }
        
        // 2. 验证处理结果
        console.log('\n✅ 2. 验证处理结果...');
        await verifyProcessingResult();
        
        console.log('\n🎉 webhook修复和支付处理完成！');
        
    } catch (error) {
        console.error('❌ 处理过程中出错:', error);
    }
}

async function processSubscriptionActivation(resource) {
    console.log('🚀 处理订阅激活:', resource.id);
    
    const subscriptionId = resource.id;
    const planId = resource.plan_id;
    const customId = resource.custom_id;
    
    // 计划详情映射
    const PLAN_DETAILS = {
        'P-5S785818YS7424947NCJBKQA': { name: 'Pro Plan', credits: 1000, price: 9.99 }
    };
    
    const planDetails = PLAN_DETAILS[planId];
    if (!planDetails) {
        throw new Error(`未知的计划ID: ${planId}`);
    }
    
    console.log('📋 计划详情:', planDetails);
    
    // 解析用户信息
    let userInfo = null;
    try {
        userInfo = JSON.parse(customId);
        console.log('👤 解析用户信息:', userInfo);
    } catch (e) {
        console.warn('⚠️ 无法解析custom_id:', customId);
        throw new Error('Invalid custom_id format');
    }
    
    // 查找用户
    let user = null;
    
    // 优先通过UUID查找
    try {
        const { data: uuidUser, error: uuidError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userInfo.user_id)
            .single();
        
        if (!uuidError && uuidUser) {
            user = uuidUser;
            console.log('✅ 通过UUID找到用户:', user.email);
        }
    } catch (err) {
        console.warn('⚠️ UUID查找失败:', err.message);
    }
    
    // 如果UUID查找失败，尝试邮箱查找
    if (!user) {
        try {
            const { data: emailUser, error: emailError } = await supabase
                .from('users')
                .select('*')
                .eq('email', userInfo.email)
                .single();
            
            if (!emailError && emailUser) {
                user = emailUser;
                console.log('✅ 通过邮箱找到用户:', user.email);
            }
        } catch (err) {
            console.warn('⚠️ 邮箱查找失败:', err.message);
        }
    }
    
    if (!user) {
        throw new Error(`找不到用户: ${userInfo.email} (UUID: ${userInfo.user_id})`);
    }
    
    // 计算新积分
    const currentCredits = user.credits || 0;
    const creditsToAdd = planDetails.credits;
    const newCredits = currentCredits + creditsToAdd;
    
    console.log(`💰 积分更新: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
    
    // 更新用户积分和状态
    const { error: updateError } = await supabase
        .from('users')
        .update({
            credits: newCredits,
            subscription_status: 'ACTIVE',
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    
    if (updateError) {
        throw new Error(`更新用户积分失败: ${updateError.message}`);
    }
    
    console.log('✅ 用户积分已更新');
    
    // 记录积分交易
    try {
        await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                transaction_type: 'EARN',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `${planDetails.name}订阅激活 - 修复处理`,
                source: 'paypal_webhook_fix'
            });
        console.log('✅ 积分交易已记录');
    } catch (transError) {
        console.warn('⚠️ 积分交易记录失败:', transError.message);
    }
    
    // 创建/更新订阅关联
    try {
        await supabase
            .from('user_subscriptions')
            .upsert({
                google_user_id: user.uuid,
                google_user_email: user.email,
                paypal_subscription_id: subscriptionId,
                plan_id: planId,
                plan_type: userInfo.plan_type || 'pro',
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'paypal_subscription_id' });
        console.log('✅ 订阅关联已更新');
    } catch (subError) {
        console.warn('⚠️ 订阅关联更新失败:', subError.message);
    }
    
    console.log('🎉 订阅激活完成!');
    console.log(`👤 用户: ${user.email}`);
    console.log(`💰 新积分: ${newCredits}`);
    
    return { user, newCredits, creditsAdded: creditsToAdd };
}

async function verifyProcessingResult() {
    const userEmail = 'sunwei7482@gmail.com';
    const userUuid = '0e5cb85f-69bc-48de-90af-ff27bb0b4df5';
    
    try {
        // 检查用户积分
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail)
            .single();
        
        if (userError) {
            console.error('❌ 查询用户失败:', userError);
            return;
        }
        
        console.log('👤 用户当前状态:');
        console.log(`   邮箱: ${user.email}`);
        console.log(`   积分: ${user.credits}`);
        console.log(`   订阅状态: ${user.subscription_status}`);
        console.log(`   更新时间: ${user.updated_at}`);
        
        // 检查积分交易记录
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', userUuid)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (!transError && transactions.length > 0) {
            console.log('\n💰 最近的积分交易:');
            transactions.forEach((trans, index) => {
                console.log(`   ${index + 1}. ${trans.transaction_type} ${trans.amount} - ${trans.description}`);
                console.log(`      余额: ${trans.balance_after} - ${trans.created_at}`);
            });
        }
        
        // 检查订阅记录
        const { data: subscriptions, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('google_user_email', userEmail)
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!subError && subscriptions.length > 0) {
            console.log('\n📋 订阅记录:');
            subscriptions.forEach((sub, index) => {
                console.log(`   ${index + 1}. ${sub.plan_type} - ${sub.status}`);
                console.log(`      订阅ID: ${sub.paypal_subscription_id}`);
                console.log(`      创建时间: ${sub.created_at}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 验证处理结果失败:', error);
    }
}

// 运行修复
fixWebhookAndProcessPayment().then(() => {
    console.log('✅ 修复脚本执行完成');
    process.exit(0);
}).catch(error => {
    console.error('❌ 修复脚本执行失败:', error);
    process.exit(1);
});