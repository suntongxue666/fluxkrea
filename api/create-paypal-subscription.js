// 导入 Supabase 客户端，用于获取用户信息
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// ============================================================================
// 使用与其他API相同的Supabase配置
// ============================================================================
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// PayPal沙盒环境配置
const PAYPAL_CLIENT_ID = 'AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8';
const PAYPAL_CLIENT_SECRET = 'EBGwQdCz-qCkYPLJ9ZVmIgxKvNgQR9qKUvGJwJiBQV_-Kj3TXVKk6mFmGNcSV_G1_-7AzTMvEPmbW-cz';
const PAYPAL_API_BASE = 'https://api.sandbox.paypal.com';

// PayPal沙盒计划ID
const PAYPAL_PLANS = {
    pro: 'P-5ML4271244454362XMVKVPEQ',  // Pro计划ID
    max: 'P-8XB43994LV7189516MVKVPMA'   // Max计划ID
};
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 获取PayPal的OAuth2访问令牌
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    if (!response.ok) {
        console.error('获取PayPal访问令牌失败:', data);
        throw new Error(`获取PayPal访问令牌失败: ${data.error_description || '未知错误'}`);
    }
    return data.access_token;
}

// Vercel Serverless Function 格式 - 使用CommonJS模块
module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: '方法不允许' });
    }

    try {
        console.log('🔄 接收到创建PayPal订阅请求');
        const { planType, user_id, email } = req.body;

        if (!planType || !user_id || !email) {
            console.error('❌ 请求缺少必要参数:', req.body);
            return res.status(400).json({ success: false, error: '缺少 planType, user_id 或 email' });
        }

        const planId = PAYPAL_PLANS[planType];
        if (!planId) {
            console.error('❌ 无效的计划类型:', planType);
            return res.status(400).json({ success: false, error: '无效的 planType' });
        }

        console.log('🔑 正在获取PayPal访问令牌...');
        const accessToken = await getPayPalAccessToken();
        console.log('✅ 成功获取PayPal访问令牌');

        // 准备传递给PayPal的自定义用户信息
        const userInfo = { user_id, email, plan_type: planType };
        console.log('👤 用户信息:', userInfo);

        console.log('🔄 正在创建PayPal订阅...');
        const subscriptionResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'PayPal-Request-Id': `sub-${Date.now()}` // 保证幂等性
            },
            body: JSON.stringify({
                plan_id: planId,
                custom_id: JSON.stringify(userInfo), // 将用户信息作为自定义ID传递，用于Webhook处理
                application_context: {
                    brand_name: 'Flux Krea AI',
                    locale: 'zh-CN',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'SUBSCRIBE_NOW',
                    return_url: `${req.headers.origin || 'http://localhost:3000'}/subscription-success.html`,
                    cancel_url: `${req.headers.origin || 'http://localhost:3000'}/pricing.html?cancelled=true`
                }
            })
        });

        const subscriptionData = await subscriptionResponse.json();

        if (!subscriptionResponse.ok) {
            console.error("❌ PayPal API 错误:", subscriptionData);
            return res.status(subscriptionResponse.status).json({ 
                success: false, 
                error: '创建PayPal订阅失败', 
                details: subscriptionData 
            });
        }

        console.log('✅ PayPal订阅创建成功:', subscriptionData.id);
        
        // 将订阅ID返回给客户端
        res.status(200).json({ 
            success: true, 
            subscriptionID: subscriptionData.id,
            plan_type: planType,
            plan_id: planId
        });

    } catch (error) {
        console.error("❌ 服务器内部错误:", error);
        res.status(500).json({ 
            success: false, 
            error: '服务器内部错误', 
            details: error.message 
        });
    }
};
