/**
 * 测试线上webhook端点和数据库写入
 * 验证 https://fluxkrea.me/api/paypal-webhook 是否正常工作
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhookEndpointLive() {
    console.log('🧪 测试线上webhook端点和数据库写入\n');
    
    const webhookUrl = 'https://fluxkrea.me/api/paypal-webhook';
    
    // 1. 测试webhook端点健康检查
    console.log('📋 1. 测试webhook端点健康检查...');
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Webhook端点正常运行');
            console.log(`   状态: ${data.status}`);
            console.log(`   消息: ${data.message}`);
            console.log(`   时间: ${data.timestamp}`);
        } else {
            console.log(`❌ Webhook端点响应异常: ${response.status}`);
            const text = await response.text();
            console.log(`   响应内容: ${text}`);
        }
    } catch (error) {
        console.log(`❌ 无法访问webhook端点: ${error.message}`);
        return;
    }
    
    // 2. 模拟PayPal webhook事件
    console.log('\n📋 2. 模拟PayPal webhook事件...');
    
    // 创建一个测试用户数据
    const testUserData = {
        user_id: `test_user_${Date.now()}`,
        email: 'test@fluxkrea.me'
    };
    
    const mockWebhookData = {
        event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
        resource: {
            id: `I-TEST-${Date.now()}`,
            plan_id: 'P-5S785818YS7424947NCJBKQA', // Pro Plan
            custom_id: JSON.stringify(testUserData),
            status: 'ACTIVE'
        },
        create_time: new Date().toISOString(),
        summary: 'Subscription activated'
    };
    
    console.log('发送模拟webhook数据...');
    console.log('数据:', JSON.stringify(mockWebhookData, null, 2));
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'PayPal/AUHD-214.0-55650910'
            },
            body: JSON.stringify(mockWebhookData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Webhook处理成功');
            console.log('   响应:', JSON.stringify(result, null, 2));
        } else {
            console.log(`❌ Webhook处理失败: ${response.status}`);
            const text = await response.text();
            console.log(`   错误内容: ${text}`);
        }
    } catch (error) {
        console.log(`❌ 发送webhook失败: ${error.message}`);
    }
    
    // 3. 检查数据库是否有新记录
    console.log('\n📋 3. 检查数据库记录...');
    
    // 等待一下让数据库写入完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 检查webhook事件记录
    const { data: webhookEvents, error: webhookError } = await supabase
        .from('webhook_events')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(5);
    
    if (webhookError) {
        console.log('❌ 查询webhook事件失败:', webhookError.message);
    } else {
        console.log(`✅ 找到 ${webhookEvents?.length || 0} 个webhook事件记录`);
        if (webhookEvents && webhookEvents.length > 0) {
            webhookEvents.forEach((event, index) => {
                console.log(`   ${index + 1}. ${event.event_type} - ${event.processed_at}`);
                console.log(`      Resource ID: ${event.resource_id}`);
            });
        }
    }
    
    // 检查积分交易记录
    const { data: transactions, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('source', 'paypal_webhook')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (transError) {
        console.log('❌ 查询积分交易失败:', transError.message);
    } else {
        console.log(`✅ 找到 ${transactions?.length || 0} 个PayPal积分交易记录`);
        if (transactions && transactions.length > 0) {
            transactions.forEach((trans, index) => {
                console.log(`   ${index + 1}. ${trans.transaction_type} ${trans.amount} - ${trans.description}`);
            });
        }
    }
    
    // 4. 测试真实用户场景
    console.log('\n📋 4. 测试真实用户场景...');
    
    // 查找一个真实用户进行测试
    const { data: realUsers, error: userError } = await supabase
        .from('users')
        .select('*')
        .not('email', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (userError || !realUsers || realUsers.length === 0) {
        console.log('⚠️ 没有找到真实用户进行测试');
    } else {
        const realUser = realUsers[0];
        console.log(`使用真实用户测试: ${realUser.email}`);
        
        const realWebhookData = {
            event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
            resource: {
                id: `I-REAL-TEST-${Date.now()}`,
                plan_id: 'P-5S785818YS7424947NCJBKQA',
                custom_id: JSON.stringify({
                    user_id: realUser.uuid,
                    email: realUser.email
                }),
                status: 'ACTIVE'
            }
        };
        
        console.log('发送真实用户webhook测试...');
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PayPal/AUHD-214.0-55650910'
                },
                body: JSON.stringify(realWebhookData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ 真实用户webhook处理成功');
                
                // 检查用户积分是否更新
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const { data: updatedUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', realUser.id)
                    .single();
                
                if (updatedUser) {
                    console.log(`   用户积分: ${realUser.credits} → ${updatedUser.credits}`);
                    if (updatedUser.credits > realUser.credits) {
                        console.log('✅ 积分更新成功！');
                    } else {
                        console.log('⚠️ 积分没有更新');
                    }
                }
            } else {
                console.log(`❌ 真实用户webhook处理失败: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ 真实用户webhook测试失败: ${error.message}`);
        }
    }
    
    // 5. 诊断可能的问题
    console.log('\n📋 5. 诊断可能的问题...');
    
    console.log('🔍 检查清单:');
    console.log('□ Webhook端点是否可访问');
    console.log('□ Webhook是否能接收POST请求');
    console.log('□ 数据库连接是否正常');
    console.log('□ Supabase RLS策略是否允许写入');
    console.log('□ 用户查找逻辑是否正确');
    console.log('□ 积分更新逻辑是否正确');
    console.log('□ 交易记录是否正确创建');
    
    // 6. 提供修复建议
    console.log('\n💡 修复建议:');
    
    if (!webhookEvents || webhookEvents.length === 0) {
        console.log('🚨 主要问题: webhook事件没有被记录到数据库');
        console.log('   可能原因:');
        console.log('   1. Supabase RLS策略阻止了写入');
        console.log('   2. API密钥权限不足');
        console.log('   3. webhook处理函数中的错误');
        console.log('   4. 数据库表结构问题');
        
        console.log('\n🔧 立即修复步骤:');
        console.log('1. 检查Supabase RLS策略');
        console.log('2. 检查API密钥权限');
        console.log('3. 查看服务器日志');
        console.log('4. 手动测试数据库写入');
    }
    
    if (!transactions || transactions.length === 0) {
        console.log('🚨 积分交易记录问题');
        console.log('   即使webhook被接收，积分也没有正确处理');
        console.log('   需要检查handleSubscriptionActivated函数');
    }
    
    console.log('\n🎯 下一步行动:');
    console.log('1. 如果webhook端点正常但数据库没有记录，检查RLS策略');
    console.log('2. 如果有webhook记录但没有积分交易，检查用户查找逻辑');
    console.log('3. 如果都正常，可能是PayPal没有发送真实的webhook事件');
    console.log('4. 考虑添加更详细的日志记录');
}

// 执行测试
testWebhookEndpointLive().catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
});