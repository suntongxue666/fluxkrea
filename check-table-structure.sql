-- 检查当前表结构
-- 在 Supabase SQL Editor 中执行

-- 1. 检查 users 表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查 users 表的约束
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users' AND tc.table_schema = 'public';

-- 3. 如果 id 字段有问题，重新创建
-- 先删除可能存在的有问题的 id 字段
ALTER TABLE users DROP COLUMN IF EXISTS id CASCADE;

-- 重新添加正确的 id 字段作为主键
ALTER TABLE users ADD COLUMN id SERIAL PRIMARY KEY;

-- 4. 验证修复后的结构
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. 测试插入一条记录
INSERT INTO users (
    uuid, 
    google_id, 
    email, 
    name, 
    credits, 
    subscription_status
) VALUES (
    'test_uuid_123',
    'google_test_123',
    'test@example.com',
    'Test User',
    20,
    'FREE'
) ON CONFLICT (uuid) DO NOTHING;

-- 6. 查看插入的记录
SELECT * FROM users WHERE uuid = 'test_uuid_123';

-- 7. 清理测试记录
DELETE FROM users WHERE uuid = 'test_uuid_123';

SELECT 'Table structure check completed!' as status;