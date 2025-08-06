// 为当前活跃用户激活Max Plan订阅
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function activateCurrentUser() {
    console.log('🚀 为当前活跃用户激活Max Plan订阅...');
    console.log('='.repeat(50));

    const currentUserId = 'user_1754255481243_makadnmmc6p'; // 当前活跃用户
    const subscriptionId = 'I-Y21YW3WN78JX'; // 最新的订阅ID
    
    const maxPlan = {
        name: 'Max Plan',
        credits: 5000, // Max Plan是5000积分
        price: 19.99,
        planId: 'P-3NJ78684DS796242VNCJBKQQ'
    };

    try {
        console.log('📋 激活信息:');
        console.log(`  用户UUID: ${currentUserId}`);
        console.log(`  邮箱: sunwei7482@gmail.com`);
        console.log(`  订阅ID: ${subscriptionId}`);
        console.log(`  计划: ${maxPlan.name}`);
        console.log(`  积分: ${maxPlan.credits}`);

        // 1. 获取当前用户状态
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${currentUserId}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const users = await userResponse.json();
        const user = users[0];
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + maxPlan.credits;
        
        console.log(`✅ 当前积分: ${currentCredits}`);
        console.log(`✅ 新积分: ${newCredits}`);

        // 2. 更新用户积分和订阅状态
        console.log('\n🪙 激活Max Plan订阅...');
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${currentUserId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                subscription_credits_remaining: maxPlan.credits,
                subscription_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (updateResponse.ok) {
            console.log(`✅ Max Plan激活成功: ${currentCredits} → ${newCredits}`);
            console.log('✅ 订阅状态: FREE → ACTIVE');
            console.log('✅ 订阅积分: 5000');
        } else {
            const error = await updateResponse.text();
            console.log('❌ 激活失败:', error);
            return;
        }

        // 3. 记录积分交易
        console.log('\n💳 记录积分交易...');
        const transactionData = {
            user_uuid: currentUserId,
            transaction_type: 'SUBSCRIPTION_PURCHASE',
            amount: maxPlan.credits,
            balance_after: newCredits,
            description: `${maxPlan.name}订阅激活 - 获得${maxPlan.credits}积分`,
            source: 'paypal_subscription',
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
            console.log(`✅ 积分交易记录成功: +${maxPlan.credits}积分`);
        } else {
            const error = await transResponse.text();
            console.log('❌ 积分交易记录失败:', error);
            console.log('   (积分已激活成功，交易记录失败不影响主要功能)');
        }

        console.log('\n🎉 Max Plan订阅激活完成！');
        console.log('\n📊 激活结果:');
        console.log(`✅ 用户: sunwei7482@gmail.com`);
        console.log(`✅ UUID: ${currentUserId}`);
        console.log(`✅ 订阅: Max Plan`);
        console.log(`✅ 积分: ${newCredits} (+${maxPlan.credits})`);
        console.log(`✅ 状态: ACTIVE`);

    } catch (error) {
        console.error('❌ 激活失败:', error);
    }
}

activateCurrentUser().then(() => {
    console.log('\n🔄 请刷新页面查看积分更新');
    console.log('或运行: node check_current_user.js 验证结果');
    process.exit(0);
}).catch(error => {
    console.error('❌ 激活失败:', error);
    process.exit(1);
});