// 处理用户订阅关联的API
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { googleUserId, googleUserEmail, paypalSubscriptionId, planId, planType } = req.body;
        
        console.log('📝 处理订阅关联:', {
            googleUserId,
            googleUserEmail,
            paypalSubscriptionId,
            planId,
            planType
        });
        
        if (!googleUserId || !paypalSubscriptionId) {
            return res.status(400).json({ 
                error: 'Missing required fields: googleUserId and paypalSubscriptionId' 
            });
        }
        
        // 步骤 1: 调用数据库函数 `get_or_create_user`
        // 这是一个原子操作，可以安全地获取或创建用户，从而完全避免竞态条件。
        console.log('👤 正在调用数据库函数 `get_or_create_user`...', { googleUserId, googleUserEmail });

        const { data: user, error: rpcError } = await supabase
            .rpc('get_or_create_user', {
                user_uuid: googleUserId,
                user_email: googleUserEmail
            });

        // 如果函数调用失败或没有返回用户，则记录错误并中止
        if (rpcError || !user) {
            console.error('❌ 调用 `get_or_create_user` RPC 失败:', rpcError);
            return res.status(500).json({ error: '无法获取或创建用户。请稍后重试。' });
        }

        console.log('✅ 成功获取或创建用户:', user.email, '用户ID:', user.id);
        
        // 2. 保存用户订阅关联
        const { error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .insert({
                google_user_id: googleUserId,
                google_user_email: googleUserEmail,
                paypal_subscription_id: paypalSubscriptionId,
                plan_id: planId,
                plan_type: planType,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
        
        if (subscriptionError) {
            console.error('❌ 保存订阅关联失败:', subscriptionError);
            return res.status(500).json({ error: 'Failed to save subscription' });
        }
        
        // 3. 更新subscriptions表
        const { error: updateSubError } = await supabase
            .from('subscriptions')
            .upsert({
                id: paypalSubscriptionId,
                user_uuid: googleUserId,
                user_email: googleUserEmail,
                plan_id: planId,
                plan_type: planType,
                status: 'PENDING',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        
        if (updateSubError) {
            console.log('⚠️ 更新subscriptions表失败:', updateSubError.message);
        }
        
        console.log('✅ 订阅关联保存成功');
        
        res.status(200).json({ 
            message: 'Subscription saved successfully',
            user_id: googleUserId,
            subscription_id: paypalSubscriptionId
        });
        
    } catch (error) {
        console.error('❌ 处理订阅关联失败:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};