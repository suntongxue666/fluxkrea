-- 快速修复RLS策略 - 简单粗暴的方法
-- 在 Supabase SQL Editor 中执行

-- 1. 完全禁用所有表的RLS（用于测试）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;

-- 2. 测试插入数据
-- 先删除可能存在的测试数据
DELETE FROM users WHERE uuid = 'test_quick_fix';

INSERT INTO users (
    uuid, 
    google_id, 
    email, 
    name, 
    credits, 
    subscription_status,
    is_signed_in
) VALUES (
    'test_quick_fix',
    'google_quick_fix',
    'quickfix@example.com',
    'Quick Fix Test',
    20,
    'FREE',
    true
);

-- 3. 测试积分交易插入
INSERT INTO credit_transactions (
    user_uuid,
    transaction_type,
    amount,
    balance_after,
    description,
    source
) VALUES (
    'test_quick_fix',
    'EARN',
    20,
    20,
    '快速修复测试',
    'test'
);

-- 4. 验证插入成功
SELECT 'users' as table_name, COUNT(*) as records FROM users WHERE uuid = 'test_quick_fix'
UNION ALL
SELECT 'credit_transactions', COUNT(*) FROM credit_transactions WHERE user_uuid = 'test_quick_fix';

-- 5. 清理测试数据
DELETE FROM credit_transactions WHERE user_uuid = 'test_quick_fix';
DELETE FROM users WHERE uuid = 'test_quick_fix';

SELECT 'RLS disabled successfully! Database is ready for testing.' as status;