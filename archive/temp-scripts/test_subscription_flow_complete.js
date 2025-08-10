// 完整的订阅流程测试工具
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WEBHOOK_URL = 'https://fluxkrea.me/api/paypal-webhook';

async function testCompleteSubscriptionFlow() {
    console.log('🧪 完整订阅流程测试');
    console.log('='.repeat(60));
    
    try {
        // 1. 测试Webhook端点健康状态
        console.log('\n🔌 1. 测试Webhook端点...');
        await testWebhookHealth();
        
        // 2. 选择测试用户
        console.log('\n👤 2. 选择测试用户...');
        const testUser = await selectTestUser();
        if (!testUser) return;
        
        // 3. 模拟订阅创建
        console.log('\n🆕 3. 模拟订阅创建...');
        const subscriptionId = await simulateSubscriptionCreation(testUser);
        if (!subscriptionId) return;
        
        // 4. 模拟订阅激活
        console.log('\n🚀 4. 模拟订阅激活...');
        await simulateSubscriptionActivation(subscriptionId, testUser);
        
        // 5. 验证结果
        console.log('\n✅ 5. 验证测试结果...');
        await verifyTestResults(testUser, subscriptionId);
        
        console.log('\n🎉 订阅流程测试完成！');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
}

// 测试Webhook端点健康状态
async function testWebhookHealth() {
    try {
        console.log(`📡 测试URL: ${WEBHOOK_URL}`);
        
        // 测试GET请求（健康检查）
        const healthResponse = await fetch(WEBHOOK_URL, {
            method: 'GET'
        });
        
        console.log(`📊 健康检查响应: ${healthResponse.status}`);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Webhook端点健康状态正常');
            console.log(`📄 响应: ${JSON.stringify(healthData)}`);
        } else {
            console.log('❌ Webhook端点健康检查失败');
            const errorText = await healthResponse.text();
            console.log(`📄 错误: ${errorText.substring(0, 200)}...`);
        }
        
        // 测试连接性
        const connectivityResponse = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_type: 'TEST.WEBHOOK.CONNECTIVITY',
                resource: { id: 'test-connectivity-' + Date.now() }
            })
        });
        
        console.log(`📊 连接性测试响应: ${connectivityResponse.status}`);
        
        if (connectivityResponse.ok) {
            const connectivityData = await connectivityResponse.json();
            console.log('✅ Webhook连接性测试成功');
            console.log(`📄 响应: ${JSON.stringify(connectivityData)}`);
        } else {
            console.log('❌ Webhook连接性测试失败');
            const errorText = await connectivityResponse.text();
            console.log(`📄 错误: ${errorText.substring(0, 200)}...`);
            throw new Error('Webhook端点不可用');
        }
        
    } catch (error) {
        console.error('❌ Webhook端点测试失败:', error.message);
        throw error;
    }
}

// 选择测试用户
async function selectTestUser() {
    try {
        // 查找重置后的用户
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('credits', 20)
            .eq('subscription_status', 'FREE')
            .limit(1);
        
        if (error || !users || users.length === 0) {
            console.error('❌ 找不到合适的测试用户');
            return null;
        }
        
        const testUser = users[0];
        console.log(`✅ 选择测试用户: ${testUser.email}`);
        console.log(`   UUID: ${testUser.uuid}`);
        console.log(`   当前积分: ${testUser.credits}`);
        console.log(`   当前状态: ${testUser.subscription_status}`);
        
        return testUser;
        
    } catch (error) {
        console.error('❌ 选择测试用户失败:', error);
        return null;
    }
}

// 模拟订阅创建
async function simulateSubscriptionCreation(testUser) {
    try {
        const subscriptionId = 'I-TEST-' + Date.now();
        const planId = 'P-5ML4271244454362WXNWU5NI'; // Pro计划
        
        console.log(`📋 创建测试订阅: ${subscriptionId}`);
        console.log(`📋 计划ID: ${planId}`);
        
        // 构造用户信息
        const userInfo = {
            user_id: testUser.uuid,
            email: testUser.email,
            plan_type: 'pro'
        };
        
        // 模拟PayPal订阅创建Webhook
        const createWebhookData = {
            event_type: 'BILLING.SUBSCRIPTION.CREATED',
            resource: {
                id: subscriptionId,
                plan_id: planId,
                custom_id: JSON.stringify(userInfo),
                status: 'ACTIVE'
            }
        };
        
        console.log('📡 发送订阅创建Webhook...');
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createWebhookData)
        });
        
        console.log(`📊 Webhook响应: ${response.status}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ 订阅创建Webhook处理成功');
            console.log(`📄 响应: ${JSON.stringify(result)}`);
            
            // 验证订阅关联是否创建
            const { data: subscription, error: subError } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('paypal_subscription_id', subscriptionId)
                .single();
            
            if (subError) {
                console.warn('⚠️ 订阅关联创建可能失败:', subError.message);
            } else {
                console.log('✅ 订阅关联已创建:', subscription);
            }
            
            return subscriptionId;
        } else {
            const errorText = await response.text();
            console.error('❌ 订阅创建Webhook失败:', errorText);
            return null;
        }
        
    } catch (error) {
        console.error('❌ 模拟订阅创建失败:', error);
        return null;
    }
}

// 模拟订阅激活
async function simulateSubscriptionActivation(subscriptionId, testUser) {
    try {
        const planId = 'P-5ML4271244454362WXNWU5NI'; // Pro计划
        
        console.log(`🚀 激活测试订阅: ${subscriptionId}`);
        
        // 模拟PayPal订阅激活Webhook
        const activateWebhookData = {
            event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
            resource: {
                id: subscriptionId,
                plan_id: planId,
                status: 'ACTIVE'
            }
        };
        
        console.log('📡 发送订阅激活Webhook...');
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activateWebhookData)
        });
        
        console.log(`📊 Webhook响应: ${response.status}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ 订阅激活Webhook处理成功');
            console.log(`📄 响应: ${JSON.stringify(result)}`);
        } else {
            const errorText = await response.text();
            console.error('❌ 订阅激活Webhook失败:', errorText);
        }
        
    } catch (error) {
        console.error('❌ 模拟订阅激活失败:', error);
    }
}

// 验证测试结果
async function verifyTestResults(testUser, subscriptionId) {
    try {
        console.log('🔍 验证测试结果...');
        
        // 1. 检查用户积分和状态
        const { data: updatedUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', testUser.id)
            .single();
        
        if (userError) {
            console.error('❌ 查询用户失败:', userError);
        } else {
            console.log('\n👤 用户状态验证:');
            console.log(`   邮箱: ${updatedUser.email}`);
            console.log(`   积分: ${testUser.credits} → ${updatedUser.credits} (${updatedUser.credits > testUser.credits ? '✅ 增加' : '❌ 未变化'})`);
            console.log(`   状态: ${testUser.subscription_status} → ${updatedUser.subscription_status} (${updatedUser.subscription_status === 'ACTIVE' ? '✅ 激活' : '❌ 未激活'})`);
            
            if (updatedUser.credits > testUser.credits && updatedUser.subscription_status === 'ACTIVE') {
                console.log('🎉 用户状态更新成功！');
            } else {
                console.log('❌ 用户状态更新失败');
            }
        }
        
        // 2. 检查订阅关联
        const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('paypal_subscription_id', subscriptionId)
            .single();
        
        if (subError) {
            console.log('\n❌ 订阅关联验证失败:', subError.message);
        } else {
            console.log('\n🔗 订阅关联验证:');
            console.log(`   订阅ID: ${subscription.paypal_subscription_id}`);
            console.log(`   用户邮箱: ${subscription.google_user_email}`);
            console.log(`   计划类型: ${subscription.plan_type}`);
            console.log(`   状态: ${subscription.status} (${subscription.status === 'ACTIVE' ? '✅ 激活' : '⚠️ 待激活'})`);
        }
        
        // 3. 检查积分交易记录
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', testUser.uuid)
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (transError) {
            console.log('\n❌ 积分交易验证失败:', transError.message);
        } else {
            console.log('\n💳 积分交易验证:');
            if (transactions.length === 0) {
                console.log('   ❌ 没有找到积分交易记录');
            } else {
                transactions.forEach((trans, index) => {
                    const date = new Date(trans.created_at).toLocaleString();
                    console.log(`   ${index + 1}. ${trans.transaction_type}: ${trans.amount > 0 ? '+' : ''}${trans.amount} (${trans.source}) - ${date}`);
                });
                
                const recentEarn = transactions.find(t => t.transaction_type === 'EARN' && t.source === 'paypal_webhook');
                if (recentEarn) {
                    console.log('   ✅ 找到订阅激活的积分交易记录');
                } else {
                    console.log('   ❌ 没有找到订阅激活的积分交易记录');
                }
            }
        }
        
        // 4. 检查Webhook事件日志
        const { data: webhookEvents, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(5);
        
        if (webhookError) {
            console.log('\n❌ Webhook事件验证失败:', webhookError.message);
        } else {
            console.log('\n📝 Webhook事件验证:');
            if (webhookEvents.length === 0) {
                console.log('   ❌ 没有找到Webhook事件记录');
            } else {
                webhookEvents.forEach((event, index) => {
                    const date = new Date(event.processed_at).toLocaleString();
                    console.log(`   ${index + 1}. ${event.event_type} (${event.processing_status}) - ${date}`);
                });
            }
        }
        
        // 5. 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log('-'.repeat(40));
        
        const success = 
            updatedUser && 
            updatedUser.credits > testUser.credits && 
            updatedUser.subscription_status === 'ACTIVE' &&
            subscription && 
            subscription.status === 'ACTIVE';
        
        if (success) {
            console.log('🎉 测试成功！订阅流程工作正常');
            console.log('✅ 用户积分已增加');
            console.log('✅ 订阅状态已激活');
            console.log('✅ 订阅关联已创建');
        } else {
            console.log('❌ 测试失败！订阅流程存在问题');
            console.log('需要检查Webhook处理器和数据库权限');
        }
        
    } catch (error) {
        console.error('❌ 验证测试结果失败:', error);
    }
}

// 主函数
async function main() {
    await testCompleteSubscriptionFlow();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testCompleteSubscriptionFlow };