// 简化版PayPal订阅API，专为Vercel Edge函数环境优化
// 使用最基本的JavaScript功能，避免使用可能不兼容的Node.js特性

// PayPal沙盒环境配置
const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
// 注意：这些是示例凭证，实际使用时会被环境变量中的值覆盖
const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID'; // 请替换为有效的PayPal客户端ID
const PAYPAL_CLIENT_SECRET = 'YOUR_PAYPAL_CLIENT_SECRET'; // 请替换为有效的PayPal客户端密钥

// 环境变量中的PayPal凭证（优先使用）
const ENV_PAYPAL_CLIENT_ID = typeof process !== 'undefined' && process.env && process.env.PAYPAL_CLIENT_ID;
const ENV_PAYPAL_CLIENT_SECRET = typeof process !== 'undefined' && process.env && process.env.PAYPAL_CLIENT_SECRET;

// 使用环境变量中的凭证（如果存在）
const ACTIVE_PAYPAL_CLIENT_ID = ENV_PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID;
const ACTIVE_PAYPAL_CLIENT_SECRET = ENV_PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_SECRET;

// 测试用的硬编码访问令牌（仅用于测试）
const TEST_ACCESS_TOKEN = 'A21AALa2HVxjB1QDM3qIQqzT5zZn9oCa9G4NlGZqLo1Vwvj-KxRwxHwQxQQNvtJZ-QmKjZFWBfzp9q9J9ULUeKR8ADw8jw';

// PayPal沙盒计划ID
const PAYPAL_PLANS = {
    pro: 'P-5ML4271244454362XMVKVPEQ',
    max: 'P-8XB43994LV7189516MVKVPMA'
};

// 安全的Base64编码函数
function safeBase64Encode(str) {
    // 检测环境并使用适当的方法
    if (typeof Buffer !== 'undefined') {
        // Node.js环境
        return Buffer.from(str).toString('base64');
    } else if (typeof btoa === 'function') {
        // 浏览器环境
        return btoa(str);
    } else {
        // 如果两种方法都不可用，抛出错误
        throw new Error('无法执行Base64编码，环境不支持');
    }
}

// 记录PayPal凭证状态（不记录实际值，只记录是否存在）
console.log('PayPal凭证状态:', {
    clientIdHardcoded: PAYPAL_CLIENT_ID !== 'YOUR_PAYPAL_CLIENT_ID',
    clientSecretHardcoded: PAYPAL_CLIENT_SECRET !== 'YOUR_PAYPAL_CLIENT_SECRET',
    clientIdFromEnv: !!ENV_PAYPAL_CLIENT_ID,
    clientSecretFromEnv: !!ENV_PAYPAL_CLIENT_SECRET,
    usingEnvVars: !!(ENV_PAYPAL_CLIENT_ID && ENV_PAYPAL_CLIENT_SECRET)
});

// 获取PayPal访问令牌
async function getPayPalAccessToken() {
    // 检查是否在本地测试环境中
    const isLocalTest = (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') || 
                        (typeof process !== 'undefined' && process.env.LOCAL_TEST === 'true');
    
    // 记录环境信息以便调试
    console.log('环境信息:', {
        processEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'undefined',
        windowDefined: typeof window !== 'undefined',
        locationHostname: typeof location !== 'undefined' ? location.hostname : 'undefined',
        isLocalTest: isLocalTest
    });
    
    // 如果是本地测试环境，直接返回测试令牌
    if (isLocalTest) {
        console.log('本地测试环境，使用测试访问令牌');
        return TEST_ACCESS_TOKEN;
    }
    
    try {
        console.log('正在获取PayPal访问令牌...');
        
        // 使用安全的Base64编码函数
        const auth = safeBase64Encode(`${ACTIVE_PAYPAL_CLIENT_ID}:${ACTIVE_PAYPAL_CLIENT_SECRET}`);
        
        const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: 'grant_type=client_credentials'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('获取PayPal访问令牌失败:', response.status, errorText);
            throw new Error(`获取PayPal访问令牌失败: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('成功获取PayPal访问令牌');
        return data.access_token;
    } catch (error) {
        console.error('获取PayPal访问令牌异常:', error);
        throw error;
    }
}

// 创建PayPal订阅
async function createPayPalSubscription(accessToken, planId, userInfo, origin) {
    // 检查是否在本地测试环境中
    const isLocalTest = (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') || 
                        (typeof process !== 'undefined' && process.env.LOCAL_TEST === 'true');
    
    // 记录环境信息以便调试
    console.log('创建订阅环境信息:', {
        processEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'undefined',
        windowDefined: typeof window !== 'undefined',
        locationHostname: typeof location !== 'undefined' ? location.hostname : 'undefined',
        isLocalTest: isLocalTest,
        accessToken: accessToken ? '已提供' : '未提供',
        planId: planId,
        userInfo: JSON.stringify(userInfo),
        origin: origin
    });
    
    // 如果是本地测试环境，返回模拟数据
    if (isLocalTest) {
        console.log('本地测试环境，返回模拟的PayPal订阅数据');
        
        // 生成一个模拟的订阅ID
        const subscriptionId = `MOCK_SUB_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        
        // 返回模拟数据
        return {
            id: subscriptionId,
            status: 'APPROVAL_PENDING',
            plan_id: planId,
            create_time: new Date().toISOString(),
            links: [
                {
                    href: 'https://www.sandbox.paypal.com/webapps/billing/subscriptions/mocklink',
                    rel: 'approve',
                    method: 'GET'
                },
                {
                    href: `https://api.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}`,
                    rel: 'self',
                    method: 'GET'
                },
                {
                    href: `https://api.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}`,
                    rel: 'edit',
                    method: 'PATCH'
                }
            ]
        };
    }
    
    try {
        console.log('正在创建PayPal订阅...');
        
        const requestId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        
        const requestBody = JSON.stringify({
            plan_id: planId,
            custom_id: JSON.stringify(userInfo),
            application_context: {
                brand_name: 'Flux Krea AI',
                locale: 'zh-CN',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'SUBSCRIBE_NOW',
                return_url: `${origin || 'https://www.fluxkrea.me'}/subscription-success.html`,
                cancel_url: `${origin || 'https://www.fluxkrea.me'}/pricing.html?cancelled=true`
            }
        });
        
        console.log('PayPal API 请求体:', requestBody);
        
        const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'PayPal-Request-Id': requestId,
                'Prefer': 'return=representation'
            },
            body: requestBody
        });
        
        // 获取响应文本以便调试
        const responseText = await response.text();
        console.log('PayPal API 响应状态:', response.status);
        console.log('PayPal API 响应文本:', responseText);
        
        if (!response.ok) {
            let errorDetails = '未知错误';
            try {
                const errorData = JSON.parse(responseText);
                errorDetails = JSON.stringify(errorData);
                console.error('创建PayPal订阅失败:', response.status, errorData);
            } catch (e) {
                console.error('创建PayPal订阅失败 (无法解析错误):', response.status, responseText);
                errorDetails = responseText.substring(0, 200); // 限制长度以防止过长
            }
            throw new Error(`创建PayPal订阅失败: ${response.status} - ${errorDetails}`);
        }
        
        // 重新解析响应文本为JSON
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('PayPal订阅创建成功:', data.id);
            return data;
        } catch (e) {
            console.error('解析PayPal成功响应失败:', e);
            throw new Error('无法解析PayPal响应: ' + responseText.substring(0, 200));
        }
    } catch (error) {
        console.error('创建PayPal订阅异常:', error);
        throw error;
    }
}

// Vercel Serverless Function
module.exports = async (req, res) => {
    // 检查是否在Node.js HTTP服务器环境中
    const isNodeHttpServer = !res.status && typeof res.writeHead === 'function';
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        if (isNodeHttpServer) {
            res.writeHead(200);
            return res.end();
        } else {
            return res.status(200).end();
        }
    }
    
    // 只允许POST请求
    if (req.method !== 'POST') {
        if (isNodeHttpServer) {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: '方法不允许' }));
        } else {
            return res.status(405).json({ success: false, error: '方法不允许' });
        }
    }
    
    try {
        console.log('接收到创建PayPal订阅请求');
        
        // 解析请求体
        let body;
        try {
            body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (e) {
            console.error('解析请求体失败:', e);
            if (isNodeHttpServer) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: '无效的请求格式' }));
            } else {
                return res.status(400).json({ success: false, error: '无效的请求格式' });
            }
        }
        
        const { planType, user_id, email } = body;
        console.log('请求参数:', { planType, user_id, email });
        
        // 验证必要参数
        if (!planType || !user_id || !email) {
            console.error('请求缺少必要参数');
            if (isNodeHttpServer) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: '缺少必要参数' }));
            } else {
                return res.status(400).json({ success: false, error: '缺少必要参数' });
            }
        }
        
        // 验证计划类型
        const planTypeKey = planType.toLowerCase();
        const planId = PAYPAL_PLANS[planTypeKey];
        if (!planId) {
            console.error('无效的计划类型:', planType);
            if (isNodeHttpServer) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: '无效的计划类型' }));
            } else {
                return res.status(400).json({ success: false, error: '无效的计划类型' });
            }
        }
        
        // 获取PayPal访问令牌
        const accessToken = await getPayPalAccessToken();
        
        // 准备用户信息
        const userInfo = { user_id, email, plan_type: planType };
        
        // 创建PayPal订阅
        const subscriptionData = await createPayPalSubscription(
            accessToken,
            planId,
            userInfo,
            req.headers.origin
        );
        
        // 返回成功响应
        const successResponse = {
            success: true,
            subscriptionID: subscriptionData.id,
            plan_type: planType,
            plan_id: planId,
            links: subscriptionData.links
        };
        
        if (isNodeHttpServer) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(successResponse));
        } else {
            return res.status(200).json(successResponse);
        }
        
    } catch (error) {
        console.error('服务器内部错误:', error);
        
        const errorResponse = {
            success: false,
            error: '服务器内部错误',
            message: error.message
        };
        
        if (isNodeHttpServer) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(errorResponse));
        } else {
            return res.status(500).json(errorResponse);
        }
    }
};