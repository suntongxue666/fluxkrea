
-- ========================================
-- 测试数据清理脚本
-- 生成时间: 2025-08-11T00:30:34.364Z
-- ========================================

-- 步骤1: 查看将要删除的测试用户
SELECT 
    'PREVIEW: Users to be deleted' as action,
    id, 
    uuid, 
    email, 
    created_at, 
    credits, 
    is_signed_in,
    CASE 
        WHEN email LIKE '%test%' THEN 'test email'
        WHEN email LIKE '%example%' THEN 'example email'
        WHEN email LIKE '%demo%' THEN 'demo email'
        WHEN uuid LIKE 'anonymous-%' THEN 'anonymous user'
        ELSE 'other'
    END as reason
FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
   OR uuid LIKE 'anonymous-%'
ORDER BY created_at DESC;

-- 步骤2: 查看相关的积分交易记录数量
SELECT 
    'PREVIEW: Credit transactions to be deleted' as action,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
FROM credit_transactions ct
WHERE ct.user_uuid IN (
    SELECT uuid FROM users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR email LIKE '%demo%'
       OR uuid LIKE 'anonymous-%'
);

-- 步骤3: 查看图片生成记录数量
SELECT 
    'PREVIEW: Generations to be deleted' as action,
    COUNT(*) as generation_count
FROM generations g
WHERE g.user_uuid IN (
    SELECT uuid FROM users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR email LIKE '%demo%'
       OR uuid LIKE 'anonymous-%'
);

-- ========================================
-- 实际删除操作 (取消注释后执行)
-- ⚠️ 警告: 以下操作不可逆，请谨慎执行
-- ========================================

/*
-- 开始事务
BEGIN;

-- 删除积分交易记录
DELETE FROM credit_transactions 
WHERE user_uuid IN (
    SELECT uuid FROM users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR email LIKE '%demo%'
       OR uuid LIKE 'anonymous-%'
);

-- 删除图片生成记录
DELETE FROM generations 
WHERE user_uuid IN (
    SELECT uuid FROM users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR email LIKE '%demo%'
       OR uuid LIKE 'anonymous-%'
);

-- 删除用户会话记录 (如果存在)
DELETE FROM user_sessions 
WHERE user_uuid IN (
    SELECT uuid FROM users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR email LIKE '%demo%'
       OR uuid LIKE 'anonymous-%'
);

-- 删除用户记录
DELETE FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
   OR uuid LIKE 'anonymous-%';

-- 提交事务 (如果一切正常)
COMMIT;

-- 如果出现问题，可以回滚
-- ROLLBACK;
*/

-- ========================================
-- 验证删除结果
-- ========================================

-- 检查剩余的测试用户
SELECT 
    'VERIFICATION: Remaining test users' as check_type,
    COUNT(*) as count 
FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
   OR uuid LIKE 'anonymous-%';

-- 检查剩余的测试交易记录
SELECT 
    'VERIFICATION: Remaining test transactions' as check_type,
    COUNT(*) as count 
FROM credit_transactions ct
WHERE EXISTS (
    SELECT 1 FROM users u 
    WHERE u.uuid = ct.user_uuid 
    AND (u.email LIKE '%test%' 
         OR u.email LIKE '%example%' 
         OR u.email LIKE '%demo%'
         OR u.uuid LIKE 'anonymous-%')
);

-- 检查剩余的测试生成记录
SELECT 
    'VERIFICATION: Remaining test generations' as check_type,
    COUNT(*) as count 
FROM generations g
WHERE EXISTS (
    SELECT 1 FROM users u 
    WHERE u.uuid = g.user_uuid 
    AND (u.email LIKE '%test%' 
         OR u.email LIKE '%example%' 
         OR u.email LIKE '%demo%'
         OR u.uuid LIKE 'anonymous-%')
);

-- ========================================
-- 清理认证用户 (可选)
-- ========================================

/*
-- 查看认证用户
SELECT 
    'AUTH USERS: To be deleted' as action,
    id, 
    email, 
    created_at, 
    email_confirmed_at
FROM auth.users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
ORDER BY created_at DESC;

-- 删除认证用户 (谨慎操作)
DELETE FROM auth.users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%';
*/

-- ========================================
-- 数据库统计信息
-- ========================================

SELECT 
    'FINAL STATS: Total users' as stat_type,
    COUNT(*) as count 
FROM users;

SELECT 
    'FINAL STATS: Total transactions' as stat_type,
    COUNT(*) as count 
FROM credit_transactions;

SELECT 
    'FINAL STATS: Total generations' as stat_type,
    COUNT(*) as count 
FROM generations;
