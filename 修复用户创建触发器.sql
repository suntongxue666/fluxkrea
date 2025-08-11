-- 修复用户创建触发器
-- 这个脚本会创建或更新从auth.users到public.users的触发器

-- 检查users表是否存在
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    -- 创建users表
    CREATE TABLE public.users (
      id BIGSERIAL PRIMARY KEY,
      uuid TEXT NOT NULL UNIQUE,
      user_identifier TEXT,
      fingerprint TEXT,
      ip_address TEXT,
      user_agent TEXT,
      language TEXT,
      platform TEXT,
      timezone TEXT,
      screen_resolution TEXT,
      canvas_fingerprint TEXT,
      credits INTEGER DEFAULT 20,
      total_credits_earned INTEGER DEFAULT 20,
      total_credits_used INTEGER DEFAULT 0,
      is_signed_in BOOLEAN DEFAULT true,
      google_id TEXT,
      email TEXT,
      name TEXT,
      avatar_url TEXT,
      images_generated INTEGER DEFAULT 0,
      last_generation_at TIMESTAMP WITH TIME ZONE,
      daily_generation_count INTEGER DEFAULT 0,
      daily_reset_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      current_subscription_id TEXT,
      subscription_status TEXT DEFAULT 'FREE',
      subscription_credits_remaining INTEGER DEFAULT 0,
      subscription_renewal_date TIMESTAMP WITH TIME ZONE
    );
    
    -- 添加索引
    CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
    CREATE INDEX IF NOT EXISTS users_uuid_idx ON public.users (uuid);
  END IF;
END $$;

-- 检查credit_transactions表是否存在
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'credit_transactions'
  ) THEN
    -- 创建credit_transactions表
    CREATE TABLE public.credit_transactions (
      id BIGSERIAL PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      description TEXT,
      source TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- 添加索引
    CREATE INDEX IF NOT EXISTS credit_transactions_user_uuid_idx ON public.credit_transactions (user_uuid);
  END IF;
END $$;

-- 创建或替换触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_exists BOOLEAN;
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
    );
    
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

-- 检查触发器是否存在，如果存在则删除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 同步现有用户
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT * FROM auth.users
  LOOP
    -- 检查用户是否已存在于public.users表中
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE uuid = auth_user.id::text OR email = auth_user.email) THEN
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
    END IF;
  END LOOP;
END $$;

-- 验证触发器
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_schema = 'auth';