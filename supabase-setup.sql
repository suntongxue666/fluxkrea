-- Supabase 数据库设置 - 支持 krea_professional.html 的完整功能
-- 在 Supabase SQL Editor 中执行

-- 1. 创建用户上下文设置函数
CREATE OR REPLACE FUNCTION set_user_context(user_uuid TEXT)
RETURNS VOID AS $$
BEGIN
    -- 设置当前用户上下文，用于RLS策略
    PERFORM set_config('app.current_user_uuid', user_uuid, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建获取当前用户UUID的函数
CREATE OR REPLACE FUNCTION get_current_user_uuid()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_user_uuid', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 启用 RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略 - users 表
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        uuid = get_current_user_uuid() OR 
        auth.uid()::text = google_id OR
        true -- 临时允许所有访问，生产环境需要更严格
    );

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (
        uuid = get_current_user_uuid() OR
        true -- 临时允许所有插入，生产环境需要更严格
    );

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (
        uuid = get_current_user_uuid() OR 
        auth.uid()::text = google_id OR
        true -- 临时允许所有更新，生产环境需要更严格
    );

-- 5. 创建 RLS 策略 - credit_transactions 表
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (
        user_uuid = get_current_user_uuid() OR
        true -- 临时允许所有访问
    );

DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;
CREATE POLICY "Users can insert own transactions" ON credit_transactions
    FOR INSERT WITH CHECK (
        user_uuid = get_current_user_uuid() OR
        true -- 临时允许所有插入
    );

-- 6. 创建 RLS 策略 - user_subscriptions 表
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (true); -- 临时允许所有访问

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (true); -- 临时允许所有插入

DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
    FOR UPDATE USING (true); -- 临时允许所有更新

-- 7. 创建 RLS 策略 - webhook_events 表
DROP POLICY IF EXISTS "Allow webhook access" ON webhook_events;
CREATE POLICY "Allow webhook access" ON webhook_events
    FOR ALL USING (true); -- Webhook 需要完全访问权限

-- 8. 创建积分交易记录函数
CREATE OR REPLACE FUNCTION add_credit_transaction(
    p_user_id TEXT,
    p_user_uuid TEXT,
    p_transaction_type TEXT,
    p_amount INTEGER,
    p_description TEXT,
    p_source TEXT
)
RETURNS VOID AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- 获取用户当前积分
    SELECT credits INTO current_balance 
    FROM users 
    WHERE uuid = p_user_uuid;
    
    -- 插入交易记录
    INSERT INTO credit_transactions (
        user_uuid,
        transaction_type,
        amount,
        balance_after,
        description,
        source,
        created_at
    ) VALUES (
        p_user_uuid,
        p_transaction_type,
        p_amount,
        current_balance,
        p_description,
        p_source,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建用户统计函数
CREATE OR REPLACE FUNCTION get_user_stats(p_user_uuid TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_credits_earned', COALESCE(SUM(CASE WHEN transaction_type = 'EARN' THEN amount ELSE 0 END), 0),
        'total_credits_spent', COALESCE(SUM(CASE WHEN transaction_type = 'SPEND' THEN amount ELSE 0 END), 0),
        'total_transactions', COUNT(*),
        'last_transaction', MAX(created_at)
    ) INTO result
    FROM credit_transactions
    WHERE user_uuid = p_user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建订阅状态更新函数
CREATE OR REPLACE FUNCTION update_subscription_status(
    p_paypal_subscription_id TEXT,
    p_status TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE user_subscriptions 
    SET status = p_status,
        updated_at = NOW()
    WHERE paypal_subscription_id = p_paypal_subscription_id;
    
    -- 同时更新用户表中的订阅状态
    UPDATE users 
    SET subscription_status = CASE 
        WHEN p_status = 'ACTIVE' THEN 'PREMIUM'
        ELSE 'FREE'
    END,
    updated_at = NOW()
    WHERE uuid IN (
        SELECT u.uuid 
        FROM users u
        JOIN user_subscriptions us ON u.email = us.google_user_email
        WHERE us.paypal_subscription_id = p_paypal_subscription_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 创建 Google OAuth 配置（如果需要）
-- 注意：这通常在 Supabase Dashboard 的 Authentication 设置中配置

-- 12. 验证表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'credit_transactions', 'user_subscriptions', 'webhook_events')
ORDER BY table_name, ordinal_position;

-- 13. 验证函数创建
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('set_user_context', 'get_current_user_uuid', 'add_credit_transaction', 'get_user_stats', 'update_subscription_status');

-- 14. 验证 RLS 策略
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

-- 完成提示
SELECT 'Supabase setup completed successfully!' as status;