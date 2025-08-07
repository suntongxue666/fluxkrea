// 检查数据库表结构和修复订阅ID类型问题

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseStructure() {
    console.log('🔍 检查数据库表结构...');
    
    // 1. 检查subscriptions表是否存在以及其结构
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ subscriptions表查询失败:', error.message);
            if (error.message.includes('does not exist')) {
                console.log('⚠️ subscriptions表不存在，需要创建');
                // 这里我们不能直接创建表，需要在Supabase控制台创建
            }
        } else {
            console.log('✅ subscriptions表存在');
            console.log('📋 subscriptions表数据示例:', data);
        }
    } catch (error) {
        console.error('异常:', error.message);
    }
    
    // 2. 检查user_subscriptions表
    try {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .limit(5);
        
        if (error) {
            console.log('❌ user_subscriptions表查询失败:', error.message);
        } else {
            console.log('✅ user_subscriptions表存在');
            console.log('📋 user_subscriptions表数据:', data);
        }
    } catch (error) {
        console.error('异常:', error.message);
    }
    
    // 3. 检查webhook_events表
    try {
        const { data, error } = await supabase
            .from('webhook_events')
            .select('*')
            .limit(5);
        
        if (error) {
            console.log('❌ webhook_events表查询失败:', error.message);
        } else {
            console.log('✅ webhook_events表存在');
            console.log('📋 webhook_events表数据:', data);
        }
    } catch (error) {
        console.error('异常:', error.message);
    }
    
    // 4. 查找测试订阅ID相关的记录
    console.log('\n🔍 查找测试订阅ID相关记录...');
    const testSubscriptionId = 'I-C6SLTMYA3LBP';
    
    // 在user_subscriptions表中查找
    try {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .ilike('paypal_subscription_id', `%${testSubscriptionId}%`);
        
        if (error) {
            console.log('❌ 查找订阅ID失败:', error.message);
        } else {
            console.log('🔍 包含测试订阅ID的记录:', data);
        }
    } catch (error) {
        console.error('异常:', error.message);
    }
    
    // 5. 检查所有的PayPal订阅记录
    try {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .not('paypal_subscription_id', 'is', null);
        
        if (error) {
            console.log('❌ 查找PayPal订阅记录失败:', error.message);
        } else {
            console.log('💳 所有PayPal订阅记录:');
            data.forEach((record, index) => {
                console.log(`   ${index + 1}. ID: ${record.paypal_subscription_id}`);
                console.log(`      状态: ${record.status}`);
                console.log(`      计划: ${record.plan_type}`);
                console.log(`      用户: ${record.google_user_email}`);
                console.log('');
            });
        }
    } catch (error) {
        console.error('异常:', error.message);
    }
}

checkDatabaseStructure().then(() => {
    console.log('🏁 检查完成');
}).catch(error => {
    console.error('❌ 检查过程中发生错误:', error);
});