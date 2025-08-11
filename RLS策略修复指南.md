# RLS策略修复指南

## 问题描述
用户登录后无法正确读取自己的积分数据，这可能是由于Row Level Security (RLS)策略配置不正确导致的。

## 什么是RLS?
Row Level Security (RLS) 是Supabase/PostgreSQL的一个安全功能，它允许我们限制哪些行可以被特定用户查询、插入、更新或删除。

## 解决方案
我们需要确保用户可以读取和更新自己的数据，同时保护其他用户的数据不被未授权访问。

## 实现步骤

### 1. 登录Supabase管理界面
访问 https://app.supabase.io/ 并登录你的账户。

### 2. 选择你的项目
在项目列表中选择你的项目。

### 3. 进入Table Editor
在左侧菜单中点击"Table Editor"。

### 4. 选择users表
在表列表中找到并点击"users"表。

### 5. 进入Policies标签
点击"Policies"标签。

### 6. 启用RLS
如果RLS尚未启用，点击"Enable RLS"按钮启用它。

### 7. 添加策略
点击"Add Policy"按钮，然后选择"Create a policy from scratch"。

### 8. 配置读取策略
- Policy name: 用户可以读取自己的数据
- Policy definition: 选择"SELECT"
- Using expression: 输入以下表达式:
```sql
auth.uid() = id OR email = auth.email() OR uuid = auth.uid()::text
```

### 9. 配置更新策略
重复步骤7，然后:
- Policy name: 用户可以更新自己的数据
- Policy definition: 选择"UPDATE"
- Using expression: 输入与读取策略相同的表达式
- With check expression: 输入与读取策略相同的表达式

### 10. 配置管理员策略(可选)
如果你有管理员角色，可以添加管理员策略:
- Policy name: 管理员可以读取所有数据
- Policy definition: 选择"ALL"
- Using expression: 输入以下表达式:
```sql
auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
```

### 11. 验证策略
保存策略后，你可以在SQL编辑器中执行以下查询来验证策略是否已正确设置:
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 使用SQL脚本
如果你有权限直接执行SQL，可以使用`fix-rls-policies.sql`脚本来设置这些策略。

## 测试方法
1. 登出并重新登录应用
2. 检查前端是否能正确显示积分
3. 尝试访问其他用户的数据，确认无法访问

## 常见问题

### 策略设置后仍然无法读取数据
- 确认RLS已启用
- 检查策略表达式是否正确
- 验证用户认证是否正常工作

### 错误消息: "new row violates row-level security policy"
- 检查更新策略的With check表达式
- 确保用户有权限更新自己的数据

### 管理员无法访问所有数据
- 确认管理员策略已正确设置
- 验证管理员用户的is_admin字段值为true

## 进阶配置

### 添加更细粒度的控制
你可以为不同的列设置不同的访问权限:

```sql
CREATE POLICY "用户只能读取非敏感数据" ON public.users
FOR SELECT USING (true)
WITH CHECK (true);

CREATE POLICY "用户只能读取自己的敏感数据" ON public.users
FOR SELECT USING (
  auth.uid() = id OR
  email = auth.email()
)
WITH CHECK (
  auth.uid() = id OR
  email = auth.email()
);
```

### 使用安全定义函数
对于复杂的权限逻辑，可以使用安全定义函数:

```sql
CREATE OR REPLACE FUNCTION public.user_can_access_data(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
END;
$$;

CREATE POLICY "基于函数的访问控制" ON public.users
FOR SELECT USING (user_can_access_data(id));