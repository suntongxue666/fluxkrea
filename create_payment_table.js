// 创建支付记录表
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createPaymentTable() {
    console.log('🔧 开始创建支付记录表...');
    
    try {
        // 创建支付记录表
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
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
            `
        });
        
        if (error) {
            console.error('❌ 创建表失败:', error);
            return false;
        }
        
        console.log('✅ 支付记录表创建成功');
        
        // 测试插入一条记录
        const testRecord = {
            user_uuid: '00000000-0000-0000-0000-000000000000',
            user_email: 'test@example.com',
            payment_id: 'TEST_' + Date.now(),
            amount: 9.99,
            currency: 'USD',
            plan_name: 'Pro Plan',
            credits_added: 1000,
            status: 'COMPLETED',
            payment_method: 'paypal'
        };
        
        const { data, error: insertError } = await supabase
            .from('payment_records')
            .insert(testRecord)
            .select();
        
        if (insertError) {
            console.error('❌ 测试插入失败:', insertError);
            return false;
        }
        
        console.log('✅ 测试记录插入成功:', data);
        
        // 删除测试记录
        await supabase
            .from('payment_records')
            .delete()
            .eq('payment_id', testRecord.payment_id);
        
        console.log('✅ 测试记录已清理');
        
        return true;
        
    } catch (error) {
        console.error('❌ 创建支付表过程中出错:', error);
        return false;
    }
}

// 运行创建
createPaymentTable().then(success => {
    if (success) {
        console.log('🎉 支付记录表创建完成！');
    } else {
        console.log('❌ 支付记录表创建失败');
        process.exit(1);
    }
}).catch(error => {
    console.error('❌ 执行失败:', error);
    process.exit(1);
});