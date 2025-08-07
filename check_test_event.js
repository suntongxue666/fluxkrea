const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://gdcjvqaqgvcxzufmessy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIwNjY1MSwiZXhwIjoyMDY5NzgyNjUxfQ.LRR6iEw8IGTvLLWC0ZzIgkY1qxaiJ1O7sCA3RQANHmA');

(async () => {
  console.log('🔍 检查是否收到PayPal测试事件...');
  
  const now = new Date();
  console.log('当前时间:', now.toISOString());
  
  const { data, error } = await supabase
    .from('webhook_events')
    .select('*')
    .order('processed_at', { ascending: false })
    .limit(10);
  
  if (!error && data && data.length > 0) {
    console.log(`✅ 收到 ${data.length} 个webhook事件:`);
    data.forEach((event, i) => {
      const eventTime = new Date(event.processed_at);
      const minutesAgo = Math.floor((now - eventTime) / 60000);
      console.log(`${i+1}. ${event.event_type} (${minutesAgo}分钟前)`);
      console.log(`   时间: ${event.processed_at}`);
      console.log(`   状态: ${event.processing_status}`);
    });
  } else {
    console.log('❌ 没有收到事件');
    if (error) console.log('Error:', error.message);
  }
})();