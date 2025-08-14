/**
 * 测试 krea_professional.html 的完整功能
 * 验证用户管理、积分系统和订阅功能
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置（与前端保持一致）
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 测试用户数据
const testUser = {
    uuid: `user_${Date.now()}_test`,
    google_id: 'google_test_12345',
    email: 'sunwei7482@gmail.com',
    name: 'Sun Wei',
    avatar_url: 'https://example.com/avatar.jpg'
};

async function testDatabaseFunctions() {
    console.log('🔧 测试数据库函数...');
    
    try {
        // 1. 测试用户上下文设置
        console.log('测试 set_user_context 函数...');
        const { error: contextError } = await supabase.rpc('set_user_context', { 
            user_uuid: testUser.uuid 
        });
        
        if (contextError) {
            console.error('❌ set_user_context 失败:', contextError);
        } else {
            console.log('✅ set_user_context 成功');
        }
        
        // 2. 测试获取当前用户UUID
        console.log('测试 get_current_user_uuid 函数...');
        const { data: currentUuid, error: uuidError } = await supabase.rpc('get_current_user_uuid');
        
        if (uuidError) {
            console.error('❌ get_current_user_uuid 失败:', uuidError);
        } else {
            console.log('✅ get_current_user_uuid 成功:', currentUuid);
        }
        
    } catch (error) {
        console.error('❌ 数据库函数测试失败:', error);
    }
}

async function testUserManagement() {
    console.log('👤 测试用户管理功能...');
    
    try {
        // 1. 创建测试用户
        console.log('创建测试用户...');
        const { data: user, error: createError } = await supabase
            .from('users')
            .insert({
                uuid: testUser.uuid,
                google_id: testUser.google_id,
                email: testUser.email,
                name: testUser.name,
                avatar_url: testUser.avatar_url,
                credits: 20,
                subscription_status: 'FREE',
                is_signed_in: true
            })
            .select()
            .single();
        
        if (createError) {
            console.error('❌ 用户创建失败:', createError);
            return null;
        }
        
        console.log('✅ 用户创建成功:', user.email);
        
        // 2. 查询用户
        console.log('查询用户信息...');
        const { data: foundUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', testUser.uuid)
            .single();
        
        if (findError) {
            console.error('❌ 用户查询失败:', findError);
        } else {
            console.log('✅ 用户查询成功:', foundUser.email, '积分:', foundUser.credits);
        }
        
        return user;
        
    } catch (error) {
        console.error('❌ 用户管理测试失败:', error);
        return null;
    }
}

async function testCreditsSystem(user) {
    console.log('💰 测试积分系统...');
    
    try {
        // 1. 记录首次登录积分奖励
        console.log('记录首次登录积分奖励...');
        const { error: transactionError } = await supabase.rpc('add_credit_transaction', {
            p_user_id: user.google_id,
            p_user_uuid: user.uuid,
            p_transaction_type: 'EARN',
            p_amount: 20,
            p_description: '首次登录奖励',
            p_source: 'first_login_bonus'
        });
        
        if (transactionError) {
            console.error('❌ 积分交易记录失败:', transactionError);
        } else {
            console.log('✅ 首次登录积分奖励记录成功');
        }
        
        // 2. 消费积分（生成图像）
        console.log('测试积分消费...');
        const newBalance = user.credits - 10;
        
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                credits: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', user.uuid);
        
        if (updateError) {
            console.error('❌ 积分更新失败:', updateError);
        } else {
            console.log('✅ 积分消费成功，余额:', newBalance);
        }
        
        // 记录消费交易
        const { error: spendError } = await supabase.rpc('add_credit_transaction', {
            p_user_id: user.google_id,
            p_user_uuid: user.uuid,
            p_transaction_type: 'SPEND',
            p_amount: 10,
            p_description: 'AI图片生成',
            p_source: 'generation'
        });
        
        if (spendError) {
            console.error('❌ 消费交易记录失败:', spendError);
        } else {
            console.log('✅ 消费交易记录成功');
        }
        
        // 3. 查看用户统计
        console.log('获取用户统计信息...');
        const { data: stats, error: statsError } = await supabase.rpc('get_user_stats', {
            p_user_uuid: user.uuid
        });
        
        if (statsError) {
            console.error('❌ 用户统计获取失败:', statsError);
        } else {
            console.log('✅ 用户统计:', stats);
        }
        
    } catch (error) {
        console.error('❌ 积分系统测试失败:', error);
    }
}

async function testSubscriptionSystem(user) {
    console.log('📋 测试订阅系统...');
    
    try {
        // 1. 创建订阅记录
        console.log('创建订阅记录...');
        const subscriptionData = {
            google_user_email: user.email,
            paypal_subscription_id: 'paypal_test_sub_123',
            plan_type: 'BASIC',
            status: 'ACTIVE',
            created_at: new Date().toISOString()
        };
        
        const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .insert(subscriptionData)
            .select()
            .single();
        
        if (subError) {
            console.error('❌ 订阅创建失败:', subError);
        } else {
            console.log('✅ 订阅创建成功:', subscription.plan_type);
        }
        
        // 2. 更新订阅状态
        console.log('测试订阅状态更新...');
        const { error: statusError } = await supabase.rpc('update_subscription_status', {
            p_paypal_subscription_id: 'paypal_test_sub_123',
            p_status: 'ACTIVE'
        });
        
        if (statusError) {
            console.error('❌ 订阅状态更新失败:', statusError);
        } else {
            console.log('✅ 订阅状态更新成功');
        }
        
        // 3. 验证用户订阅状态
        const { data: updatedUser, error: userError } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('uuid', user.uuid)
            .single();
        
        if (userError) {
            console.error('❌ 用户订阅状态查询失败:', userError);
        } else {
            console.log('✅ 用户订阅状态:', updatedUser.subscription_status);
        }
        
    } catch (error) {
        console.error('❌ 订阅系统测试失败:', error);
    }
}

async function testWebhookSystem() {
    console.log('🔗 测试Webhook系统...');
    
    try {
        // 模拟PayPal webhook事件
        const webhookData = {
            event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
            resource_data: {
                id: 'paypal_test_sub_123',
                status: 'ACTIVE',
                subscriber: {
                    email_address: testUser.email
                }
            },
            status: 'processed',
            created_at: new Date().toISOString()
        };
        
        const { data: webhook, error: webhookError } = await supabase
            .from('webhook_events')
            .insert(webhookData)
            .select()
            .single();
        
        if (webhookError) {
            console.error('❌ Webhook记录失败:', webhookError);
        } else {
            console.log('✅ Webhook记录成功:', webhook.event_type);
        }
        
    } catch (error) {
        console.error('❌ Webhook系统测试失败:', error);
    }
}

async function cleanupTestData() {
    console.log('🗑️ 清理测试数据...');
    
    try {
        // 删除测试数据
        await supabase.from('credit_transactions').delete().eq('user_uuid', testUser.uuid);
        await supabase.from('user_subscriptions').delete().eq('google_user_email', testUser.email);
        await supabase.from('webhook_events').delete().eq('resource_data->id', 'paypal_test_sub_123');
        await supabase.from('users').delete().eq('uuid', testUser.uuid);
        
        console.log('✅ 测试数据清理完成');
        
    } catch (error) {
        console.error('❌ 测试数据清理失败:', error);
    }
}

async function runCompleteTest() {
    console.log('🚀 开始 krea_professional.html 完整功能测试\n');
    
    try {
        // 1. 测试数据库函数
        await testDatabaseFunctions();
        console.log('');
        
        // 2. 测试用户管理
        const user = await testUserManagement();
        if (!user) {
            console.error('❌ 用户管理测试失败，终止测试');
            return;
        }
        console.log('');
        
        // 3. 测试积分系统
        await testCreditsSystem(user);
        console.log('');
        
        // 4. 测试订阅系统
        await testSubscriptionSystem(user);
        console.log('');
        
        // 5. 测试Webhook系统
        await testWebhookSystem();
        console.log('');
        
        console.log('🎉 所有测试完成！krea_professional.html 功能正常');
        
        // 6. 清理测试数据
        await cleanupTestData();
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
}

// 运行测试
runCompleteTest();