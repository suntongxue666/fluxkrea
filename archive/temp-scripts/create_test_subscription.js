// 创建测试订阅数据（使用服务角色）
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
// 注意：这里需要使用服务角色密钥，而不是匿名密钥
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIwNjY1MSwiZXhwIjoyMDY5NzgyNjUxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

// 如果没有服务角色密钥，我们直接使用SQL插入
async function createTestData() {
    console.log('🚀 创建测试订阅数据...');
    console.log('='.repeat(50));

    // 由于权限限制，我们直接输出SQL语句供手动执行
    const testUserUuid = 'user_1754239290136_toqa4uqugas';
    const subscriptionId = 'I-7ZAPM2VBBJX78';
    const paymentId = 'PAY-7ZAPM2VBBJX78';
    const orderId = 'ORDER-7ZAPM2VBBJX78';

    console.log('\n📋 请在Supabase SQL编辑器中执行以下SQL语句:');
    console.log('='.repeat(50));

    const sqlStatements = `
-- 1. 插入测试订阅记录
INSERT INTO subscriptions (
    user_uuid, 
    paypal_subscription_id, 
    paypal_plan_id,
    plan_name, 
    status, 
    credits_per_month, 
    price, 
    currency,
    billing_cycle,
    start_date,
    next_billing_date,
    created_at, 
    updated_at
) VALUES (
    '${testUserUuid}',
    '${subscriptionId}',
    'P-5ML4271244454362WXNWU5NI',
    'Pro Plan',
    'ACTIVE',
    1000,
    9.99,
    'USD',
    'monthly',
    NOW(),
    NOW() + INTERVAL '1 month',
    NOW(),
    NOW()
) ON CONFLICT (paypal_subscription_id) DO NOTHING;

-- 2. 插入测试支付记录
INSERT INTO payments (
    user_uuid,
    subscription_id,
    paypal_payment_id,
    paypal_order_id,
    amount,
    currency,
    status,
    credits_awarded,
    paid_at,
    created_at,
    updated_at
) VALUES (
    '${testUserUuid}',
    (SELECT id FROM subscriptions WHERE paypal_subscription_id = '${subscriptionId}'),
    '${paymentId}',
    '${orderId}',
    9.99,
    'USD',
    'COMPLETED',
    1000,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (paypal_payment_id) DO NOTHING;

-- 3. 更新用户积分和订阅状态
UPDATE users SET 
    credits = 1000,
    subscription_status = 'ACTIVE',
    current_subscription_id = (SELECT id FROM subscriptions WHERE paypal_subscription_id = '${subscriptionId}'),
    subscription_credits_remaining = 1000,
    subscription_renewal_date = NOW() + INTERVAL '1 month',
    updated_at = NOW()
WHERE uuid = '${testUserUuid}';

-- 4. 插入积分交易记录
INSERT INTO credit_transactions (
    user_uuid,
    transaction_type,
    amount,
    balance_after,
    description,
    source,
    reference_id,
    subscription_id,
    payment_id,
    created_at
) VALUES (
    '${testUserUuid}',
    'SUBSCRIPTION_PURCHASE',
    1000,
    1000,
    'Pro Plan订阅激活 - 获得1000积分',
    'paypal_subscription',
    '${paymentId}',
    (SELECT id FROM subscriptions WHERE paypal_subscription_id = '${subscriptionId}'),
    (SELECT id FROM payments WHERE paypal_payment_id = '${paymentId}'),
    NOW()
);

-- 5. 插入订阅历史记录
INSERT INTO subscription_history (
    subscription_id,
    user_id,
    action,
    old_status,
    new_status,
    reason,
    paypal_event_id,
    metadata,
    created_at
) VALUES (
    (SELECT id FROM subscriptions WHERE paypal_subscription_id = '${subscriptionId}'),
    (SELECT id FROM users WHERE uuid = '${testUserUuid}'),
    'ACTIVATED',
    'PENDING',
    'ACTIVE',
    'PayPal订阅激活',
    'evt_test_webhook',
    '{"plan": "Pro Plan", "credits": 1000, "amount": 9.99, "paypal_subscription_id": "${subscriptionId}"}',
    NOW()
);

-- 6. 验证插入的数据
SELECT 'Subscription' as table_name, COUNT(*) as count FROM subscriptions WHERE paypal_subscription_id = '${subscriptionId}'
UNION ALL
SELECT 'Payment' as table_name, COUNT(*) as count FROM payments WHERE paypal_payment_id = '${paymentId}'
UNION ALL
SELECT 'User Updated' as table_name, COUNT(*) as count FROM users WHERE uuid = '${testUserUuid}' AND subscription_status = 'ACTIVE'
UNION ALL
SELECT 'Credit Transaction' as table_name, COUNT(*) as count FROM credit_transactions WHERE reference_id = '${paymentId}'
UNION ALL
SELECT 'Subscription History' as table_name, COUNT(*) as count FROM subscription_history WHERE paypal_event_id = 'evt_test_webhook';
`;

    console.log(sqlStatements);
    console.log('\n='.repeat(50));
    console.log('📝 执行步骤:');
    console.log('1. 登录到 Supabase Dashboard');
    console.log('2. 进入 SQL Editor');
    console.log('3. 复制粘贴上面的SQL语句');
    console.log('4. 点击 Run 执行');
    console.log('5. 运行 node check_payment_simple.js 验证数据');

    console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project/gdcjvqaqgvcxzufmessy');
    console.log('🔗 SQL Editor: https://supabase.com/dashboard/project/gdcjvqaqgvcxzufmessy/sql');

    // 同时创建一个简化的验证脚本
    console.log('\n📊 或者，运行以下命令来验证现有数据:');
    console.log('node check_payment_simple.js');
}

createTestData().then(() => {
    console.log('\n✨ 测试数据SQL生成完成！');
}).catch(error => {
    console.error('❌ 生成失败:', error);
});