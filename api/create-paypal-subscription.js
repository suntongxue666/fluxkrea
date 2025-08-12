// 使用 ESM 语法，更好地兼容 Vercel Edge 函数
import { createClient } from '@supabase/supabase-js';
// 使用内置的 fetch API

// Supabase配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// PayPal沙盒环境配置
const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com'; // 使用 api-m 子域名
const PAYPAL_CLIENT_ID = 'AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8';
const PAYPAL_CLIENT_SECRET = 'EBGwQdCz-qCkYPLJ9ZVmIgxKvNgQR9qKUvGJwJiBQV_-Kj3TXVKk6mFmGNcSV_G1_-7AzTMvEPmbW-cz';

// PayPal沙盒计划ID
const PAYPAL_PLANS = {
    pro: 'P-5ML4271244454362XMVKVPEQ',  // Pro计划ID
    max: 'P-8XB43994LV7189516MVKVPMA'   // Max计划ID
};
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 获取PayPal的OAuth2访问令牌
async function getPayPalAccessToken() {
    try {
        console.log('🔄 正在获取PayPal访问令牌...');
        
        // 使用 btoa 代替 Buffer 进行 base64 编码，兼容浏览器环境
        const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
        
        const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: 'grant_type=client_credentials'
        });
        
        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text();
            console.error('获取PayPal访问令牌失败 - 状态码:', response.status);
            console.error('错误响应:', errorText);
            throw new Error(`获取PayPal访问令牌失败: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ 成功获取PayPal访问令牌');
        return data.access_token;
    } catch (error) {
        console.error('获取PayPal访问令牌时发生异常:', error);
        throw error;
    }
}

// Vercel Serverless Function 格式 - 使用 ESM 语法
export default async function handler(req, res) {
    // 设置CORS头，允许特定域名访问
    const allowedOrigins = ['https://www.fluxkrea.me', 'http://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://www.fluxkrea.me');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: '方法不允许' });
    }

    try {
        console.log('🔄 接收到创建PayPal订阅请求');
        
        // 解析请求体
        let body;
        try {
            body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (e) {
            console.error('❌ 解析请求体失败:', e);
            return res.status(400).json({ success: false, error: '无效的请求格式' });
        }
        
        const { planType, user_id, email } = body;
        console.log('📝 请求参数:', { planType, user_id, email });

        // 验证必要参数
        if (!planType || !user_id || !email) {
            console.error('❌ 请求缺少必要参数');
            return res.status(400).json({ success: false, error: '缺少 planType, user_id 或 email' });
        }

        // 验证计划类型
        const planId = PAYPAL_PLANS[planType];
        if (!planId) {
            console.error('❌ 无效的计划类型:', planType);
            return res.status(400).json({ success: false, error: '无效的 planType' });
        }

        // 获取PayPal访问令牌
        let accessToken;
        try {
            accessToken = await getPayPalAccessToken();
        } catch (error) {
            console.error('❌ 获取PayPal访问令牌失败:', error);
            return res.status(500).json({ 
                success: false, 
                error: '获取PayPal访问令牌失败', 
                details: error.message 
            });
        }

        // 准备传递给PayPal的自定义用户信息
        const userInfo = { user_id, email, plan_type: planType }
        console.log('👤 用户信息:', userInfo);
        const requestId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

        console.log('🔄 正在创建PayPal订阅...');
        let subscriptionResponse;
        try {
            subscriptionResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'PayPal-Request-Id': requestId, // 保证幂等性
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    plan_id: planId,
                    custom_id: JSON.stringify(userInfo), // 将用户信息作为自定义ID传递，用于Webhook处理
                    application_context: {
                        brand_name: 'Flux Krea AI',
                        locale: 'zh-CN',
                        shipping_preference: 'NO_SHIPPING',
                        user_action: 'SUBSCRIBE_NOW',
                        return_url: `${req.headers.origin || 'https://www.fluxkrea.me'}/subscription-success.html`,
                        cancel_url: `${req.headers.origin || 'https://www.fluxkrea.me'}/pricing.html?cancelled=true`
                    }
                })
            });
        } catch (error) {
            console.error('❌ 创建订阅请求失败:', error);
            return res.status(500).json({ 
                success: false, 
                error: '创建PayPal订阅请求失败', 
                details: error.message 
            });
        }

        // 检查响应状态
        if (!subscriptionResponse.ok) {
            try {
                const errorText = await subscriptionResponse.text();
                let errorData;
                
                try {
                    // 尝试解析为JSON
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // 如果不是JSON，使用原始文本
                    errorData = { raw_response: errorText };
                }
                
                console.error("❌ PayPal API 错误:", errorData);
                return res.status(subscriptionResponse.status).json({ 
                    success: false, 
                    error: '创建PayPal订阅失败', 
                    status: subscriptionResponse.status,
                    details: errorData
                });
            } catch (error) {
                console.error("❌ 处理PayPal错误响应失败:", error);
                return res.status(500).json({ 
                    success: false, 
                    error: '处理PayPal错误响应失败', 
                    details: error.message 
                });
            }
        }

        // 解析订阅数据
        let subscriptionData;
        try {
            subscriptionData = await subscriptionResponse.json();
        } catch (error) {
            console.error("❌ 解析PayPal响应失败:", error);
            return res.status(500).json({ 
                success: false, 
                error: '解析PayPal响应失败', 
                details: error.message 
            });
        }

        console.log('✅ PayPal订阅创建成功:', subscriptionData.id);
        
        // 将订阅ID返回给客户端
        return res.status(200).json({ 
            success: true, 
            subscriptionID: subscriptionData.id,
            plan_type: planType,
            plan_id: planId,
            links: subscriptionData.links
        });

    } catch (error) {
        console.error("❌ 服务器内部错误:", error);
        return res.status(500).json({ 
            success: false, 
            error: '服务器内部错误', 
            details: error.message 
        });
    }
};
