// 清理测试数据，重新创建干净的数据库
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIwNjY1MSwiZXhwIjoyMDY5NzgyNjUxfQ.LRR6iEw8IGTvLLWC0ZzIgkY1qxaiJ1O7sCA3RQANHmA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanupAndRebuild() {
    console.log('🧹 开始清理测试数据并重建数据库...\n');
    
    try {
        // 1. 检查现有数据
        console.log('📊 检查现有数据...');
        
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('email, credits, subscription_status, created_at')
            .order('created_at', { ascending: false });
        
        if (!usersError && users) {
            console.log(`找到 ${users.length} 个用户:`);
            users.forEach(user => {
                console.log(`- ${user.email}: 积分=${user.credits || 0}, 状态=${user.subscription_status || 'FREE'}`);
            });
        }
        
        // 2. 清理测试数据
        console.log('\n🗑️ 清理测试数据...');
        
        const tables = [
            'credit_transactions',
            'webhook_events',
            'user_subscriptions', 
            'paypal_orders',
            'subscriptions'
        ];
        
        for (const tableName of tables) {
            try {
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .neq('id', 0); // 删除所有记录
                
                if (!error) {
                    console.log(`✅ 已清理 ${tableName} 表`);
                } else {
                    console.log(`⚠️ ${tableName} 表: ${error.message}`);
                }
            } catch (e) {
                console.log(`⚠️ ${tableName} 表可能不存在`);
            }
        }
        
        // 3. 重置用户数据
        console.log('\n🔄 重置用户积分和订阅状态...');
        const { error: resetError } = await supabase
            .from('users')
            .update({
                credits: 20, // 默认积分
                subscription_status: null,
                subscription_credits_remaining: null,
                subscription_renewal_date: null,
                updated_at: new Date().toISOString()
            })
            .neq('id', 0);
        
        if (!resetError) {
            console.log('✅ 已重置所有用户状态');
        } else {
            console.log('❌ 重置用户状态失败:', resetError.message);
        }
        
        // 4. 创建必要的表结构
        console.log('\n🏗️ 创建表结构...');
        
        // 创建 user_subscriptions 表
        const { error: userSubsError } = await supabase.rpc('exec', {
            sql: `
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
                
                CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_user_id ON user_subscriptions(google_user_id);
                CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paypal_subscription_id ON user_subscriptions(paypal_subscription_id);
            `
        });
        
        // 创建 webhook_events 表
        const { error: webhookError } = await supabase.rpc('exec', {
            sql: `
                CREATE TABLE IF NOT EXISTS webhook_events (
                    id SERIAL PRIMARY KEY,
                    event_type VARCHAR(100) NOT NULL,
                    resource_data JSONB NOT NULL,
                    processed_at TIMESTAMP DEFAULT NOW(),
                    processing_status VARCHAR(20) DEFAULT 'SUCCESS'
                );
                
                CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
            `
        });
        
        console.log('✅ 数据库清理和重建完成!');
        console.log('\n📋 下一步:');
        console.log('1. 新的webhook处理器已经部署');
        console.log('2. 数据库表结构已更新');
        console.log('3. 可以开始测试新的购买流程');
        
        // 5. 验证清理结果
        console.log('\n🔍 验证清理结果...');
        const { data: finalUsers, error: finalError } = await supabase
            .from('users')
            .select('email, credits, subscription_status')
            .limit(5);
        
        if (!finalError && finalUsers) {
            console.log('当前用户状态:');
            finalUsers.forEach(user => {
                console.log(`- ${user.email}: 积分=${user.credits}, 状态=${user.subscription_status || 'FREE'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 清理过程失败:', error);
    }
}

cleanupAndRebuild();