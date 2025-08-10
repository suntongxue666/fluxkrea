// 追踪订阅用户积分的来源
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function traceSubscriptionCredits() {
    console.log('🔍 追踪订阅用户积分来源');
    console.log('='.repeat(50));
    
    try {
        // 1. 查找所有活跃订阅用户
        console.log('\n👥 1. 查找活跃订阅用户...');
        
        const { data: activeUsers, error: usersError } = await supabase
            .from('users')
            .select('id, uuid, email, credits, subscription_status, created_at, updated_at')
            .eq('subscription_status', 'ACTIVE')
            .order('credits', { ascending: false });
        
        if (usersError) {
            console.error('❌ 查询用户失败:', usersError);
            return;
        }
        
        console.log(`✅ 找到 ${activeUsers.length} 个活跃订阅用户:`);
        
        for (const user of activeUsers) {
            console.log(`\n📊 用户: ${user.email}`);
            console.log(`   UUID: ${user.uuid}`);
            console.log(`   当前积分: ${user.credits}`);
            console.log(`   创建时间: ${new Date(user.created_at).toLocaleString()}`);
            console.log(`   更新时间: ${new Date(user.updated_at).toLocaleString()}`);
            
            // 2. 查找该用户的所有积分交易记录
            console.log('\n💳 积分交易历史:');
            
            const { data: transactions, error: transError } = await supabase
                .from('credit_transactions')
                .select('*')
                .eq('user_uuid', user.uuid)
                .order('created_at', { ascending: true });
            
            if (transError) {
                console.log('❌ 查询交易记录失败:', transError.message);
                continue;
            }
            
            if (transactions.length === 0) {
                console.log('⚠️ 没有找到积分交易记录');
                console.log('🚨 这表明积分可能是直接在数据库中修改的，而不是通过API');
            } else {
                console.log(`✅ 找到 ${transactions.length} 条交易记录:`);
                
                let calculatedBalance = 0;
                transactions.forEach((trans, index) => {
                    calculatedBalance += trans.amount;
                    const date = new Date(trans.created_at).toLocaleString();
                    
                    console.log(`   ${index + 1}. ${trans.transaction_type}: ${trans.amount > 0 ? '+' : ''}${trans.amount}`);
                    console.log(`      描述: ${trans.description}`);
                    console.log(`      来源: ${trans.source}`);
                    console.log(`      时间: ${date}`);
                    console.log(`      记录余额: ${trans.balance_after}, 计算余额: ${calculatedBalance}`);
                    
                    if (trans.balance_after !== calculatedBalance) {
                        console.log(`      ⚠️ 余额不匹配！可能存在未记录的积分变动`);
                    }
                });
                
                // 检查最终余额是否匹配
                const lastTransaction = transactions[transactions.length - 1];
                if (lastTransaction && lastTransaction.balance_after !== user.credits) {
                    console.log(`\n🚨 警告: 最后交易记录的余额 (${lastTransaction.balance_after}) 与当前用户积分 (${user.credits}) 不匹配！`);
                    console.log(`   这表明在最后一次交易后，积分被直接修改了`);
                }
            }
            
            // 3. 查找订阅关联记录
            console.log('\n🔗 订阅关联记录:');
            
            const { data: subscriptions, error: subError } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('google_user_id', user.uuid);
            
            if (subError) {
                console.log('❌ 查询订阅关联失败:', subError.message);
            } else if (subscriptions.length === 0) {
                console.log('⚠️ 没有找到订阅关联记录');
                console.log('🚨 这表明用户的ACTIVE状态可能是手动设置的');
            } else {
                console.log(`✅ 找到 ${subscriptions.length} 个订阅关联:`);
                subscriptions.forEach(sub => {
                    console.log(`   订阅ID: ${sub.paypal_subscription_id}`);
                    console.log(`   计划类型: ${sub.plan_type}`);
                    console.log(`   状态: ${sub.status}`);
                    console.log(`   创建时间: ${new Date(sub.created_at).toLocaleString()}`);
                });
            }
            
            // 4. 分析积分来源
            console.log('\n🔍 积分来源分析:');
            
            const subscriptionTransactions = transactions.filter(t => 
                t.transaction_type === 'SUBSCRIPTION_PURCHASE' || 
                t.source === 'paypal_subscription' ||
                t.source === 'webhook_activation' ||
                t.source === 'manual_activation'
            );
            
            const earnTransactions = transactions.filter(t => t.transaction_type === 'EARN');
            const spendTransactions = transactions.filter(t => t.transaction_type === 'SPEND');
            
            console.log(`   订阅相关交易: ${subscriptionTransactions.length} 条`);
            console.log(`   获得积分交易: ${earnTransactions.length} 条`);
            console.log(`   消费积分交易: ${spendTransactions.length} 条`);
            
            const subscriptionCredits = subscriptionTransactions.reduce((sum, t) => sum + t.amount, 0);
            const earnedCredits = earnTransactions.reduce((sum, t) => sum + t.amount, 0);
            const spentCredits = spendTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            console.log(`   订阅获得积分: ${subscriptionCredits}`);
            console.log(`   其他获得积分: ${earnedCredits}`);
            console.log(`   消费积分: ${spentCredits}`);
            console.log(`   理论余额: ${subscriptionCredits + earnedCredits - spentCredits}`);
            console.log(`   实际余额: ${user.credits}`);
            
            if (subscriptionCredits === 0 && user.credits > earnedCredits) {
                console.log('🚨 结论: 该用户的积分很可能是手动添加的，没有通过正常的订阅API流程');
            } else if (subscriptionCredits > 0) {
                console.log('✅ 结论: 该用户有正常的订阅积分记录');
            }
            
            console.log('\n' + '='.repeat(50));
        }
        
        // 5. 总结分析
        console.log('\n📋 总体分析结果:');
        console.log('-'.repeat(30));
        
        let manualUsers = 0;
        let apiUsers = 0;
        
        for (const user of activeUsers) {
            const { data: transactions } = await supabase
                .from('credit_transactions')
                .select('*')
                .eq('user_uuid', user.uuid);
            
            const hasSubscriptionTransaction = transactions?.some(t => 
                t.transaction_type === 'SUBSCRIPTION_PURCHASE' || 
                t.source === 'paypal_subscription' ||
                t.source === 'webhook_activation' ||
                t.source === 'manual_activation'
            );
            
            if (hasSubscriptionTransaction) {
                apiUsers++;
                console.log(`✅ ${user.email}: 通过API/Webhook激活`);
            } else {
                manualUsers++;
                console.log(`🔧 ${user.email}: 可能手动激活`);
            }
        }
        
        console.log(`\n📊 统计结果:`);
        console.log(`   通过API激活的用户: ${apiUsers} 个`);
        console.log(`   可能手动激活的用户: ${manualUsers} 个`);
        
        if (manualUsers > 0) {
            console.log('\n💡 建议: 对于手动激活的用户，建议补充相应的积分交易记录以保持数据一致性');
        }
        
    } catch (error) {
        console.error('❌ 追踪过程中发生错误:', error);
    }
}

// 主函数
async function main() {
    await traceSubscriptionCredits();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { traceSubscriptionCredits };