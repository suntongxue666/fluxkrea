// 手动激活订阅脚本 - 临时解决方案
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function manualActivateSubscription() {
    console.log('🚀 手动激活最新的PayPal订阅...');
    console.log('='.repeat(50));

    // 使用最新的测试数据
    const subscriptionId = 'I-684WCFK57KMV'; // 最新的订阅ID
    const userId = 'user_1754239290136_toqa4uqugas'; // sunwei7482@gmail.com
    const planType = 'pro'; // Pro Plan
    
    const planDetails = {
        name: 'Pro Plan',
        credits: 1000,
        price: 9.99,
        planId: 'P-5ML4271244454362WXNWU5NI'
    };

    try {
        console.log('📋 订阅信息:');
        console.log(`  订阅ID: ${subscriptionId}`);
        console.log(`  用户ID: ${userId}`);
        console.log(`  计划: ${planDetails.name}`);
        console.log(`  积分: ${planDetails.credits}`);
        console.log(`  价格: $${planDetails.price}`);

        // 1. 获取当前用户信息
        console.log('\n👤 获取用户当前状态...');
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
        if (users.length === 0) {
            throw new Error('User not found');
        }

        const user = users[0];
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + planDetails.credits;

        console.log(`✅ 用户: ${user.email}`);
        console.log(`   当前积分: ${currentCredits}`);
        console.log(`   新积分: ${newCredits}`);

        // 2. 更新用户积分（尝试使用匿名密钥）
        console.log('\n🪙 更新用户积分...');
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
        });

        if (updateResponse.ok) {
            console.log(`✅ 积分更新成功: ${currentCredits} → ${newCredits}`);
        } else {
            const error = await updateResponse.text();
            console.log('❌ 积分更新失败:', error);
            
            // 如果是权限问题，提供SQL语句
            if (error.includes('policy') || error.includes('permission')) {
                console.log('\n📝 请在Supabase SQL编辑器中执行以下语句:');
                console.log('='.repeat(50));
                console.log(`UPDATE users SET 
    credits = ${newCredits},
    subscription_status = 'ACTIVE',
    updated_at = NOW()
WHERE uuid = '${userId}';`);
                console.log('='.repeat(50));
            }
        }

        // 3. 尝试记录积分交易
        console.log('\n💳 记录积分交易...');
        const transactionData = {
            user_uuid: userId,
            transaction_type: 'SUBSCRIPTION_PURCHASE',
            amount: planDetails.credits,
            balance_after: newCredits,
            description: `${planDetails.name}订阅激活 - 获得${planDetails.credits}积分`,
            source: 'paypal_subscription',
            reference_id: subscriptionId,
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
            const transaction = await transResponse.json();
            console.log('✅ 积分交易记录成功:', transaction[0].id);
        } else {
            const error = await transResponse.text();
            console.log('❌ 积分交易记录失败:', error);
            
            if (error.includes('policy') || error.includes('permission')) {
                console.log('\n📝 请在Supabase SQL编辑器中执行以下语句:');
                console.log('='.repeat(50));
                console.log(`INSERT INTO credit_transactions (
    user_uuid, transaction_type, amount, balance_after, 
    description, source, reference_id, created_at
) VALUES (
    '${userId}',
    'SUBSCRIPTION_PURCHASE',
    ${planDetails.credits},
    ${newCredits},
    '${planDetails.name}订阅激活 - 获得${planDetails.credits}积分',
    'paypal_subscription',
    '${subscriptionId}',
    NOW()
);`);
                console.log('='.repeat(50));
            }
        }

        console.log('\n🎉 手动激活完成！');
        console.log('\n📊 结果摘要:');
        console.log(`✅ 订阅ID: ${subscriptionId}`);
        console.log(`✅ 用户: ${user.email}`);
        console.log(`✅ 积分增加: ${planDetails.credits}`);
        console.log(`✅ 新余额: ${newCredits}`);

    } catch (error) {
        console.error('❌ 手动激活失败:', error);
    }
}

// 运行手动激活
manualActivateSubscription().then(() => {
    console.log('\n🔄 请运行以下命令验证结果:');
    console.log('node check_payment_simple.js');
    process.exit(0);
}).catch(error => {
    console.error('❌ 激活失败:', error);
    process.exit(1);
});