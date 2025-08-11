# 🗑️ 快速删除测试用户指南

## 📋 简化步骤

### 1. 打开 Supabase Dashboard
- 访问 https://supabase.com/dashboard
- 选择你的项目
- 点击左侧菜单的 "SQL Editor"

### 2. 先预览要删除的数据
复制以下SQL到编辑器中执行：

```sql
-- 查看所有测试用户
SELECT id, uuid, email, created_at, credits, is_signed_in 
FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
   OR uuid LIKE 'anonymous-%'
ORDER BY created_at DESC;
```

### 3. 执行删除操作
⚠️ **重要：这些操作不可逆，请确认后再执行**

```sql
-- 开始事务
BEGIN;

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

-- 3. 删除用户记录
DELETE FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
   OR uuid LIKE 'anonymous-%';

-- 4. 删除认证用户 (可选)
DELETE FROM auth.users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%';

-- 提交事务
COMMIT;
```

### 4. 验证删除结果
```sql
-- 检查是否还有测试用户
SELECT COUNT(*) as remaining_test_users 
FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%' 
   OR email LIKE '%demo%'
   OR uuid LIKE 'anonymous-%';
```

### 5. 清理浏览器数据
在浏览器控制台中执行：

```javascript
// 清理所有相关的本地存储
['flux_krea_user', 'flux_krea_credits', 'flux_krea_state_change', 'user_credits', 'currentUser', 'pending_generation_prompt', 'redirect_after_signin'].forEach(key => {
    localStorage.removeItem(key);
    console.log('✅ 已清理:', key);
});

// 重置全局状态
if (window.currentUser) window.currentUser = null;
if (window.UnifiedStateSync) window.UnifiedStateSync.setCredits(0);

console.log('✅ 本地清理完成，建议刷新页面');
```

## 🎯 删除特定用户

如果只想删除特定的测试用户，可以使用：

```sql
-- 替换 'specific@test.com' 为实际的邮箱地址
DELETE FROM credit_transactions WHERE user_uuid = (SELECT uuid FROM users WHERE email = 'specific@test.com');
DELETE FROM generations WHERE user_uuid = (SELECT uuid FROM users WHERE email = 'specific@test.com');
DELETE FROM users WHERE email = 'specific@test.com';
DELETE FROM auth.users WHERE email = 'specific@test.com';
```

## ⚠️ 安全提醒

1. **备份重要数据** - 删除前确保有备份
2. **使用事务** - 用 BEGIN/COMMIT 包装删除操作
3. **逐步执行** - 不要一次性执行所有删除
4. **验证结果** - 每步都检查删除结果
5. **保留测试数据** - 保留一些用于开发的测试账户

## 🚨 如果出错了

如果删除过程中出现错误：

1. 立即执行 `ROLLBACK;` (如果在事务中)
2. 检查错误信息
3. 修复问题后重新执行
4. 如果数据损坏，从备份恢复

## ✅ 完成检查

删除完成后，确认：
- [ ] 测试用户已从数据库中删除
- [ ] 相关数据记录已清理
- [ ] 浏览器存储已清空
- [ ] 新用户注册功能正常
- [ ] 积分系统工作正常