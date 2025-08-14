-- 修复 users 表结构
-- 在 Supabase SQL Editor 中执行

-- 1. 检查当前 users 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 如果缺少 id 字段，添加它
ALTER TABLE users ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;

-- 3. 确保 uuid 字段存在且唯一
ALTER TABLE users ADD COLUMN IF NOT EXISTS uuid VARCHAR(255) UNIQUE;

-- 4. 确保其他必要字段存在
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 20;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'FREE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_signed_in BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_credits_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_credits_earned INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);

-- 6. 检查修复后的表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. 同样检查其他表
-- credit_transactions 表
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS user_uuid VARCHAR(255);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(10) NOT NULL;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS balance_after INTEGER NOT NULL;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS related_resource_type VARCHAR(50);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS related_resource_id VARCHAR(255);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS paypal_payment_id VARCHAR(255);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- user_subscriptions 表
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS google_user_id VARCHAR(255);
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS google_user_email VARCHAR(255);
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255) UNIQUE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS plan_id VARCHAR(255);
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50);
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- webhook_events 表
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) NOT NULL;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS resource_data JSONB;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'processed';
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 8. 验证所有表结构
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.table_schema = 'public'
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN ('users', 'credit_transactions', 'user_subscriptions', 'webhook_events')
GROUP BY t.table_name
ORDER BY t.table_name;

SELECT 'Tables structure fixed successfully!' as status;