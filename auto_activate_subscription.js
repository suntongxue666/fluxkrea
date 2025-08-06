// 自动激活订阅的核心业务逻辑
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// 计划详情映射
const PLAN_DETAILS = {
    'P-5ML4271244454362WXNWU5NI': { name: 'Pro Plan', credits: 1000, price: 9.99 },
    'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000, price: 19.99 }
};

/**
 * 自动激活订阅的核心函数
 * @param {string} subscriptionId - PayPal订阅ID
 * @param {string} planId - PayPal计划ID
 * @param {string} userIdentifier - 用户标识（邮箱或UUID）
 */
async function autoActivateSubscription(subscriptionId, planId, userIdentifier) {
    console.log('🚀 自动激活订阅...');
    console.log(`  订阅ID: ${subscriptionId}`);
    console.log(`  计划ID: ${planId}`);
    console.log(`  用户标识: ${userIdentifier}`);

    try {
        // 1. 获取计划详情
        const planDetails = PLAN_DETAILS[planId];
        if (!planDetails) {
            throw new Error(`未知的计划ID: ${planId}`);
        }

        console.log(`  计划: ${planDetails.name}`);
        console.log(`  积分: ${planDetails.credits}`);

        // 2. 查找用户记录
        let user = null;
        
        // 如果用户标识是邮箱格式
        if (userIdentifier.includes('@')) {
            console.log('📧 基于邮箱查找用户...');
            const emailResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${userIdentifier}&select=*&order=last_seen_at.desc.nullslast,updated_at.desc&limit=1`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

            const emailUsers = await emailResponse.json();
            if (emailUsers.length > 0) {
                user = emailUsers[0];
                console.log(`✅ 通过邮箱找到用户: ${user.uuid}`);
            }
        } else {
            // 如果用户标识是UUID格式
            console.log('🆔 基于UUID查找用户...');
            const uuidResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${userIdentifier}&select=*`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

            const uuidUsers = await uuidResponse.json();
            if (uuidUsers.length > 0) {
                user = uuidUsers[0];
                console.log(`✅ 通过UUID找到用户: ${user.uuid}`);
            }
        }

        if (!user) {
            throw new Error(`未找到用户: ${userIdentifier}`);
        }

        // 3. 检查是否已经激活过
        const existingSubResponse = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?paypal_subscription_id=eq.${subscriptionId}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const existingSubs = await existingSubResponse.json();
        if (existingSubs.length > 0) {
            console.log('⚠️  订阅已存在，跳过重复激活');
            return { success: true, message: '订阅已存在' };
        }

        // 4. 激活订阅积分
        console.log('🪙 激活订阅积分...');
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + planDetails.credits;

        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${user.uuid}`, {
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

        if (!updateResponse.ok) {
            const error = await updateResponse.text();
            throw new Error(`更新用户积分失败: ${error}`);
        }

        console.log(`✅ 积分更新成功: ${currentCredits} → ${newCredits}`);

        // 5. 记录积分交易
        console.log('💳 记录积分交易...');
        const transactionData = {
            user_uuid: user.uuid,
            transaction_type: 'SUBSCRIPTION_PURCHASE',
            amount: planDetails.credits,
            balance_after: newCredits,
            description: `${planDetails.name}订阅激活 - 获得${planDetails.credits}积分`,
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
            console.log('✅ 积分交易记录成功');
        } else {
            console.log('⚠️  积分交易记录失败，但积分已发放');
        }

        // 6. 保存订阅记录（用于防重复）
        console.log('📋 保存订阅记录...');
        const subscriptionData = {
            user_uuid: user.uuid,
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
            console.log('✅ 订阅记录保存成功');
        } else {
            console.log('⚠️  订阅记录保存失败，但积分已发放');
        }

        console.log('\n🎉 订阅自动激活完成！');
        console.log(`✅ 用户: ${user.email || user.uuid}`);
        console.log(`✅ 计划: ${planDetails.name}`);
        console.log(`✅ 积分: ${newCredits} (+${planDetails.credits})`);
        console.log(`✅ 状态: ACTIVE`);

        return {
            success: true,
            message: '订阅激活成功',
            user_id: user.uuid,
            credits_added: planDetails.credits,
            new_balance: newCredits
        };

    } catch (error) {
        console.error('❌ 自动激活失败:', error);
        return {
            success: false,
            message: error.message,
            subscription_id: subscriptionId
        };
    }
}

// 如果直接运行此脚本，激活指定订阅
if (require.main === module) {
    const subscriptionId = process.argv[2] || 'I-WK6UTE0104DU';
    const planId = process.argv[3] || 'P-3NJ78684DS796242VNCJBKQQ'; // 默认Max Plan
    const userIdentifier = process.argv[4] || 'sunwei7482@gmail.com';

    autoActivateSubscription(subscriptionId, planId, userIdentifier).then((result) => {
        if (result.success) {
            console.log('\n✨ 激活成功！');
        } else {
            console.log('\n❌ 激活失败:', result.message);
        }
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { autoActivateSubscription };