-- 最终修复RLS策略，确保用户可以读取自己的积分
-- 根据实际表结构调整

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的冲突策略
DROP POLICY IF EXISTS "用户可以读取自己的数据" ON public.users;
DROP POLICY IF EXISTS "用户可以更新自己的数据" ON public.users;
DROP POLICY IF EXISTS "管理员可以读取所有数据" ON public.users;

-- 创建读取策略（使用email匹配，这是最可靠的方式）
CREATE POLICY "用户可以读取自己的数据" ON public.users
FOR SELECT USING (
  email = auth.email()
);

-- 创建更新策略
CREATE POLICY "用户可以更新自己的数据" ON public.users
FOR UPDATE USING (
  email = auth.email()
)
WITH CHECK (
  email = auth.email()
);

-- 创建管理员策略
-- 注意：根据表结构，没有看到is_admin字段，所以使用is_super_admin代替
CREATE POLICY "管理员可以读取所有数据" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.is_super_admin = true
  )
);

-- 验证策略
SELECT * FROM pg_policies WHERE tablename = 'users';