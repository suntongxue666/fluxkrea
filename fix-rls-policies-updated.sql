-- 修复RLS策略，确保用户可以读取自己的积分
-- 修复类型不匹配问题

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的冲突策略
DROP POLICY IF EXISTS "用户可以读取自己的数据" ON public.users;
DROP POLICY IF EXISTS "用户可以更新自己的数据" ON public.users;
DROP POLICY IF EXISTS "管理员可以读取所有数据" ON public.users;

-- 创建读取策略（使用类型转换解决uuid和bigint不匹配问题）
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

-- 创建管理员策略（如果有is_admin字段）
-- 如果没有is_admin字段，请注释掉这部分
CREATE POLICY "管理员可以读取所有数据" ON public.users
FOR ALL USING (
  auth.uid()::text IN (SELECT uuid FROM users WHERE is_admin = true)
);

-- 验证策略
SELECT * FROM pg_policies WHERE tablename = 'users';