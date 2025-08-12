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
        
        // 1. 确保用户存在于users表中 - 修复版本
        let user = null;
        
        // 先通过UUID查找用户
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', googleUserId)
            .single();
        
        if (findError && findError.code === 'PGRST116') {
            // 用户不存在，尝试通过邮箱查找
            console.log('👤 通过UUID未找到用户，尝试邮箱查找:', googleUserEmail);
            
            const { data: emailUser, error: emailError } = await supabase
                .from('users')
                .select('*')
                .eq('email', googleUserEmail)
                .single();
            
            if (!emailError && emailUser) {
                // 通过邮箱找到用户，更新UUID
                console.log('✅ 通过邮箱找到用户，更新UUID');
                
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update({ uuid: googleUserId })
                    .eq('id', emailUser.id)
                    .select()
                    .single();
                
                if (updateError) {
                    console.error('❌ 更新用户UUID失败:', updateError);
                    return res.status(500).json({ error: 'Failed to update user UUID' });
                }
                
                user = updatedUser;
            } else {
                // 用户不存在，创建新用户
                console.log('👤 创建新用户:', googleUserEmail);
                
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        uuid: googleUserId,
                        email: googleUserEmail,
                        name: googleUserEmail ? googleUserEmail.split('@')[0] : 'User',
                        credits: 0,
                        subscription_status: 'PENDING',
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (createError) {
                    console.error('❌ 创建用户失败:', createError);
                    return res.status(500).json({ error: 'Failed to create user' });
                }
                
                user = newUser;
            }
        } else if (findError) {
            console.error('❌ 查找用户失败:', findError);
            return res.status(500).json({ error: 'Database query failed' });
        } else {
            user = existingUser;
            
            // 更新用户邮箱（如果提供了）
            if (googleUserEmail && user.email !== googleUserEmail) {
                await supabase
                    .from('users')
                    .update({ email: googleUserEmail })
                    .eq('uuid', googleUserId);
            }
        }
        
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