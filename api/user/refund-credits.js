/**
 * 退还积分API - 处理生成失败时的积分退还
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
        const { google_id, amount, reason = '生成失败退还' } = req.body;
        
        if (!google_id || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        console.log('处理积分退还:', { google_id, amount, reason });
        
        // 1. 获取用户信息
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', google_id)
            .single();
        
        if (userError || !user) {
            console.error('用户不存在:', userError);
            return res.status(404).json({ error: 'User not found' });
        }
        
        const newBalance = user.credits + amount;
        
        // 2. 更新用户积分
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                credits: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('google_id', google_id);
        
        if (updateError) {
            console.error('更新积分失败:', updateError);
            throw updateError;
        }
        
        // 3. 记录积分交易
        const { error: transactionError } = await supabase
            .from('credit_transactions')
            .insert([{
                user_uuid: user.uuid,
                transaction_type: 'EARN',
                amount: amount,
                balance_after: newBalance,
                description: reason,
                source: 'refund',
                created_at: new Date().toISOString()
            }]);
        
        if (transactionError) {
            console.error('记录积分交易失败:', transactionError);
            // 不抛出错误，因为积分已退还成功
        }
        
        console.log('积分退还成功:', { 
            user: user.email, 
            refunded: amount, 
            newBalance: newBalance 
        });
        
        return res.status(200).json({
            success: true,
            newBalance: newBalance,
            refunded: amount,
            message: `成功退还${amount}积分`
        });
        
    } catch (error) {
        console.error('积分退还失败:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}