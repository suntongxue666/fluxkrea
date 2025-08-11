// 使用原生fetch的PayPal Webhook处理器 - 避免依赖问题
const https = require('https');

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

// 使用原生fetch调用Supabase API
async function supabaseRequest(method, table, data = null, filter = null) {
    return new Promise((resolve, reject) => {
        let path = `/rest/v1/${table}`;
        if (filter) {
            path += `?${filter}`;
        }
        
        const options = {
            hostname: 'gdcjvqaqgvcxzufmessy.supabase.co',
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': method === 'POST' ? 'return=minimal' : 'return=representation'
            }
        };
        
        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : null;
                    resolve({ data: parsedData, error: null, status: res.statusCode });
                } catch (e) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ data: null, error: null, status: res.statusCode });
                    } else {
                        resolve({ data: null, error: { message: responseData }, status: res.statusCode });
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// 记录webhook事件
async function logWebhookEvent(eventType, resource) {
    try {
        const logData = {
            event_type: eventType,
            resource_data: resource || {},
            processed_at: new Date().toISOString()
        };
        
        const result = await supabaseRequest('POST', 'webhook_events', logData);
        
        if (result.error) {
            console.warn('Webhook事件日志记录失败:', result.error.message);
            console.warn('错误详情:', JSON.stringify(result.error));
        } else {
            console.log('Webhook事件已记录');
        }
    } catch (error) {
        console.error('日志记录异常:', error);
    }
}

// 处理订阅激活事件
async function handleSubscriptionActivated(resource) {
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
        const uuidResult = await supabaseRequest('GET', 'users', null, `uuid=eq.${userInfo.user_id}&select=*`);
        
        if (!uuidResult.error && uuidResult.data && uuidResult.data.length > 0) {
            user = uuidResult.data[0];
            console.log('通过UUID找到用户:', user.email);
        } else {
            // 通过邮箱查找
            const emailResult = await supabaseRequest('GET', 'users', null, `email=eq.${userInfo.email}&select=*`);
            
            if (!emailResult.error && emailResult.data && emailResult.data.length > 0) {
                user = emailResult.data[0];
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
        const updateData = {
            credits: newCredits,
            subscription_status: 'ACTIVE',
            updated_at: new Date().toISOString()
        };
        
        const updateResult = await supabaseRequest('PATCH', 'users', updateData, `id=eq.${user.id}`);
        
        if (updateResult.error) {
            console.error('更新用户积分失败:', updateResult.error.message);
            return;
        }
        
        console.log('用户积分已更新');
        
        // 记录积分交易
        try {
            const transactionData = {
                user_uuid: user.uuid,
                transaction_type: 'EARN',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `${planDetails.name}订阅激活`,
                source: 'paypal_webhook'
            };
            
            await supabaseRequest('POST', 'credit_transactions', transactionData);
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