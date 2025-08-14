-- 原子化获取或创建用户函数
-- 这个函数解决了用户创建延迟和数据库表未增加数据的问题
-- 在 Supabase SQL Editor 中执行

-- 删除可能存在的同名函数以避免冲突
DROP FUNCTION IF EXISTS get_or_create_user;
DROP FUNCTION IF EXISTS atomic_get_or_create_user;

-- 创建原子化获取或创建用户函数，使用更明确的名称
CREATE OR REPLACE FUNCTION atomic_get_or_create_user(
    p_google_id TEXT,
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_initial_credits INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_user_record JSONB;
    v_uuid TEXT;
    v_user_exists BOOLEAN;
    v_credits INTEGER;
BEGIN
    -- 生成一个UUID，如果不存在
    v_uuid := gen_random_uuid()::TEXT;
    
    -- 使用事务确保原子性
    BEGIN
        -- 检查用户是否已存在
        SELECT 
            jsonb_build_object(
                'id', id,
                'uuid', uuid,
                'google_id', google_id,
                'email', email,
                'name', name,
                'avatar_url', avatar_url,
                'credits', credits,
                'subscription_status', subscription_status,
                'is_signed_in', is_signed_in,
                'created_at', created_at,
                'updated_at', updated_at,
                'user_exists', true
            ),
            true,
            credits
        INTO v_user_record, v_user_exists, v_credits
        FROM users
        WHERE google_id = p_google_id
        LIMIT 1;
        
        -- 如果用户不存在，创建新用户
        IF v_user_record IS NULL THEN
            INSERT INTO users (
                uuid,
                google_id,
                email,
                name,
                avatar_url,
                credits,
                subscription_status,
                is_signed_in,
                last_seen_at,
                created_at,
                updated_at
            ) VALUES (
                v_uuid,
                p_google_id,
                p_email,
                p_name,
                p_avatar_url,
                p_initial_credits,
                'FREE',
                true,
                NOW(),
                NOW(),
                NOW()
            )
            RETURNING 
                jsonb_build_object(
                    'id', id,
                    'uuid', uuid,
                    'google_id', google_id,
                    'email', email,
                    'name', name,
                    'avatar_url', avatar_url,
                    'credits', credits,
                    'subscription_status', subscription_status,
                    'is_signed_in', is_signed_in,
                    'created_at', created_at,
                    'updated_at', updated_at,
                    'user_exists', false
                )
            INTO v_user_record;
            
            -- 记录新用户积分交易
            IF p_initial_credits > 0 THEN
                INSERT INTO credit_transactions (
                    user_uuid,
                    transaction_type,
                    amount,
                    balance_after,
                    description,
                    source,
                    created_at
                ) VALUES (
                    v_uuid,
                    'EARN',
                    p_initial_credits,
                    p_initial_credits,
                    '新用户奖励',
                    'signup_bonus',
                    NOW()
                );
            END IF;
        ELSE
            -- 更新现有用户的登录状态和最后访问时间
            UPDATE users
            SET 
                is_signed_in = true,
                last_seen_at = NOW(),
                updated_at = NOW(),
                -- 如果用户名或头像为空，则更新
                name = COALESCE(name, p_name),
                avatar_url = COALESCE(avatar_url, p_avatar_url)
            WHERE google_id = p_google_id;
        END IF;
        
        -- 提交事务
        RETURN v_user_record;
    EXCEPTION WHEN OTHERS THEN
        -- 回滚事务并返回错误
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 测试函数
COMMENT ON FUNCTION atomic_get_or_create_user IS '
原子化获取或创建用户函数。
这个函数解决了用户创建延迟和数据库表未增加数据的问题。
它确保用户记录在单个事务中被创建或更新，避免竞态条件。
';

-- 创建一个RPC端点，允许从前端调用此函数
DROP FUNCTION IF EXISTS public.rpc_get_or_create_user;
CREATE OR REPLACE FUNCTION public.rpc_get_or_create_user(
    p_google_id TEXT,
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_initial_credits INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
BEGIN
    -- 调用内部函数并返回结果
    RETURN atomic_get_or_create_user(p_google_id, p_email, p_name, p_avatar_url, p_initial_credits);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为RPC函数添加注释
COMMENT ON FUNCTION public.rpc_get_or_create_user IS '
RPC端点，用于从前端调用atomic_get_or_create_user函数。
这个函数可以通过Supabase客户端的rpc方法调用。
';

-- 验证函数创建
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('get_or_create_user', 'rpc_get_or_create_user');

SELECT 'Atomic user creation functions created successfully!' as status;