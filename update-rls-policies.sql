-- 更新RLS策略，确保数据能成功写入数据库
-- 在 Supabase SQL Editor 中执行

-- 1. 临时禁用所有表的RLS，方便调试
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;

-- 2. 删除现有的所有RLS策略
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Allow webhook access" ON webhook_events;

-- 3. 重新启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- 4. 删除可能存在的宽松策略
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on credit_transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Allow all operations on user_subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Allow all operations on webhook_events" ON webhook_events;

-- 5. 创建更宽松的RLS策略 - users表
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- 6. 创建更宽松的RLS策略 - credit_transactions表
CREATE POLICY "Allow all operations on credit_transactions" ON credit_transactions
    FOR ALL USING (true) WITH CHECK (true);

-- 7. 创建更宽松的RLS策略 - user_subscriptions表
CREATE POLICY "Allow all operations on user_subscriptions" ON user_subscriptions
    FOR ALL USING (true) WITH CHECK (true);

-- 8. 创建更宽松的RLS策略 - webhook_events表
CREATE POLICY "Allow all operations on webhook_events" ON webhook_events
    FOR ALL USING (true) WITH CHECK (true);

-- 9. 验证策略创建
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'credit_transactions', 'user_subscriptions', 'webhook_events');

-- 10. 测试插入数据
-- 测试用户插入
INSERT INTO users (
    uuid, 
    google_id, 
    email, 
    name, 
    credits, 
    subscription_status,
    is_signed_in
) VALUES (
    'test_rls_' || extract(epoch from now()),
    'google_test_rls',
    'test_rls@example.com',
    'Test RLS User',
    20,
    'FREE',
    true
) ON CONFLICT (uuid) DO NOTHING;

-- 测试积分交易插入
INSERT INTO credit_transactions (
    user_uuid,
    transaction_type,
    amount,
    balance_after,
    description,
    source
) VALUES (
    'test_rls_' || extract(epoch from now()),
    'EARN',
    20,
    20,
    '首次登录奖励测试',
    'first_login_bonus'
);

-- 11. 清理测试数据
DELETE FROM credit_transactions WHERE description = '首次登录奖励测试';
DELETE FROM users WHERE email = 'test_rls@example.com';

-- 12. 验证函数权限
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('set_user_context', 'get_current_user_uuid', 'add_credit_transaction');

SELECT 'RLS policies updated successfully! All tables now allow full access for testing.' as status;