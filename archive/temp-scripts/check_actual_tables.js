// 检查实际数据库表结构
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIwNjY1MSwiZXhwIjoyMDY5NzgyNjUxfQ.C4urG1X5S8QJcvKGvdGYKjmvg-Zt8Zt8Zt8Zt8Zt8Zt8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTables() {
    console.log('🔍 检查实际数据库表结构...');
    
    // 检查users表结构
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(3);
    
    if (!usersError && users.length > 0) {
        console.log('\n📋 users表结构:');
        console.log('字段:', Object.keys(users[0]));
        console.log('示例数据:', users[0]);
    }
    
    // 检查subscriptions表结构
    const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);
    
    console.log('\n📋 subscriptions表:', subsError ? '不存在或无权限' : '存在');
    if (!subsError && subs.length > 0) {
        console.log('字段:', Object.keys(subs[0]));
    }
    
    // 检查user_subscriptions表
    const { data: userSubs, error: userSubsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .limit(1);
    
    console.log('\n📋 user_subscriptions表:', userSubsError ? '不存在' : '存在');
}

checkTables().catch(console.error);