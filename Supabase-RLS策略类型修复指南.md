# Supabase RLS策略类型修复指南

## 错误问题

在配置RLS策略时，出现了以下错误：

```
ERROR:  operator does not exist: uuid = bigint
HINT:  No operator matches the given name and argument types. You might need to add explicit type casts.
```

这个错误表明在RLS策略中存在类型不匹配的问题。具体来说，`auth.uid()`返回的是UUID类型，而表中的`id`字段可能是bigint类型，这两种类型不能直接比较。

## 解决方案

我们需要修改RLS策略表达式，添加适当的类型转换。以下是修复后的策略表达式：

### 用户可以读取自己的数据
```sql
auth.uid()::text = uuid::text OR email = auth.email() OR uuid = auth.uid()::text
```

### 用户可以更新自己的数据
```sql
auth.uid()::text = uuid::text OR email = auth.email() OR uuid = auth.uid()::text
```

### 管理员可以读取所有数据
```sql
auth.uid()::text IN (SELECT uuid::text FROM users WHERE is_admin = true)
```

## 表结构分析

根据错误信息，我们可以推断出你的users表可能有以下结构：

- `id`: bigint类型（主键）
- `uuid`: uuid或text类型（用户唯一标识符）
- `email`: text类型（用户邮箱）

## 修复步骤

### 1. 确认表结构

首先，我们需要确认users表的确切结构。在SQL编辑器中执行以下查询：

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### 2. 根据表结构修改策略

根据表结构的实际情况，选择以下方案之一：

#### 方案A：如果users表中有uuid字段

```sql
-- 读取策略
CREATE POLICY "用户可以读取自己的数据" ON public.users
FOR SELECT USING (
  uuid = auth.uid()::text OR email = auth.email()
);

-- 更新策略
CREATE POLICY "用户可以更新自己的数据" ON public.users
FOR UPDATE USING (
  uuid = auth.uid()::text OR email = auth.email()
)
WITH CHECK (
  uuid = auth.uid()::text OR email = auth.email()
);

-- 管理员策略
CREATE POLICY "管理员可以读取所有数据" ON public.users
FOR ALL USING (
  auth.uid()::text IN (SELECT uuid FROM users WHERE is_admin = true)
);
```

#### 方案B：如果users表中没有uuid字段，只有id字段

```sql
-- 读取策略
CREATE POLICY "用户可以读取自己的数据" ON public.users
FOR SELECT USING (
  id::text = auth.uid()::text OR email = auth.email()
);

-- 更新策略
CREATE POLICY "用户可以更新自己的数据" ON public.users
FOR UPDATE USING (
  id::text = auth.uid()::text OR email = auth.email()
)
WITH CHECK (
  id::text = auth.uid()::text OR email = auth.email()
);

-- 管理员策略
CREATE POLICY "管理员可以读取所有数据" ON public.users
FOR ALL USING (
  auth.uid()::text IN (SELECT id::text FROM users WHERE is_admin = true)
);
```

### 3. 验证策略

修改策略后，执行以下查询来验证策略是否已正确设置：

```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 完整的修复SQL脚本

```sql
-- 删除可能存在的冲突策略
DROP POLICY IF EXISTS "用户可以读取自己的数据" ON public.users;
DROP POLICY IF EXISTS "用户可以更新自己的数据" ON public.users;
DROP POLICY IF EXISTS "管理员可以读取所有数据" ON public.users;

-- 创建读取策略（根据实际表结构选择方案A或B）
CREATE POLICY "用户可以读取自己的数据" ON public.users
FOR SELECT USING (
  uuid = auth.uid()::text OR email = auth.email()
);

-- 创建更新策略
CREATE POLICY "用户可以更新自己的数据" ON public.users
FOR UPDATE USING (
  uuid = auth.uid()::text OR email = auth.email()
)
WITH CHECK (
  uuid = auth.uid()::text OR email = auth.email()
);

-- 创建管理员策略
CREATE POLICY "管理员可以读取所有数据" ON public.users
FOR ALL USING (
  auth.uid()::text IN (SELECT uuid FROM users WHERE is_admin = true)
);

-- 验证策略
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 注意事项

1. 确保在执行修复脚本前备份数据库
2. 根据实际表结构选择正确的方案
3. 如果仍然遇到问题，可能需要检查auth.users表和public.users表之间的关系