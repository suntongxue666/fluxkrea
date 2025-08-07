// 完整的PayPal Webhook处理器 - 包含数据库操作
const { createClient } = require('@supabase/supabase-js');

// 环境变量配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// 计划配置
const SUBSCRIPTION_PLANS = {
    'P-5S785818YS7424947NCJBKQA': { 
        name: 'Pro Plan', 
        credits: 1000, 
        price: 9.99
    },
    'P-3NJ78684DS796242VNCJBKQQ': { 
        name: 'Max Plan', 
        credits: 5000, 
        price: 29.99
    }
};

let supabase;

// 初始化Supabase
try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error('Supabase初始化失败:', error);
}

module.exports = async (req, res) => {
    // 设置响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        console.log('PayPal Webhook received:', req.method);
        
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
        
        // 处理POST请求
        if (req.method === 'POST') {
            const eventData = req.body || {};
            const { event_type, resource } = eventData;
            
            console.log('Event type:', event_type);
            console.log('Resource ID:', resource?.id);
            
            // 记录webhook事件
            await logWebhookEvent(event_type, resource);
            
            // 处理订阅激活事件
            if (event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
                console.log('Processing subscription activation...');
                await handleSubscriptionActivated(resource);
            }
            
            return res.status(200).json({
                message: 'Webhook processed',
                event_type: event_type,
                resource_id: resource?.id,
                timestamp: new Date().toISOString()
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Webhook error:', error);
        
        return res.status(200).json({
            message: 'Webhook received but processing failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// 记录webhook事件
async function logWebhookEvent(eventType, resource) {
    if (!supabase) return;
    
    try {
        const logData = {
            event_type: eventType,
            resource_data: resource || {},
            processing_status: 'SUCCESS',
            processed_at: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('webhook_events')
            .insert(logData);
        
        if (error) {
            console.warn('Webhook事件日志记录失败:', error.message);
        } else {
            console.log('Webhook事件已记录');
        }
    } catch (error) {
        console.error('日志记录异常:', error);
    }
}

// 处理订阅激活事件
async function handleSubscriptionActivated(resource) {
    if (!supabase) {
        console.error('数据库连接不可用');
        return;
    }
    
    try {
        console.log('处理订阅激活:', resource.id);
        
        const subscriptionId = resource.id;
        const planId = resource.plan_id;
        const customId = resource.custom_id;
        
        // 获取计划详情
        const planDetails = SUBSCRIPTION_PLANS[planId];
        if (!planDetails) {
            console.error('未知的计划ID:', planId);
            return;
        }
        
        console.log('计划详情:', planDetails);
        
        // 解析用户信息
        let userInfo = null;
        try {
            userInfo = JSON.parse(customId);
            console.log('用户信息:', userInfo);
        } catch (e) {
            console.error('无法解析custom_id:', customId);
            return;
        }
        
        // 查找用户
        let user = null;
        
        // 通过UUID查找
        const { data: uuidUser, error: uuidError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userInfo.user_id)
            .single();
        
        if (!uuidError && uuidUser) {
            user = uuidUser;
            console.log('通过UUID找到用户:', user.email);
        } else {
            // 通过邮箱查找
            const { data: emailUser, error: emailError } = await supabase
                .from('users')
                .select('*')
                .eq('email', userInfo.email)
                .single();
            
            if (!emailError && emailUser) {
                user = emailUser;
                console.log('通过邮箱找到用户:', user.email);
            }
        }
        
        if (!user) {
            console.error('找不到用户:', userInfo.email);
            return;
        }
        
        // 计算新积分
        const currentCredits = user.credits || 0;
        const creditsToAdd = planDetails.credits;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`积分更新: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 更新用户积分
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateError) {
            console.error('更新用户积分失败:', updateError);
            return;
        }
        
        console.log('用户积分已更新');
        
        // 记录积分交易
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
            console.log('积分交易已记录');
        } catch (transError) {
            console.warn('积分交易记录失败:', transError.message);
        }
        
        console.log('订阅激活完成!');
        console.log(`用户: ${user.email}`);
        console.log(`新积分: ${newCredits}`);
        
    } catch (error) {
        console.error('处理订阅激活失败:', error);
    }
}