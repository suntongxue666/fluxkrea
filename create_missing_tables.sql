-- 创建缺失的订阅系统表
-- 需要在 Supabase SQL Editor 中执行

-- 1. 创建用户订阅关联表
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    google_user_id VARCHAR(255) NOT NULL,
    google_user_email VARCHAR(255) NOT NULL,
    paypal_subscription_id VARCHAR(50) NOT NULL UNIQUE,
    plan_id VARCHAR(50) NOT NULL,
    plan_type VARCHAR(20) NOT NULL, -- 'pro' or 'max'
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, CANCELLED, SUSPENDED
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

-- 4. 修复现有subscriptions表结构
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS paypal_plan_id VARCHAR(50);

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_user_id ON user_subscriptions(google_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paypal_subscription_id ON user_subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_subscription_id ON paypal_orders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_user_uuid ON paypal_orders(user_uuid);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);

-- 6. 设置RLS策略
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paypal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的订阅关联
CREATE POLICY "Users can view own subscription associations" ON user_subscriptions
    FOR SELECT USING (google_user_email = auth.email());

-- 系统可以管理所有记录
CREATE POLICY "Service role can manage user subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage paypal orders" ON paypal_orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage webhook events" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');

-- 7. 添加注释
COMMENT ON TABLE user_subscriptions IS '用户订阅关联表 - 连接Google用户ID和PayPal订阅ID';
COMMENT ON TABLE paypal_orders IS 'PayPal订单追踪表 - 记录所有PayPal订阅订单';
COMMENT ON TABLE webhook_events IS 'Webhook事件日志表 - 记录所有PayPal webhook事件';