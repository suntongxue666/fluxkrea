// 测试本地Webhook服务器
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_WEBHOOK_URL = 'http://localhost:3000/api/paypal-webhook';

async function testLocalWebhook() {
    console.log('🧪 测试本地Webhook服务器');
    console.log('='.repeat(50));
    
    try {
        // 1. 检查本地服务器是否运行
        console.log('\n🔌 1. 检查本地服务器状态...');
        
        const healthResponse = await fetch(LOCAL_WEBHOOK_URL, {
            method: 'GET'
        });
        
        if (!healthResponse.ok) {
            throw new Error('本地服务器未运行，请先启动: node local_webhook_server.js');
        }
        
        const healthData = await healthResponse.json();
        console.log('✅ 本地服务器运行正常');
        console.log(`📄 响应: ${JSON.stringify(healthData)}`);
        
        // 2. 选择测试用户
        console.log('\n👤 2. 选择测试用户...');
        
        const { data: testUsers, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('credits', 20)
            .eq('subscription_status', 'FREE')
            .limit(1);
        
        if (usersError || !testUsers || testUsers.length === 0) {
            throw new Error('找不到合适的测试用户');
        }
        
        const testUser = testUsers[0];
        console.log(`✅ 选择测试用户: ${testUser.email}`);
        console.log(`   UUID: ${testUser.uuid}`);
        console.log(`   当前积分: ${testUser.credits}`);
        
        // 3. 模拟订阅创建
        console.log('\n🆕 3. 模拟订阅创建...');
        
        const subscriptionId = 'I-LOCAL-TEST-' + Date.now();
        const planId = 'P-5ML4271244454362WXNWU5NI'; // Pro计划
        
        const userInfo = {
            user_id: testUser.uuid,
            email: testUser.email,
            plan_type: 'pro'
        };
        
        const createWebhookData = {
            event_type: 'BILLING.SUBSCRIPTION.CREATED',
            resource: {
                id: subscriptionId,
                plan_id: planId,
                custom_id: JSON.stringify(userInfo),
                status: 'ACTIVE'
            }
        };
        
        console.log(`📋 创建订阅: ${subscriptionId}`);
        
        const createResponse = await fetch(LOCAL_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createWebhookData)
        });
        
        if (createResponse.ok) {
            const createResult = await createResponse.json();
            console.log('✅ 订阅创建Webhook处理成功');
            console.log(`📄 响应: ${JSON.stringify(createResult)}`);
        } else {
            const errorText = await createResponse.text();
            console.error('❌ 订阅创建Webhook失败:', errorText);
            return;
        }
        
        // 4. 验证订阅关联是否创建
        console.log('\n🔍 4. 验证订阅关联...');
        
        const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('paypal_subscription_id', subscriptionId)
            .single();
        
        if (subError) {
            console.error('❌ 订阅关联创建失败:', subError.message);
            return;
        } else {
            console.log('✅ 订阅关联已创建');
            console.log(`   订阅ID: ${subscription.paypal_subscription_id}`);
            console.log(`   用户邮箱: ${subscription.google_user_email}`);
            console.log(`   状态: ${subscription.status}`);
        }
        
        // 5. 模拟订阅激活
        console.log('\n🚀 5. 模拟订阅激活...');
        
        const activateWebhookData = {
            event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
            resource: {
                id: subscriptionId,
                plan_id: planId,
                status: 'ACTIVE'
            }
        };
        
        const activateResponse = await fetch(LOCAL_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activateWebhookData)
        });
        
        if (activateResponse.ok) {
            const activateResult = await activateResponse.json();
            console.log('✅ 订阅激活Webhook处理成功');
            console.log(`📄 响应: ${JSON.stringify(activateResult)}`);
        } else {
            const errorText = await activateResponse.text();
            console.error('❌ 订阅激活Webhook失败:', errorText);
            return;
        }
        
        // 6. 验证最终结果
        console.log('\n✅ 6. 验证最终结果...');
        
        // 检查用户状态
        const { data: updatedUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', testUser.id)
            .single();
        
        if (userError) {
            console.error('❌ 查询用户失败:', userError);
        } else {
            console.log('👤 用户状态验证:');
            console.log(`   邮箱: ${updatedUser.email}`);
            console.log(`   积分: ${testUser.credits} → ${updatedUser.credits} (${updatedUser.credits > testUser.credits ? '✅ 增加了' + (updatedUser.credits - testUser.credits) : '❌ 未变化'})`);
            console.log(`   状态: ${testUser.subscription_status} → ${updatedUser.subscription_status} (${updatedUser.subscription_status === 'ACTIVE' ? '✅ 已激活' : '❌ 未激活'})`);
        }
        
        // 检查订阅关联状态
        const { data: updatedSub, error: updatedSubError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('paypal_subscription_id', subscriptionId)
            .single();
        
        if (!updatedSubError) {
            console.log('🔗 订阅关联状态:');
            console.log(`   状态: ${subscription.status} → ${updatedSub.status} (${updatedSub.status === 'ACTIVE' ? '✅ 已激活' : '⚠️ 待激活'})`);
        }
        
        // 检查积分交易记录
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', testUser.uuid)
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!transError && transactions.length > 0) {
            console.log('💳 最新积分交易:');
            transactions.forEach((trans, index) => {
                const date = new Date(trans.created_at).toLocaleString();
                console.log(`   ${index + 1}. ${trans.transaction_type}: ${trans.amount > 0 ? '+' : ''}${trans.amount} (${trans.source}) - ${date}`);
            });
        }
        
        // 7. 测试结果总结
        console.log('\n📊 测试结果总结:');
        console.log('-'.repeat(40));
        
        const success = 
            updatedUser && 
            updatedUser.credits > testUser.credits && 
            updatedUser.subscription_status === 'ACTIVE' &&
            updatedSub && 
            updatedSub.status === 'ACTIVE';
        
        if (success) {
            console.log('🎉 测试完全成功！');
            console.log('✅ 本地Webhook服务器工作正常');
            console.log('✅ 订阅创建和激活流程正常');
            console.log('✅ 用户积分和状态正确更新');
            console.log('✅ 数据库记录完整');
            
            console.log('\n💡 下一步建议:');
            console.log('1. 使用ngrok暴露本地服务器到公网');
            console.log('2. 将ngrok URL配置到PayPal Webhook设置');
            console.log('3. 进行真实的PayPal订阅测试');
            
        } else {
            console.log('❌ 测试失败！');
            console.log('需要检查Webhook处理逻辑和数据库操作');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 解决方案:');
            console.log('1. 在另一个终端中启动本地服务器:');
            console.log('   node local_webhook_server.js');
            console.log('2. 然后重新运行此测试');
        }
    }
}

// 主函数
async function main() {
    await testLocalWebhook();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testLocalWebhook };