/**
 * PayPal订阅API - Vercel Edge函数兼容版本
 * 优化版本：增强错误处理、日志记录和兼容性
 */

// PayPal API配置
const PAYPAL_API_BASE = process.env.PAYPAL_API_PRODUCTION === 'true' 
    ? 'https://api-m.paypal.com'  // 生产环境
    : 'https://api-m.sandbox.paypal.com';  // 沙盒环境（默认）

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

// PayPal计划ID配置
const PAYPAL_PLANS = {
    // 沙盒环境计划ID
    sandbox: {
        pro: 'P-5ML4271244454362XMVKVPEQ',
        max: 'P-8XB43994LV7189516MVKVPMA'
    },
    // 生产环境计划ID（需要替换为实际值）
    production: {
        pro: process.env.PAYPAL_PLAN_PRO || 'P-PRODUCTION_PRO_PLAN_ID',
        max: process.env.PAYPAL_PLAN_MAX || 'P-PRODUCTION_MAX_PLAN_ID'
    }
};

// 获取当前环境的计划ID
const ACTIVE_PLANS = process.env.PAYPAL_API_PRODUCTION === 'true' 
    ? PAYPAL_PLANS.production 
    : PAYPAL_PLANS.sandbox;

/**
 * 安全的日志记录函数
 * 在生产环境中过滤敏感信息
 */
function safeLog(message, data = {}) {
    // 创建数据的安全副本
    const safeData = { ...data };
    
    // 过滤掉敏感字段
    const sensitiveFields = ['password', 'secret', 'token', 'auth', 'key', 'credential'];
    Object.keys(safeData).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
            safeData[key] = typeof safeData[key] === 'string' ? '[已隐藏]' : { hidden: true };
        }
    });
    
    // 记录日志
    console.log(message, safeData);
}

/**
 * 安全的Base64编码函数
 * 兼容不同的JavaScript运行环境
 */
function safeBase64Encode(str) {
    // 检测环境并使用适当的方法
    if (typeof Buffer !== 'undefined') {
        // Node.js环境
        return Buffer.from(str).toString('base64');
    } else if (typeof btoa === 'function') {
        // 浏览器环境
        return btoa(str);
    } else {
        // 如果两种方法都不可用，尝试使用TextEncoder和btoa的组合
        try {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(str);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        } catch (e) {
            throw new Error('无法执行Base64编码，环境不支持');
        }
    }
}

// 记录PayPal凭证状态（不记录实际值，只记录是否存在）
safeLog('PayPal配置状态', {
    apiBase: PAYPAL_API_BASE,
    environment: process.env.PAYPAL_API_PRODUCTION === 'true' ? 'production' : 'sandbox',
    clientIdHardcoded: PAYPAL_CLIENT_ID !== 'YOUR_PAYPAL_CLIENT_ID',
    clientSecretHardcoded: PAYPAL_CLIENT_SECRET !== 'YOUR_PAYPAL_CLIENT_SECRET',
    clientIdFromEnv: !!ENV_PAYPAL_CLIENT_ID,
    clientSecretFromEnv: !!ENV_PAYPAL_CLIENT_SECRET,
    usingEnvVars: !!(ENV_PAYPAL_CLIENT_ID && ENV_PAYPAL_CLIENT_SECRET),
    plansConfigured: Object.keys(ACTIVE_PLANS).length > 0
});

/**
 * 检测当前运行环境
 * 返回环境信息对象
 */
function detectEnvironment() {
    const env = {
        isTest: false,
        isLocal: false,
        isProduction: false,
        nodeEnv: 'unknown',
        platform: 'unknown'
    };
    
    // 检测Node.js环境
    if (typeof process !== 'undefined' && process.env) {
        env.nodeEnv = process.env.NODE_ENV || 'development';
        env.isTest = env.nodeEnv === 'test' || process.env.LOCAL_TEST === 'true';
        env.isLocal = env.nodeEnv === 'development' || process.env.LOCAL_DEV === 'true';
        env.isProduction = env.nodeEnv === 'production' || process.env.PAYPAL_API_PRODUCTION === 'true';
    }
    
    // 检测浏览器环境
    if (typeof window !== 'undefined') {
        env.platform = 'browser';
        env.hostname = typeof location !== 'undefined' ? location.hostname : 'unknown';
        env.isLocal = env.isLocal || env.hostname === 'localhost' || env.hostname.includes('127.0.0.1');
    } else {
        env.platform = 'node';
    }
    
    return env;
}

/**
 * 获取PayPal访问令牌
 * 增强的错误处理和重试逻辑
 */
async function getPayPalAccessToken(retryCount = 0) {
    const env = detectEnvironment();
    const maxRetries = 2;
    
    // 记录环境信息以便调试
    safeLog('获取PayPal访问令牌 - 环境信息', {
        nodeEnv: env.nodeEnv,
        platform: env.platform,
        isTest: env.isTest,
        isLocal: env.isLocal,
        isProduction: env.isProduction,
        retryAttempt: retryCount
    });

    // 如果是测试环境，直接返回测试令牌
    if (env.isTest) {
        safeLog('测试环境，使用测试访问令牌');
        return TEST_ACCESS_TOKEN;
    }

    try {
        safeLog('正在获取PayPal访问令牌...');

        // 验证凭证是否有效
        if (ACTIVE_PAYPAL_CLIENT_ID === 'YOUR_PAYPAL_CLIENT_ID' || 
            ACTIVE_PAYPAL_CLIENT_SECRET === 'YOUR_PAYPAL_CLIENT_SECRET') {
            throw new Error('PayPal凭证未配置，请设置有效的PAYPAL_CLIENT_ID和PAYPAL_CLIENT_SECRET环境变量');
        }

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
            
            // 如果是可重试的错误并且未超过最大重试次数
            if (retryCount < maxRetries && (response.status >= 500 || response.status === 429)) {
                const delay = Math.pow(2, retryCount) * 1000; // 指数退避策略
                safeLog(`将在${delay}ms后重试获取访问令牌 (${retryCount + 1}/${maxRetries})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return getPayPalAccessToken(retryCount + 1);
            }
            
            throw new Error(`获取PayPal访问令牌失败: ${response.status} - ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();
        safeLog('成功获取PayPal访问令牌', { tokenReceived: !!data.access_token });
        return data.access_token;
    } catch (error) {
        console.error('获取PayPal访问令牌异常:', error);
        throw error;
    }
}

/**
 * 创建PayPal订阅
 * 增强的错误处理、重试逻辑和数据验证
 */
async function createPayPalSubscription(accessToken, planId, userInfo, origin, retryCount = 0) {
    const env = detectEnvironment();
    const maxRetries = 2;
    
    // 验证参数
    if (!accessToken) throw new Error('访问令牌未提供');
    if (!planId) throw new Error('计划ID未提供');
    if (!userInfo || !userInfo.user_id || !userInfo.email) throw new Error('用户信息不完整');
    
    // 记录环境信息以便调试（不包含敏感信息）
    safeLog('创建订阅 - 环境信息', {
        platform: env.platform,
        isTest: env.isTest,
        isLocal: env.isLocal,
        isProduction: env.isProduction,
        accessTokenProvided: !!accessToken,
        planId: planId,
        userInfo: {
            user_id: userInfo.user_id,
            email: userInfo.email ? '已提供' : '未提供',
            plan_type: userInfo.plan_type
        },
        origin: origin || 'default',
        retryAttempt: retryCount
    });

    // 如果是测试环境，返回模拟数据
    if (env.isTest) {
        safeLog('测试环境，返回模拟的PayPal订阅数据');

        // 生成一个模拟的订阅ID
        const subscriptionId = `MOCK_SUB_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        
        // 构建域名
        const domain = env.isProduction ? 'www.paypal.com' : 'www.sandbox.paypal.com';
        const apiDomain = env.isProduction ? 'api.paypal.com' : 'api.sandbox.paypal.com';

        // 返回模拟数据
        return {
            id: subscriptionId,
            status: 'APPROVAL_PENDING',
            plan_id: planId,
            create_time: new Date().toISOString(),
            links: [
                {
                    href: `https://${domain}/webapps/billing/subscriptions/mocklink?token=${subscriptionId}`,
                    rel: 'approve',
                    method: 'GET'
                },
                {
                    href: `https://${apiDomain}/v1/billing/subscriptions/${subscriptionId}`,
                    rel: 'self',
                    method: 'GET'
                },
                {
                    href: `https://${apiDomain}/v1/billing/subscriptions/${subscriptionId}`,
                    rel: 'edit',
                    method: 'PATCH'
                }
            ]
        };
    }

    try {
        safeLog('正在创建PayPal订阅...');

        // 生成唯一请求ID
        const requestId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        
        // 确定正确的域名
        const defaultDomain = env.isProduction ? 'www.fluxkrea.me' : 'www.fluxkrea.me';
        const effectiveOrigin = origin || `https://${defaultDomain}`;
        
        // 构建请求体
        const requestBody = JSON.stringify({
            plan_id: planId,
            custom_id: JSON.stringify(userInfo),
            application_context: {
                brand_name: 'Flux Krea AI',
                locale: 'zh-CN',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'SUBSCRIBE_NOW',
                return_url: `${effectiveOrigin}/subscription-success.html?user_id=${encodeURIComponent(userInfo.user_id)}`,
                cancel_url: `${effectiveOrigin}/pricing.html?cancelled=true&user_id=${encodeURIComponent(userInfo.user_id)}`
            }
        });

        safeLog('PayPal API 请求', {
            endpoint: `${PAYPAL_API_BASE}/v1/billing/subscriptions`,
            requestId: requestId,
            planId: planId,
            customId: `包含用户ID: ${userInfo.user_id}`
        });

        // 发送请求
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
        safeLog('PayPal API 响应状态', { status: response.status });

        if (!response.ok) {
            let errorDetails = '未知错误';
            try {
                const errorData = JSON.parse(responseText);
                errorDetails = JSON.stringify(errorData);
                console.error('创建PayPal订阅失败:', response.status, errorData);
                
                // 检查是否是可重试的错误
                const isRetryable = response.status >= 500 || response.status === 429;
                
                if (isRetryable && retryCount < maxRetries) {
                    const delay = Math.pow(2, retryCount) * 1000; // 指数退避策略
                    safeLog(`将在${delay}ms后重试创建订阅 (${retryCount + 1}/${maxRetries})`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return createPayPalSubscription(accessToken, planId, userInfo, origin, retryCount + 1);
                }
            } catch (e) {
                console.error('创建PayPal订阅失败 (无法解析错误):', response.status, responseText);
                errorDetails = responseText.substring(0, 200); // 限制长度以防止过长
            }
            throw new Error(`创建PayPal订阅失败: ${response.status} - ${errorDetails}`);
        }

        // 解析响应
        let data;
        try {
            data = JSON.parse(responseText);
            safeLog('PayPal订阅创建成功', { 
                subscriptionId: data.id,
                status: data.status,
                linksCount: data.links ? data.links.length : 0
            });
            
            // 验证响应数据
            if (!data.id || !data.links || !Array.isArray(data.links)) {
                throw new Error('PayPal响应缺少必要字段');
            }
            
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