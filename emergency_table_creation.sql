-- 紧急数据库表创建脚本
-- 需要在 Supabase SQL Editor 中执行

-- 1. 创建用户订阅关联表 (如果不存在)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    google_user_id VARCHAR(255) NOT NULL,
    google_user_email VARCHAR(255) NOT NULL,
    paypal_subscription_id VARCHAR(50) NOT NULL UNIQUE,
    plan_id VARCHAR(50) NOT NULL,
    plan_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 创建PayPal订单追踪表
CREATE TABLE IF NOT EXISTS paypal_orders (
    id SERIAL PRIMARY KEY,
    subscription_id VARCHAR(50) NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    plan_id VARCHAR(50) NOT NULL,
    plan_type VARCHAR(20) NOT NULL,
    order_status VARCHAR(20) DEFAULT 'CREATED',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 创建Webhook事件日志表
CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    resource_data JSONB NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    processing_status VARCHAR(20) DEFAULT 'SUCCESS'
);

-- 4. 修复现有subscriptions表 (如果存在)
DO $$ 
BEGIN
    -- 检查subscriptions表是否存在
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        -- 添加缺失的列
        ALTER TABLE subscriptions 
        ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20),
        ADD COLUMN IF NOT EXISTS paypal_plan_id VARCHAR(50);
        
        -- 修改id列类型为VARCHAR以支持PayPal订阅ID
        ALTER TABLE subscriptions ALTER COLUMN id TYPE VARCHAR(50);
    ELSE
        -- 创建subscriptions表
        CREATE TABLE subscriptions (
            id VARCHAR(50) PRIMARY KEY,
            user_uuid VARCHAR(255) NOT NULL,
            user_email VARCHAR(255),
            plan_id VARCHAR(50) NOT NULL,
            plan_type VARCHAR(20) NOT NULL,
            paypal_plan_id VARCHAR(50),
            status VARCHAR(20) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_user_id ON user_subscriptions(google_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paypal_subscription_id ON user_subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_subscription_id ON paypal_orders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_user_uuid ON paypal_orders(user_uuid);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_uuid ON subscriptions(user_uuid);

-- 6. 设置RLS策略 (Row Level Security)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paypal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. 创建服务角色策略 (允许API访问)
CREATE POLICY IF NOT EXISTS "Service role can manage user subscriptions" ON user_subscriptions
    FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Service role can manage paypal orders" ON paypal_orders
    FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Service role can manage webhook events" ON webhook_events
    FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Service role can manage subscriptions" ON subscriptions
    FOR ALL USING (true);

-- 8. 创建用户访问策略
CREATE POLICY IF NOT EXISTS "Users can view own subscription associations" ON user_subscriptions
    FOR SELECT USING (google_user_email = auth.email());

CREATE POLICY IF NOT EXISTS "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (user_email = auth.email());

-- 9. 插入测试数据验证表创建
INSERT INTO webhook_events (event_type, resource_data, processing_status) 
VALUES ('SYSTEM.TABLE.CREATED', '{"message": "Tables created successfully"}', 'SUCCESS')
ON CONFLICT DO NOTHING;

-- 10. 验证表创建
SELECT 
    'user_subscriptions' as table_name,
    COUNT(*) as record_count
FROM user_subscriptions
UNION ALL
SELECT 
    'paypal_orders' as table_name,
    COUNT(*) as record_count  
FROM paypal_orders
UNION ALL
SELECT 
    'webhook_events' as table_name,
    COUNT(*) as record_count
FROM webhook_events
UNION ALL
SELECT 
    'subscriptions' as table_name,
    COUNT(*) as record_count
FROM subscriptions;