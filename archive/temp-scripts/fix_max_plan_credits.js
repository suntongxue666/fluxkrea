// 修正Max Plan积分 - 从1000调整到5000
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function fixMaxPlanCredits() {
    console.log('🔧 修正Max Plan积分...');
    console.log('='.repeat(50));

    const userId = 'user_1754239290136_toqa4uqugas'; // sunwei7482@gmail.com
    const subscriptionId = 'I-684WCFK57KMV'; // 最新的订阅ID
    
    // Max Plan详情
    const maxPlan = {
        name: 'Max Plan',
        credits: 5000,
        price: 19.99,
        planId: 'P-3NJ78684DS796242VNCJBKQQ'
    };

    try {
        console.log('📋 修正信息:');
        console.log(`  用户: sunwei7482@gmail.com`);
        console.log(`  订阅ID: ${subscriptionId}`);
        console.log(`  计划: ${maxPlan.name}`);
        console.log(`  正确积分: ${maxPlan.credits}`);
        console.log(`  当前积分: 1000 (错误)`);

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

        // 2. 更新积分到正确的5000
        console.log('\n🪙 更新积分到5000...');
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credits: maxPlan.credits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
        });

        if (updateResponse.ok) {
            console.log(`✅ 积分修正成功: ${user.credits} → ${maxPlan.credits}`);
        } else {
            const error = await updateResponse.text();
            console.log('❌ 积分修正失败:', error);
            
            if (error.includes('policy') || error.includes('permission')) {
                console.log('\n📝 请在Supabase SQL编辑器中执行以下语句:');
                console.log('='.repeat(50));
                console.log(`UPDATE users SET 
    credits = ${maxPlan.credits},
    subscription_status = 'ACTIVE',
    updated_at = NOW()
WHERE uuid = '${userId}';`);
                console.log('='.repeat(50));
            }
            return;
        }

        // 3. 记录积分修正交易
        console.log('\n💳 记录积分修正交易...');
        const creditDifference = maxPlan.credits - user.credits; // 应该是4000
        
        const transactionData = {
            user_uuid: userId,
            transaction_type: 'SUBSCRIPTION_CORRECTION',
            amount: creditDifference,
            balance_after: maxPlan.credits,
            description: `Max Plan积分修正 - 补充${creditDifference}积分 (总计${maxPlan.credits}积分)`,
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
            console.log(`✅ 积分修正交易记录成功: +${creditDifference}积分`);
        } else {
            const error = await transResponse.text();
            console.log('❌ 积分交易记录失败:', error);
            console.log('   (积分已经修正成功，交易记录失败不影响主要功能)');
        }

        console.log('\n🎉 Max Plan积分修正完成！');
        console.log('\n📊 修正结果:');
        console.log(`✅ 用户: sunwei7482@gmail.com`);
        console.log(`✅ 订阅: Max Plan`);
        console.log(`✅ 积分: ${maxPlan.credits} (已修正)`);
        console.log(`✅ 状态: ACTIVE`);

    } catch (error) {
        console.error('❌ 修正失败:', error);
    }
}

// 运行修正
fixMaxPlanCredits().then(() => {
    console.log('\n🔄 请运行以下命令验证修正结果:');
    console.log('node check_payment_simple.js');
    process.exit(0);
}).catch(error => {
    console.error('❌ 修正失败:', error);
    process.exit(1);
});