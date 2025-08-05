# PayPal订阅流程测试指南

## 🎯 测试目标

验证完整的PayPal订阅流程，包括：
- 订阅创建
- 支付处理
- Webhook接收
- 用户积分更新
- 订阅状态管理

## 🔧 测试环境准备

### 1. PayPal沙盒账户设置

#### 创建测试买家账户
1. 登录 [PayPal Developer Dashboard](https://developer.paypal.com/)
2. 进入 "Sandbox" > "Accounts"
3. 创建新的个人账户（买家）
4. 记录测试账户邮箱和密码

#### 测试信用卡信息
```
卡号: 4111111111111111 (Visa)
过期日期: 任意未来日期 (如 12/2025)
CVV: 123
姓名: Test User
```

### 2. 本地环境配置

#### 环境变量设置
```bash
# .env 文件
PAYPAL_CLIENT_ID=AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8
PAYPAL_CLIENT_SECRET=ENlcBlade--RMAM6EWnp16tTsPaw_nDogYdriNgIfI4KSng-kY2YhqO7job-WRa6tDctYFGXAf9MWLzC
PAYPAL_WEBHOOK_ID=YOUR_WEBHOOK_ID
PAYPAL_ENVIRONMENT=sandbox
```

## 📋 测试步骤

### 步骤1: 数据库准备
```sql
-- 1. 执行数据库schema
\i database_schema.sql

-- 2. 验证表创建
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'payments', 'subscription_history');

-- 3. 检查用户表是否有测试用户
SELECT uuid, email, credits FROM users LIMIT 5;
```

### 步骤2: 前端测试
1. **访问订阅页面**
   ```
   https://fluxkrea.me/pricing.html
   ```

2. **选择订阅计划**
   - 点击 "Pro Plan" 或 "Max Plan"
   - 验证PayPal弹窗正常打开

3. **完成支付流程**
   - 使用测试买家账户登录
   - 使用测试信用卡完成支付
   - 确认订阅创建成功

### 步骤3: Webhook验证
1. **检查Webhook接收**
   ```bash
   # 查看服务器日志
   tail -f /var/log/paypal-webhook.log
   ```

2. **验证数据库更新**
   ```sql
   -- 检查订阅记录
   SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;
   
   -- 检查支付记录
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
   
   -- 检查用户积分更新
   SELECT uuid, email, credits, subscription_status FROM users 
   WHERE current_subscription_id IS NOT NULL;
   ```

### 步骤4: 功能验证
1. **积分发放验证**
   - 确认用户积分正确增加
   - 验证积分交易记录

2. **订阅状态验证**
   - 检查用户订阅状态
   - 验证下次计费日期

3. **访问权限验证**
   - 测试订阅用户的特殊权限
   - 验证积分消耗逻辑

## 🔍 测试检查清单

### ✅ 前端测试
- [ ] 订阅页面正常加载
- [ ] PayPal按钮正常显示
- [ ] 计划选择功能正常
- [ ] PayPal弹窗正常打开
- [ ] 支付流程可以完成
- [ ] 成功页面正常跳转

### ✅ 后端测试
- [ ] Webhook正常接收事件
- [ ] 订阅记录正确创建
- [ ] 支付记录正确保存
- [ ] 用户积分正确更新
- [ ] 订阅状态正确设置
- [ ] 历史记录正确记录

### ✅ 数据库测试
- [ ] 所有表正确创建
- [ ] 索引正确建立
- [ ] RLS策略正常工作
- [ ] 触发器正常执行
- [ ] 视图查询正常

## 🐛 常见问题排查

### 1. PayPal按钮不显示
- 检查Client ID是否正确
- 验证网络连接
- 查看浏览器控制台错误

### 2. Webhook未接收
- 验证Webhook URL配置
- 检查服务器防火墙设置
- 确认SSL证书有效

### 3. 数据库更新失败
- 检查数据库连接
- 验证表结构是否正确
- 查看错误日志

### 4. 积分未更新
- 检查Webhook处理逻辑
- 验证用户匹配逻辑
- 确认积分计算正确

## 📊 测试数据示例

### 成功的订阅记录
```json
{
  "subscription_id": "I-BW452GLLEP1G",
  "plan_id": "P-5S785818YS7424947NCJBKQA",
  "status": "ACTIVE",
  "user_uuid": "user_123456",
  "credits_per_month": 1000,
  "price": 9.99
}
```

### 成功的支付记录
```json
{
  "payment_id": "PAYID-MXXX",
  "amount": 9.99,
  "status": "COMPLETED",
  "credits_awarded": 1000
}
```

## 📞 测试支持

如果测试过程中遇到问题：

1. **检查日志文件**
   - PayPal Webhook日志
   - 应用服务器日志
   - 数据库查询日志

2. **验证配置**
   - PayPal Developer Dashboard设置
   - 环境变量配置
   - 数据库连接

3. **联系支持**
   - 提供详细的错误信息
   - 包含相关的日志片段
   - 说明测试步骤和预期结果

## 🚀 测试完成后

测试成功后，您可以：
1. 配置生产环境
2. 更新PayPal应用为生产模式
3. 部署到生产服务器
4. 开始接受真实订阅

记住在生产环境中使用真实的PayPal Client ID和Secret！