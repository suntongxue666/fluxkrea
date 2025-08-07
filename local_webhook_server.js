// 本地Webhook测试服务器
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS中间件
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Supabase配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 计划详情
const PLAN_DETAILS = {
    'P-5ML4271244454362WXNWU5NI': { name: 'Pro Plan', credits: 1000, price: 9.99 },
    'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000, price: 29.99 }
};

// 健康检查端点
app.get('/api/paypal-webhook', (req, res) => {
    res.json({
        message: 'Local PayPal Webhook server is running',
        timestamp: new Date().toISOString(),
        status: 'healthy'
    });
});

// PayPal Webhook处理端点
app.post('/api/paypal-webhook', async (req, res) => {
    try {
        console.log('🔔 PayPal Webhook received');
        console.log('📋 Event type:', req.body.event_type);
        console.log('📋 Resource:', JSON.stringify(req.body.resource, null, 2));
        
        const { event_type, resource } = req.body;
        
        // 记录webhook事件
        await logWebhookEvent(event_type, resource);
        
        // 处理不同类型的事件
        switch (event_type) {
            case 'BILLING.SUBSCRIPTION.CREATED':
                await handleSubscriptionCreated(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                await handleSubscriptionActivated(resource);
                break;
                
            case 'TEST.WEBHOOK.CONNECTIVITY':
                console.log('✅ Webhook连接测试成功');
                break;
                
            default:
                console.log('⚠️ 未处理的事件类型:', event_type);
        }
        
        res.json({
            message: 'Webhook processed successfully',
            event_type: event_type,
            resource_id: resource?.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Webhook处理异常:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 记录webhook事件
async function logWebhookEvent(eventType, resource, status = 'SUCCESS') {
    try {
        const { error } = await supabase
            .from('webhook_events')
            .insert({
                event_type: eventType,
                resource_data: resource || {},
                processing_status: status,
                processed_at: new Date().toISOString()
            });
        
        if (error) {
            console.warn('⚠️ Webhook事件日志记录失败:', error.message);
        } else {
            console.log('✅ Webhook事件已记录');
        }
    } catch (error) {
        console.error('❌ 日志记录异常:', error);
    }
}

// 处理订阅创建
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

// 处理订阅激活
async function handleSubscriptionActivated(resource) {
    console.log('🚀 处理订阅激活:', resource.id);
    
    try {
        const subscriptionId = resource.id;
        const planId = resource.plan_id;
        
        // 获取计划详情
        const planDetails = PLAN_DETAILS[planId];
        if (!planDetails) {
            throw new Error(`未知的计划ID: ${planId}`);
        }
        
        console.log('📋 计划详情:', planDetails);
        
        // 查找用户订阅关联
        const { data: userSub, error: userSubError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('paypal_subscription_id', subscriptionId)
            .single();
        
        if (userSubError) {
            console.error('❌ 找不到订阅关联:', userSubError.message);
            return;
        }
        
        console.log('👤 找到用户:', userSub.google_user_email);
        
        // 查找用户记录
        let user = null;
        
        // 优先通过UUID查找
        const { data: uuidUser, error: uuidError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userSub.google_user_id)
            .single();
        
        if (!uuidError && uuidUser) {
            user = uuidUser;
            console.log('✅ 通过UUID找到用户:', user.email);
        } else {
            // 通过邮箱查找
            const { data: emailUser, error: emailError } = await supabase
                .from('users')
                .select('*')
                .eq('email', userSub.google_user_email)
                .single();
            
            if (!emailError && emailUser) {
                user = emailUser;
                console.log('✅ 通过邮箱找到用户:', user.email);
            } else {
                throw new Error(`找不到用户: ${userSub.google_user_email}`);
            }
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
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                transaction_type: 'EARN',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `${planDetails.name}订阅激活`,
                source: 'paypal_webhook'
            });
        
        if (transError) {
            console.warn('⚠️ 积分交易记录失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        // 更新订阅关联状态
        const { error: statusError } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
        
        if (statusError) {
            console.warn('⚠️ 订阅状态更新失败:', statusError.message);
        } else {
            console.log('✅ 订阅状态已更新');
        }
        
        console.log('🎉 订阅激活完成!');
        console.log(`👤 用户: ${user.email}`);
        console.log(`💰 新积分: ${newCredits}`);
        
    } catch (error) {
        console.error('❌ 处理订阅激活失败:', error);
        throw error;
    }
}

// 启动服务器
app.listen(PORT, () => {
    console.log('🚀 本地Webhook服务器已启动');
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🔗 Webhook端点: http://localhost:${PORT}/api/paypal-webhook`);
    console.log('');
    console.log('📋 使用说明:');
    console.log('1. 保持此服务器运行');
    console.log('2. 使用ngrok暴露端口: ngrok http 3000');
    console.log('3. 将ngrok URL配置到PayPal Webhook');
    console.log('4. 或者直接测试本地端点');
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
});

module.exports = app;