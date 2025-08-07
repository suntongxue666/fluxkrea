// 修复版PayPal Webhook处理器 - 解决500错误
const { createClient } = require('@supabase/supabase-js');

// 环境变量配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// 计划详情映射 - 修正计划ID
const PLAN_DETAILS = {
    'P-5ML4271244454362WXNWU5NI': { name: 'Pro Plan', credits: 1000, price: 9.99 },
    'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000, price: 29.99 },
    'P-5S785818YS7424947NCJBKQA': { name: 'Pro Plan', credits: 1000, price: 9.99 } // 新的Pro计划ID
};

let supabase;

// 安全初始化Supabase
try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error('Supabase初始化失败:', error);
}

module.exports = async (req, res) => {
    // 设置响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        console.log('🔔 PayPal Webhook received:', req.method);
        
        // 处理OPTIONS请求
        if (req.method === 'OPTIONS') {
            return res.status(200).json({ message: 'CORS OK' });
        }
        
        // 处理GET请求（健康检查）
        if (req.method === 'GET') {
            return res.status(200).json({ 
                message: 'PayPal Webhook is running',
                timestamp: new Date().toISOString(),
                status: 'healthy'
            });
        }
        
        // 只处理POST请求
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }
        
        // 检查Supabase连接
        if (!supabase) {
            console.error('❌ Supabase未初始化');
            return res.status(500).json({ error: 'Database not available' });
        }
        
        // 解析请求体
        const eventData = req.body;
        if (!eventData) {
            return res.status(400).json({ error: 'No request body' });
        }
        
        const { event_type, resource } = eventData;
        
        console.log('📋 Event type:', event_type);
        console.log('📋 Resource ID:', resource?.id);
        console.log('📋 Plan ID:', resource?.plan_id);
        
        // 记录webhook事件（不阻塞主流程）
        logWebhookEvent(event_type, resource).catch(err => {
            console.warn('⚠️ 日志记录失败:', err.message);
        });
        
        // 处理订阅激活事件
        if (event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            try {
                await handleSubscriptionActivated(resource);
                console.log('✅ 订阅激活处理成功');
            } catch (activationError) {
                console.error('❌ 订阅激活处理失败:', activationError);
                // 记录错误但不返回500，避免PayPal重试
                logWebhookEvent(event_type, resource, 'ERROR', activationError.message).catch(() => {});
            }
        } else {
            console.log('⚠️ 未处理的事件类型:', event_type);
        }
        
        // 总是返回成功响应
        return res.status(200).json({
            message: 'Webhook processed',
            event_type: event_type,
            resource_id: resource?.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Webhook处理异常:', error);
        
        // 记录错误
        try {
            await logWebhookEvent('ERROR', { error: error.message }, 'ERROR');
        } catch (logError) {
            console.error('❌ 错误日志记录失败:', logError);
        }
        
        // 返回成功响应避免PayPal重试（但记录错误）
        return res.status(200).json({
            message: 'Webhook received but processing failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// 记录webhook事件
async function logWebhookEvent(eventType, resource, status = 'SUCCESS', errorMessage = null) {
    try {
        const logData = {
            event_type: eventType,
            resource_data: resource || {},
            processing_status: status,
            processed_at: new Date().toISOString()
        };
        
        if (errorMessage) {
            logData.resource_data.error = errorMessage;
        }
        
        const { error } = await supabase
            .from('webhook_events')
            .insert(logData);
        
        if (error) {
            console.warn('⚠️ Webhook事件日志记录失败:', error.message);
        } else {
            console.log('✅ Webhook事件已记录');
        }
    } catch (error) {
        console.error('❌ 日志记录异常:', error);
    }
}

// 处理订阅创建事件
async function handleSubscriptionCreated(resource) {
    console.log('🆕 处理订阅创建:', resource.id);
    
    try {
        const subscriptionId = resource.id;
        const planId = resource.plan_id;
        const customId = resource.custom_id;
        
        // 解析用户信息
        let userInfo = null;
        try {
            userInfo = JSON.parse(customId);
        } catch (e) {
            console.warn('⚠️ 无法解析custom_id:', customId);
            userInfo = { user_id: customId };
        }
        
        console.log('👤 用户信息:', userInfo);
        
        // 保存订阅关联
        const subscriptionData = {
            google_user_id: userInfo.user_id,
            google_user_email: userInfo.email,
            paypal_subscription_id: subscriptionId,
            plan_id: planId,
            plan_type: userInfo.plan_type || 'pro',
            status: 'CREATED'
        };
        
        const { error: insertError } = await supabase
            .from('user_subscriptions')
            .insert(subscriptionData);
        
        if (insertError) {
            console.error('❌ 保存订阅关联失败:', insertError);
        } else {
            console.log('✅ 订阅关联已保存');
        }
        
    } catch (error) {
        console.error('❌ 处理订阅创建失败:', error);
    }
}

// 处理订阅激活事件
async function handleSubscriptionActivated(resource) {
    console.log('🚀 处理订阅激活:', resource.id);
    
    const subscriptionId = resource.id;
    const planId = resource.plan_id;
    const customId = resource.custom_id;
    
    // 获取计划详情
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
    
    // 记录积分交易（不阻塞主流程）
    try {
        await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                transaction_type: 'EARN',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `${planDetails.name}订阅激活`,
                source: 'paypal_webhook'
            });
        console.log('✅ 积分交易已记录');
    } catch (transError) {
        console.warn('⚠️ 积分交易记录失败:', transError.message);
    }
    
    // 创建/更新订阅关联（不阻塞主流程）
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
}

// 处理订阅取消事件
async function handleSubscriptionCancelled(resource) {
    console.log('❌ 处理订阅取消:', resource.id);
    
    try {
        const subscriptionId = resource.id;
        
        // 更新订阅关联状态
        const { error: statusError } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'CANCELLED',
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
        
        if (statusError) {
            console.error('❌ 更新订阅状态失败:', statusError);
        } else {
            console.log('✅ 订阅取消状态已更新');
        }
        
    } catch (error) {
        console.error('❌ 处理订阅取消失败:', error);
    }
}