// 检查特定Webhook事件和用户积分状态
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkWebhookEvent() {
    console.log('🔍 检查Webhook事件: WH-3L101902MB532172S-0HS21913WG835770Y');
    console.log('📅 事件时间: 8/7/25, 7:37 PM');
    console.log('💰 支付金额: $9.99 USD');
    console.log('🆔 Resource ID: 3GJ877690B014130P');
    
    try {
        // 1. 检查webhook_events表中的记录
        console.log('\n📋 1. 检查webhook事件记录...');
        const { data: webhookEvents, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(10);
        
        if (webhookError) {
            console.error('❌ 查询webhook事件失败:', webhookError);
        } else {
            console.log(`✅ 找到 ${webhookEvents.length} 个webhook事件:`);
            webhookEvents.forEach((event, index) => {
                console.log(`  ${index + 1}. ${event.event_type} - ${event.processing_status} - ${event.processed_at}`);
                if (event.resource_data?.id) {
                    console.log(`     Resource ID: ${event.resource_data.id}`);
                }
            });
        }
        
        // 2. 检查用户订阅记录
        console.log('\n👥 2. 检查用户订阅记录...');
        const { data: subscriptions, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (subError) {
            console.error('❌ 查询订阅记录失败:', subError);
        } else {
            console.log(`✅ 找到 ${subscriptions.length} 个订阅记录:`);
            subscriptions.forEach((sub, index) => {
                console.log(`  ${index + 1}. ${sub.google_user_email} - ${sub.status} - ${sub.paypal_subscription_id}`);
                console.log(`     Plan: ${sub.plan_type} (${sub.plan_id})`);
            });
        }
        
        // 3. 检查积分交易记录
        console.log('\n💰 3. 检查积分交易记录...');
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('source', 'paypal_webhook')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (transError) {
            console.error('❌ 查询积分交易失败:', transError);
        } else {
            console.log(`✅ 找到 ${transactions.length} 个PayPal积分交易:`);
            transactions.forEach((trans, index) => {
                console.log(`  ${index + 1}. ${trans.user_uuid} - ${trans.transaction_type} ${trans.amount} - ${trans.description}`);
                console.log(`     余额: ${trans.balance_after} - ${trans.created_at}`);
            });
        }
        
        // 4. 检查最近的用户积分状态
        console.log('\n👤 4. 检查用户积分状态...');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('email, credits, subscription_status, updated_at')
            .order('updated_at', { ascending: false })
            .limit(5);
        
        if (userError) {
            console.error('❌ 查询用户失败:', userError);
        } else {
            console.log(`✅ 最近更新的用户:`);
            users.forEach((user, index) => {
                console.log(`  ${index + 1}. ${user.email} - 积分: ${user.credits} - 状态: ${user.subscription_status}`);
                console.log(`     更新时间: ${user.updated_at}`);
            });
        }
        
        // 5. 查找可能相关的支付记录
        console.log('\n🔍 5. 查找相关支付记录...');
        const resourceId = '3GJ877690B014130P';
        
        // 在webhook事件中查找这个resource ID
        const { data: relatedEvents, error: relatedError } = await supabase
            .from('webhook_events')
            .select('*')
            .contains('resource_data', { id: resourceId });
        
        if (relatedError) {
            console.error('❌ 查询相关事件失败:', relatedError);
        } else if (relatedEvents.length > 0) {
            console.log(`✅ 找到 ${relatedEvents.length} 个相关事件:`);
            relatedEvents.forEach((event, index) => {
                console.log(`  ${index + 1}. ${event.event_type} - ${event.processing_status}`);
                console.log(`     处理时间: ${event.processed_at}`);
                console.log(`     Resource: ${JSON.stringify(event.resource_data, null, 2)}`);
            });
        } else {
            console.log('⚠️ 未找到相关的webhook事件记录');
        }
        
        console.log('\n📊 检查完成!');
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error);
    }
}

// 运行检查
checkWebhookEvent().then(() => {
    console.log('✅ 检查完成');
    process.exit(0);
}).catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
});