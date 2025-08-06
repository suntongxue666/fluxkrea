// 直接创建订阅系统所需的数据库表
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTables() {
    console.log('🔧 开始创建订阅系统数据库表...');
    
    // 1. 创建用户订阅关联表
    console.log('\n📋 创建 user_subscriptions 表...');
    try {
        const { error } = await supabase
            .from('user_subscriptions')
            .insert({
                google_user_id: 'test',
                google_user_email: 'test@test.com',
                paypal_subscription_id: 'test-sub',
                plan_id: 'test-plan',
                plan_type: 'test'
            });
        
        if (error && error.code === '42P01') {
            console.log('❌ user_subscriptions 表不存在，需要在 Supabase SQL Editor 中创建');
        } else {
            console.log('✅ user_subscriptions 表已存在');
            // 删除测试数据
            await supabase
                .from('user_subscriptions')
                .delete()
                .eq('google_user_id', 'test');
        }
    } catch (error) {
        console.log('❌ 检查 user_subscriptions 表失败:', error.message);
    }
    
    // 2. 检查其他表
    const tables = ['paypal_orders', 'webhook_events'];
    
    for (const tableName of tables) {
        console.log(`\n📋 检查 ${tableName} 表...`);
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (error && error.code === '42P01') {
                console.log(`❌ ${tableName} 表不存在`);
            } else {
                console.log(`✅ ${tableName} 表已存在`);
            }
        } catch (error) {
            console.log(`❌ 检查 ${tableName} 表失败:`, error.message);
        }
    }
    
    console.log('\n📝 需要在 Supabase SQL Editor 中执行以下 SQL:');
    console.log('='.repeat(60));
    console.log(`
-- 1. 创建用户订阅关联表
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

-- 系统可以管理所有记录
CREATE POLICY "Service role can manage user subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage paypal orders" ON paypal_orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage webhook events" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');
    `);
    console.log('='.repeat(60));
}

createTables().catch(console.error);