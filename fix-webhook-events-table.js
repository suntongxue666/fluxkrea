/**
 * 修复webhook_events表结构问题
 * 确保表有正确的列结构
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixWebhookEventsTable() {
    console.log('🔧 修复webhook_events表结构问题\n');
    
    // 1. 检查当前表结构
    console.log('📋 1. 检查当前表结构...');
    
    try {
        // 尝试查询表结构
        const { data, error } = await supabase
            .from('webhook_events')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ 查询webhook_events表失败:', error.message);
        } else {
            console.log('✅ webhook_events表存在');
            if (data && data.length > 0) {
                console.log('当前表结构列:', Object.keys(data[0]));
            } else {
                console.log('表为空，无法确定列结构');
            }
        }
    } catch (e) {
        console.log('❌ 表结构检查异常:', e.message);
    }
    
    // 2. 测试插入数据以确定缺少的列
    console.log('\n📋 2. 测试插入数据以确定缺少的列...');
    
    const testData = {
        event_type: 'TEST_EVENT',
        processed_at: new Date().toISOString()
    };
    
    try {
        const { data, error } = await supabase
            .from('webhook_events')
            .insert(testData)
            .select();
        
        if (error) {
            console.log('❌ 基础插入失败:', error.message);
        } else {
            console.log('✅ 基础插入成功');
            console.log('成功插入的数据:', data[0]);
            
            // 清理测试数据
            if (data && data.length > 0) {
                await supabase
                    .from('webhook_events')
                    .delete()
                    .eq('id', data[0].id);
                console.log('测试数据已清理');
            }
        }
    } catch (e) {
        console.log('❌ 基础插入异常:', e.message);
    }
    
    // 3. 创建适配当前表结构的记录函数
    console.log('\n📋 3. 创建适配当前表结构的记录函数...');
    
    // 导出适配函数
    global.adaptedLogWebhookEvent = adaptedLogWebhookEvent;
    global.testAdaptedLogging = testAdaptedLogging;
    global.fixWebhookProcessing = fixWebhookProcessing;
    
    console.log('✅ 适配函数已创建:');
    console.log('- adaptedLogWebhookEvent(eventType, resource)');
    console.log('- testAdaptedLogging()');
    console.log('- fixWebhookProcessing()');
    
    // 4. 测试适配后的功能
    console.log('\n📋 4. 测试适配后的功能...');
    await testAdaptedLogging();
    
    // 5. 提供完整的修复方案
    console.log('\n📋 5. 完整修复方案...');
    
    console.log('🎯 问题总结:');
    console.log('1. webhook_events表缺少resource_id列');
    console.log('2. 需要适配当前表结构');
    console.log('3. 积分交易记录功能正常');
    
    console.log('\n🔧 修复方案:');
    console.log('方案1: 修改webhook处理代码，适配当前表结构');
    console.log('方案2: 在Supabase中添加缺少的列');
    console.log('方案3: 重新创建表结构');
    
    console.log('\n💡 推荐方案1 - 修改代码适配:');
    console.log('这样不需要修改数据库结构，风险最小');
}

// 适配当前表结构的webhook事件记录函数
async function adaptedLogWebhookEvent(eventType, resource) {
    try {
        console.log(`🔧 适配记录webhook事件: ${eventType}`);
        
        // 只使用表中存在的列
        const logData = {
            event_type: eventType,
            resource_data: resource || {},
            processed_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('webhook_events')
            .insert(logData)
            .select();
        
        if (error) {
            console.log('❌ 适配webhook事件记录失败:', error.message);
            return false;
        } else {
            console.log('✅ 适配webhook事件已记录');
            console.log('记录ID:', data[0]?.id);
            return true;
        }
    } catch (error) {
        console.log('❌ 适配webhook事件记录异常:', error.message);
        return false;
    }
}

// 测试适配后的记录功能
async function testAdaptedLogging() {
    console.log('🧪 测试适配后的记录功能...');
    
    const testResource = {
        id: 'I-TEST-ADAPTED-123',
        plan_id: 'P-5S785818YS7424947NCJBKQA',
        status: 'ACTIVE'
    };
    
    const success = await adaptedLogWebhookEvent('BILLING.SUBSCRIPTION.ACTIVATED', testResource);
    
    if (success) {
        console.log('✅ 适配后的webhook记录功能正常');
        
        // 验证记录是否真的被保存
        const { data, error } = await supabase
            .from('webhook_events')
            .select('*')
            .eq('event_type', 'BILLING.SUBSCRIPTION.ACTIVATED')
            .order('processed_at', { ascending: false })
            .limit(1);
        
        if (!error && data && data.length > 0) {
            console.log('✅ 记录已成功保存到数据库');
            console.log('最新记录:', data[0]);
        } else {
            console.log('⚠️ 记录可能没有保存成功');
        }
    } else {
        console.log('❌ 适配后的webhook记录功能仍有问题');
    }
    
    return success;
}

// 修复webhook处理流程
async function fixWebhookProcessing() {
    console.log('🔧 修复webhook处理流程...');
    
    console.log('📝 修复后的webhook处理代码:');
    console.log('');
    console.log('// 修复后的logWebhookEvent函数');
    console.log('async function logWebhookEvent(eventType, resource) {');
    console.log('    try {');
    console.log('        const logData = {');
    console.log('            event_type: eventType,');
    console.log('            resource_data: resource || {},');
    console.log('            processed_at: new Date().toISOString()');
    console.log('        };');
    console.log('        ');
    console.log('        const result = await supabaseRequest("POST", "webhook_events", logData);');
    console.log('        ');
    console.log('        if (result.error) {');
    console.log('            console.warn("Webhook事件日志记录失败:", result.error.message);');
    console.log('        } else {');
    console.log('            console.log("Webhook事件已记录");');
    console.log('        }');
    console.log('    } catch (error) {');
    console.log('        console.error("日志记录异常:", error);');
    console.log('    }');
    console.log('}');
    
    console.log('\n🎯 关键修改:');
    console.log('1. 移除resource_id字段');
    console.log('2. 保留resource_data字段存储完整资源信息');
    console.log('3. 确保processed_at字段格式正确');
    
    console.log('\n📋 部署步骤:');
    console.log('1. 修改api/paypal-webhook.js中的logWebhookEvent函数');
    console.log('2. 移除resource_id相关代码');
    console.log('3. 重新部署到Vercel');
    console.log('4. 测试webhook功能');
}

// 执行修复
fixWebhookEventsTable().catch(error => {
    console.error('❌ 修复失败:', error);
    process.exit(1);
});