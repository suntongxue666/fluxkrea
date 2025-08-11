/**
 * 修复webhook数据库记录问题
 * 解决webhook事件和积分交易记录不被保存的问题
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixWebhookDatabaseLogging() {
    console.log('🔧 修复webhook数据库记录问题\n');
    
    // 1. 测试数据库连接和权限
    console.log('📋 1. 测试数据库连接和权限...');
    
    const tables = ['webhook_events', 'credit_transactions', 'users'];
    
    for (const table of tables) {
        console.log(`\n测试表: ${table}`);
        
        // 测试读取权限
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ 读取失败: ${error.message}`);
            } else {
                console.log(`✅ 读取权限正常`);
            }
        } catch (e) {
            console.log(`❌ 读取异常: ${e.message}`);
        }
        
        // 测试写入权限（仅对非用户表）
        if (table !== 'users') {
            try {
                const testData = table === 'webhook_events' ? {
                    event_type: 'TEST_EVENT',
                    resource_id: 'test-123',
                    resource_data: { test: true },
                    processed_at: new Date().toISOString()
                } : {
                    user_uuid: 'test-uuid',
                    transaction_type: 'EARN',
                    amount: 1,
                    balance_after: 1,
                    description: '测试交易',
                    source: 'test'
                };
                
                const { data, error } = await supabase
                    .from(table)
                    .insert(testData)
                    .select();
                
                if (error) {
                    console.log(`❌ 写入失败: ${error.message}`);
                    console.log(`   详细错误: ${JSON.stringify(error, null, 2)}`);
                } else {
                    console.log(`✅ 写入权限正常`);
                    
                    // 清理测试数据
                    if (data && data.length > 0) {
                        await supabase
                            .from(table)
                            .delete()
                            .eq('id', data[0].id);
                        console.log(`   测试数据已清理`);
                    }
                }
            } catch (e) {
                console.log(`❌ 写入异常: ${e.message}`);
            }
        }
    }
    
    // 2. 检查RLS策略
    console.log('\n📋 2. 检查RLS策略...');
    
    console.log('检查webhook_events表的RLS策略...');
    try {
        // 尝试直接插入webhook事件
        const { data, error } = await supabase
            .from('webhook_events')
            .insert({
                event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
                resource_id: 'I-RLS-TEST-123',
                resource_data: { test: 'rls_test' },
                processed_at: new Date().toISOString()
            })
            .select();
        
        if (error) {
            console.log('❌ RLS策略阻止了webhook_events写入');
            console.log(`   错误: ${error.message}`);
            console.log('   需要修改RLS策略或使用service_role密钥');
        } else {
            console.log('✅ webhook_events写入正常');
            
            // 清理测试数据
            if (data && data.length > 0) {
                await supabase
                    .from('webhook_events')
                    .delete()
                    .eq('id', data[0].id);
            }
        }
    } catch (e) {
        console.log(`❌ webhook_events测试异常: ${e.message}`);
    }
    
    console.log('\n检查credit_transactions表的RLS策略...');
    try {
        // 尝试直接插入积分交易
        const { data, error } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: 'test-uuid-rls',
                transaction_type: 'EARN',
                amount: 100,
                balance_after: 100,
                description: 'RLS测试交易',
                source: 'rls_test'
            })
            .select();
        
        if (error) {
            console.log('❌ RLS策略阻止了credit_transactions写入');
            console.log(`   错误: ${error.message}`);
            console.log('   需要修改RLS策略或使用service_role密钥');
        } else {
            console.log('✅ credit_transactions写入正常');
            
            // 清理测试数据
            if (data && data.length > 0) {
                await supabase
                    .from('credit_transactions')
                    .delete()
                    .eq('id', data[0].id);
            }
        }
    } catch (e) {
        console.log(`❌ credit_transactions测试异常: ${e.message}`);
    }
    
    // 3. 创建修复后的webhook处理函数
    console.log('\n📋 3. 创建修复后的webhook处理函数...');
    
    // 导出修复函数
    global.fixedLogWebhookEvent = fixedLogWebhookEvent;
    global.fixedLogCreditTransaction = fixedLogCreditTransaction;
    global.testWebhookLogging = testWebhookLogging;
    
    console.log('✅ 修复函数已创建:');
    console.log('- fixedLogWebhookEvent(eventType, resource)');
    console.log('- fixedLogCreditTransaction(userUuid, amount, description)');
    console.log('- testWebhookLogging()');
    
    // 4. 提供修复建议
    console.log('\n💡 修复建议:');
    
    console.log('🎯 主要问题可能是:');
    console.log('1. RLS策略阻止了匿名用户写入webhook_events和credit_transactions表');
    console.log('2. 需要在Supabase中禁用这两个表的RLS或修改策略');
    console.log('3. 或者使用service_role密钥而不是anon密钥');
    
    console.log('\n🔧 立即修复步骤:');
    console.log('1. 登录Supabase控制台');
    console.log('2. 进入Authentication > Policies');
    console.log('3. 为webhook_events表添加允许INSERT的策略');
    console.log('4. 为credit_transactions表添加允许INSERT的策略');
    console.log('5. 或者完全禁用这两个表的RLS');
    
    console.log('\n📝 建议的RLS策略:');
    console.log('-- 允许所有用户插入webhook事件');
    console.log('CREATE POLICY "Allow webhook inserts" ON webhook_events');
    console.log('FOR INSERT WITH CHECK (true);');
    console.log('');
    console.log('-- 允许所有用户插入积分交易');
    console.log('CREATE POLICY "Allow credit transaction inserts" ON credit_transactions');
    console.log('FOR INSERT WITH CHECK (true);');
    
    // 5. 测试修复后的功能
    console.log('\n📋 5. 测试修复后的功能...');
    await testWebhookLogging();
}

// 修复后的webhook事件记录函数
async function fixedLogWebhookEvent(eventType, resource) {
    try {
        console.log(`🔧 记录webhook事件: ${eventType}`);
        
        const logData = {
            event_type: eventType,
            resource_id: resource?.id || 'unknown',
            resource_data: resource || {},
            processed_at: new Date().toISOString(),
            status: 'processed'
        };
        
        const { data, error } = await supabase
            .from('webhook_events')
            .insert(logData)
            .select();
        
        if (error) {
            console.log('❌ Webhook事件记录失败:', error.message);
            console.log('   详细错误:', JSON.stringify(error, null, 2));
            return false;
        } else {
            console.log('✅ Webhook事件已记录');
            return true;
        }
    } catch (error) {
        console.log('❌ Webhook事件记录异常:', error.message);
        return false;
    }
}

// 修复后的积分交易记录函数
async function fixedLogCreditTransaction(userUuid, amount, description, source = 'paypal_webhook') {
    try {
        console.log(`🔧 记录积分交易: ${userUuid} ${amount}`);
        
        // 先获取用户当前积分
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('credits')
            .eq('uuid', userUuid)
            .single();
        
        if (userError) {
            console.log('❌ 获取用户积分失败:', userError.message);
            return false;
        }
        
        const balanceAfter = (users.credits || 0) + amount;
        
        const transactionData = {
            user_uuid: userUuid,
            transaction_type: 'EARN',
            amount: amount,
            balance_after: balanceAfter,
            description: description,
            source: source
        };
        
        const { data, error } = await supabase
            .from('credit_transactions')
            .insert(transactionData)
            .select();
        
        if (error) {
            console.log('❌ 积分交易记录失败:', error.message);
            console.log('   详细错误:', JSON.stringify(error, null, 2));
            return false;
        } else {
            console.log('✅ 积分交易已记录');
            return true;
        }
    } catch (error) {
        console.log('❌ 积分交易记录异常:', error.message);
        return false;
    }
}

// 测试webhook记录功能
async function testWebhookLogging() {
    console.log('🧪 测试webhook记录功能...');
    
    // 测试webhook事件记录
    const webhookSuccess = await fixedLogWebhookEvent('TEST_EVENT', {
        id: 'test-123',
        plan_id: 'test-plan',
        status: 'ACTIVE'
    });
    
    if (webhookSuccess) {
        console.log('✅ Webhook事件记录功能正常');
    } else {
        console.log('❌ Webhook事件记录功能异常');
    }
    
    // 测试积分交易记录
    const transactionSuccess = await fixedLogCreditTransaction(
        'test-user-uuid',
        1000,
        '测试积分交易',
        'test'
    );
    
    if (transactionSuccess) {
        console.log('✅ 积分交易记录功能正常');
    } else {
        console.log('❌ 积分交易记录功能异常');
    }
    
    return webhookSuccess && transactionSuccess;
}

// 执行修复
fixWebhookDatabaseLogging().catch(error => {
    console.error('❌ 修复失败:', error);
    process.exit(1);
});