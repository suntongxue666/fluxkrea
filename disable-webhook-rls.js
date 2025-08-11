/**
 * 禁用webhook相关表的RLS策略
 * 解决webhook无法写入数据库的问题
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置 - 需要使用service_role密钥来修改RLS策略
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function disableWebhookRLS() {
    console.log('🔧 解决webhook RLS策略问题\n');
    
    console.log('🎯 问题分析:');
    console.log('webhook_events表的RLS策略阻止了匿名用户写入数据');
    console.log('这导致PayPal webhook无法记录事件到数据库');
    console.log('');
    
    // 1. 测试当前RLS状态
    console.log('📋 1. 测试当前RLS状态...');
    
    try {
        const { data, error } = await supabase
            .from('webhook_events')
            .insert({
                event_type: 'RLS_TEST',
                resource_data: { test: true },
                processed_at: new Date().toISOString()
            })
            .select();
        
        if (error) {
            console.log('❌ 当前RLS策略阻止写入:', error.message);
            console.log('   这确认了RLS是问题的根源');
        } else {
            console.log('✅ 写入成功，RLS策略正常');
            // 清理测试数据
            if (data && data.length > 0) {
                await supabase
                    .from('webhook_events')
                    .delete()
                    .eq('id', data[0].id);
            }
        }
    } catch (e) {
        console.log('❌ 测试RLS状态异常:', e.message);
    }
    
    // 2. 提供手动修复步骤
    console.log('\n📋 2. 手动修复步骤（需要在Supabase控制台执行）...');
    
    console.log('🔧 立即修复步骤:');
    console.log('');
    console.log('1. 登录Supabase控制台: https://supabase.com/dashboard');
    console.log('2. 选择你的项目');
    console.log('3. 进入 "Authentication" > "Policies"');
    console.log('4. 找到 "webhook_events" 表');
    console.log('5. 点击 "Disable RLS" 或添加允许插入的策略');
    console.log('');
    
    console.log('📝 方案1: 完全禁用RLS（推荐，最简单）');
    console.log('在Supabase控制台中，找到webhook_events表，点击"Disable RLS"');
    console.log('');
    
    console.log('📝 方案2: 添加允许插入的策略');
    console.log('在SQL编辑器中执行以下SQL:');
    console.log('');
    console.log('-- 为webhook_events表添加允许所有插入的策略');
    console.log('CREATE POLICY "Allow webhook inserts" ON webhook_events');
    console.log('FOR INSERT WITH CHECK (true);');
    console.log('');
    console.log('-- 为credit_transactions表添加允许所有插入的策略（如果需要）');
    console.log('CREATE POLICY "Allow credit transaction inserts" ON credit_transactions');
    console.log('FOR INSERT WITH CHECK (true);');
    
    // 3. 创建验证函数
    console.log('\n📋 3. 创建验证函数...');
    
    global.verifyWebhookRLSFix = verifyWebhookRLSFix;
    global.testCompleteWebhookFlow = testCompleteWebhookFlow;
    
    console.log('✅ 验证函数已创建:');
    console.log('- verifyWebhookRLSFix() - 验证RLS修复是否成功');
    console.log('- testCompleteWebhookFlow() - 测试完整webhook流程');
    
    // 4. 提供临时解决方案
    console.log('\n📋 4. 临时解决方案...');
    
    console.log('💡 如果无法立即修改RLS策略，可以使用以下临时方案:');
    console.log('');
    console.log('1. 修改webhook处理逻辑，跳过事件记录');
    console.log('2. 只记录积分交易（这个功能正常）');
    console.log('3. 添加更详细的错误日志');
    console.log('');
    console.log('这样至少能确保积分同步功能正常工作');
    
    // 5. 创建临时修复版本的webhook处理
    console.log('\n📋 5. 创建临时修复版本...');
    
    global.temporaryWebhookHandler = temporaryWebhookHandler;
    
    console.log('✅ 临时处理函数已创建:');
    console.log('- temporaryWebhookHandler(eventData) - 跳过事件记录的webhook处理');
    
    console.log('\n🎯 推荐行动计划:');
    console.log('1. 立即在Supabase控制台禁用webhook_events表的RLS');
    console.log('2. 重新测试webhook功能');
    console.log('3. 验证积分同步是否正常工作');
    console.log('4. 如果一切正常，问题就解决了');
}

// 验证RLS修复是否成功
async function verifyWebhookRLSFix() {
    console.log('🧪 验证RLS修复是否成功...');
    
    try {
        const testData = {
            event_type: 'VERIFICATION_TEST',
            resource_data: { 
                test: true, 
                timestamp: new Date().toISOString() 
            },
            processed_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('webhook_events')
            .insert(testData)
            .select();
        
        if (error) {
            console.log('❌ RLS修复失败:', error.message);
            console.log('   仍然无法写入webhook_events表');
            return false;
        } else {
            console.log('✅ RLS修复成功！');
            console.log('   可以正常写入webhook_events表');
            console.log('   记录ID:', data[0]?.id);
            
            // 清理测试数据
            if (data && data.length > 0) {
                await supabase
                    .from('webhook_events')
                    .delete()
                    .eq('id', data[0].id);
                console.log('   测试数据已清理');
            }
            
            return true;
        }
    } catch (error) {
        console.log('❌ 验证过程异常:', error.message);
        return false;
    }
}

// 测试完整webhook流程
async function testCompleteWebhookFlow() {
    console.log('🧪 测试完整webhook流程...');
    
    // 首先验证RLS修复
    const rlsFixed = await verifyWebhookRLSFix();
    
    if (!rlsFixed) {
        console.log('❌ RLS未修复，无法测试完整流程');
        return false;
    }
    
    // 测试完整的webhook处理流程
    const webhookUrl = 'https://fluxkrea.me/api/paypal-webhook';
    
    // 查找一个真实用户进行测试
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .not('email', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (userError || !users || users.length === 0) {
        console.log('⚠️ 没有找到测试用户');
        return false;
    }
    
    const testUser = users[0];
    const originalCredits = testUser.credits || 0;
    
    console.log(`使用测试用户: ${testUser.email} (当前积分: ${originalCredits})`);
    
    const testWebhookData = {
        event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
        resource: {
            id: `I-COMPLETE-TEST-${Date.now()}`,
            plan_id: 'P-5S785818YS7424947NCJBKQA',
            custom_id: JSON.stringify({
                user_id: testUser.uuid,
                email: testUser.email
            }),
            status: 'ACTIVE'
        }
    };
    
    try {
        console.log('发送完整webhook测试...');
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'PayPal/AUHD-214.0-55650910'
            },
            body: JSON.stringify(testWebhookData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Webhook处理成功');
            
            // 等待数据库更新
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 检查webhook事件是否被记录
            const { data: webhookEvents } = await supabase
                .from('webhook_events')
                .select('*')
                .eq('event_type', 'BILLING.SUBSCRIPTION.ACTIVATED')
                .order('processed_at', { ascending: false })
                .limit(1);
            
            if (webhookEvents && webhookEvents.length > 0) {
                console.log('✅ Webhook事件已记录到数据库');
            } else {
                console.log('⚠️ Webhook事件未记录到数据库');
            }
            
            // 检查用户积分是否更新
            const { data: updatedUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', testUser.id)
                .single();
            
            if (updatedUser && updatedUser.credits > originalCredits) {
                console.log(`✅ 用户积分已更新: ${originalCredits} → ${updatedUser.credits}`);
                console.log('🎉 完整webhook流程测试成功！');
                return true;
            } else {
                console.log('❌ 用户积分未更新');
                return false;
            }
        } else {
            console.log(`❌ Webhook处理失败: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ 完整流程测试失败: ${error.message}`);
        return false;
    }
}

// 临时webhook处理函数（跳过事件记录）
async function temporaryWebhookHandler(eventData) {
    console.log('🔧 使用临时webhook处理（跳过事件记录）...');
    
    const { event_type, resource } = eventData;
    
    if (event_type !== 'BILLING.SUBSCRIPTION.ACTIVATED') {
        console.log('⚠️ 非订阅激活事件，跳过处理');
        return;
    }
    
    console.log('处理订阅激活事件（临时版本）...');
    
    // 跳过事件记录，直接处理积分
    try {
        const planDetails = {
            'P-5S785818YS7424947NCJBKQA': { name: 'Pro Plan', credits: 1000 },
            'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000 }
        };
        
        const plan = planDetails[resource.plan_id];
        if (!plan) {
            console.log('❌ 未知的计划ID:', resource.plan_id);
            return;
        }
        
        let userInfo;
        try {
            userInfo = JSON.parse(resource.custom_id);
        } catch (e) {
            console.log('❌ 无法解析用户信息:', resource.custom_id);
            return;
        }
        
        // 查找用户并更新积分
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userInfo.user_id);
        
        if (userError || !users || users.length === 0) {
            console.log('❌ 找不到用户:', userInfo.user_id);
            return;
        }
        
        const user = users[0];
        const newCredits = (user.credits || 0) + plan.credits;
        
        // 更新用户积分
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateError) {
            console.log('❌ 更新用户积分失败:', updateError.message);
            return;
        }
        
        // 记录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                transaction_type: 'EARN',
                amount: plan.credits,
                balance_after: newCredits,
                description: `${plan.name}订阅激活（临时处理）`,
                source: 'paypal_webhook_temp'
            });
        
        if (transError) {
            console.log('⚠️ 积分交易记录失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        console.log(`✅ 临时处理成功: ${user.email} 获得 ${plan.credits} 积分`);
        
    } catch (error) {
        console.log('❌ 临时处理失败:', error.message);
    }
}

// 执行修复
disableWebhookRLS().catch(error => {
    console.error('❌ 修复失败:', error);
    process.exit(1);
});