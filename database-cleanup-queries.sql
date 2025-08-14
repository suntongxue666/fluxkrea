-- 数据库表检查和清理查询
-- 在 Supabase 控制台的 SQL Editor 中执行

-- 1. 查看所有表
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. 查看每个表的记录数
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public';

-- 3. 检查核心表是否存在及记录数
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'credit_transactions' as table_name,
    COUNT(*) as record_count  
FROM credit_transactions
UNION ALL
SELECT 
    'user_subscriptions' as table_name,
    COUNT(*) as record_count
FROM user_subscriptions
UNION ALL  
SELECT 
    'webhook_events' as table_name,
    COUNT(*) as record_count
FROM webhook_events;

-- 4. 查看users表结构和数据
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 查看users表前5条记录
SELECT * FROM users LIMIT 5;

-- 5. 查看credit_transactions表结构和数据
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns  
WHERE table_name = 'credit_transactions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 查看credit_transactions表前5条记录
SELECT * FROM credit_transactions LIMIT 5;

-- 6. 查看user_subscriptions表结构和数据
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_subscriptions' AND table_schema = 'public'  
ORDER BY ordinal_position;

-- 查看user_subscriptions表前5条记录
SELECT * FROM user_subscriptions LIMIT 5;

-- 7. 查看webhook_events表结构和数据
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'webhook_events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 查看webhook_events表前5条记录  
SELECT * FROM webhook_events LIMIT 5;

-- 8. 查找特定用户 sunwei7482@gmail.com
SELECT * FROM users WHERE email = 'sunwei7482@gmail.com';

-- 9. 查看所有用户（检查是否有其他用户）
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- 10. 查看所有积分交易记录（基于实际表结构）
SELECT * FROM credit_transactions ORDER BY created_at DESC LIMIT 10;

-- 11. 查找user_uuid对应的用户信息
SELECT u.*, ct.* FROM users u 
RIGHT JOIN credit_transactions ct ON u.uuid = ct.user_uuid
WHERE ct.user_uuid = 'user_1754927303221_vh4t3iaj9';

-- 12. 检查是否有孤立的积分记录（没有对应用户）
SELECT ct.* FROM credit_transactions ct
LEFT JOIN users u ON ct.user_uuid = u.uuid
WHERE u.uuid IS NULL;

-- 13. 查看该用户的订阅记录
SELECT * FROM user_subscriptions 
WHERE google_user_email = 'sunwei7482@gmail.com';

-- 14. 查看所有订阅记录
SELECT * FROM user_subscriptions ORDER BY created_at DESC LIMIT 10;

-- 清理不必要的表（如果存在的话）
-- 注意：执行前请确认这些表确实不需要
/*
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS user_credits;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS payment_history;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS api_logs;
DROP TABLE IF EXISTS system_settings;
*/