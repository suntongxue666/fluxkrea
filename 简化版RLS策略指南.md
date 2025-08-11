# 简化版RLS策略指南

## 问题描述

在执行之前的RLS策略脚本时，出现了错误：
```
ERROR: 42703: column "is_admin" does not exist
```

这表明users表中没有is_admin字段，因此管理员策略无法创建。

## 解决方案

我们创建了一个简化版的RLS策略脚本，只包含基本的用户数据访问策略，移除了管理员策略。这个简化版脚本应该能够解决前端显示积分余额与数据库不一致的问题。

## 实施步骤

1. 登录Supabase管理界面
2. 进入SQL编辑器
3. 执行`fix-rls-policies-simple.sql`脚本

## 策略详解

1. **用户可以读取自己的数据**
   - 使用`email = auth.email()`进行匹配
   - 这是最可靠的方式，因为email在auth系统和用户表中都存在

2. **用户可以更新自己的数据**
   - 同样使用email进行匹配
   - 确保用户只能更新自己的数据

## 验证方法

执行以下SQL查询来验证策略是否已正确设置：

```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 测试方法

1. 登出并重新登录应用
2. 检查前端是否能正确显示积分
3. 尝试访问其他用户的数据，确认无法访问

## 如果需要管理员权限

如果后续需要添加管理员权限，可以根据实际表结构添加管理员策略。例如，如果表中有`is_super_admin`字段，可以使用以下SQL：

```sql
CREATE POLICY "管理员可以读取所有数据" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.is_super_admin = true
  )
);
```

## 注意事项

1. 这个简化版脚本只解决了基本的用户数据访问问题
2. 如果需要更复杂的权限控制，需要根据实际需求和表结构进行调整
3. 确保在执行脚本前备份数据库