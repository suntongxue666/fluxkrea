// 重置订阅用户积分为20积分，方便测试
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function resetSubscriptionUsersCredits() {
    console.log('🔄 重置订阅用户积分为20积分...');
    
    try {
        // 1. 查找所有有订阅状态的用户
        console.log('\n📋 1. 查找订阅用户...');
        const { data: subscriptionUsers, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('subscription_status', 'ACTIVE')
            .order('updated_at', { ascending: false });
        
        if (userError) {
            console.error('❌ 查询订阅用户失败:', userError);
            return;
        }
        
        console.log(`✅ 找到 ${subscriptionUsers.length} 个订阅用户:`);
        subscriptionUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} - 当前积分: ${user.credits}`);
        });
        
        if (subscriptionUsers.length === 0) {
            console.log('⚠️ 没有找到订阅用户');
            return;
        }
        
        // 2. 重置每个用户的积分为20
        console.log('\n📋 2. 重置用户积分...');
        
        for (const user of subscriptionUsers) {
            console.log(`🔄 重置用户 ${user.email} 的积分...`);
            
            const oldCredits = user.credits;
            const newCredits = 20;
            
            // 更新用户积分
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    credits: newCredits,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            
            if (updateError) {
                console.error(`❌ 更新用户 ${user.email} 积分失败:`, updateError);
                continue;
            }
            
            console.log(`✅ ${user.email}: ${oldCredits} → ${newCredits} 积分`);
            
            // 记录积分交易
            try {
                await supabase
                    .from('credit_transactions')
                    .insert({
                        user_uuid: user.uuid,
                        transaction_type: 'RESET',
                        amount: newCredits - oldCredits,
                        balance_after: newCredits,
                        description: '测试重置 - 积分重置为20',
                        source: 'admin_reset'
                    });
                console.log(`✅ ${user.email} 积分交易记录已创建`);
            } catch (transError) {
                console.warn(`⚠️ ${user.email} 积分交易记录失败:`, transError.message);
            }
        }
        
        // 3. 验证重置结果
        console.log('\n📋 3. 验证重置结果...');
        const { data: updatedUsers, error: verifyError } = await supabase
            .from('users')
            .select('email, credits, subscription_status, updated_at')
            .eq('subscription_status', 'ACTIVE')
            .order('updated_at', { ascending: false });
        
        if (verifyError) {
            console.error('❌ 验证重置结果失败:', verifyError);
            return;
        }
        
        console.log('✅ 重置后的用户状态:');
        updatedUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} - 积分: ${user.credits} - 更新时间: ${user.updated_at}`);
        });
        
        // 4. 检查积分交易记录
        console.log('\n📋 4. 检查最近的积分交易记录...');
        const { data: recentTransactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('source', 'admin_reset')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (!transError && recentTransactions.length > 0) {
            console.log('💰 最近的重置交易记录:');
            recentTransactions.forEach((trans, index) => {
                console.log(`  ${index + 1}. ${trans.user_uuid} - ${trans.transaction_type} ${trans.amount}`);
                console.log(`     余额: ${trans.balance_after} - ${trans.description}`);
                console.log(`     时间: ${trans.created_at}`);
            });
        }
        
        console.log('\n🎉 订阅用户积分重置完成！');
        console.log(`✅ 共重置了 ${subscriptionUsers.length} 个用户的积分`);
        console.log('✅ 所有用户积分现在都是20积分');
        console.log('✅ 积分交易记录已创建');
        console.log('✅ 现在可以进行PayPal支付测试了');
        
    } catch (error) {
        console.error('❌ 重置过程中出错:', error);
    }
}

// 运行重置
resetSubscriptionUsersCredits().then(() => {
    console.log('✅ 重置脚本执行完成');
    process.exit(0);
}).catch(error => {
    console.error('❌ 重置脚本执行失败:', error);
    process.exit(1);
});