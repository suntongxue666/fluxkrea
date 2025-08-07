// 手动激活订阅I-2HUL5HXAUJRA的积分
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIwNjY1MSwiZXhwIjoyMDY5NzgyNjUxfQ.LRR6iEw8IGTvLLWC0ZzIgkY1qxaiJ1O7sCA3RQANHmA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function manualActivateSubscription() {
    console.log('🔧 手动激活订阅 I-2HUL5HXAUJRA...\n');
    
    try {
        // 查找用户tiktreeapp@gmail.com
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'tiktreeapp@gmail.com')
            .single();
        
        if (userError || !user) {
            console.log('❌ 用户tiktreeapp@gmail.com不存在');
            return;
        }
        
        console.log(`✅ 找到用户: ${user.email}`);
        console.log(`当前积分: ${user.credits}`);
        
        // 添加5000积分 (Max套餐)
        const newCredits = user.credits + 5000;
        
        // 更新用户积分和订阅状态
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('uuid', user.uuid)
            .select()
            .single();
        
        if (updateError) {
            console.log('❌ 更新用户失败:', updateError.message);
            return;
        }
        
        console.log(`✅ 用户积分已更新: ${user.credits} → ${updatedUser.credits}`);
        console.log(`✅ 订阅状态已更新: ${user.subscription_status || 'FREE'} → ${updatedUser.subscription_status}`);
        
        // 记录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                amount: 5000,
                transaction_type: 'PURCHASE',
                description: '手动激活PayPal订阅 I-2HUL5HXAUJRA (Max套餐)',
                created_at: new Date().toISOString()
            });
        
        if (transError) {
            console.log('⚠️ 记录积分交易失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        // 记录订阅信息
        const { error: subError } = await supabase
            .from('user_subscriptions')
            .insert({
                user_uuid: user.uuid,
                subscription_id: 'I-2HUL5HXAUJRA',
                plan_id: 'P-3NJ78684DS796242VNCJBKQQ', // Max套餐
                status: 'ACTIVE',
                start_time: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        
        if (subError) {
            console.log('⚠️ 记录订阅信息失败:', subError.message);
        } else {
            console.log('✅ 订阅信息已记录');
        }
        
        console.log('\n🎉 订阅I-2HUL5HXAUJRA手动激活完成！');
        console.log('用户现在可以正常使用5000积分了。');
        
    } catch (error) {
        console.error('❌ 手动激活失败:', error);
    }
}

manualActivateSubscription();