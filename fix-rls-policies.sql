-- 修复RLS策略，确保用户可以读取自己的积分

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的冲突策略
DROP POLICY IF EXISTS "用户可以读取自己的数据" ON public.users;
DROP POLICY IF EXISTS "用户可以更新自己的数据" ON public.users;
DROP POLICY IF EXISTS "管理员可以读取所有数据" ON public.users;

-- 创建读取策略
CREATE POLICY "用户可以读取自己的数据" ON public.users
FOR SELECT USING (
  auth.uid() = id OR
  email = auth.email() OR
  uuid = auth.uid()::text
);

-- 创建更新策略
CREATE POLICY "用户可以更新自己的数据" ON public.users
FOR UPDATE USING (
  auth.uid() = id OR
  email = auth.email() OR
  uuid = auth.uid()::text
)
WITH CHECK (
  auth.uid() = id OR
  email = auth.email() OR
  uuid = auth.uid()::text
);

-- 创建管理员策略
CREATE POLICY "管理员可以读取所有数据" ON public.users
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- 验证策略
SELECT * FROM pg_policies WHERE tablename = 'users';