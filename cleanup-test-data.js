/**
 * 自动化测试数据清理脚本
 * 用于安全地删除测试用户和相关数据
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 自动化测试数据清理脚本\n');

// 生成SQL清理脚本
function generateCleanupSQL() {
    const sqlScript = `
-- ========================================
-- 测试数据清理脚本
-- 生成时间: ${new Date().toISOString()}
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
`;

    return sqlScript;
}

// 生成本地清理脚本
function generateLocalCleanupScript() {
    const localScript = `
/**
 * 本地数据清理脚本
 * 清理浏览器存储和缓存
 */

console.log('🧹 开始本地数据清理...');

// 清理localStorage
const keysToRemove = [
    'flux_krea_user',
    'flux_krea_credits',
    'flux_krea_state_change',
    'user_credits',
    'currentUser',
    'pending_generation_prompt',
    'redirect_after_signin'
];

keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log('✅ 已清理 localStorage:', key);
    }
});

// 清理sessionStorage
const sessionKeys = [
    'temp_user_data',
    'generation_session',
    'auth_state'
];

sessionKeys.forEach(key => {
    if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        console.log('✅ 已清理 sessionStorage:', key);
    }
});

// 重置全局变量
if (window.currentUser) {
    window.currentUser = null;
    console.log('✅ 已重置 window.currentUser');
}

if (window.UnifiedStateSync) {
    window.UnifiedStateSync.setCredits(0);
    console.log('✅ 已重置积分状态');
}

console.log('✅ 本地数据清理完成！');
console.log('💡 建议刷新页面以确保所有状态重置');
`;

    return localScript;
}

// 创建清理文件
const sqlScript = generateCleanupSQL();
const localScript = generateLocalCleanupScript();

// 保存SQL脚本
fs.writeFileSync('database-cleanup.sql', sqlScript);
console.log('✅ 已生成 database-cleanup.sql');

// 保存本地清理脚本
fs.writeFileSync('public/local-cleanup.js', localScript);
console.log('✅ 已生成 public/local-cleanup.js');

// 创建清理指令文件
const instructions = `
# 数据库清理操作指南

## 🔍 第一步：预览要删除的数据

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制并执行 database-cleanup.sql 中的预览查询
4. 确认要删除的数据是否正确

## ⚠️ 第二步：执行删除操作

1. 在 database-cleanup.sql 中找到删除操作部分
2. 取消注释 (删除 /* 和 */)
3. 逐步执行删除语句
4. 使用事务确保安全性

## 🧹 第三步：本地清理

1. 在浏览器控制台中执行：
   \`\`\`javascript
   // 方法1：直接执行清理代码
   ${localScript}
   
   // 方法2：加载清理脚本
   const script = document.createElement('script');
   script.src = '/local-cleanup.js';
   document.head.appendChild(script);
   \`\`\`

## ✅ 第四步：验证清理结果

1. 刷新页面
2. 检查用户状态是否重置
3. 尝试新用户注册
4. 验证积分系统正常

## 📋 清理检查清单

- [ ] 数据库中的测试用户已删除
- [ ] 相关的积分交易记录已删除
- [ ] 图片生成记录已删除
- [ ] 认证用户已删除 (可选)
- [ ] 本地存储已清理
- [ ] 页面状态已重置
- [ ] 新用户注册功能正常
- [ ] 积分系统功能正常

## 🚨 紧急回滚

如果删除过程中出现问题：

1. 立即执行 ROLLBACK; (如果在事务中)
2. 检查数据完整性
3. 恢复备份数据 (如果有)
4. 重新评估删除策略

## 📞 技术支持

如果遇到问题，请检查：
- 外键约束错误
- 权限问题
- 数据依赖关系
- Supabase连接状态
`;

fs.writeFileSync('CLEANUP-INSTRUCTIONS.md', instructions);
console.log('✅ 已生成 CLEANUP-INSTRUCTIONS.md');

console.log('\n📋 生成的文件:');
console.log('1. database-cleanup.sql - 数据库清理SQL脚本');
console.log('2. public/local-cleanup.js - 本地数据清理脚本');
console.log('3. CLEANUP-INSTRUCTIONS.md - 详细操作指南');

console.log('\n🚀 使用步骤:');
console.log('1. 阅读 CLEANUP-INSTRUCTIONS.md');
console.log('2. 在 Supabase SQL Editor 中执行 database-cleanup.sql');
console.log('3. 在浏览器控制台中执行本地清理');
console.log('4. 验证清理结果');

console.log('\n⚠️ 重要提醒:');
console.log('- 删除操作不可逆，请先备份重要数据');
console.log('- 建议先在测试环境中执行');
console.log('- 逐步执行，确认每一步的结果');
console.log('- 保留必要的测试数据用于开发');

console.log('\n✅ 清理脚本生成完成！');