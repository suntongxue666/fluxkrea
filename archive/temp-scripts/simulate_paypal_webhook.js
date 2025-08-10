// 模拟PayPal Webhook事件并插入测试数据
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// Supabase REST API helper
async function supabaseInsert(table, data) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, error: ${error}`);
    }
    
    return await response.json();
}

async function supabaseUpdate(table, data, filter) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
    
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, error: ${error}`);
    }
    
    return await response.json();
}

async function simulatePayPalWebhook() {
    console.log('🚀 模拟PayPal Webhook事件和数据插入...');
    console.log('='.repeat(50));

    try {
        // 1. 创建测试订阅记录
        console.log('\n📋 创建测试订阅记录...');
        const subscriptionData = {
            paypal_subscription_id: 'I-7ZAPM2VBBJX78',
            plan_name: 'Pro Plan',
            price: 9.99,
            credits_per_month: 1000,
            status: 'ACTIVE',
            user_uuid: 'user_1754239290136_toqa4uqugas', // 使用已存在的用户
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const subscription = await supabaseInsert('subscriptions', subscriptionData);
        console.log('✅ 订阅记录创建成功:', subscription[0]);

        // 2. 创建测试支付记录
        console.log('\n💰 创建测试支付记录...');
        const paymentData = {
            paypal_payment_id: 'PAY-7ZAPM2VBBJX78',
            paypal_order_id: 'ORDER-7ZAPM2VBBJX78',
            amount: 9.99,
            currency: 'USD',
            status: 'COMPLETED',
            credits_awarded: 1000,
            user_uuid: 'user_1754239290136_toqa4uqugas',
            subscription_id: subscription[0].id,
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        const payment = await supabaseInsert('payments', paymentData);
        console.log('✅ 支付记录创建成功:', payment[0]);

        // 3. 更新用户积分和订阅状态
        console.log('\n👤 更新用户积分和订阅状态...');
        const userUpdateData = {
            credits: 1000,
            subscription_status: 'ACTIVE',
            current_subscription_id: subscription[0].id,
            subscription_credits_remaining: 1000,
            updated_at: new Date().toISOString()
        };

        const updatedUser = await supabaseUpdate('users', userUpdateData, 'uuid=eq.user_1754239290136_toqa4uqugas');
        console.log('✅ 用户记录更新成功:', updatedUser[0]);

        // 4. 创建积分交易记录
        console.log('\n💳 创建积分交易记录...');
        const transactionData = {
            user_uuid: 'user_1754239290136_toqa4uqugas',
            transaction_type: 'SUBSCRIPTION_PURCHASE',
            amount: 1000,
            balance_after: 1000,
            description: 'Pro Plan订阅 - 1000积分',
            source: 'paypal_subscription',
            reference_id: payment[0].id,
            created_at: new Date().toISOString()
        };

        const transaction = await supabaseInsert('credit_transactions', transactionData);
        console.log('✅ 积分交易记录创建成功:', transaction[0]);

        // 5. 创建订阅历史记录
        console.log('\n📚 创建订阅历史记录...');
        const historyData = {
            subscription_id: subscription[0].id,
            user_uuid: 'user_1754239290136_toqa4uqugas',
            event_type: 'SUBSCRIPTION_ACTIVATED',
            event_data: JSON.stringify({
                plan: 'Pro Plan',
                credits: 1000,
                amount: 9.99,
                paypal_subscription_id: 'I-7ZAPM2VBBJX78'
            }),
            created_at: new Date().toISOString()
        };

        const history = await supabaseInsert('subscription_history', historyData);
        console.log('✅ 订阅历史记录创建成功:', history[0]);

        console.log('\n🎉 模拟PayPal Webhook事件完成！');
        console.log('\n📊 创建的记录摘要:');
        console.log(`  订阅ID: ${subscription[0].id}`);
        console.log(`  支付ID: ${payment[0].id}`);
        console.log(`  用户UUID: user_1754239290136_toqa4uqugas`);
        console.log(`  积分: 1000`);
        console.log(`  金额: $9.99`);
        console.log(`  状态: ACTIVE`);

    } catch (error) {
        console.error('❌ 模拟过程中发生错误:', error);
    }
}

// 运行模拟
simulatePayPalWebhook().then(() => {
    console.log('\n✨ 模拟完成！现在可以运行 check_payment_simple.js 来验证数据');
    process.exit(0);
}).catch(error => {
    console.error('❌ 模拟失败:', error);
    process.exit(1);
});