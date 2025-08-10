// 激活订阅并发放积分 - 模拟PayPal Webhook
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function activateSubscription(planType = 'pro') {
    console.log('🚀 激活订阅并发放积分...');
    console.log('='.repeat(50));

    const userId = 'user_1754239290136_toqa4uqugas'; // sunwei7482@gmail.com
    const subscriptionId = 'I-' + Date.now(); // 生成新的订阅ID
    
    // 计划详情
    const planDetails = {
        pro: { name: 'Pro Plan', credits: 1000, price: 9.99, planId: 'P-5ML4271244454362WXNWU5NI' },
        max: { name: 'Max Plan', credits: 5000, price: 19.99, planId: 'P-3NJ78684DS796242VNCJBKQQ' }
    };

    const plan = planDetails[planType];

    try {
        console.log('📋 激活信息:');
        console.log(`  用户: sunwei7482@gmail.com`);
        console.log(`  订阅ID: ${subscriptionId}`);
        console.log(`  计划: ${plan.name}`);
        console.log(`  积分: ${plan.credits}`);
        console.log(`  价格: $${plan.price}`);

        // 1. 获取当前用户状态
        console.log('\n👤 获取当前用户状态...');
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
        
        console.log(`✅ 当前积分: ${user.credits}`);
        console.log(`✅ 当前状态: ${user.subscription_status}`);

        // 2. 更新用户积分和订阅状态
        console.log('\n🪙 发放积分并激活订阅...');
        const newCredits = (user.credits || 0) + plan.credits;
        
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
                subscription_credits_remaining: plan.credits,
                subscription_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (updateResponse.ok) {
            console.log(`✅ 积分发放成功: ${user.credits} → ${newCredits}`);
            console.log('✅ 订阅状态激活: FREE → ACTIVE');
        } else {
            const error = await updateResponse.text();
            console.log('❌ 积分发放失败:', error);
            
            if (error.includes('policy') || error.includes('permission')) {
                console.log('\n📝 请在Supabase SQL编辑器中执行以下语句:');
                console.log('='.repeat(50));
                console.log(`UPDATE users SET 
    credits = ${newCredits},
    subscription_status = 'ACTIVE',
    subscription_credits_remaining = ${plan.credits},
    subscription_renewal_date = NOW() + INTERVAL '30 days',
    updated_at = NOW()
WHERE uuid = '${userId}';`);
                console.log('='.repeat(50));
            }
            return;
        }

        // 3. 记录积分交易
        console.log('\n💳 记录积分交易...');
        const transactionData = {
            user_uuid: userId,
            transaction_type: 'SUBSCRIPTION_PURCHASE',
            amount: plan.credits,
            balance_after: newCredits,
            description: `${plan.name}订阅激活 - 获得${plan.credits}积分`,
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
            const transaction = await transResponse.json();
            console.log(`✅ 积分交易记录成功: +${plan.credits}积分`);
        } else {
            const error = await transResponse.text();
            console.log('❌ 积分交易记录失败:', error);
            console.log('   (积分已发放成功，交易记录失败不影响主要功能)');
        }

        console.log('\n🎉 订阅激活完成！');
        console.log('\n📊 激活结果:');
        console.log(`✅ 用户: sunwei7482@gmail.com`);
        console.log(`✅ 订阅: ${plan.name}`);
        console.log(`✅ 积分: ${newCredits} (+${plan.credits})`);
        console.log(`✅ 状态: ACTIVE`);

    } catch (error) {
        console.error('❌ 激活失败:', error);
    }
}

// 从命令行参数获取计划类型
const planType = process.argv[2] || 'pro';

if (!['pro', 'max'].includes(planType)) {
    console.error('❌ 无效的计划类型。请使用: pro 或 max');
    console.log('用法: node activate_subscription.js [pro|max]');
    process.exit(1);
}

// 运行激活
activateSubscription(planType).then(() => {
    console.log('\n🔄 请运行以下命令验证激活结果:');
    console.log('node check_payment_simple.js');
    process.exit(0);
}).catch(error => {
    console.error('❌ 激活失败:', error);
    process.exit(1);
});