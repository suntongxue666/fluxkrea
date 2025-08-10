// 简单的Webhook测试 - 最小化版本
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 测试最简单的POST请求到webhook
async function testSimpleWebhookCall() {
    console.log('🧪 开始简单的Webhook测试...\n');
    
    // 最简单的测试事件
    const simpleTestEvent = {
        event_type: 'TEST_EVENT',
        resource: {
            id: 'test-123',
            status: 'TEST'
        }
    };
    
    console.log('📋 发送测试事件:', JSON.stringify(simpleTestEvent, null, 2));
    
    try {
        const response = await fetch('https://fluxkrea.me/api/paypal-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(simpleTestEvent)
        });
        
        console.log('\n📊 响应状态:', response.status);
        console.log('📊 响应头:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📊 响应内容:', responseText);
        
        if (response.ok) {
            console.log('✅ Webhook测试成功！');
        } else {
            console.log('❌ Webhook测试失败');
            
            // 如果是500错误，通常是函数内部错误
            if (response.status === 500) {
                console.log('💡 这是服务器内部错误，可能是:');
                console.log('   1. 代码语法错误');
                console.log('   2. 数据库连接问题');
                console.log('   3. 依赖包缺失');
                console.log('   4. 环境变量问题');
            }
        }
    } catch (error) {
        console.log('❌ 请求发送失败:', error.message);
    }
    
    console.log('\n🔍 检查webhook_events表记录...');
    
    try {
        const { data, error } = await supabase
            .from('webhook_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(3);
        
        if (error) {
            console.log('❌ 查询webhook事件失败:', error.message);
        } else {
            console.log('📋 最近的webhook事件:');
            if (data.length === 0) {
                console.log('   (无记录)');
            } else {
                data.forEach((event, i) => {
                    console.log(`   ${i+1}. ${event.event_type} - ${event.processed_at}`);
                });
            }
        }
    } catch (error) {
        console.log('❌ 查询异常:', error.message);
    }
}

testSimpleWebhookCall().then(() => {
    console.log('\n🏁 简单测试完成');
}).catch(error => {
    console.error('❌ 测试过程异常:', error);
});