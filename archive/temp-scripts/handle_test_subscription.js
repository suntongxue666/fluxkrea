// 处理测试订阅 I-C6SLTMYA3LBP 的专门脚本
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_SUBSCRIPTION_ID = 'I-C6SLTMYA3LBP';

async function handleTestSubscription() {
    console.log('🔍 处理测试订阅:', TEST_SUBSCRIPTION_ID);
    console.log('='.repeat(50));
    
    try {
        // 1. 检查订阅是否已存在于数据库中
        console.log('\n📋 1. 检查订阅记录...');
        
        const { data: existingSub, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('paypal_subscription_id', TEST_SUBSCRIPTION_ID)
            .single();
        
        if (subError && subError.code !== 'PGRST116') {
            console.error('❌ 查询订阅失败:', subError);
            return;
        }
        
        if (existingSub) {
            console.log('✅ 找到现有订阅记录:');
            console.log('   用户邮箱:', existingSub.google_user_email);
            console.log('   计划类型:', existingSub.plan_type);
            console.log('   状态:', existingSub.status);
            
            // 检查对应的用户
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('uuid', existingSub.google_user_id)
                .single();
            
            if (userError) {
                console.log('❌ 找不到对应用户，尝试邮箱查找...');
                
                const { data: emailUser, error: emailError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', existingSub.google_user_email)
                    .single();
                
                if (emailError) {
                    console.log('❌ 通过邮箱也找不到用户');
                    return;
                } else {
                    console.log('✅ 通过邮箱找到用户:', emailUser.email);
                    await activateSubscription(existingSub, emailUser);
                }
            } else {
                console.log('✅ 找到对应用户:', user.email);
                await activateSubscription(existingSub, user);
            }
        } else {
            console.log('❌ 数据库中未找到订阅记录');
            console.log('需要创建订阅关联记录...');
            
            // 创建测试订阅关联
            await createTestSubscriptionAssociation();
        }
        
    } catch (error) {
        console.error('❌ 处理过程中发生错误:', error);
    }
}

// 激活订阅
async function activateSubscription(subscription, user) {
    console.log('\n🚀 2. 激活订阅...');
    
    try {
        // 确定计划详情
        const planDetails = {
            'pro': { name: 'Pro Plan', credits: 1000 },
            'max': { name: 'Max Plan', credits: 5000 }
        };
        
        const plan = planDetails[subscription.plan_type] || { name: 'Unknown Plan', credits: 1000 };
        
        // 计算新积分
        const currentCredits = user.credits || 0;
        const creditsToAdd = plan.credits;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`💰 积分计算: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 更新用户积分
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateError) {
            console.error('❌ 更新用户积分失败:', updateError);
            return;
        }
        
        console.log('✅ 用户积分已更新');
        
        // 记录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                transaction_type: 'SUBSCRIPTION_PURCHASE',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `${plan.name}订阅激活 - 获得${creditsToAdd}积分`,
                source: 'manual_activation'
            });
        
        if (transError) {
            console.warn('⚠️ 积分交易记录失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        // 更新订阅状态
        const { error: statusError } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscription.paypal_subscription_id);
        
        if (statusError) {
            console.warn('⚠️ 订阅状态更新失败:', statusError.message);
        } else {
            console.log('✅ 订阅状态已更新');
        }
        
        console.log('\n🎉 订阅激活完成!');
        console.log(`👤 用户: ${user.email}`);
        console.log(`💰 新积分: ${newCredits}`);
        console.log(`📊 订阅状态: ACTIVE`);
        
    } catch (error) {
        console.error('❌ 激活过程中发生错误:', error);
    }
}

// 创建测试订阅关联
async function createTestSubscriptionAssociation() {
    console.log('\n🆕 创建测试订阅关联...');
    
    try {
        // 查找一个测试用户（使用管理员账户）
        const { data: testUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'sunwei7482@gmail.com')
            .single();
        
        if (userError) {
            console.error('❌ 找不到测试用户');
            return;
        }
        
        console.log('✅ 使用测试用户:', testUser.email);
        
        // 创建订阅关联
        const subscriptionData = {
            google_user_id: testUser.uuid,
            google_user_email: testUser.email,
            paypal_subscription_id: TEST_SUBSCRIPTION_ID,
            plan_id: 'P-5ML4271244454362WXNWU5NI', // Pro计划
            plan_type: 'pro',
            status: 'PENDING'
        };
        
        const { error: insertError } = await supabase
            .from('user_subscriptions')
            .insert(subscriptionData);
        
        if (insertError) {
            console.error('❌ 创建订阅关联失败:', insertError);
            return;
        }
        
        console.log('✅ 订阅关联已创建');
        
        // 立即激活
        await activateSubscription(subscriptionData, testUser);
        
    } catch (error) {
        console.error('❌ 创建订阅关联过程中发生错误:', error);
    }
}

// 查询当前状态
async function checkCurrentStatus() {
    console.log('\n📊 当前系统状态:');
    console.log('-'.repeat(30));
    
    try {
        // 检查用户积分
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('email, credits, subscription_status')
            .not('email', 'is', null)
            .order('credits', { ascending: false })
            .limit(5);
        
        if (!usersError) {
            console.log('💰 用户积分排行:');
            users.forEach(user => {
                console.log(`   ${user.email}: ${user.credits} 积分 (${user.subscription_status})`);
            });
        }
        
        // 检查订阅关联
        const { data: subscriptions, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!subError) {
            console.log('\n🔗 最近订阅关联:');
            subscriptions.forEach(sub => {
                console.log(`   ${sub.paypal_subscription_id}: ${sub.google_user_email} (${sub.status})`);
            });
        }
        
        // 检查积分交易
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('user_uuid, transaction_type, amount, description, created_at')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!transError) {
            console.log('\n💳 最近积分交易:');
            transactions.forEach(trans => {
                const date = new Date(trans.created_at).toLocaleString();
                console.log(`   ${trans.transaction_type}: ${trans.amount} (${date})`);
            });
        }
        
    } catch (error) {
        console.error('❌ 状态检查失败:', error);
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--status')) {
        await checkCurrentStatus();
    } else {
        await handleTestSubscription();
        await checkCurrentStatus();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { handleTestSubscription, checkCurrentStatus };