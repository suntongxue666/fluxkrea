# Supabase SQL策略修改指南

根据您提供的官方SQL代码，我将详细说明如何修改策略名称和添加条件。

## 官方提供的SQL代码

```sql
create policy "Enable read access for all users"
on "public"."user_subscriptions"
as PERMISSIVE
for INSERT
to anon
with check (

);
```

## 如何修改

您需要修改两个部分：
1. 策略名称（从"Enable read access for all users"改为"允许匿名插入订阅"）
2. with check条件（添加`true`或其他条件）

### 修改后的SQL代码

```sql
create policy "允许匿名插入订阅"
on "public"."user_subscriptions"
as PERMISSIVE
for INSERT
to anon
with check (
  true
);
```

## 操作步骤

### 方法1：直接在SQL编辑器中修改

1. 在Supabase控制台中，点击左侧菜单的"SQL Editor"
2. 创建新查询
3. 粘贴以下SQL代码：

```sql
-- 如果已存在同名策略，先删除
drop policy if exists "Enable read access for all users" on "public"."user_subscriptions";

-- 创建新策略
create policy "允许匿名插入订阅"
on "public"."user_subscriptions"
as PERMISSIVE
for INSERT
to anon
with check (
  true
);
```

4. 点击"Run"执行SQL

### 方法2：在策略界面修改

1. 在"Authentication" > "Policies"中找到`user_subscriptions`表
2. 点击"New Policy"
3. 选择"Write a custom policy"
4. 在编辑框中，将默认的SQL代码：

```sql
create policy "Enable read access for all users"
on "public"."user_subscriptions"
as PERMISSIVE
for INSERT
to anon
with check (

);
```

修改为：

```sql
create policy "允许匿名插入订阅"
on "public"."user_subscriptions"
as PERMISSIVE
for INSERT
to anon
with check (
  true
);
```

5. 点击"Create Policy"保存

## 为webhook_events表添加策略

同样的方法，为webhook_events表添加策略：

```sql
create policy "允许匿名插入webhook事件"
on "public"."webhook_events"
as PERMISSIVE
for INSERT
to anon
with check (
  true
);
```

## 为credit_transactions表添加策略（可选）

```sql
create policy "允许匿名插入积分交易"
on "public"."credit_transactions"
as PERMISSIVE
for INSERT
to anon
with check (
  true
);
```

## 更安全的条件示例

如果您想使用更安全的条件而不是简单的`true`，可以参考以下示例：

### user_subscriptions表

```sql
create policy "允许匿名插入订阅"
on "public"."user_subscriptions"
as PERMISSIVE
for INSERT
to anon
with check (
  google_user_email IS NOT NULL AND 
  paypal_subscription_id IS NOT NULL
);
```

### webhook_events表

```sql
create policy "允许匿名插入webhook事件"
on "public"."webhook_events"
as PERMISSIVE
for INSERT
to anon
with check (
  event_type IS NOT NULL
);
```

## 验证策略是否生效

添加策略后，您可以通过以下SQL查询验证策略是否已正确添加：

```sql
SELECT
  policyname,
  tablename,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'user_subscriptions';
```

这将显示`user_subscriptions`表的所有策略。确认您的新策略"允许匿名插入订阅"已列出，并且`with_check`条件正确。