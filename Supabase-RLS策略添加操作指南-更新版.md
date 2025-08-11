# Supabase RLS策略添加操作指南（更新版）

## 配置读取策略时的Target Roles设置

在配置RLS策略时，"Target Roles"（目标角色）是一个重要的设置，它决定了策略适用于哪些用户角色。

### Target Roles选项说明

在Supabase中，常见的角色有：

- **authenticated**：已登录的用户
- **anon**：匿名用户（未登录）
- **service_role**：服务角色（通常用于后端服务）

### 针对用户积分显示问题的推荐设置

对于我们的用例（确保用户可以读取自己的积分数据），推荐的设置是：

1. **在配置读取策略时（步骤8）：**
   - Target Roles: 选择 **authenticated**
   
   这确保只有已登录的用户才能读取数据，匿名用户无法访问。

2. **在配置更新策略时（步骤9）：**
   - Target Roles: 同样选择 **authenticated**
   
   这确保只有已登录的用户才能更新自己的数据。

3. **在配置管理员策略时（步骤10，如果适用）：**
   - Target Roles: 选择 **authenticated**
   
   管理员也必须是已登录用户。

### 为什么不选择其他角色？

- **不选择anon**：匿名用户不应该能够读取或修改用户数据
- **不选择service_role**：service_role默认已经有完全访问权限，不需要额外的策略

### 特殊情况

如果你的应用有特殊需求，例如：

1. **公开部分用户数据**：如果某些用户数据需要公开（如用户名、头像），你可以为这些字段创建单独的策略，并将Target Roles设置为包括anon。

2. **多种用户角色**：如果你的应用有自定义角色（如普通用户、高级用户、管理员等），你可能需要为不同角色创建不同的策略。

## 完整的策略配置示例

以下是一个完整的策略配置示例：

### 用户可以读取自己的数据
- Policy name: 用户可以读取自己的数据
- Policy definition: SELECT
- Target roles: authenticated
- Using expression:
```sql
auth.uid() = id OR email = auth.email() OR uuid = auth.uid()::text
```

### 用户可以更新自己的数据
- Policy name: 用户可以更新自己的数据
- Policy definition: UPDATE
- Target roles: authenticated
- Using expression:
```sql
auth.uid() = id OR email = auth.email() OR uuid = auth.uid()::text
```
- With check expression:
```sql
auth.uid() = id OR email = auth.email() OR uuid = auth.uid()::text
```

### 管理员可以读取所有数据
- Policy name: 管理员可以读取所有数据
- Policy definition: ALL
- Target roles: authenticated
- Using expression:
```sql
auth.uid() IN (SELECT id FROM users WHERE is_admin = true)