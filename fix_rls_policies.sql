-- 修复RLS策略，允许API正常工作
-- 需要在 Supabase SQL Editor 中执行

-- 1. 删除现有的限制性策略
DROP POLICY IF EXISTS "Users can view own subscription associations" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;

-- 2. 创建更宽松的策略，允许匿名用户访问
CREATE POLICY "Allow anonymous access to user_subscriptions" ON user_subscriptions
    FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to subscriptions" ON subscriptions
    FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to paypal_orders" ON paypal_orders
    FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to webhook_events" ON webhook_events
    FOR ALL USING (true);

-- 3. 或者完全禁用RLS（如果上面的策略还不够）
-- ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE paypal_orders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;

-- 4. 验证策略设置
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_subscriptions', 'subscriptions', 'paypal_orders', 'webhook_events');