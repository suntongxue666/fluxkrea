-- 创建完整的订阅系统数据库表

-- 1. 用户订阅关联表
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    google_user_id VARCHAR(255) NOT NULL,
    google_user_email VARCHAR(255),
    paypal_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    plan_id VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PayPal订单追踪表
CREATE TABLE IF NOT EXISTS paypal_orders (
    id SERIAL PRIMARY KEY,
    subscription_id VARCHAR(255) NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    plan_id VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Webhook事件日志表
CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    resource_data JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_status VARCHAR(50) DEFAULT 'SUCCESS'
);

-- 4. 更新现有的subscriptions表结构（如果需要）
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50);

-- 5. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_user_id ON user_subscriptions(google_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paypal_subscription_id ON user_subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_subscription_id ON paypal_orders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_user_uuid ON paypal_orders(user_uuid);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_email ON subscriptions(user_email);

-- 6. 添加外键约束（如果需要）
-- ALTER TABLE user_subscriptions 
-- ADD CONSTRAINT fk_user_subscriptions_user_uuid 
-- FOREIGN KEY (google_user_id) REFERENCES users(uuid);

COMMENT ON TABLE user_subscriptions IS '用户订阅关联表 - 连接Google用户ID和PayPal订阅ID';
COMMENT ON TABLE paypal_orders IS 'PayPal订单追踪表 - 记录所有PayPal订阅订单';
COMMENT ON TABLE webhook_events IS 'Webhook事件日志表 - 记录所有PayPal webhook事件';

-- 插入测试数据（可选）
-- INSERT INTO user_subscriptions (google_user_id, google_user_email, paypal_subscription_id, plan_id, plan_type, status)
-- VALUES ('test_user_123', 'test@example.com', 'I-TEST123456', 'P-5ML4271244454362WXNWU5NI', 'pro', 'ACTIVE');