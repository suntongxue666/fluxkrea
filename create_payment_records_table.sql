-- 创建支付记录表
CREATE TABLE IF NOT EXISTS payment_records (
    id BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    user_email TEXT,
    payment_id TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    plan_name TEXT,
    credits_added INTEGER DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    payment_method TEXT DEFAULT 'paypal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_records_user_uuid ON payment_records(user_uuid);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_id ON payment_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_created_at ON payment_records(created_at);

-- 添加RLS策略
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的支付记录
CREATE POLICY "Users can view own payment records" ON payment_records
    FOR SELECT USING (user_uuid = auth.uid()::uuid);

-- 允许系统插入支付记录
CREATE POLICY "System can insert payment records" ON payment_records
    FOR INSERT WITH CHECK (true);

-- 允许系统更新支付记录
CREATE POLICY "System can update payment records" ON payment_records
    FOR UPDATE USING (true);

COMMENT ON TABLE payment_records IS '支付记录表，记录所有PayPal支付信息';
COMMENT ON COLUMN payment_records.user_uuid IS '用户UUID';
COMMENT ON COLUMN payment_records.payment_id IS 'PayPal支付ID';
COMMENT ON COLUMN payment_records.amount IS '支付金额';
COMMENT ON COLUMN payment_records.credits_added IS '添加的积分数量';
COMMENT ON COLUMN payment_records.status IS '支付状态：PENDING, COMPLETED, FAILED';