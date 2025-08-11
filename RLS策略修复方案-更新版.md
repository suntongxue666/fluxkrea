# 数据库RLS策略修复方案（更新版）

根据您提供的当前数据库RLS策略信息，我们需要针对性地进行修改，以解决订阅创建失败的问题。

## 当前RLS策略状态

### 1. user_subscriptions表
- 已启用RLS
- 现有策略:
  - `ALL`: Service role can manage user subscriptions (应用于public角色)
  - `SELECT`: Users can view own subscription associations (应用于public角色)
- **问题**: 缺少允许匿名插入的策略

### 2. webhook_events表
- 已启用RLS
- 现有策略:
  - `ALL`: Service role can manage webhook events (应用于public角色)
- **问题**: 缺少允许匿名插入的策略

### 3. credit_transactions表
- 已启用RLS
- 现有策略:
  - `ALL`: Allow all operations on credit_transactions (应用于public角色)
- **状态**: 此表已有允许所有操作的策略，理论上不应该有问题

## 需要添加的RLS策略

### 1. user_subscriptions表
需要添加一个专门针对`anon`角色的`INSERT`策略:

```sql
CREATE POLICY "允许匿名插入订阅" ON user_subscriptions
FOR INSERT TO anon
WITH CHECK (true);
```

### 2. webhook_events表
需要添加一个专门针对`anon`角色的`INSERT`策略:

```sql
CREATE POLICY "允许匿名插入webhook事件" ON webhook_events
FOR INSERT TO anon
WITH CHECK (true);
```

### 3. credit_transactions表
虽然此表已有`ALL`操作的策略，但为了确保匿名插入正常工作，可以添加一个专门的策略:

```sql
CREATE POLICY "允许匿名插入积分交易" ON credit_transactions
FOR INSERT TO anon
WITH CHECK (true);
```

## 操作步骤

1. 登录Supabase管理控制台
2. 导航到"Authentication" > "Policies"
3. 找到相应的表，点击"New Policy"
4. 选择"Insert"操作和"anon"角色
5. 使用上述SQL语句创建策略
6. 保存并测试

## 特别说明

虽然`credit_transactions`表已有`ALL`操作的策略，但该策略可能仅应用于`public`角色而非`anon`角色。在Supabase中，`public`角色通常代表已认证用户，而`anon`角色代表未认证用户。

由于PayPal webhook和订阅创建过程可能是在未认证状态下进行的，因此需要确保`anon`角色也有适当的权限。

## 验证方法

添加策略后，可以通过以下方法验证:

1. 尝试创建新订阅
2. 检查webhook事件是否正确记录
3. 检查积分交易是否正确记录

## 安全性建议

为了提高安全性，可以考虑使用更精细的条件，而不是简单的`WITH CHECK (true)`:

```sql
-- user_subscriptions表的更安全策略
CREATE POLICY "允许匿名插入订阅" ON user_subscriptions
FOR INSERT TO anon
WITH CHECK (
  -- 确保email字段不为空
  google_user_email IS NOT NULL AND
  -- 确保subscription_id字段不为空
  paypal_subscription_id IS NOT NULL
);

-- webhook_events表的更安全策略
CREATE POLICY "允许匿名插入webhook事件" ON webhook_events
FOR INSERT TO anon
WITH CHECK (
  -- 确保event_type字段不为空
  event_type IS NOT NULL
);
```

这些条件可以防止插入无效数据，提高系统安全性。