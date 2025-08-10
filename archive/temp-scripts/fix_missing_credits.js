// 补发之前购买但未正确发放的积分
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIwNjY1MSwiZXhwIjoyMDY5NzgyNjUxfQ.C4urG1X5S8QJcvKGvdGYKjmvg-Zt8Zt8Zt8Zt8Zt8Zt8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 计划详情映射
const PLAN_DETAILS = {
    'P-5ML4271244454362WXNWU5NI': { name: 'Pro Plan', credits: 1000, price: 9.99 },
    'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000, price: 29.99 }
};

async function fixMissingCredits() {
    console.log('🔍 查找需要补发积分的订阅...');
    
    try {
        // 1. 查找所有ACTIVE状态的订阅，但用户积分可能不足
        const { data: activeSubscriptions, error: subsError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('status', 'ACTIVE');
        
        if (subsError) {
            console.error('❌ 查询订阅失败:', subsError);
            return;
        }
        
        console.log(`📊 找到 ${activeSubscriptions?.length || 0} 个激活的订阅`);
        
        if (!activeSubscriptions || activeSubscriptions.length === 0) {
            // 如果user_subscriptions表为空，查看subscriptions表
            const { data: subs, error: subsError2 } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('status', 'ACTIVE');
            
            console.log(`📊 subscriptions表中有 ${subs?.length || 0} 个激活订阅`);
            
            if (subs && subs.length > 0) {
                console.log('前3个订阅示例:');
                subs.slice(0, 3).forEach(sub => {
                    console.log(`- ID: ${sub.id}, Plan: ${sub.plan_id}, User: ${sub.user_uuid}`);
                });
            }
            return;
        }
        
        // 2. 对每个订阅检查用户积分
        for (const subscription of activeSubscriptions) {
            console.log(`\n🔍 处理订阅: ${subscription.paypal_subscription_id}`);
            console.log(`👤 用户: ${subscription.google_user_email} (${subscription.google_user_id})`);
            console.log(`📋 计划: ${subscription.plan_type} (${subscription.plan_id})`);
            
            // 获取计划详情
            const planDetails = PLAN_DETAILS[subscription.plan_id];
            if (!planDetails) {
                console.log(`⚠️ 未知计划ID: ${subscription.plan_id}`);
                continue;
            }
            
            // 查找用户
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .or(`uuid.eq.${subscription.google_user_id},email.eq.${subscription.google_user_email}`)
                .single();
            
            if (userError || !user) {
                console.log(`❌ 找不到用户: ${subscription.google_user_email}`);
                continue;
            }
            
            console.log(`💰 用户当前积分: ${user.credits || 0}`);
            console.log(`📊 应有积分(订阅): ${planDetails.credits}`);
            
            // 检查是否需要补发积分
            // 如果用户积分少于应有的订阅积分，说明可能需要补发
            const expectedMinCredits = planDetails.credits;
            const currentCredits = user.credits || 0;
            
            if (currentCredits < expectedMinCredits) {
                console.log(`🚨 积分可能不足，建议补发: ${expectedMinCredits - currentCredits}`);
                
                // 检查是否已有相关的积分交易记录
                const { data: transactions, error: transError } = await supabase
                    .from('credit_transactions')
                    .select('*')
                    .eq('user_uuid', user.uuid)
                    .eq('source', 'paypal_subscription')
                    .eq('amount', planDetails.credits);
                
                if (!transError && transactions && transactions.length > 0) {
                    console.log(`✅ 已有积分交易记录，无需补发`);
                    continue;
                }
                
                // 确认是否要补发积分
                console.log(`\n💡 建议操作:`);
                console.log(`   - 用户: ${user.email}`);
                console.log(`   - 当前积分: ${currentCredits}`);
                console.log(`   - 补发积分: ${planDetails.credits}`);
                console.log(`   - 补发后积分: ${currentCredits + planDetails.credits}`);
                console.log(`\n如需补发，请运行: node manual_credit_fix.js ${user.uuid} ${planDetails.credits}`);
                
            } else {
                console.log(`✅ 积分充足，无需补发`);
            }
        }
        
    } catch (error) {
        console.error('❌ 处理失败:', error);
    }
}

// 手动补发积分的函数
async function manualCreditFix(userUuid, creditsToAdd, reason = '订阅积分补发') {
    try {
        console.log(`🔧 开始补发积分: 用户=${userUuid}, 积分=${creditsToAdd}`);
        
        // 获取用户当前积分
        const { data: user, error: getUserError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userUuid)
            .single();
        
        if (getUserError || !user) {
            console.error('❌ 找不到用户:', userUuid);
            return;
        }
        
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`💰 积分更新: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 更新用户积分
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', userUuid);
        
        if (updateError) {
            console.error('❌ 更新积分失败:', updateError);
            return;
        }
        
        // 记录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: userUuid,
                transaction_type: 'MANUAL_ADJUSTMENT',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: reason,
                source: 'manual_fix'
            });
        
        if (transError) {
            console.log('⚠️ 记录交易失败:', transError.message);
        }
        
        console.log(`✅ 积分补发完成! 用户 ${user.email} 现在有 ${newCredits} 积分`);
        
    } catch (error) {
        console.error('❌ 补发积分失败:', error);
    }
}

// 如果通过命令行调用
if (process.argv.length >= 4) {
    const userUuid = process.argv[2];
    const credits = parseInt(process.argv[3]);
    const reason = process.argv[4] || '订阅积分手动补发';
    
    manualCreditFix(userUuid, credits, reason);
} else {
    fixMissingCredits();
}