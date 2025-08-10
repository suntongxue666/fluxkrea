// 重置用户余额到0
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function resetUserBalance() {
    console.log('🔄 重置用户余额到0...');
    console.log('='.repeat(50));

    const userId = 'user_1754239290136_toqa4uqugas'; // sunwei7482@gmail.com
    const userEmail = 'sunwei7482@gmail.com';

    try {
        // 1. 获取当前用户状态
        console.log('👤 获取当前用户状态...');
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${userId}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user');
        }

        const users = await userResponse.json();
        const user = users[0];
        
        console.log(`✅ 用户: ${user.email}`);
        console.log(`   当前积分: ${user.credits}`);
        console.log(`   订阅状态: ${user.subscription_status}`);

        // 2. 重置用户余额到0
        console.log('\n🔄 重置余额到0...');
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credits: 0,
                subscription_status: 'FREE',
                current_subscription_id: null,
                subscription_credits_remaining: 0,
                subscription_renewal_date: null,
                updated_at: new Date().toISOString()
            })
        });

        if (updateResponse.ok) {
            console.log(`✅ 余额重置成功: ${user.credits} → 0`);
            console.log('✅ 订阅状态重置为: FREE');
        } else {
            const error = await updateResponse.text();
            console.log('❌ 余额重置失败:', error);
            
            if (error.includes('policy') || error.includes('permission')) {
                console.log('\n📝 请在Supabase SQL编辑器中执行以下语句:');
                console.log('='.repeat(50));
                console.log(`UPDATE users SET 
    credits = 0,
    subscription_status = 'FREE',
    current_subscription_id = NULL,
    subscription_credits_remaining = 0,
    subscription_renewal_date = NULL,
    updated_at = NOW()
WHERE uuid = '${userId}';`);
                console.log('='.repeat(50));
            }
            return;
        }

        // 3. 记录重置交易
        console.log('\n💳 记录余额重置交易...');
        const transactionData = {
            user_uuid: userId,
            transaction_type: 'BALANCE_RESET',
            amount: -user.credits,
            balance_after: 0,
            description: '管理员重置余额到0',
            source: 'admin_reset',
            created_at: new Date().toISOString()
        };

        const transResponse = await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(transactionData)
        });

        if (transResponse.ok) {
            console.log('✅ 重置交易记录成功');
        } else {
            const error = await transResponse.text();
            console.log('❌ 重置交易记录失败:', error);
            console.log('   (余额已重置成功，交易记录失败不影响主要功能)');
        }

        console.log('\n🎉 用户余额重置完成！');
        console.log('\n📊 重置结果:');
        console.log(`✅ 用户: ${userEmail}`);
        console.log(`✅ 余额: 0 (已重置)`);
        console.log(`✅ 订阅状态: FREE`);

    } catch (error) {
        console.error('❌ 重置失败:', error);
    }
}

// 运行重置
resetUserBalance().then(() => {
    console.log('\n🔄 请运行以下命令验证重置结果:');
    console.log('node check_payment_simple.js');
    process.exit(0);
}).catch(error => {
    console.error('❌ 重置失败:', error);
    process.exit(1);
});