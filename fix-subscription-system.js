// 订阅系统修复脚本
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 计划配置
const SUBSCRIPTION_PLANS = {
    'P-5S785818YS7424947NCJBKQA': { 
        name: 'Pro Plan', 
        credits: 1000, 
        price: 9.99,
        type: 'pro'
    },
    'P-3NJ78684DS796242VNCJBKQQ': { 
        name: 'Max Plan', 
        credits: 5000, 
        price: 29.99,
        type: 'max'
    }
};

async function main() {
    console.log('===== 订阅系统诊断与修复工具 =====');
    
    // 1. 检查RLS策略
    console.log('\n1. 检查数据库RLS策略...');
    await checkRlsPolicies();
    
    // 2. 检查webhook事件表
    console.log('\n2. 检查webhook事件记录...');
    await checkWebhookEvents();
    
    // 3. 检查订阅表结构
    console.log('\n3. 检查订阅表结构...');
    await checkSubscriptionTables();
    
    // 4. 测试订阅创建流程
    console.log('\n4. 测试订阅创建流程...');
    await testSubscriptionCreation();
    
    console.log('\n===== 诊断完成 =====');
}

async function checkRlsPolicies() {
    try {
        // 这里我们无法直接检查RLS策略，但可以测试是否能访问关键表
        const tables = ['users', 'user_subscriptions', 'subscriptions', 'webhook_events'];
        
        for (const table of tables) {
            console.log(`检查表 ${table} 的访问权限...`);
            
            const { data, error } = await supabase
                .from(table)
                .select('count(*)')
                .limit(1);
            
            if (error) {
                console.log(`❌ 无法访问 ${table} 表: ${error.message}`);
                console.log(`   可能的RLS策略问题，需要检查该表的RLS配置`);
            } else {
                console.log(`✅ 可以正常访问 ${table} 表`);
            }
        }
        
        console.log('\n建议: 检查Supabase控制台中的RLS策略，确保以下策略存在:');
        console.log('1. user_subscriptions 表应允许匿名插入');
        console.log('2. webhook_events 表应允许匿名插入');
        console.log('3. users 表应允许通过API更新积分');
    } catch (err) {
        console.error('检查RLS策略时出错:', err);
    }
}

async function checkWebhookEvents() {
    try {
        const { data: events, error } = await supabase
            .from('webhook_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) {
            console.error('❌ 查询webhook事件失败:', error.message);
            return;
        }
        
        if (!events || events.length === 0) {
            console.log('⚠️ 没有找到webhook事件记录');
            console.log('   可能原因: PayPal未发送webhook或webhook处理失败');
        } else {
            console.log(`✅ 找到 ${events.length} 条最近的webhook事件:`);
            events.forEach((event, i) => {
                console.log(`   ${i+1}. ${event.event_type || '未知事件'} (${event.processed_at || '未知时间'})`);
            });
        }
        
        // 检查是否有订阅激活事件
        const activationEvents = events.filter(e => e.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED');
        if (activationEvents.length === 0) {
            console.log('⚠️ 没有找到订阅激活事件');
            console.log('   问题: PayPal可能没有发送激活事件或webhook配置错误');
        }
    } catch (err) {
        console.error('检查webhook事件时出错:', err);
    }
}

async function checkSubscriptionTables() {
    try {
        // 检查user_subscriptions表
        const { data: userSubs, error: userSubError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (userSubError) {
            console.error('❌ 查询user_subscriptions表失败:', userSubError.message);
        } else if (!userSubs || userSubs.length === 0) {
            console.log('⚠️ user_subscriptions表中没有记录');
        } else {
            console.log(`✅ user_subscriptions表中有 ${userSubs.length} 条最近记录`);
            
            // 检查状态
            const pendingSubs = userSubs.filter(s => s.status === 'PENDING');
            if (pendingSubs.length > 0) {
                console.log(`⚠️ 发现 ${pendingSubs.length} 条处于PENDING状态的订阅`);
            }
        }
        
        // 检查subscriptions表
        const { data: subs, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (subError) {
            console.error('❌ 查询subscriptions表失败:', subError.message);
        } else if (!subs || subs.length === 0) {
            console.log('⚠️ subscriptions表中没有记录');
        } else {
            console.log(`✅ subscriptions表中有 ${subs.length} 条最近记录`);
        }
    } catch (err) {
        console.error('检查订阅表时出错:', err);
    }
}

async function testSubscriptionCreation() {
    try {
        console.log('模拟订阅创建流程...');
        
        // 1. 创建测试用户
        const testEmail = `test_${Date.now()}@example.com`;
        const testUserId = `user_${Date.now()}`;
        
        console.log(`创建测试用户: ${testEmail}`);
        
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
                uuid: testUserId,
                email: testEmail,
                name: 'Test User',
                credits: 0,
                subscription_status: 'FREE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select();
        
        if (userError) {
            console.error('❌ 创建测试用户失败:', userError.message);
            return;
        }
        
        console.log('✅ 测试用户创建成功');
        
        // 2. 创建订阅关联
        const testSubId = `test_sub_${Date.now()}`;
        const planId = 'P-5S785818YS7424947NCJBKQA'; // Pro Plan
        
        console.log('创建订阅关联...');
        
        const { error: subError } = await supabase
            .from('user_subscriptions')
            .insert({
                google_user_id: testUserId,
                google_user_email: testEmail,
                paypal_subscription_id: testSubId,
                plan_id: planId,
                plan_type: 'pro',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
        
        if (subError) {
            console.error('❌ 创建订阅关联失败:', subError.message);
            console.log('   问题: 可能是RLS策略限制或表结构问题');
            return;
        }
        
        console.log('✅ 订阅关联创建成功');
        
        // 3. 模拟webhook激活
        console.log('模拟webhook激活事件...');
        
        // 记录webhook事件
        const { error: eventError } = await supabase
            .from('webhook_events')
            .insert({
                event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
                resource_data: {
                    id: testSubId,
                    plan_id: planId,
                    custom_id: JSON.stringify({
                        user_id: testUserId,
                        email: testEmail
                    })
                },
                processed_at: new Date().toISOString()
            });
        
        if (eventError) {
            console.error('❌ 记录webhook事件失败:', eventError.message);
            console.log('   问题: 可能是RLS策略限制或表结构问题');
        } else {
            console.log('✅ Webhook事件记录成功');
        }
        
        // 4. 手动激活订阅
        console.log('手动激活订阅...');
        
        const plan = SUBSCRIPTION_PLANS[planId];
        const creditsToAdd = plan.credits;
        
        // 更新订阅状态
        const { error: updateSubError } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', testSubId);
        
        if (updateSubError) {
            console.error('❌ 更新订阅状态失败:', updateSubError.message);
        } else {
            console.log('✅ 订阅状态已更新为ACTIVE');
        }
        
        // 更新用户积分和订阅状态
        const { error: updateUserError } = await supabase
            .from('users')
            .update({
                credits: creditsToAdd,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('uuid', testUserId);
        
        if (updateUserError) {
            console.error('❌ 更新用户状态失败:', updateUserError.message);
        } else {
            console.log(`✅ 用户积分已更新: +${creditsToAdd}`);
        }
        
        // 记录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: testUserId,
                transaction_type: 'EARN',
                amount: creditsToAdd,
                balance_after: creditsToAdd,
                description: `${plan.name}订阅激活`,
                source: 'test_activation'
            });
        
        if (transError) {
            console.warn('⚠️ 积分交易记录失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        console.log('\n测试结果:');
        console.log('1. 用户创建: ✅');
        console.log('2. 订阅关联: ' + (subError ? '❌' : '✅'));
        console.log('3. Webhook事件: ' + (eventError ? '❌' : '✅'));
        console.log('4. 订阅激活: ' + (updateSubError ? '❌' : '✅'));
        console.log('5. 积分更新: ' + (updateUserError ? '❌' : '✅'));
        console.log('6. 交易记录: ' + (transError ? '❌' : '✅'));
        
        // 清理测试数据
        console.log('\n清理测试数据...');
        await supabase.from('users').delete().eq('uuid', testUserId);
        await supabase.from('user_subscriptions').delete().eq('paypal_subscription_id', testSubId);
        console.log('✅ 测试数据已清理');
        
    } catch (err) {
        console.error('测试订阅创建时出错:', err);
    }
}

// 运行主函数
main().catch(err => {
    console.error('程序执行错误:', err);
});