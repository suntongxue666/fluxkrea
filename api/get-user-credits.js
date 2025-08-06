// 获取用户积分的API - 支持跨页面同步
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
        const { userIdentifier } = req.body;
        
        if (!userIdentifier || userIdentifier === 'anonymous') {
            return res.status(200).json({ 
                success: true, 
                credits: 0,
                user_type: 'anonymous'
            });
        }
        
        console.log('🔍 查询用户积分:', userIdentifier);
        
        // 支持多种查找方式：UUID或邮箱
        let user = null;
        
        // 1. 先尝试通过UUID查找
        const { data: uuidUser, error: uuidError } = await supabase
            .from('users')
            .select('uuid, email, credits, subscription_status')
            .eq('uuid', userIdentifier)
            .single();
        
        if (!uuidError && uuidUser) {
            user = uuidUser;
            console.log(`✅ 通过UUID找到用户: ${user.email}, 积分: ${user.credits}`);
        } else {
            // 2. 如果UUID查找失败，尝试通过邮箱查找
            const { data: emailUser, error: emailError } = await supabase
                .from('users')
                .select('uuid, email, credits, subscription_status')
                .eq('email', userIdentifier)
                .single();
            
            if (!emailError && emailUser) {
                user = emailUser;
                console.log(`✅ 通过邮箱找到用户: ${user.email}, 积分: ${user.credits}`);
            } else {
                console.log('❌ 未找到用户:', userIdentifier);
                return res.status(200).json({ 
                    success: true, 
                    credits: 0,
                    user_type: 'not_found'
                });
            }
        }
        
        // 返回用户积分信息
        res.status(200).json({
            success: true,
            credits: user.credits || 0,
            user_type: 'registered',
            user_info: {
                uuid: user.uuid,
                email: user.email,
                subscription_status: user.subscription_status
            }
        });
        
    } catch (error) {
        console.error('❌ 获取用户积分失败:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            credits: 0
        });
    }
};