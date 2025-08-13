/**
 * PayPal订阅关联API
 *
 * 这个API用于将PayPal订阅与用户关联起来
 */

// Supabase客户端配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// 创建Supabase客户端
let supabaseClient;

// 初始化Supabase客户端
async function initSupabase() {
    // 检查是否在Node.js环境中
    if (typeof require !== 'undefined') {
        try {
            const { createClient } = require('@supabase/supabase-js');
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
            return supabaseClient;
        } catch (error) {
            console.error('初始化Supabase客户端失败 (Node.js):', error);
            throw error;
        }
    } else {
        // 浏览器环境
        if (typeof window.supabase !== 'undefined') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            return supabaseClient;
        } else {
            console.error('初始化Supabase客户端失败 (浏览器): supabase未定义');
            throw new Error('supabase未定义');
        }
    }
}

// 保存订阅关联
async function saveSubscriptionAssociation(subscriptionData) {
    try {
        console.log('🔄 保存订阅关联...');

        // 确保Supabase客户端已初始化
        if (!supabaseClient) {
            await initSupabase();
        }

        // 提取订阅数据
        const {
            googleUserId,
            googleUserEmail,
            paypalSubscriptionId,
            planId,
            planType
        } = subscriptionData;

        // 验证必要参数
        if (!googleUserId || !googleUserEmail || !paypalSubscriptionId || !planType) {
            throw new Error('缺少必要参数');
        }

        // 检查用户是否存在
        const { data: existingUser, error: userError } = await supabaseClient
            .from('users')
            .select('id')
            .eq('google_user_id', googleUserId)
            .maybeSingle();

        if (userError) {
            console.error('查询用户失败:', userError);
            throw new Error('查询用户失败');
        }

        let userId;

        if (existingUser) {
            userId = existingUser.id;
            console.log('找到现有用户:', userId);
        } else {
            // 创建新用户
            const { data: newUser, error: createError } = await supabaseClient
                .from('users')
                .insert({
                    google_user_id: googleUserId,
                    email: googleUserEmail,
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (createError) {
                console.error('创建用户失败:', createError);
                throw new Error('创建用户失败');
            }

            userId = newUser.id;
            console.log('创建新用户:', userId);
        }

        // 保存订阅信息
        const { data: subscription, error: subscriptionError } = await supabaseClient
            .from('subscriptions')
            .insert({
                user_id: userId,
                paypal_subscription_id: paypalSubscriptionId,
                plan_id: planId || '',
                plan_type: planType,
                status: 'PENDING',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (subscriptionError) {
            console.error('保存订阅失败:', subscriptionError);
            throw new Error('保存订阅失败');
        }

        console.log('✅ 订阅关联保存成功:', subscription.id);

        return {
            success: true,
            subscription_id: subscription.id,
            user_id: userId
        };
    } catch (error) {
        console.error('保存订阅关联失败:', error);
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
        console.log('接收到保存订阅关联请求');

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

        // 保存订阅关联
        const result = await saveSubscriptionAssociation(body);

        // 返回成功响应
        if (isNodeHttpServer) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(result));
        } else {
            return res.status(200).json(result);
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