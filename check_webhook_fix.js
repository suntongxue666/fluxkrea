// 检查webhook修复后是否收到事件
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIwNjY1MSwiZXhwIjoyMDY5NzgyNjUxfQ.LRR6iEw8IGTvLLWC0ZzIgkY1qxaiJ1O7sCA3RQANHmA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkWebhookFix() {
    console.log('🔍 检查webhook修复效果...\n');
    
    try {
        // 检查最近的webhook事件（按时间排序）
        const { data: recentWebhooks, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(10);
        
        if (!webhookError && recentWebhooks && recentWebhooks.length > 0) {
            console.log(`✅ 找到 ${recentWebhooks.length} 个webhook事件:`);
            
            const now = new Date();
            recentWebhooks.forEach((event, index) => {
                const eventTime = new Date(event.processed_at);
                const minutesAgo = Math.floor((now - eventTime) / (1000 * 60));
                
                console.log(`${index + 1}. ${event.event_type}`);
                console.log(`   时间: ${event.processed_at} (${minutesAgo}分钟前)`);
                console.log(`   状态: ${event.processing_status}`);
                
                if (event.resource_data && event.resource_data.id) {
                    console.log(`   订阅ID: ${event.resource_data.id}`);
                }
                console.log('');
            });
            
            // 检查是否有最近5分钟内的事件
            const recentEvents = recentWebhooks.filter(event => {
                const eventTime = new Date(event.processed_at);
                const minutesAgo = (now - eventTime) / (1000 * 60);
                return minutesAgo <= 5;
            });
            
            if (recentEvents.length > 0) {
                console.log('🎉 发现最近5分钟内的事件，webhook修复成功！');
            } else {
                console.log('⏰ 没有发现最近5分钟内的事件');
                console.log('💡 请在PayPal后台发送测试事件验证');
            }
            
        } else {
            console.log('❌ 仍然没有webhook事件');
            console.log('需要：');
            console.log('1. 在PayPal后台发送测试事件');
            console.log('2. 或者测试一个真实的订阅');
        }
        
        // 显示当前时间供参考
        console.log(`\n🕐 当前时间: ${now.toISOString()}`);
        
    } catch (error) {
        console.error('❌ 检查失败:', error);
    }
}

checkWebhookFix();