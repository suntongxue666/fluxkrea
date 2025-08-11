# 数据库RLS策略修复指南

## 需要修改RLS策略的表

根据订阅流程分析，以下表需要修改RLS策略：

1. **user_subscriptions** ✅ - **必须修改**
   - 问题：当前策略阻止匿名插入，导致订阅创建失败
   - 修改：添加允许匿名插入的策略

2. **webhook_events** ✅ - **必须修改**
   - 问题：PayPal webhook无法记录事件
   - 修改：添加允许匿名插入的策略

3. **credit_transactions** ✅ - **建议修改**
   - 问题：积分交易记录可能失败
   - 修改：添加允许匿名插入的策略

## 不需要修改RLS策略的表

1. **users** ❌ - **无需修改**
   - 原因：用户表应该有严格的访问控制
   - 当前状态：已有适当的RLS策略，允许通过API更新积分

2. **subscriptions** ❌ - **无需修改**
   - 原因：此表主要由后端服务访问，不需要匿名访问
   - 当前状态：已有适当的RLS策略

## 具体修改方法

登录Supabase管理控制台，为每个需要修改的表添加以下策略：

### 1. user_subscriptions表

```sql
CREATE POLICY "允许匿名插入订阅" ON user_subscriptions
FOR INSERT TO anon
WITH CHECK (true);
```

### 2. webhook_events表

```sql
CREATE POLICY "允许匿名插入webhook事件" ON webhook_events
FOR INSERT TO anon
WITH CHECK (true);
```

### 3. credit_transactions表

```sql
CREATE POLICY "允许匿名插入积分交易" ON credit_transactions
FOR INSERT TO anon
WITH CHECK (true);
```

## 验证方法

添加策略后，可以通过以下方法验证：

1. 尝试创建新订阅
2. 检查webhook事件是否正确记录
3. 检查积分交易是否正确记录

## 安全性考虑

虽然我们允许匿名插入，但应确保：

1. 在应用层面进行适当的验证
2. 考虑添加更精细的条件，而不是简单的`WITH CHECK (true)`
3. 定期审查数据库访问日志，检测异常活动

## 长期解决方案

1. 实现服务器端API密钥验证
2. 使用服务角色(service role)而不是匿名角色进行数据库操作
3. 为每个表实现更精细的RLS策略