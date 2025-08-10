// 激活订单 I-7VVXSYVUHPC8
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function activateOrder() {
    const subscriptionId = 'I-7VVXSYVUHPC8';
    
    try {
        console.log('🚀 激活订单:', subscriptionId);
        console.log('');
        
        // 显示当前有邮箱的用户，让用户选择
        console.log('📋 当前数据库中有邮箱的用户:');
        
        const { data: usersWithEmail, error: usersError } = await supabase
            .from('users')
            .select('*')
            .not('email', 'is', null)
            .order('created_at', { ascending: false });
        
        if (usersError) {
            console.error('❌ 查询用户失败:', usersError);
            return;
        }
        
        if (usersWithEmail && usersWithEmail.length > 0) {
            usersWithEmail.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email}`);
                console.log(`   UUID: ${user.uuid}`);
                console.log(`   当前积分: ${user.credits || 0}`);
                console.log(`   订阅状态: ${user.subscription_status || 'FREE'}`);
                console.log('   ---');
            });
        }
        
        console.log('');
        console.log('⚠️ 请告诉我这个订单应该激活给哪个用户');
        console.log('订单ID:', subscriptionId);
        console.log('');
        console.log('如果这是Pro Plan订阅，将获得1000积分');
        console.log('如果这是Max Plan订阅，将获得5000积分');
        console.log('');
        console.log('请在聊天中告诉我正确的用户邮箱，我会立即激活！');
        
    } catch (error) {
        console.error('❌ 激活订单失败:', error);
    }
}

// 运行激活检查
activateOrder();