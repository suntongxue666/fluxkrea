// 测试新的PayPal Webhook配置
// 新Webhook地址: https://fluxkrea.me/api/paypal-webhook
// 测试订阅ID: I-C6SLTMYA3LBP

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 测试订阅ID
const TEST_SUBSCRIPTION_ID = 'I-C6SLTMYA3LBP';

async function testNewWebhookConfig() {
    console.log('🧪 开始测试新的Webhook配置');
    console.log('📍 新Webhook地址: https://fluxkrea.me/api/paypal-webhook');
    console.log('🆔 测试订阅ID:', TEST_SUBSCRIPTION_ID);
    console.log('=====================================\n');

    // 1. 测试Webhook端点可访问性
    console.log('1️⃣ 测试Webhook端点可访问性...');
    try {
        const response = await fetch('https://fluxkrea.me/api/paypal-webhook', {
            method: 'OPTIONS',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Webhook端点可访问');
            console.log(`   状态码: ${response.status}`);
            console.log(`   CORS头: ${response.headers.get('Access-Control-Allow-Origin')}`);
        } else {
            console.log('❌ Webhook端点访问失败');
            console.log(`   状态码: ${response.status}`);
        }
    } catch (error) {
        console.log('❌ Webhook端点连接错误:', error.message);
    }
    console.log('');

    // 2. 检查数据库中的订阅记录
    console.log('2️⃣ 检查订阅记录...');
    
    // 检查subscriptions表
    try {
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('id', TEST_SUBSCRIPTION_ID);
        
        if (subError) {
            console.log('⚠️ subscriptions表查询失败:', subError.message);
        } else if (subscriptions && subscriptions.length > 0) {
            console.log('✅ 在subscriptions表中找到记录:');
            subscriptions.forEach(sub => {
                console.log(`   订阅ID: ${sub.id}`);
                console.log(`   状态: ${sub.status}`);
                console.log(`   计划ID: ${sub.plan_id}`);
                console.log(`   用户UUID: ${sub.user_uuid}`);
                console.log(`   创建时间: ${sub.created_at}`);
            });
        } else {
            console.log('⚠️ subscriptions表中未找到记录');
        }
    } catch (error) {
        console.log('❌ 查询subscriptions表异常:', error.message);
    }
    
    // 检查user_subscriptions表
    try {
        const { data: userSubs, error: userSubError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('paypal_subscription_id', TEST_SUBSCRIPTION_ID);
        
        if (userSubError) {
            console.log('⚠️ user_subscriptions表查询失败:', userSubError.message);
        } else if (userSubs && userSubs.length > 0) {
            console.log('✅ 在user_subscriptions表中找到记录:');
            userSubs.forEach(sub => {
                console.log(`   订阅ID: ${sub.paypal_subscription_id}`);
                console.log(`   状态: ${sub.status}`);
                console.log(`   计划类型: ${sub.plan_type}`);
                console.log(`   用户邮箱: ${sub.google_user_email}`);
                console.log(`   Google用户ID: ${sub.google_user_id}`);
            });
        } else {
            console.log('⚠️ user_subscriptions表中未找到记录');
        }
    } catch (error) {
        console.log('❌ 查询user_subscriptions表异常:', error.message);
    }
    console.log('');

    // 3. 检查webhook事件记录
    console.log('3️⃣ 检查最近的Webhook事件...');
    try {
        const { data: webhookEvents, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(10);
        
        if (webhookError) {
            console.log('⚠️ webhook_events表查询失败:', webhookError.message);
        } else if (webhookEvents && webhookEvents.length > 0) {
            console.log('✅ 最近的Webhook事件:');
            webhookEvents.forEach((event, index) => {
                console.log(`   ${index + 1}. 类型: ${event.event_type}`);
                console.log(`      时间: ${event.processed_at}`);
                if (event.resource_data && event.resource_data.id) {
                    console.log(`      资源ID: ${event.resource_data.id}`);
                }
            });
        } else {
            console.log('⚠️ 未找到Webhook事件记录');
        }
    } catch (error) {
        console.log('❌ 查询webhook_events表异常:', error.message);
    }
    console.log('');

    // 4. 模拟订阅激活事件测试
    console.log('4️⃣ 模拟订阅激活事件测试...');
    
    const mockSubscriptionActivatedEvent = {
        event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
        resource: {
            id: TEST_SUBSCRIPTION_ID,
            plan_id: 'P-5ML4271244454362WXNWU5NI', // Pro Plan
            status: 'ACTIVE',
            custom_id: JSON.stringify({
                user_id: 'test-user-uuid',
                email: 'sunwei7482@gmail.com',
                plan_type: 'pro'
            }),
            create_time: new Date().toISOString(),
            update_time: new Date().toISOString()
        }
    };
    
    console.log('📋 模拟事件数据:');
    console.log(JSON.stringify(mockSubscriptionActivatedEvent, null, 2));
    
    try {
        const response = await fetch('https://fluxkrea.me/api/paypal-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mockSubscriptionActivatedEvent)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Webhook处理成功');
            console.log('📄 响应:', result);
        } else {
            console.log('❌ Webhook处理失败');
            console.log(`   状态码: ${response.status}`);
            const errorText = await response.text();
            console.log(`   错误信息: ${errorText}`);
        }
    } catch (error) {
        console.log('❌ Webhook测试请求失败:', error.message);
    }
    console.log('');

    // 5. 检查用户积分变化
    console.log('5️⃣ 检查用户积分状态...');
    try {
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'sunwei7482@gmail.com')
            .single();
        
        if (userError) {
            console.log('⚠️ 用户查询失败:', userError.message);
        } else if (users) {
            console.log('✅ 用户信息:');
            console.log(`   邮箱: ${users.email}`);
            console.log(`   UUID: ${users.uuid}`);
            console.log(`   积分: ${users.credits}`);
            console.log(`   订阅状态: ${users.subscription_status || '无'}`);
            console.log(`   最后更新: ${users.updated_at}`);
        }
    } catch (error) {
        console.log('❌ 查询用户信息异常:', error.message);
    }
    console.log('');

    // 6. 测试总结
    console.log('📊 测试总结');
    console.log('=====================================');
    console.log('✅ 已完成的检查项目:');
    console.log('   - Webhook端点可访问性测试');
    console.log('   - 数据库订阅记录检查');
    console.log('   - Webhook事件历史查询');
    console.log('   - 模拟订阅激活事件测试');
    console.log('   - 用户积分状态检查');
    console.log('');
    console.log('🔍 关键检查点:');
    console.log('   1. Webhook地址是否可以正常接收POST请求');
    console.log('   2. 订阅记录是否存在于数据库中');
    console.log('   3. Webhook事件是否被正确记录和处理');
    console.log('   4. 用户积分是否正确更新');
    console.log('');
    console.log('💡 下一步建议:');
    console.log('   - 在PayPal开发者控制台检查Webhook配置');
    console.log('   - 确认Webhook URL设置为: https://fluxkrea.me/api/paypal-webhook');
    console.log('   - 检查PayPal是否成功发送了实际的Webhook事件');
    console.log('   - 监控Vercel函数日志以查看实际的Webhook接收情况');
}

// 运行测试
if (require.main === module) {
    testNewWebhookConfig().then(() => {
        console.log('🏁 测试完成');
        process.exit(0);
    }).catch(error => {
        console.error('❌ 测试过程中发生错误:', error);
        process.exit(1);
    });
}

module.exports = { testNewWebhookConfig };