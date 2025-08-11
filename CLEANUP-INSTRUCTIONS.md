
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
   ```javascript
   // 方法1：直接执行清理代码
   
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

   
   // 方法2：加载清理脚本
   const script = document.createElement('script');
   script.src = '/local-cleanup.js';
   document.head.appendChild(script);
   ```

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
