-- 用户系统数据库迁移脚本 - 支持Google用户ID为主要标识
-- 创建时间: 2025-08-07

-- 1. 为users表添加Google相关字段（如果不存在的话）
DO $$
BEGIN
    -- 检查并添加google_id字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'google_id'
    ) THEN
        ALTER TABLE users ADD COLUMN google_id TEXT;
        CREATE INDEX idx_users_google_id ON users(google_id);
    END IF;
    
    -- 检查并添加email字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email TEXT;
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    
    -- 检查并添加name字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name TEXT;
    END IF;
    
    -- 检查并添加avatar_url字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- 检查并添加is_signed_in字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_signed_in'
    ) THEN
        ALTER TABLE users ADD COLUMN is_signed_in BOOLEAN DEFAULT false;
        CREATE INDEX idx_users_is_signed_in ON users(is_signed_in);
    END IF;
END $$;

-- 2. 创建新的用户积分系统（如果表不存在的话）
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    uuid TEXT UNIQUE NOT NULL,
    google_id TEXT UNIQUE,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    user_identifier TEXT UNIQUE NOT NULL,
    fingerprint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    language TEXT,
    platform TEXT,
    timezone TEXT,
    screen_resolution TEXT,
    
    -- 积分相关字段
    credits INTEGER DEFAULT 20,
    total_credits_earned INTEGER DEFAULT 20,
    total_credits_used INTEGER DEFAULT 0,
    
    -- 用户状态
    is_signed_in BOOLEAN DEFAULT false,
    
    -- 统计字段
    images_generated INTEGER DEFAULT 0,
    daily_generation_count INTEGER DEFAULT 0,
    last_generation_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建积分交易记录表（如果不存在的话）
CREATE TABLE IF NOT EXISTS credit_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    user_uuid TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('EARN', 'SPEND')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    source TEXT, -- signup_bonus, generation, refund, admin_adjustment等
    related_resource_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建图像生成记录表（如果不存在的话）
CREATE TABLE IF NOT EXISTS image_generations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    user_uuid TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_size TEXT,
    inference_steps INTEGER,
    credits_cost INTEGER DEFAULT 10,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    image_url TEXT,
    generation_time_ms INTEGER,
    api_request_id TEXT,
    error_message TEXT,
    was_refunded BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. 创建系统设置表（如果不存在的话）
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 插入默认系统设置
INSERT INTO system_settings (key, value, data_type, description, is_public)
VALUES 
    ('default_credits', '20', 'integer', '新用户默认积分', true),
    ('generation_cost', '10', 'integer', '单次生成图像消耗积分', true),
    ('daily_free_credits', '5', 'integer', '每日免费积分', true),
    ('max_daily_generations', '10', 'integer', '每日最大生成次数', true),
    ('maintenance_mode', 'false', 'boolean', '维护模式开关', true),
    ('welcome_message', 'Welcome to Flux Krea AI!', 'string', '欢迎消息', true)
ON CONFLICT (key) DO NOTHING;

-- 7. 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON users(fingerprint);
CREATE INDEX IF NOT EXISTS idx_users_is_signed_in ON users(is_signed_in);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_uuid ON credit_transactions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON image_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_user_uuid ON image_generations(user_uuid);
CREATE INDEX IF NOT EXISTS idx_image_generations_status ON image_generations(status);
CREATE INDEX IF NOT EXISTS idx_image_generations_created_at ON image_generations(created_at);

-- 8. 创建RLS（行级安全）策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的记录（基于UUID或Google ID）
CREATE POLICY "Users can view own records" ON users
    FOR SELECT USING (
        uuid = current_setting('app.current_user_uuid', true) OR
        google_id = current_setting('app.current_user_google_id', true)
    );

CREATE POLICY "Users can update own records" ON users
    FOR UPDATE USING (
        uuid = current_setting('app.current_user_uuid', true) OR
        google_id = current_setting('app.current_user_google_id', true)
    );

-- 积分交易记录策略
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
    FOR SELECT USING (user_uuid = current_setting('app.current_user_uuid', true));

-- 图像生成记录策略
CREATE POLICY "Users can view own generations" ON image_generations
    FOR SELECT USING (user_uuid = current_setting('app.current_user_uuid', true));

-- 9. 创建触发器以自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. 创建用于设置用户上下文的函数
CREATE OR REPLACE FUNCTION set_user_context(user_uuid TEXT DEFAULT NULL, user_google_id TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    IF user_uuid IS NOT NULL THEN
        PERFORM set_config('app.current_user_uuid', user_uuid, true);
    END IF;
    
    IF user_google_id IS NOT NULL THEN
        PERFORM set_config('app.current_user_google_id', user_google_id, true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 为匿名用户创建特殊策略
CREATE POLICY "Anonymous users can insert records" ON users
    FOR INSERT WITH CHECK (is_signed_in = false);

CREATE POLICY "Anonymous users can view by fingerprint" ON users
    FOR SELECT USING (
        is_signed_in = false AND 
        fingerprint = current_setting('app.current_fingerprint', true)
    );

-- 12. 创建清理过期数据的函数
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- 删除30天前的匿名用户记录（积分为0且未生成图像）
    DELETE FROM users 
    WHERE is_signed_in = false 
        AND credits = 0 
        AND images_generated = 0 
        AND created_at < NOW() - INTERVAL '30 days';
        
    -- 删除90天前的图像生成记录（仅删除失败的记录）
    DELETE FROM image_generations 
    WHERE status = 'failed' 
        AND created_at < NOW() - INTERVAL '90 days';
        
    -- 删除180天前的积分交易记录
    DELETE FROM credit_transactions 
    WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- 创建定期清理任务（需要pg_cron扩展）
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- 完成迁移
SELECT 'Database migration completed successfully!' as result;