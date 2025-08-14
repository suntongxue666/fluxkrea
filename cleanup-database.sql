-- 数据库清理脚本
-- 只保留核心业务表，删除其他不必要的表

-- 保留的核心表（不要删除）:
-- 1. users - 用户基本信息
-- 2. credit_transactions - 积分交易记录
-- 3. user_subscriptions - 用户订阅信息  
-- 4. webhook_events - PayPal webhook事件

-- 第一步：删除所有视图（避免依赖问题）
DROP VIEW IF EXISTS users_view CASCADE;
DROP VIEW IF EXISTS user_stats CASCADE;
DROP VIEW IF EXISTS user_subscription_summary CASCADE;

-- 第二步：清空所有表的数据（测试数据可以删除）
TRUNCATE TABLE daily_stats CASCADE;
TRUNCATE TABLE image_generations CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE paypal_orders CASCADE;
TRUNCATE TABLE subscription_history CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE system_settings CASCADE;
TRUNCATE TABLE users_backup CASCADE;

-- 第三步：删除不必要的表
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS image_generations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS paypal_orders CASCADE;
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS users_backup CASCADE;

-- 第四步：清空核心表的测试数据（保留表结构）
TRUNCATE TABLE credit_transactions CASCADE;
TRUNCATE TABLE user_subscriptions CASCADE;
TRUNCATE TABLE webhook_events CASCADE;
TRUNCATE TABLE users CASCADE;

-- 验证剩余的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 检查核心表的记录数
SELECT 'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 'credit_transactions', COUNT(*) FROM credit_transactions  
UNION ALL
SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL
SELECT 'webhook_events', COUNT(*) FROM webhook_events;