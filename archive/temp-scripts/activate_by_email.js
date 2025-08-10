// 基于邮箱激活Max Plan订阅
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function activateByEmail() {
    console.log('🚀 基于邮箱激活Max Plan订阅...');
    console.log('='.repeat(50));

    const userEmail = 'sunwei7482@gmail.com';
    const subscriptionId = 'I-Y21YW3WN78JX'; // 最新的订阅ID
    
    const maxPlan = {
        name: 'Max Plan',
        credits: 5000, // Max Plan是5000积分
        price: 19.99,
        planId: 'P-3NJ78684DS796242VNCJBKQQ'
    };

    try {
        console.log('📋 激活信息:');
        console.log(`  邮箱: ${userEmail}`);
        console.log(`  订阅ID: ${subscriptionId}`);
        console.log(`  计划: ${maxPlan.name}`);
        console.log(`  积分: ${maxPlan.credits}`);

        // 1. 查找该邮箱的所有用户记录，按最后活跃时间排序
        console.log('\n👤 查找用户记录...');
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${userEmail}&select=*&order=last_seen_at.desc.nullslast,updated_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch users');
        }

        const users = await userResponse.json();
        
        if (users.length === 0) {
            throw new Error('未找到该邮箱的用户记录');
        }

        console.log(`✅ 找到 ${users.length} 个用户记录`);
        
        // 找到最活跃的用户（最近登录的）
        let activeUser = null;
        for (const user of users) {
            console.log(`  - UUID: ${user.uuid}, 积分: ${user.credits}, 状态: ${user.subscription_status}, 最后活跃: ${user.last_seen_at || '未知'}`);
            
            if (user.is_signed_in && user.last_seen_at) {
                activeUser = user;
                break; // 找到第一个已登录且有活跃时间的用户
            }
        }

        // 如果没找到已登录的用户，使用最新更新的用户
        if (!activeUser) {
            activeUser = users[0];
            console.log('⚠️  未找到已登录用户，使用最新记录');
        }

        console.log(`\n🎯 选择用户: ${activeUser.uuid}`);
        console.log(`   当前积分: ${activeUser.credits}`);
        console.log(`   当前状态: ${activeUser.subscription_status}`);

        // 2. 更新用户积分和订阅状态
        console.log('\n🪙 激活Max Plan订阅...');
        const newCredits = (activeUser.credits || 0) + maxPlan.credits;
        
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
                subscription_credits_remaining: maxPlan.credits,
                subscription_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (updateResponse.ok) {
            console.log(`✅ Max Plan激活成功: ${activeUser.credits} → ${newCredits}`);
            console.log('✅ 订阅状态: → ACTIVE');
            console.log('✅ 订阅积分: 5000');
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

        // 4. 清理其他同邮箱用户的积分（避免重复）
        console.log('\n🧹 清理其他用户记录的积分...');
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

        console.log('\n🎉 Max Plan订阅激活完成！');
        console.log('\n📊 激活结果:');
        console.log(`✅ 邮箱: ${userEmail}`);
        console.log(`✅ 活跃用户UUID: ${activeUser.uuid}`);
        console.log(`✅ 订阅: Max Plan`);
        console.log(`✅ 积分: ${newCredits} (+${maxPlan.credits})`);
        console.log(`✅ 状态: ACTIVE`);

    } catch (error) {
        console.error('❌ 激活失败:', error);
    }
}

activateByEmail().then(() => {
    console.log('\n🔄 请刷新页面查看积分更新');
    console.log('积分应该显示为5000，状态为ACTIVE');
    process.exit(0);
}).catch(error => {
    console.error('❌ 激活失败:', error);
    process.exit(1);
});