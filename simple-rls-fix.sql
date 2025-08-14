-- 最简单的RLS修复
-- 在 Supabase SQL Editor 中执行

-- 1. 禁用所有表的RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;

-- 2. 简单测试 - 查看表结构
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position
LIMIT 5;

SELECT 'RLS disabled. Database ready for testing.' as status;