/**
 * Google登录API - 处理用户登录和积分奖励
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
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
        const { google_id, email, name, avatar_url } = req.body;
        
        if (!google_id || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        console.log('处理Google登录:', { google_id, email, name });
        
        // 1. 检查用户是否已存在
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', google_id)
            .single();
        
        if (existingUser) {
            console.log('用户已存在:', existingUser.email);
            return res.status(200).json({
                success: true,
                user: existingUser,
                credits: existingUser.credits,
                message: '登录成功'
            });
        }
        
        // 2. 创建新用户
        const newUser = {
            uuid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            google_id: google_id,
            email: email,
            name: name,
            avatar_url: avatar_url,
            credits: 0, // 首次登录不给积分
            subscription_status: 'FREE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data: user, error: createError } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();
        
        if (createError) {
            console.error('创建用户失败:', createError);
            throw createError;
        }
        
        // 3. 记录首次登录积分奖励
        const { error: transactionError } = await supabase
            .from('credit_transactions')
            .insert([{
                user_uuid: user.uuid,
                transaction_type: 'EARN',
                amount: 0,
                balance_after: 0,
                description: '首次登录记录',
                source: 'first_login_bonus',
                created_at: new Date().toISOString()
            }]);
        
        if (transactionError) {
            console.error('记录积分交易失败:', transactionError);
            // 不抛出错误，因为用户已创建成功
        }
        
        console.log('新用户创建成功:', user.email, '积分:', user.credits);
        
        return res.status(200).json({
            success: true,
            user: user,
            credits: user.credits,
            message: '注册成功！'
        });
        
    } catch (error) {
        console.error('Google登录处理失败:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}