// 简化检查 - 查看所有webhook事件和最近交易
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIwNjY1MSwiZXhwIjoyMDY5NzgyNjUxfQ.LRR6iEw8IGTvLLWC0ZzIgkY1qxaiJ1O7sCA3RQANHmA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function quickCheck() {
    console.log('🔍 快速检查数据库状态...\n');
    
    try {
        // 1. 检查最近的所有webhook事件
        console.log('📋 检查最近的webhook事件...');
        const { data: allWebhooks, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(10);
        
        if (!webhookError && allWebhooks && allWebhooks.length > 0) {
            console.log(`✅ 找到 ${allWebhooks.length} 个webhook事件:`);
            allWebhooks.forEach(event => {
                console.log(`- ${event.event_type} at ${event.processed_at}`);
                console.log(`  Resource: ${JSON.stringify(event.resource_data).substring(0, 100)}...`);
            });
        } else {
            console.log('❌ 没有webhook事件');
            console.log('Error:', webhookError?.message);
        }
        
        // 2. 检查最近的积分交易
        console.log('\n💰 检查最近的积分交易...');
        const { data: recentTrans, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (!transError && recentTrans && recentTrans.length > 0) {
            console.log(`✅ 最近的 ${recentTrans.length} 个积分交易:`);
            recentTrans.forEach(trans => {
                console.log(`- ${trans.user_uuid}: ${trans.amount}积分 (${trans.transaction_type})`);
                console.log(`  ${trans.description} at ${trans.created_at}`);
            });
        } else {
            console.log('❌ 没有积分交易记录');
            console.log('Error:', transError?.message);
        }
        
        // 3. 检查所有用户状态
        console.log('\n👤 检查用户状态...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('uuid, email, credits, subscription_status, updated_at')
            .order('updated_at', { ascending: false })
            .limit(5);
        
        if (!usersError && users && users.length > 0) {
            console.log('✅ 最近更新的用户:');
            users.forEach(user => {
                console.log(`- ${user.email || '匿名'}: ${user.credits}积分, 状态: ${user.subscription_status || 'FREE'}`);
            });
        } else {
            console.log('❌ 没有用户记录');
            console.log('Error:', usersError?.message);
        }
        
        // 4. 检查表是否存在
        console.log('\n📊 检查表结构...');
        
        const tables = ['webhook_events', 'user_subscriptions', 'credit_transactions', 'users'];
        for (const tableName of tables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                console.log(`- ${tableName}: ${error ? '❌ 不存在或无权限' : '✅ 存在'}`);
                if (error) {
                    console.log(`  Error: ${error.message}`);
                }
            } catch (e) {
                console.log(`- ${tableName}: ❌ 异常 - ${e.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error);
    }
}

quickCheck();