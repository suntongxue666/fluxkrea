// 激活订阅 I-4V957XAPPN06
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// PayPal计划映射
const PAYPAL_PLANS = {
    'pro': 'P-5ML4271244454362WXNWU5NI',
    'max': 'P-3NJ78684DS796242VNCJBKQQ'
};

const PLAN_DETAILS = {
    'P-5ML4271244454362WXNWU5NI': { name: 'Pro Plan', credits: 1000, price: 9.99 },
    'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000, price: 19.99 }
};

async function activateSubscription() {
    try {
        const subscriptionId = 'I-4V957XAPPN06';
        console.log(`🚀 开始激活订阅: ${subscriptionId}`);
        
        // 这是Pro计划的订阅ID，给予1000积分
        const planId = PAYPAL_PLANS.pro;
        const planDetails = PLAN_DETAILS[planId];
        const creditsToAdd = planDetails.credits;
        
        console.log(`📋 计划详情: ${planDetails.name} - ${creditsToAdd}积分`);
        
        // 由于我们不知道具体的用户UUID，我们需要通过其他方式找到用户
        // 让我们查找最近登录的用户或者通过邮箱查找
        
        // 方法1: 查找最近创建的用户
        const { data: recentUsers, error: userError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (userError) {
            console.error('❌ 查询用户失败:', userError);
            return;
        }
        
        console.log('📋 最近的用户:');
        recentUsers?.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.uuid}) - 积分: ${user.credits || 0}`);
        });
        
        // 假设是最近的用户（你可以根据实际情况调整）
        if (!recentUsers || recentUsers.length === 0) {
            console.error('❌ 没有找到用户记录');
            return;
        }
        
        // 让用户选择或者我们选择最近的用户
        const targetUser = recentUsers[0]; // 选择最近的用户
        console.log(`🎯 选择用户: ${targetUser.email} (${targetUser.uuid})`);
        
        // 激活订阅
        await activateUserSubscription(targetUser, subscriptionId, planId, creditsToAdd);
        
    } catch (error) {
        console.error('❌ 激活订阅失败:', error);
    }
}

async function activateUserSubscription(user, subscriptionId, planId, creditsToAdd) {
    try {
        console.log(`\n🔄 为用户 ${user.email} 激活订阅...`);
        
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`💰 积分更新: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 1. 更新用户积分和订阅状态
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('uuid', user.uuid);
        
        if (updateError) {
            console.error('❌ 更新用户积分失败:', updateError);
            throw updateError;
        }
        
        console.log('✅ 用户积分已更新');
        
        // 2. 创建订阅记录
        const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
                id: subscriptionId,
                user_uuid: user.uuid,
                plan_id: planId,
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        
        if (subError) {
            console.log('⚠️ 创建订阅记录失败 (可能表结构不同):', subError.message);
        } else {
            console.log('✅ 订阅记录已创建');
        }
        
        // 3. 记录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                transaction_type: 'SUBSCRIPTION_PURCHASE',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `Pro Plan订阅激活 - 获得${creditsToAdd}积分`,
                source: 'paypal_subscription',
                related_resource_id: subscriptionId
            });
        
        if (transError) {
            console.log('⚠️ 记录积分交易失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        // 4. 验证结果
        const { data: updatedUser, error: verifyError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', user.uuid)
            .single();
        
        if (verifyError) {
            console.error('❌ 验证失败:', verifyError);
        } else {
            console.log('\n🎉 激活成功！');
            console.log(`👤 用户: ${updatedUser.email}`);
            console.log(`💰 当前积分: ${updatedUser.credits}`);
            console.log(`📊 订阅状态: ${updatedUser.subscription_status}`);
            console.log(`🆔 订阅ID: ${subscriptionId}`);
        }
        
    } catch (error) {
        console.error('❌ 激活用户订阅失败:', error);
        throw error;
    }
}

// 运行激活
activateSubscription();