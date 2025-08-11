/**
 * 数据库清理指南
 * 用于删除测试用户和相关数据
 */

console.log('🗑️ 数据库清理指南\n');

console.log('📋 需要清理的数据表:');
console.log('1. users - 用户基本信息');
console.log('2. credit_transactions - 积分交易记录');
console.log('3. generations - 图片生成记录');
console.log('4. user_sessions - 用户会话记录');
console.log('5. auth.users - Supabase认证用户\n');

console.log('🔍 识别测试用户的方法:');
console.log('- 邮箱包含 "test", "example", "demo"');
console.log('- UUID以 "anonymous-" 开头');
console.log('- 创建时间在测试期间');
console.log('- 用户名包含测试标识\n');

console.log('⚠️ 删除步骤 (按顺序执行):');
console.log('');

console.log('步骤1: 连接到Supabase数据库');
console.log('- 打开 https://supabase.com/dashboard');
console.log('- 选择你的项目');
console.log('- 进入 SQL Editor');
console.log('');

console.log('步骤2: 查看测试用户 (先查看再删除)');
console.log(`
-- 查看所有测试用户
SELECT id, uuid, email, created_at, credits, is_signed_in 
FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
   OR uuid LIKE 'anonymous-%'
ORDER BY created_at DESC;
`);

console.log('步骤3: 查看相关的积分交易记录');
console.log(`
-- 查看测试用户的积分交易
SELECT ct.*, u.email 
FROM credit_transactions ct
JOIN users u ON ct.user_uuid = u.uuid
WHERE u.email LIKE '%test%' 
   OR u.email LIKE '%example%' 
   OR u.email LIKE '%demo%'
   OR u.uuid LIKE 'anonymous-%'
ORDER BY ct.created_at DESC;
`);

console.log('步骤4: 查看图片生成记录');
console.log(`
-- 查看测试用户的生成记录
SELECT g.*, u.email 
FROM generations g
JOIN users u ON g.user_uuid = u.uuid
WHERE u.email LIKE '%test%' 
   OR u.email LIKE '%example%' 
   OR u.email LIKE '%demo%'
   OR u.uuid LIKE 'anonymous-%'
ORDER BY g.created_at DESC;
`);

console.log('步骤5: 删除相关数据 (⚠️ 不可逆操作)');
console.log(`
-- 1. 删除积分交易记录
DELETE FROM credit_transactions 
WHERE user_uuid IN (
    SELECT uuid FROM users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR email LIKE '%demo%'
       OR uuid LIKE 'anonymous-%'
);

-- 2. 删除图片生成记录
DELETE FROM generations 
WHERE user_uuid IN (
    SELECT uuid FROM users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR email LIKE '%demo%'
       OR uuid LIKE 'anonymous-%'
);

-- 3. 删除用户会话记录 (如果有)
DELETE FROM user_sessions 
WHERE user_uuid IN (
    SELECT uuid FROM users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example%' 
       OR email LIKE '%demo%'
       OR uuid LIKE 'anonymous-%'
);

-- 4. 删除用户记录
DELETE FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
   OR uuid LIKE 'anonymous-%';
`);

console.log('步骤6: 清理Supabase认证用户');
console.log(`
-- 查看认证用户 (在 auth.users 表中)
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
ORDER BY created_at DESC;

-- 删除认证用户 (⚠️ 谨慎操作)
DELETE FROM auth.users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%';
`);

console.log('步骤7: 验证删除结果');
console.log(`
-- 验证用户表
SELECT COUNT(*) as remaining_test_users 
FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
   OR uuid LIKE 'anonymous-%';

-- 验证积分交易表
SELECT COUNT(*) as remaining_transactions 
FROM credit_transactions ct
JOIN users u ON ct.user_uuid = u.uuid
WHERE u.email LIKE '%test%' 
   OR u.email LIKE '%example%' 
   OR u.email LIKE '%demo%'
   OR u.uuid LIKE 'anonymous-%';

-- 验证生成记录表
SELECT COUNT(*) as remaining_generations 
FROM generations g
JOIN users u ON g.user_uuid = u.uuid
WHERE u.email LIKE '%test%' 
   OR u.email LIKE '%example%' 
   OR u.email LIKE '%demo%'
   OR u.uuid LIKE 'anonymous-%';
`);

console.log('🛡️ 安全建议:');
console.log('1. 在删除前先备份数据');
console.log('2. 先在测试环境中执行');
console.log('3. 逐步执行，不要一次性删除所有');
console.log('4. 保留一些测试数据用于开发');
console.log('5. 删除后清理本地存储和缓存\n');

console.log('🧹 本地清理:');
console.log('删除数据库记录后，还需要清理:');
console.log('- localStorage中的用户数据');
console.log('- 浏览器缓存');
console.log('- 测试文件和日志\n');

console.log('✅ 完成后验证:');
console.log('1. 重新访问应用，确认测试用户已清除');
console.log('2. 检查新用户注册是否正常');
console.log('3. 验证积分系统是否正常工作');
console.log('4. 确认没有孤立的数据记录\n');

console.log('📞 如需帮助:');
console.log('如果在删除过程中遇到问题，请:');
console.log('1. 检查外键约束');
console.log('2. 确认表结构和关系');
console.log('3. 查看Supabase日志');
console.log('4. 考虑使用级联删除');