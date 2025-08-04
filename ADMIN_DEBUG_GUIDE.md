# 🧪 管理员调试功能使用指南

## 🔐 权限控制

### 调试按钮显示规则
- **仅显示给**: `sunwei7482@gmail.com` 账户
- **匿名用户**: 不显示调试按钮
- **其他登录用户**: 不显示调试按钮
- **管理员登录后**: 自动显示 "🔄 刷新" 按钮

## 🛠️ 可用的调试功能

### 1. 页面调试按钮
**位置**: 页面右上角（仅管理员可见）
**功能**: 
- 🔄 **刷新按钮**: 重新初始化用户状态
- 用于解决积分显示异常、用户状态错误等问题

### 2. 控制台调试函数
按 `F12` 打开控制台，输入以下命令：

#### 基础查询函数
```javascript
// 查看当前用户信息
debugFunctions.getCurrentUser()

// 查看积分管理器状态
debugFunctions.getCreditsManager()

// 查看系统设置
debugFunctions.getSystemSettings()
```

#### 管理员专用函数
```javascript
// 重新初始化用户状态
debugFunctions.reinitializeUser()

// 设置积分为0（测试余额不足）
debugFunctions.setCreditsToZero()
```

## 📋 0余额测试流程

### 测试步骤
1. **登录管理员账户** (`sunwei7482@gmail.com`)
2. **确认当前积分** > 0
3. **打开控制台** (F12)
4. **执行命令**: `debugFunctions.setCreditsToZero()`
5. **验证积分显示** 变为 0
6. **尝试生成图像** 应该提示余额不足
7. **验证错误消息**: "Insufficient credits! You need at least 10 credits..."

### 预期结果
```
✅ 积分显示: 0
✅ 生成按钮: 可点击
✅ 点击后提示: "Insufficient credits! You need at least 10 credits to generate an image. Current: 0. Please sign in for more credits."
✅ 不扣除积分
✅ 不执行生成流程
```

### 恢复测试
```javascript
// 重新初始化，恢复默认积分
debugFunctions.reinitializeUser()
```

## 🔧 故障排除

### 调试按钮不显示
**可能原因**:
- 未使用 `sunwei7482@gmail.com` 账户登录
- 页面缓存问题
- JavaScript错误

**解决方案**:
1. 确认登录邮箱正确
2. 强制刷新页面 (`Ctrl+Shift+R`)
3. 检查控制台是否有错误

### 积分设置失败
**可能原因**:
- 数据库连接问题
- 权限验证失败
- 网络错误

**解决方案**:
1. 检查控制台错误信息
2. 确认Supabase连接正常
3. 使用 `debugFunctions.reinitializeUser()` 重试

## 🚨 安全注意事项

### 权限保护
- ✅ 只有 `sunwei7482@gmail.com` 可以看到调试按钮
- ✅ 控制台函数有权限验证
- ✅ 非管理员用户无法执行敏感操作

### 生产环境使用
- ⚠️ 调试功能仅用于测试和故障排除
- ⚠️ 避免在用户面前使用调试功能
- ⚠️ 测试完成后及时恢复正常状态

## 📊 测试记录

### 建议测试场景
1. **余额充足** → 生成成功
2. **余额不足** → 提示错误
3. **余额为0** → 拒绝生成
4. **网络错误** → 积分退还
5. **用户切换** → 状态同步

### 测试日志格式
```
测试时间: 2025-01-XX XX:XX:XX
测试场景: 0余额测试
测试步骤: 
1. 设置积分为0
2. 尝试生成图像
3. 验证错误提示
结果: ✅/❌
备注: xxx
```

---

**💡 提示**: 这些调试功能为开发和维护提供便利，请谨慎使用，确保不影响正常用户体验。