// 模拟PayPal Webhook事件测试
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// 模拟PayPal订阅激活事件
async function simulateSubscriptionActivation() {
    console.log('🚀 模拟PayPal订阅激活事件...');
    console.log('='.repeat(50));

    // 使用真实的订阅ID
    const subscriptionId = 'I-684WCFK57KMV'; // 你最新的测试订阅ID
    const userId = 'user_1754239290136_toqa4uqugas'; // 使用已存在的用户
    const planId = 'P-5ML4271244454362WXNWU5NI'; // Pro Plan

    const planDetails = {
        name: 'Pro Plan',
        credits: 1000,
        price: 9.99
    };

    try {
        console.log('📋 订阅信息:');
        console.log(`  订阅ID: ${subscriptionId}`);
        console.log(`  用户ID: ${userId}`);
        console.log(`  计划: ${planDetails.name}`);
        console.log(`  积分: ${planDetails.credits}`);
        console.log(`  价格: $${planDetails.price}`);

        // 1. 检查用户是否存在
        console.log('\n👤 检查用户...');
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
        console.log(`✅ 用户找到: ${user.email || '未设置邮箱'}`);
        console.log(`   当前积分: ${user.credits || 0}`);

        // 2. 保存订阅记录（使用匿名密钥可能会失败，但我们试试）
        console.log('\n💳 保存订阅记录...');
        const subscriptionData = {
            user_uuid: userId,
            paypal_subscription_id: subscriptionId,
            paypal_plan_id: planId,
            plan_name: planDetails.name,
            status: 'ACTIVE',
            credits_per_month: planDetails.credits,
            price: planDetails.price,
            currency: 'USD',
            billing_cycle: 'monthly',
            start_date: new Date().toISOString(),
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const subResponse = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(subscriptionData)
        });

        if (subResponse.ok) {
            const subscription = await subResponse.json();
            console.log('✅ 订阅记录保存成功:', subscription[0].id);
        } else {
            const error = await subResponse.text();
            console.log('❌ 订阅记录保存失败:', error);
            console.log('   这是预期的，因为需要服务角色权限');
        }

        // 3. 尝试更新用户积分（也可能失败）
        console.log('\n🪙 更新用户积分...');
        const newCredits = (user.credits || 0) + planDetails.credits;
        
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
            console.log(`✅ 用户积分更新成功: ${user.credits || 0} → ${newCredits}`);
        } else {
            const error = await updateResponse.text();
            console.log('❌ 用户积分更新失败:', error);
            console.log('   这也是预期的，因为需要服务角色权限');
        }

        console.log('\n📝 总结:');
        console.log('✅ 用户验证成功');
        console.log('⚠️  数据库操作需要服务角色权限');
        console.log('💡 解决方案: 配置PayPal Webhook指向服务端API');

    } catch (error) {
        console.error('❌ 模拟过程中发生错误:', error);
    }
}

// 运行模拟
simulateSubscriptionActivation().then(() => {
    console.log('\n🎉 模拟完成！');
    console.log('\n📋 下一步行动:');
    console.log('1. 配置PayPal Webhook URL指向你的服务端');
    console.log('2. 使用服务角色密钥处理Webhook事件');
    console.log('3. 在Webhook中处理积分发放逻辑');
    process.exit(0);
}).catch(error => {
    console.error('❌ 模拟失败:', error);
    process.exit(1);
});