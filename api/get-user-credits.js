// 获取用户积分的API
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ciwjjfcuhubjydajazkk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpd2pqZmN1aHVianlkYWphemtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzE4NzQsImV4cCI6MjA1MDAwNzg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

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
        
        if (!userIdentifier) {
            return res.status(400).json({ error: 'User identifier required' });
        }
        
        // 查询用户积分
        const { data, error } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', userIdentifier)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('查询积分失败:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }
        
        const credits = data ? data.credits : 0;
        
        res.status(200).json({
            success: true,
            credits: credits,
            userIdentifier: userIdentifier
        });
        
    } catch (error) {
        console.error('获取用户积分失败:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};