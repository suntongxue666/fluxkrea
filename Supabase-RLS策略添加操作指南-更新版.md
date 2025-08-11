# Supabase RLS策略添加操作指南（更新版）

本指南将详细说明如何在Supabase控制台中为`user_subscriptions`表添加允许匿名插入的RLS策略，特别是如何修改默认的策略名称。

## 为user_subscriptions表添加RLS策略

### 步骤1：登录Supabase控制台
1. 访问 https://app.supabase.io/
2. 使用您的账号登录
3. 选择您的项目

### 步骤2：导航到数据库策略页面
1. 在左侧菜单中点击"Authentication"
2. 点击"Policies"选项卡
3. 找到并点击`user_subscriptions`表

### 步骤3：创建新策略
1. 点击"New Policy"按钮
2. 在弹出的对话框中，您有两种方式添加策略：

#### 方式一：使用模板（推荐新手使用）
1. 选择"Use a policy template"
2. 在"Policy Type"下拉菜单中选择"INSERT"
3. 在"Target roles"中选择"anon"（匿名角色）
4. **重要：** 在"Policy name"字段中，删除默认的"Enable read access for all users"，替换为"允许匿名插入订阅"
   ![修改策略名称](https://i.imgur.com/example.png)
5. 点击"Review"按钮
6. 检查生成的SQL代码，应该类似于：
   ```sql
   CREATE POLICY "允许匿名插入订阅" ON user_subscriptions
   FOR INSERT TO anon
   WITH CHECK (true);
   ```
7. 点击"Create Policy"按钮保存

#### 方式二：使用自定义SQL（适合高级用户）
1. 选择"Write a custom policy"
2. **重要：** 在"Policy name"字段中，删除默认的"Enable read access for all users"，替换为"允许匿名插入订阅"
3. 在"Target roles"中选择"anon"（匿名角色）
4. 在"Using expression"中输入"true"
5. 在"With check expression"中输入"true"
6. 点击"Create Policy"按钮保存

### 步骤4：验证策略
1. 策略创建后，它应该出现在策略列表中
2. 确认策略名称为"允许匿名插入订阅"（而不是默认的"Enable read access for all users"）
3. 确认策略应用于"anon"角色
4. 确认策略类型为"INSERT"

## 为webhook_events表添加RLS策略

重复上述步骤，但在步骤2中选择`webhook_events`表，并在步骤3中使用以下信息：
- **重要：** 删除默认的Policy name，替换为"允许匿名插入webhook事件"
- Target roles: "anon"
- Operation: "INSERT"
- Using expression: "true"
- With check expression: "true"

## 为credit_transactions表添加RLS策略（可选）

重复上述步骤，但在步骤2中选择`credit_transactions`表，并在步骤3中使用以下信息：
- **重要：** 删除默认的Policy name，替换为"允许匿名插入积分交易"
- Target roles: "anon"
- Operation: "INSERT"
- Using expression: "true"
- With check expression: "true"

## 注意事项

1. 添加策略后，可能需要几分钟才能生效
2. 如果您在添加策略后仍然遇到问题，请尝试刷新浏览器或重新登录
3. 为了安全起见，您可以考虑使用更严格的条件，而不是简单的"true"
4. 例如，对于`user_subscriptions`表，您可以使用：
   ```sql
   google_user_email IS NOT NULL AND paypal_subscription_id IS NOT NULL
   ```

## 策略添加后的验证

添加策略后，您可以通过以下方式验证它是否生效：

1. 尝试创建新订阅
2. 检查是否能成功创建订阅记录
3. 检查webhook事件是否正确记录
4. 检查积分交易是否正确记录

如果一切正常，您应该能够成功创建订阅，并且不再看到"Failed to create subscription"错误。