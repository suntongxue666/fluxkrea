-- 简化版RLS策略，确保用户可以读取自己的积分
-- 移除管理员策略，只保留基本的用户数据访问策略

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

-- 验证策略
SELECT * FROM pg_policies WHERE tablename = 'users';