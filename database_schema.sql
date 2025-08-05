-- PayPal订阅系统数据库表结构
-- 适用于Supabase PostgreSQL

-- 1. 订阅表 (subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    paypal_subscription_id VARCHAR(50) UNIQUE NOT NULL,
    paypal_plan_id VARCHAR(50) NOT NULL,
    plan_name VARCHAR(50) NOT NULL, -- 'pro' or 'max'
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, CANCELLED, SUSPENDED, EXPIRED
    credits_per_month INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    next_billing_date TIMESTAMP,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 支付记录表 (payments)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    paypal_payment_id VARCHAR(50) UNIQUE,
    paypal_order_id VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL, -- PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED
    payment_method VARCHAR(50),
    credits_awarded INTEGER DEFAULT 0,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 订阅历史表 (subscription_history)
CREATE TABLE IF NOT EXISTS subscription_history (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- CREATED, ACTIVATED, CANCELLED, SUSPENDED, RENEWED, EXPIRED
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    reason TEXT,
    paypal_event_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 积分交易表扩展 (为订阅系统添加字段)
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS subscription_id INTEGER REFERENCES subscriptions(id),
ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id),
ADD COLUMN IF NOT EXISTS paypal_payment_id VARCHAR(50);

-- 5. 用户表扩展 (添加订阅相关字段)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_subscription_id INTEGER REFERENCES subscriptions(id),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_credits_remaining INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_renewal_date TIMESTAMP;

-- 6. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_uuid ON subscriptions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_payment_id ON payments(paypal_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);

-- 7. 创建触发器自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 创建RLS (Row Level Security) 策略
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的订阅记录
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid()::text = user_uuid);

-- 用户只能查看自己的支付记录
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid()::text = user_uuid);

-- 用户只能查看自己的订阅历史
CREATE POLICY "Users can view own subscription history" ON subscription_history
    FOR SELECT USING (auth.uid()::text = (SELECT user_uuid FROM subscriptions WHERE id = subscription_id));

-- 系统可以插入和更新所有记录（通过服务角色）
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage payments" ON payments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage subscription history" ON subscription_history
    FOR ALL USING (auth.role() = 'service_role');

-- 9. 创建有用的视图
CREATE OR REPLACE VIEW user_subscription_summary AS
SELECT 
    u.uuid as user_uuid,
    u.email,
    u.credits,
    s.id as subscription_id,
    s.paypal_subscription_id,
    s.plan_name,
    s.status as subscription_status,
    s.credits_per_month,
    s.price,
    s.next_billing_date,
    s.created_at as subscription_created_at,
    CASE 
        WHEN s.status = 'ACTIVE' THEN true 
        ELSE false 
    END as is_subscribed
FROM users u
LEFT JOIN subscriptions s ON u.current_subscription_id = s.id;

-- 10. 插入示例数据（可选，用于测试）
-- INSERT INTO subscriptions (user_id, user_uuid, paypal_subscription_id, paypal_plan_id, plan_name, status, credits_per_month, price) 
-- VALUES (1, 'test-uuid', 'I-TEST123', 'P-5S785818YS7424947NCJBKQA', 'pro', 'ACTIVE', 1000, 9.99);

COMMENT ON TABLE subscriptions IS 'PayPal订阅记录表';
COMMENT ON TABLE payments IS 'PayPal支付记录表';
COMMENT ON TABLE subscription_history IS '订阅状态变更历史表';
COMMENT ON VIEW user_subscription_summary IS '用户订阅状态汇总视图';