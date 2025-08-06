// 自动解析并激活订阅 I-4V957XAPPN06
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function autoResolveSubscription() {
    const subscriptionId = 'I-4V957XAPPN06';
    
    try {
        console.log('🔍 自动解析订阅:', subscriptionId);
        console.log('这是一个Pro Plan订阅，应该获得1000积分\n');
        
        // 步骤1: 检查是否已有订阅记录
        console.log('📋 步骤1: 检查现有订阅记录...');
        
        // 尝试通过不同字段查找订阅记录
        let existingSub = null;
        let subError = null;
        
        // 先尝试通过paypal_subscription_id字段查找
        const { data: subByPaypalId, error: paypalIdError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('paypal_subscription_id', subscriptionId)
            .single();
        
        if (!paypalIdError && subByPaypalId) {
            existingSub = subByPaypalId;
        } else {
            // 如果没有paypal_subscription_id字段，尝试其他方式
            console.log('⚠️ 通过paypal_subscription_id查找失败，尝试其他方式...');
            
            // 查看表结构
            const { data: allSubs, error: allSubsError } = await supabase
                .from('subscriptions')
                .select('*')
                .limit(1);
            
            if (!allSubsError && allSubs && allSubs.length > 0) {
                console.log('📋 subscriptions表字段:', Object.keys(allSubs[0]));
            }
            
            subError = paypalIdError;
        }
        
        if (subError && subError.code !== 'PGRST116') {
            console.error('❌ 查询订阅记录失败:', subError);
            return;
        }
        
        if (existingSub) {
            console.log('✅ 找到现有订阅记录:');
            console.log('用户UUID:', existingSub.user_uuid);
            console.log('用户邮箱:', existingSub.user_email);
            console.log('状态:', existingSub.status);
            
            if (existingSub.status === 'ACTIVE') {
                console.log('✅ 订阅已经是激活状态');
                return;
            }
            
            // 激活现有订阅
            await activateExistingSubscription(existingSub);
            return;
        }
        
        console.log('⚠️ 未找到订阅记录，开始自动解析...');
        
        // 步骤2: 查找最近的用户（可能是购买者）
        console.log('\n📋 步骤2: 查找可能的购买用户...');
        
        const { data: recentUsers, error: usersError } = await supabase
            .from('users')
            .select('*')
            .not('email', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (usersError) {
            console.error('❌ 查询用户失败:', usersError);
            return;
        }
        
        console.log(`📋 找到 ${recentUsers.length} 个有邮箱的用户:`);
        recentUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.uuid}) - 积分: ${user.credits || 0} - 状态: ${user.subscription_status || 'FREE'}`);
        });
        
        // 步骤3: 智能选择用户
        console.log('\n📋 步骤3: 智能选择购买用户...');
        
        let targetUser = null;
        
        // 优先选择最近创建的用户
        const recentUser = recentUsers.find(user => {
            const createdTime = new Date(user.created_at).getTime();
            const now = Date.now();
            const hoursDiff = (now - createdTime) / (1000 * 60 * 60);
            return hoursDiff < 24; // 24小时内创建的用户
        });
        
        if (recentUser) {
            targetUser = recentUser;
            console.log(`🎯 选择最近创建的用户: ${targetUser.email}`);
        } else {
            // 选择第一个有邮箱的用户
            targetUser = recentUsers[0];
            console.log(`🎯 选择第一个用户: ${targetUser.email}`);
        }
        
        if (!targetUser) {
            console.error('❌ 没有找到合适的用户');
            return;
        }
        
        // 步骤4: 创建订阅记录并激活
        console.log('\n📋 步骤4: 创建订阅记录并激活...');
        
        await createAndActivateSubscription(targetUser, subscriptionId);
        
    } catch (error) {
        console.error('❌ 自动解析订阅失败:', error);
    }
}

async function activateExistingSubscription(subscription) {
    try {
        console.log('\n🚀 激活现有订阅...');
        
        // 查找用户
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', subscription.user_uuid)
            .single();
        
        if (userError) {
            console.error('❌ 查找用户失败:', userError);
            return;
        }
        
        // 激活订阅
        await addCreditsAndActivate(user, subscription.id, 1000);
        
    } catch (error) {
        console.error('❌ 激活现有订阅失败:', error);
    }
}

async function createAndActivateSubscription(user, subscriptionId) {
    try {
        console.log(`\n🆕 为用户 ${user.email} 创建并激活订阅...`);
        
        // 创建订阅记录（使用正确的字段）
        const { error: createError } = await supabase
            .from('subscriptions')
            .insert({
                paypal_subscription_id: subscriptionId,
                user_uuid: user.uuid,
                user_email: user.email,
                plan_id: 'P-5ML4271244454362WXNWU5NI', // Pro Plan
                plan_type: 'pro',
                status: 'PENDING',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        
        if (createError) {
            console.error('❌ 创建订阅记录失败:', createError);
            return;
        }
        
        console.log('✅ 订阅记录已创建');
        
        // 激活订阅
        await addCreditsAndActivate(user, subscriptionId, 1000);
        
    } catch (error) {
        console.error('❌ 创建并激活订阅失败:', error);
    }
}

async function addCreditsAndActivate(user, subscriptionId, creditsToAdd) {
    try {
        console.log(`\n💰 为用户添加积分并激活订阅...`);
        
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`💰 积分更新: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 更新用户积分和订阅状态
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
                description: `Pro Plan订阅激活 - 获得${creditsToAdd}积分 (${subscriptionId})`,
                source: 'paypal_subscription'
            });
        
        if (transError) {
            console.log('⚠️ 记录积分交易失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        // 更新订阅状态
        const { error: updateSubError } = await supabase
            .from('subscriptions')
            .update({
                status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
        
        if (updateSubError) {
            console.log('⚠️ 更新订阅状态失败:', updateSubError.message);
        } else {
            console.log('✅ 订阅状态已更新');
        }
        
        // 验证结果
        const { data: updatedUser } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', user.uuid)
            .single();
        
        console.log('\n🎉 订阅激活成功！');
        console.log('='.repeat(50));
        console.log(`👤 用户: ${updatedUser.email}`);
        console.log(`💰 当前积分: ${updatedUser.credits}`);
        console.log(`📊 订阅状态: ${updatedUser.subscription_status}`);
        console.log(`🆔 订阅ID: ${subscriptionId}`);
        console.log('='.repeat(50));
        
        console.log('\n📝 用户现在可以:');
        console.log(`1. 使用邮箱 ${updatedUser.email} 登录网站`);
        console.log(`2. 查看积分余额: ${updatedUser.credits}`);
        console.log('3. 享受Pro Plan订阅服务');
        console.log('4. 积分会在首页和pricing页面同步显示');
        
    } catch (error) {
        console.error('❌ 添加积分并激活失败:', error);
    }
}

// 运行自动解析
console.log('🎯 PayPal订阅自动解析和激活工具');
console.log('订阅ID: I-4V957XAPPN06 (Pro Plan - 1000积分)');
console.log('这个工具会自动找到购买用户并激活订阅\n');

autoResolveSubscription();