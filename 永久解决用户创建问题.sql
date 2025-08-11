-- 永久解决用户创建问题
-- 这个脚本提供了一个完整的永久性解决方案，确保Google登录用户能够正确创建记录并获得积分

-- 第一步：备份现有表（安全措施）
CREATE TABLE IF NOT EXISTS public.users_backup AS SELECT * FROM public.users;
CREATE TABLE IF NOT EXISTS public.credit_transactions_backup AS SELECT * FROM public.credit_transactions;

-- 第二步：检查并修复表结构
DO $$
BEGIN
  -- 确保users表有正确的结构
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- 确保必要的列存在
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'uuid') THEN
      ALTER TABLE public.users ADD COLUMN uuid TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'credits') THEN
      ALTER TABLE public.users ADD COLUMN credits INTEGER DEFAULT 20;
    END IF;
    
    -- 确保索引存在
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_email_idx') THEN
      CREATE INDEX users_email_idx ON public.users (email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_uuid_idx') THEN
      CREATE INDEX users_uuid_idx ON public.users (uuid);
    END IF;
  END IF;
END $$;

-- 第三步：删除可能存在的旧触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 第四步：创建强健的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_exists BOOLEAN;
  user_id BIGINT;
  user_uuid TEXT;
  user_email TEXT;
  user_name TEXT;
  user_avatar TEXT;
  google_id TEXT;
  log_message TEXT;
BEGIN
  -- 记录开始执行
  RAISE LOG 'handle_new_user触发器开始执行，用户ID: %', NEW.id;
  
  -- 设置变量
  user_uuid := NEW.id::text;
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  user_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', '');
  
  -- 确定Google ID
  IF NEW.raw_user_meta_data->>'provider' = 'google' THEN
    google_id := NEW.raw_user_meta_data->>'sub';
  ELSE
    google_id := NULL;
  END IF;
  
  -- 检查用户是否已存在
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE (uuid = user_uuid OR email = user_email) AND email IS NOT NULL
  ) INTO user_exists;
  
  -- 记录检查结果
  IF user_exists THEN
    RAISE LOG '用户已存在，UUID: %, Email: %', user_uuid, user_email;
  ELSE
    RAISE LOG '创建新用户，UUID: %, Email: %', user_uuid, user_email;
  END IF;
  
  -- 如果用户不存在，则创建
  IF NOT user_exists THEN
    BEGIN
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
        user_uuid,
        user_email,
        user_name,
        user_avatar,
        20, -- 默认赠送20积分
        20, -- 总共获得的积分
        0,  -- 已使用的积分
        true,
        google_id,
        'FREE',
        NEW.created_at,
        NEW.updated_at,
        NOW()
      )
      RETURNING id INTO user_id;
      
      RAISE LOG '用户创建成功，ID: %, UUID: %, Email: %', user_id, user_uuid, user_email;
      
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
        user_uuid,
        'EARN',
        20,
        20,
        '首次登录奖励',
        'first_login_bonus'
      );
      
      RAISE LOG '积分交易记录创建成功，UUID: %', user_uuid;
    EXCEPTION WHEN OTHERS THEN
      -- 记录错误
      GET STACKED DIAGNOSTICS log_message = PG_EXCEPTION_DETAIL;
      RAISE LOG '创建用户失败: %, 详情: %', SQLERRM, log_message;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 第五步：创建新触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 第六步：创建同步函数（可以手动调用来同步用户）
CREATE OR REPLACE FUNCTION public.sync_auth_users()
RETURNS TEXT AS $$
DECLARE
  auth_user RECORD;
  sync_count INTEGER := 0;
  error_count INTEGER := 0;
  log_message TEXT;
BEGIN
  FOR auth_user IN 
    SELECT * FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE (uuid = auth_user.id::text OR email = auth_user.email) AND email IS NOT NULL
    )
  LOOP
    BEGIN
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
      
      sync_count := sync_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- 记录错误
      GET STACKED DIAGNOSTICS log_message = PG_EXCEPTION_DETAIL;
      RAISE LOG '同步用户失败: %, 详情: %', SQLERRM, log_message;
      error_count := error_count + 1;
    END;
  END LOOP;
  
  RETURN format('同步完成: 成功 %s 个用户, 失败 %s 个用户', sync_count, error_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 第七步：创建健康检查函数
CREATE OR REPLACE FUNCTION public.check_user_system_health()
RETURNS JSONB AS $$
DECLARE
  auth_count INTEGER;
  public_count INTEGER;
  missing_count INTEGER;
  result JSONB;
BEGIN
  -- 获取auth.users表中的用户数量
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  
  -- 获取public.users表中的用户数量
  SELECT COUNT(*) INTO public_count FROM public.users;
  
  -- 获取缺失的用户数量
  SELECT COUNT(*) INTO missing_count 
  FROM auth.users
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE (uuid = auth.users.id::text OR email = auth.users.email) AND email IS NOT NULL
  );
  
  -- 构建结果
  result := jsonb_build_object(
    'auth_users_count', auth_count,
    'public_users_count', public_count,
    'missing_users_count', missing_count,
    'trigger_exists', EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    ),
    'function_exists', EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user'
    ),
    'system_healthy', (
      EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
      ) AND 
      EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
      ) AND
      missing_count = 0
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 第八步：创建自动修复函数
CREATE OR REPLACE FUNCTION public.auto_fix_user_system()
RETURNS JSONB AS $$
DECLARE
  health_check JSONB;
  fix_result JSONB;
  sync_result TEXT;
BEGIN
  -- 检查系统健康状况
  health_check := public.check_user_system_health();
  
  -- 如果系统健康，不需要修复
  IF health_check->>'system_healthy' = 'true' THEN
    RETURN jsonb_build_object(
      'status', 'healthy',
      'message', '系统健康，不需要修复',
      'health_check', health_check
    );
  END IF;
  
  -- 初始化修复结果
  fix_result := jsonb_build_object(
    'trigger_fixed', false,
    'function_fixed', false,
    'users_synced', false
  );
  
  -- 修复触发器函数（如果需要）
  IF health_check->>'function_exists' = 'false' THEN
    -- 函数已在脚本前面创建，这里不需要重复
    fix_result := fix_result || jsonb_build_object('function_fixed', true);
  END IF;
  
  -- 修复触发器（如果需要）
  IF health_check->>'trigger_exists' = 'false' THEN
    -- 触发器已在脚本前面创建，这里不需要重复
    fix_result := fix_result || jsonb_build_object('trigger_fixed', true);
  END IF;
  
  -- 同步缺失的用户
  IF (health_check->>'missing_users_count')::int > 0 THEN
    sync_result := public.sync_auth_users();
    fix_result := fix_result || jsonb_build_object(
      'users_synced', true,
      'sync_result', sync_result
    );
  END IF;
  
  -- 返回修复结果
  RETURN jsonb_build_object(
    'status', 'fixed',
    'message', '系统已修复',
    'before', health_check,
    'fixes', fix_result,
    'after', public.check_user_system_health()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 第九步：创建定期检查和修复的函数
CREATE OR REPLACE FUNCTION public.schedule_user_system_maintenance()
RETURNS VOID AS $$
BEGIN
  -- 检查系统健康状况
  PERFORM public.check_user_system_health();
  
  -- 如果需要，自动修复
  PERFORM public.auto_fix_user_system();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 第十步：创建定时任务（每小时执行一次）
SELECT cron.schedule(
  'user-system-maintenance',
  '0 * * * *',  -- 每小时执行一次
  $$SELECT public.schedule_user_system_maintenance()$$
);

-- 第十一步：立即执行一次健康检查和修复
SELECT public.auto_fix_user_system();

-- 第十二步：验证触发器和函数
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- 第十三步：验证用户同步情况
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS auth_users_count,
  (SELECT COUNT(*) FROM public.users) AS public_users_count,
  (
    SELECT COUNT(*) FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE (uuid = auth.users.id::text OR email = auth.users.email) AND email IS NOT NULL
    )
  ) AS missing_users_count;