/**
 * 测试user_subscriptions表的RLS策略
 * 检查是否需要禁用RLS
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserSubscriptionsRLS() {
    console.log('🧪 测试user_subscriptions表的RLS策略\n');
    
    // 1. 测试读取权限
    console.log('📋 1. 测试读取权限...');
    
    try {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ 读取失败:', error.message);
        } else {
            console.log('✅ 读取权限正常');
            console.log(`   找到 ${data?.length || 0} 条记录`);
        }
    } catch (e) {
        console.log('❌ 读取异常:', e.message);
    }
    
    // 2. 测试写入权限
    console.log('\n📋 2. 测试写入权限...');
    
    const testSubscriptionData = {
        google_user_id: `test_user_${Date.now()}`,
        google_user_email: 'test@fluxkrea.me',
        paypal_subscription_id: `I-TEST-SUB-${Date.now()}`,
        plan_id: 'P-5S785818YS7424947NCJBKQA',
        plan_type: 'PRO',
        status: 'ACTIVE'
    };
    
    try {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .insert(testSubscriptionData)
            .select();
        
        if (error) {
            console.log('❌ 写入失败:', error.message);
            console.log('   详细错误:', JSON.stringify(error, null, 2));
            
            if (error.message.includes('row-level security policy')) {
                console.log('🚨 RLS策略阻止了写入！');
                console.log('   需要禁用user_subscriptions表的RLS策略');
                return false;
            }
        } else {
            console.log('✅ 写入权限正常');
            console.log('   记录ID:', data[0]?.id);
            
            // 清理测试数据
            if (data && data.length > 0) {
                await supabase
                    .from('user_subscriptions')
                    .delete()
                    .eq('id', data[0].id);
                console.log('   测试数据已清理');
            }
            return true;
        }
    } catch (e) {
        console.log('❌ 写入异常:', e.message);
        return false;
    }
    
    return false;
}

async function checkSubscriptionWorkflow() {
    console.log('\n📋 3. 检查订阅工作流程...');
    
    // 检查handle-subscription.js是否会写入user_subscriptions表
    console.log('🔍 分析订阅工作流程:');
    console.log('1. 用户在Pricing页面点击订阅');
    console.log('2. PayPal处理支付');
    console.log('3. 调用handle-subscription.js API');
    console.log('4. 写入user_subscriptions表');
    console.log('5. PayPal发送webhook到paypal-webhook.js');
    console.log('6. 更新用户积分');
    
    console.log('\n💡 如果user_subscriptions表的RLS阻止写入:');
    console.log('- handle-subscription.js无法创建订阅记录');
    console.log('- 虽然webhook能更新积分，但缺少订阅关联记录');
    console.log('- 这会影响订阅管理和历史记录');
    
    // 检查当前是否有订阅记录
    const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.log('❌ 查询订阅记录失败:', error.message);
    } else {
        console.log(`✅ 当前有 ${subscriptions?.length || 0} 条订阅记录`);
        if (subscriptions && subscriptions.length > 0) {
            console.log('最近的订阅记录:');
            subscriptions.forEach((sub, index) => {
                console.log(`  ${index + 1}. ${sub.google_user_email} - ${sub.plan_type} - ${sub.status}`);
            });
        } else {
            console.log('⚠️ 没有订阅记录，这可能表明RLS阻止了写入');
        }
    }
}

async function main() {
    const canWrite = await testUserSubscriptionsRLS();
    await checkSubscriptionWorkflow();
    
    console.log('\n🎯 结论和建议:');
    
    if (canWrite) {
        console.log('✅ user_subscriptions表的RLS策略正常');
        console.log('   不需要禁用RLS');
    } else {
        console.log('❌ user_subscriptions表的RLS策略阻止写入');
        console.log('   建议禁用RLS策略');
        
        console.log('\n🔧 修复步骤:');
        console.log('1. 登录Supabase控制台');
        console.log('2. 进入Authentication > Policies');
        console.log('3. 找到user_subscriptions表');
        console.log('4. 点击"Disable RLS"');
        
        console.log('\n📝 或者添加允许插入的策略:');
        console.log('CREATE POLICY "Allow subscription inserts" ON user_subscriptions');
        console.log('FOR INSERT WITH CHECK (true);');
    }
    
    console.log('\n📊 当前状态总结:');
    console.log('- webhook_events: RLS已禁用 ✅');
    console.log('- credit_transactions: RLS正常 ✅');
    console.log(`- user_subscriptions: ${canWrite ? 'RLS正常 ✅' : 'RLS需要修复 ❌'}`);
    
    if (!canWrite) {
        console.log('\n⚠️ 重要提醒:');
        console.log('虽然积分同步现在正常工作，但订阅记录无法创建');
        console.log('这会影响:');
        console.log('- 订阅历史记录');
        console.log('- 订阅管理功能');
        console.log('- 用户订阅状态查询');
        console.log('建议尽快修复user_subscriptions表的RLS策略');
    }
}

main().catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
});