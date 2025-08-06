// 激活订单 I-WK6UTE0104DU 的积分
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function activateOrder() {
    console.log('🚀 激活订单 I-WK6UTE0104DU 的积分...');
    console.log('='.repeat(50));

    const orderId = 'I-WK6UTE0104DU';
    const userEmail = 'sunwei7482@gmail.com';
    
    // 假设是Max Plan，如果是Pro Plan请修改
    const planDetails = {
        name: 'Max Plan',
        credits: 5000,
        price: 19.99,
        planId: 'P-3NJ78684DS796242VNCJBKQQ'
    };

    try {
        console.log('📋 激活信息:');
        console.log(`  订单ID: ${orderId}`);
        console.log(`  邮箱: ${userEmail}`);
        console.log(`  计划: ${planDetails.name}`);
        console.log(`  积分: ${planDetails.credits}`);

        // 1. 查找该邮箱的活跃用户
        console.log('\n👤 查找活跃用户...');
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${userEmail}&select=*&order=last_seen_at.desc.nullslast,updated_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const users = await userResponse.json();
        
        if (users.length === 0) {
            throw new Error('未找到该邮箱的用户记录');
        }

        // 选择最活跃的用户
        const activeUser = users[0];
        console.log(`✅ 选择用户: ${activeUser.uuid}`);
        console.log(`   当前积分: ${activeUser.credits}`);
        console.log(`   当前状态: ${activeUser.subscription_status}`);

        // 2. 为用户激活订阅积分
        console.log('\n🪙 激活订阅积分...');
        const newCredits = (activeUser.credits || 0) + planDetails.credits;
        
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${activeUser.uuid}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                subscription_credits_remaining: planDetails.credits,
                subscription_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (updateResponse.ok) {
            console.log(`✅ 积分激活成功: ${activeUser.credits} → ${newCredits}`);
            console.log('✅ 订阅状态: → ACTIVE');
        } else {
            const error = await updateResponse.text();
            console.log('❌ 激活失败:', error);
            return;
        }

        // 3. 记录积分交易
        console.log('\n💳 记录积分交易...');
        const transactionData = {
            user_uuid: activeUser.uuid,
            transaction_type: 'SUBSCRIPTION_PURCHASE',
            amount: planDetails.credits,
            balance_after: newCredits,
            description: `订单${orderId} - ${planDetails.name}激活，获得${planDetails.credits}积分`,
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
            console.log(`✅ 积分交易记录成功: +${planDetails.credits}积分`);
        } else {
            const error = await transResponse.text();
            console.log('❌ 积分交易记录失败:', error);
            console.log('   (积分已激活成功，交易记录失败不影响主要功能)');
        }

        // 4. 清理其他同邮箱用户的积分（避免重复）
        console.log('\n🧹 清理其他用户记录...');
        for (const user of users) {
            if (user.uuid !== activeUser.uuid && user.credits > 0) {
                console.log(`  清理用户 ${user.uuid} 的积分: ${user.credits} → 0`);
                
                await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${user.uuid}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        credits: 0,
                        subscription_status: 'FREE',
                        subscription_credits_remaining: 0,
                        updated_at: new Date().toISOString()
                    })
                });
            }
        }

        console.log('\n🎉 订单积分激活完成！');
        console.log('\n📊 激活结果:');
        console.log(`✅ 订单: ${orderId}`);
        console.log(`✅ 邮箱: ${userEmail}`);
        console.log(`✅ 用户UUID: ${activeUser.uuid}`);
        console.log(`✅ 计划: ${planDetails.name}`);
        console.log(`✅ 积分: ${newCredits} (+${planDetails.credits})`);
        console.log(`✅ 状态: ACTIVE`);

    } catch (error) {
        console.error('❌ 激活失败:', error);
    }
}

activateOrder().then(() => {
    console.log('\n🔄 请刷新页面查看积分更新');
    console.log('或运行: node check_order_credits.js 验证结果');
    process.exit(0);
}).catch(error => {
    console.error('❌ 激活失败:', error);
    process.exit(1);
});