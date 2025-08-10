// 检查订阅 I-2HUL5HXAUJRA 的处理情况
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIwNjY1MSwiZXhwIjoyMDY5NzgyNjUxfQ.LRR6iEw8IGTvLLWC0ZzIgkY1qxaiJ1O7sCA3RQANHmA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSubscription() {
    const subscriptionId = 'I-2HUL5HXAUJRA';
    
    console.log(`🔍 检查订阅 ${subscriptionId} 的处理情况...\n`);
    
    try {
        // 1. 检查webhook事件
        console.log('📋 检查webhook事件记录...');
        const { data: webhookEvents, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .ilike('resource_data', `%${subscriptionId}%`)
            .order('processed_at', { ascending: false });
        
        if (!webhookError && webhookEvents && webhookEvents.length > 0) {
            console.log(`✅ 找到 ${webhookEvents.length} 个webhook事件:`);
            webhookEvents.forEach(event => {
                console.log(`- ${event.event_type} at ${event.processed_at}`);
                console.log(`  Status: ${event.processing_status}`);
            });
        } else {
            console.log('❌ 没有找到webhook事件记录');
            console.log('Webhook错误:', webhookError?.message);
        }
        
        // 2. 检查user_subscriptions表
        console.log('\n📋 检查用户订阅记录...');
        const { data: userSubs, error: userSubsError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('paypal_subscription_id', subscriptionId);
        
        if (!userSubsError && userSubs && userSubs.length > 0) {
            console.log('✅ 找到用户订阅记录:');
            userSubs.forEach(sub => {
                console.log(`- User: ${sub.google_user_email}`);
                console.log(`- Plan: ${sub.plan_type} (${sub.plan_id})`);
                console.log(`- Status: ${sub.status}`);
            });
        } else {
            console.log('❌ 没有找到用户订阅记录');
            console.log('用户订阅错误:', userSubsError?.message);
        }
        
        // 3. 检查积分交易记录
        console.log('\n💰 检查积分交易记录...');
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .ilike('description', `%${subscriptionId}%`)
            .or('source.eq.paypal_subscription,description.ilike.%Max Plan%,description.ilike.%5000积分%');
        
        if (!transError && transactions && transactions.length > 0) {
            console.log(`✅ 找到 ${transactions.length} 个积分交易:`);
            transactions.forEach(trans => {
                console.log(`- User: ${trans.user_uuid}`);
                console.log(`- Amount: +${trans.amount} credits`);
                console.log(`- Balance After: ${trans.balance_after}`);
                console.log(`- Description: ${trans.description}`);
                console.log(`- Time: ${trans.created_at}`);
            });
        } else {
            console.log('❌ 没有找到相关积分交易记录');
            console.log('交易错误:', transError?.message);
        }
        
        // 4. 检查所有订阅状态为ACTIVE的用户
        console.log('\n👤 检查有活跃订阅的用户...');
        const { data: activeUsers, error: activeUsersError } = await supabase
            .from('users')
            .select('uuid, email, credits, subscription_status, updated_at')
            .eq('subscription_status', 'ACTIVE')
            .order('updated_at', { ascending: false });
        
        if (!activeUsersError && activeUsers && activeUsers.length > 0) {
            console.log(`✅ 找到 ${activeUsers.length} 个有活跃订阅的用户:`);
            activeUsers.forEach(user => {
                console.log(`- ${user.email}: ${user.credits}积分 (更新于${user.updated_at})`);
            });
        } else {
            console.log('❌ 没有找到有活跃订阅的用户');
        }
        
        // 5. 检查最近的Max Plan购买记录
        console.log('\n🔍 检查最近的Max Plan交易...');
        const { data: recentMaxTrans, error: recentError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('amount', 5000)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (!recentError && recentMaxTrans && recentMaxTrans.length > 0) {
            console.log('✅ 最近的5000积分交易:');
            recentMaxTrans.forEach(trans => {
                console.log(`- ${trans.user_uuid}: +5000积分 at ${trans.created_at}`);
                console.log(`  Description: ${trans.description}`);
            });
        } else {
            console.log('❌ 没有找到5000积分的交易记录');
        }
        
    } catch (error) {
        console.error('❌ 检查过程失败:', error);
    }
}

checkSubscription();