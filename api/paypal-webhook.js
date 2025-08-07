// 基于PayPal官方文档的标准Webhook处理器
// 参考: https://developer.paypal.com/docs/subscriptions/
const { createClient } = require('@supabase/supabase-js');

// 环境变量配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// 计划配置
const SUBSCRIPTION_PLANS = {
    'P-5S785818YS7424947NCJBKQA': { 
        name: 'Pro Plan', 
        credits: 1000, 
        price: 9.99,
        type: 'pro'
    },
    'P-3NJ78684DS796242VNCJBKQQ': { 
        name: 'Max Plan', 
        credits: 5000, 
        price: 29.99,
        type: 'max'
    }
};

let supabase;

// 安全初始化Supabase
try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error('❌ Supabase初始化失败:', error);
}

module.exports = async (req, res) => {
    // 设置标准HTTP响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, PAYPAL-TRANSMISSION-ID, PAYPAL-CERT-ID, PAYPAL-AUTH-ALGO, PAYPAL-TRANSMISSION-SIG, PAYPAL-TRANSMISSION-TIME');
    res.setHeader('Content-Type', 'application/json');
    
    const startTime = Date.now();
    
    try {
        console.log(`🔔 PayPal Webhook [${req.method}] - ${new Date().toISOString()}`);
        
        // 处理预检请求
        if (req.method === 'OPTIONS') {
            return res.status(200).json({ message: 'CORS preflight OK' });
        }
        
        // 健康检查端点
        if (req.method === 'GET') {
            return res.status(200).json({
                service: 'PayPal Webhook Handler',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                supported_events: [
                    'BILLING.SUBSCRIPTION.CREATED',
                    'BILLING.SUBSCRIPTION.ACTIVATED', 
                    'BILLING.SUBSCRIPTION.CANCELLED',
                    'BILLING.SUBSCRIPTION.SUSPENDED',
                    'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
                    'PAYMENT.SALE.COMPLETED'
                ]
            });
        }
        
        // 只处理POST请求
        if (req.method !== 'POST') {
            return res.status(405).json({ 
                error: 'Method Not Allowed',
                allowed_methods: ['GET', 'POST', 'OPTIONS']
            });
        }
        
        // 验证Supabase连接
        if (!supabase) {
            console.error('❌ 数据库连接不可用');
            return res.status(200).json({
                status: 'received',
                message: 'Database connection unavailable',
                timestamp: new Date().toISOString()
            });
        }
        
        // 解析webhook事件数据
        const webhookEvent = req.body;
        if (!webhookEvent || !webhookEvent.event_type) {
            console.warn('⚠️ 无效的webhook数据');
            return res.status(200).json({
                status: 'received',
                message: 'Invalid webhook data',
                timestamp: new Date().toISOString()
            });
        }
        
        const { event_type, resource, id: webhook_id } = webhookEvent;
        
        console.log(`📋 处理事件: ${event_type}`);
        console.log(`🆔 Webhook ID: ${webhook_id}`);
        console.log(`📦 Resource ID: ${resource?.id}`);
        
        // 记录webhook事件到数据库
        await logWebhookEvent(webhookEvent);
        
        // 根据事件类型分发处理
        let processingResult = null;
        
        switch (event_type) {
            case 'BILLING.SUBSCRIPTION.CREATED':
                processingResult = await handleSubscriptionCreated(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                processingResult = await handleSubscriptionActivated(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                processingResult = await handleSubscriptionCancelled(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                processingResult = await handleSubscriptionSuspended(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
                processingResult = await handlePaymentFailed(resource);
                break;
                
            case 'PAYMENT.SALE.COMPLETED':
                processingResult = await handlePaymentCompleted(resource);
                break;
                
            default:
                console.log(`⚠️ 未处理的事件类型: ${event_type}`);
                processingResult = { status: 'ignored', message: 'Event type not handled' };
        }
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ 事件处理完成 (${processingTime}ms)`);
        
        // 返回成功响应（PayPal要求200状态码）
        return res.status(200).json({
            status: 'success',
            event_type: event_type,
            webhook_id: webhook_id,
            resource_id: resource?.id,
            processing_result: processingResult,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Webhook处理异常:', error);
        
        // 记录错误但仍返回200状态码，避免PayPal重试
        try {
            await logWebhookEvent({
                event_type: 'ERROR',
                resource: { error: error.message, stack: error.stack },
                id: 'error-' + Date.now()
            }, 'ERROR');
        } catch (logError) {
            console.error('❌ 错误日志记录失败:', logError);
        }
        
        return res.status(200).json({
            status: 'error',
            message: 'Webhook processing failed',
            error: error.message,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString()
        });
    }
};

// 记录webhook事件到数据库
async function logWebhookEvent(webhookEvent, status = 'SUCCESS') {
    try {
        const logData = {
            event_type: webhookEvent.event_type,
            webhook_id: webhookEvent.id,
            resource_data: webhookEvent.resource || {},
            processing_status: status,
            processed_at: new Date().toISOString(),
            raw_event: webhookEvent
        };
        
        const { error } = await supabase
            .from('webhook_events')
            .insert(logData);
        
        if (error) {
            console.warn('⚠️ Webhook事件日志记录失败:', error.message);
        } else {
            console.log('✅ Webhook事件已记录到数据库');
        }
    } catch (error) {
        console.error('❌ 日志记录异常:', error);
    }
}

// 处理订阅创建事件
async function handleSubscriptionCreated(resource) {
    console.log('🆕 处理订阅创建事件:', resource.id);
    
    try {
        const subscriptionData = extractSubscriptionData(resource);
        
        // 保存订阅信息到数据库
        const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
                paypal_subscription_id: subscriptionData.subscriptionId,
                google_user_id: subscriptionData.userInfo.user_id,
                google_user_email: subscriptionData.userInfo.email,
                plan_id: subscriptionData.planId,
                plan_type: subscriptionData.planDetails.type,
                status: 'CREATED',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'paypal_subscription_id' });
        
        if (error) {
            console.error('❌ 保存订阅信息失败:', error);
            return { status: 'error', message: error.message };
        }
        
        console.log('✅ 订阅创建事件处理完成');
        return { status: 'success', message: 'Subscription created' };
        
    } catch (error) {
        console.error('❌ 处理订阅创建失败:', error);
        return { status: 'error', message: error.message };
    }
}

// 处理订阅激活事件（关键事件 - 添加积分）
async function handleSubscriptionActivated(resource) {
    console.log('🚀 处理订阅激活事件:', resource.id);
    
    try {
        const subscriptionData = extractSubscriptionData(resource);
        const { userInfo, planDetails, subscriptionId } = subscriptionData;
        
        // 查找用户
        const user = await findUser(userInfo);
        if (!user) {
            throw new Error(`找不到用户: ${userInfo.email} (UUID: ${userInfo.user_id})`);
        }
        
        // 计算新积分
        const currentCredits = user.credits || 0;
        const creditsToAdd = planDetails.credits;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`💰 积分更新: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 开始数据库事务
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
        
        // 记录积分交易
        await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                transaction_type: 'EARN',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `${planDetails.name}订阅激活`,
                source: 'paypal_subscription'
            });
        
        // 更新订阅状态
        await supabase
            .from('user_subscriptions')
            .update({
                status: 'ACTIVE',
                activated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
        
        console.log('🎉 订阅激活完成!');
        console.log(`👤 用户: ${user.email}`);
        console.log(`💰 新积分: ${newCredits}`);
        
        return { 
            status: 'success', 
            message: 'Subscription activated and credits added',
            user_email: user.email,
            credits_added: creditsToAdd,
            new_balance: newCredits
        };
        
    } catch (error) {
        console.error('❌ 处理订阅激活失败:', error);
        return { status: 'error', message: error.message };
    }
}

// 处理订阅取消事件
async function handleSubscriptionCancelled(resource) {
    console.log('❌ 处理订阅取消事件:', resource.id);
    
    try {
        const subscriptionId = resource.id;
        
        // 更新订阅状态
        const { error } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'CANCELLED',
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
        
        if (error) {
            throw new Error(`更新订阅状态失败: ${error.message}`);
        }
        
        console.log('✅ 订阅取消事件处理完成');
        return { status: 'success', message: 'Subscription cancelled' };
        
    } catch (error) {
        console.error('❌ 处理订阅取消失败:', error);
        return { status: 'error', message: error.message };
    }
}

// 处理订阅暂停事件
async function handleSubscriptionSuspended(resource) {
    console.log('⏸️ 处理订阅暂停事件:', resource.id);
    
    try {
        const subscriptionId = resource.id;
        
        // 更新订阅状态
        const { error } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'SUSPENDED',
                suspended_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
        
        if (error) {
            throw new Error(`更新订阅状态失败: ${error.message}`);
        }
        
        console.log('✅ 订阅暂停事件处理完成');
        return { status: 'success', message: 'Subscription suspended' };
        
    } catch (error) {
        console.error('❌ 处理订阅暂停失败:', error);
        return { status: 'error', message: error.message };
    }
}

// 处理支付失败事件
async function handlePaymentFailed(resource) {
    console.log('💳 处理支付失败事件:', resource.id);
    
    try {
        // 这里可以添加支付失败的处理逻辑
        // 比如发送邮件通知、暂停服务等
        
        console.log('✅ 支付失败事件处理完成');
        return { status: 'success', message: 'Payment failure recorded' };
        
    } catch (error) {
        console.error('❌ 处理支付失败事件失败:', error);
        return { status: 'error', message: error.message };
    }
}

// 处理支付完成事件
async function handlePaymentCompleted(resource) {
    console.log('💰 处理支付完成事件:', resource.id);
    
    try {
        // 对于订阅，支付完成通常跟随订阅激活
        // 这里主要记录支付信息
        
        console.log('✅ 支付完成事件处理完成');
        return { status: 'success', message: 'Payment completion recorded' };
        
    } catch (error) {
        console.error('❌ 处理支付完成事件失败:', error);
        return { status: 'error', message: error.message };
    }
}

// 提取订阅数据的通用函数
function extractSubscriptionData(resource) {
    const subscriptionId = resource.id;
    const planId = resource.plan_id;
    const customId = resource.custom_id;
    
    // 获取计划详情
    const planDetails = SUBSCRIPTION_PLANS[planId];
    if (!planDetails) {
        throw new Error(`未知的计划ID: ${planId}`);
    }
    
    // 解析用户信息
    let userInfo = null;
    try {
        userInfo = JSON.parse(customId);
    } catch (e) {
        throw new Error(`无法解析custom_id: ${customId}`);
    }
    
    return {
        subscriptionId,
        planId,
        planDetails,
        userInfo
    };
}

// 查找用户的通用函数
async function findUser(userInfo) {
    // 优先通过UUID查找
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userInfo.user_id)
            .single();
        
        if (!error && user) {
            console.log('✅ 通过UUID找到用户:', user.email);
            return user;
        }
    } catch (err) {
        console.warn('⚠️ UUID查找失败:', err.message);
    }
    
    // 如果UUID查找失败，尝试邮箱查找
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', userInfo.email)
            .single();
        
        if (!error && user) {
            console.log('✅ 通过邮箱找到用户:', user.email);
            return user;
        }
    } catch (err) {
        console.warn('⚠️ 邮箱查找失败:', err.message);
    }
    
    return null;
}