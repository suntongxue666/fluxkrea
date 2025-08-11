-- 全面解决方案：同时解决数据写入和前端显示问题
-- 这个脚本提供了一个综合性的解决方案，确保用户数据正确写入数据库，并且前端能够正确显示积分

-- 第一部分：修复数据库结构和触发器

-- 1. 检查并修复users表结构
DO $$
BEGIN
  -- 确保users表有正确的结构
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- 确保必要的列存在
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'credits') THEN
      ALTER TABLE public.users ADD COLUMN credits INTEGER DEFAULT 20;
    END IF;
  END IF;
END $$;

-- 2. 删除可能存在的旧触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. 创建新的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_exists BOOLEAN;
  user_id BIGINT;
BEGIN
  -- 检查用户是否已存在
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE uuid = NEW.id::text OR email = NEW.email
  ) INTO user_exists;
  
  -- 如果用户不存在，则创建
  IF NOT user_exists THEN
    INSERT INTO public.users (
      uuid,
      email,
      name,
      avatar_url,
      credits,
      total_credits_earned,
      total_credits_used,
      is_signed_in,
      google_id,
      subscription_status,
      created_at,
      updated_at,
      last_seen_at
    )
    VALUES (
      NEW.id::text,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
      20, -- 默认赠送20积分
      20, -- 总共获得的积分
      0,  -- 已使用的积分
      true,
      CASE 
        WHEN NEW.raw_user_meta_data->>'provider' = 'google' THEN NEW.raw_user_meta_data->>'sub'
        ELSE NULL
      END,
      'FREE',
      NEW.created_at,
      NEW.updated_at,
      NOW()
    )
    RETURNING id INTO user_id;
    
    -- 为新用户创建积分交易记录
    INSERT INTO public.credit_transactions (
      user_uuid,
      transaction_type,
      amount,
      balance_after,
      description,
      source
    )
    VALUES (
      NEW.id::text,
      'EARN',
      20,
      20,
      '首次登录奖励',
      'first_login_bonus'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建新触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 第二部分：修复RLS策略，确保前端可以读取积分数据

-- 1. 启用RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能存在的冲突策略
DROP POLICY IF EXISTS "用户可以读取自己的数据" ON public.users;
DROP POLICY IF EXISTS "用户可以更新自己的数据" ON public.users;
DROP POLICY IF EXISTS "管理员可以读取所有数据" ON public.users;

-- 3. 创建新的RLS策略
CREATE POLICY "用户可以读取自己的数据" ON public.users
FOR SELECT USING (
  auth.uid()::text = uuid OR auth.email() = email
);

CREATE POLICY "用户可以更新自己的数据" ON public.users
FOR UPDATE USING (
  auth.uid()::text = uuid OR auth.email() = email
)
WITH CHECK (
  auth.uid()::text = uuid OR auth.email() = email
);

-- 第三部分：创建API函数，确保前端可以获取用户数据

-- 1. 创建获取当前用户数据的函数
CREATE OR REPLACE FUNCTION public.get_my_user_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id TEXT;
  current_user_email TEXT;
  user_data JSONB;
BEGIN
  -- 获取当前用户ID和邮箱
  current_user_id := auth.uid()::text;
  current_user_email := auth.email();
  
  -- 查询用户数据
  SELECT 
    jsonb_build_object(
      'id', id,
      'uuid', uuid,
      'email', email,
      'name', name,
      'avatar_url', avatar_url,
      'credits', credits,
      'subscription_status', subscription_status,
      'created_at', created_at
    )
  INTO user_data
  FROM public.users
  WHERE uuid = current_user_id OR email = current_user_email;
  
  -- 如果没有找到用户，返回空对象
  IF user_data IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  RETURN user_data;
END;
$$;

-- 2. 创建获取用户积分的函数
CREATE OR REPLACE FUNCTION public.get_my_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id TEXT;
  current_user_email TEXT;
  user_credits INTEGER;
BEGIN
  -- 获取当前用户ID和邮箱
  current_user_id := auth.uid()::text;
  current_user_email := auth.email();
  
  -- 查询用户积分
  SELECT credits INTO user_credits
  FROM public.users
  WHERE uuid = current_user_id OR email = current_user_email;
  
  -- 如果没有找到用户，返回0
  IF user_credits IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN user_credits;
END;
$$;

-- 第四部分：同步现有用户数据

-- 1. 同步auth.users到public.users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT * FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE uuid = auth_user.id::text OR email = auth_user.email
    )
  LOOP
    -- 创建用户记录
    INSERT INTO public.users (
      uuid,
      email,
      name,
      avatar_url,
      credits,
      total_credits_earned,
      total_credits_used,
      is_signed_in,
      google_id,
      subscription_status,
      created_at,
      updated_at,
      last_seen_at
    )
    VALUES (
      auth_user.id::text,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.raw_user_meta_data->>'name', ''),
      COALESCE(auth_user.raw_user_meta_data->>'avatar_url', ''),
      20, -- 默认赠送20积分
      20, -- 总共获得的积分
      0,  -- 已使用的积分
      true,
      CASE 
        WHEN auth_user.raw_user_meta_data->>'provider' = 'google' THEN auth_user.raw_user_meta_data->>'sub'
        ELSE NULL
      END,
      'FREE',
      auth_user.created_at,
      auth_user.updated_at,
      NOW()
    );
    
    -- 为用户创建积分交易记录
    INSERT INTO public.credit_transactions (
      user_uuid,
      transaction_type,
      amount,
      balance_after,
      description,
      source
    )
    VALUES (
      auth_user.id::text,
      'EARN',
      20,
      20,
      '首次登录奖励',
      'first_login_bonus'
    );
  END LOOP;
END $$;

-- 2. 修复特定用户的积分
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- 查找特定用户
  FOR user_record IN 
    SELECT * FROM public.users 
    WHERE email IN ('tiktreeapp@gmail.com', 'sunwei7482@gmail.com')
  LOOP
    -- 确保用户有至少20积分
    IF user_record.credits < 20 THEN
      -- 更新积分
      UPDATE public.users
      SET 
        credits = 20,
        total_credits_earned = GREATEST(total_credits_earned, 20),
        updated_at = NOW()
      WHERE id = user_record.id;
      
      -- 添加积分交易记录
      INSERT INTO public.credit_transactions (
        user_uuid,
        transaction_type,
        amount,
        balance_after,
        description,
        source
      )
      VALUES (
        user_record.uuid,
        'EARN',
        20 - user_record.credits,
        20,
        '积分修复',
        'credits_fix'
      );
    END IF;
  END LOOP;
END $$;

-- 第五部分：验证结果

-- 1. 验证触发器
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- 2. 验证RLS策略
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 3. 验证API函数
SELECT pg_get_functiondef('public.get_my_user_data()'::regprocedure);
SELECT pg_get_functiondef('public.get_my_credits()'::regprocedure);

-- 4. 验证用户数据
SELECT 
  'auth.users' AS table_name,
  COUNT(*) AS user_count
FROM auth.users
UNION ALL
SELECT 
  'public.users' AS table_name,
  COUNT(*) AS user_count
FROM public.users;

-- 5. 验证特定用户
SELECT 
  email,
  credits,
  subscription_status,
  created_at
FROM public.users
WHERE email IN ('tiktreeapp@gmail.com', 'sunwei7482@gmail.com');