// 用户积分和登录问题诊断脚本
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 要诊断的用户邮箱
const TARGET_EMAIL = 'sunwei7482@gmail.com';

async function main() {
    console.log('===== 用户积分和登录问题诊断工具 =====');
    console.log(`目标用户: ${TARGET_EMAIL}`);
    console.log('');

    // 1. 检查用户是否存在
    console.log('1. 检查用户记录...');
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', TARGET_EMAIL);

    if (userError) {
        console.error('❌ 查询用户数据失败:', userError.message);
        return;
    }

    if (!users || users.length === 0) {
        console.log('❌ 用户记录不存在!');
        console.log('');
        console.log('解决方案: 创建新用户记录');
        
        // 创建新用户
        await createNewUser();
        return;
    }

    const user = users[0];
    console.log('✅ 找到用户记录:');
    console.log(`   ID: ${user.id}`);
    console.log(`   UUID: ${user.uuid}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   积分: ${user.credits}`);
    console.log(`   订阅状态: ${user.subscription_status}`);
    console.log(`   创建时间: ${user.created_at}`);
    console.log('');

    // 2. 检查积分交易记录
    console.log('2. 检查积分交易记录...');
    const { data: transactions, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_uuid', user.uuid)
        .order('created_at', { ascending: false });

    if (transError) {
        console.error('❌ 查询积分交易失败:', transError.message);
    } else if (!transactions || transactions.length === 0) {
        console.log('⚠️ 没有找到积分交易记录');
    } else {
        console.log(`✅ 找到 ${transactions.length} 条积分交易记录:`);
        transactions.slice(0, 5).forEach((tx, i) => {
            console.log(`   ${i+1}. ${tx.transaction_type}: ${tx.amount} 积分 (${tx.created_at})`);
            console.log(`      余额: ${tx.balance_after}, 来源: ${tx.source}`);
        });
    }
    console.log('');

    // 3. 检查订阅记录
    console.log('3. 检查订阅记录...');
    const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('google_user_email', TARGET_EMAIL);

    if (subError) {
        console.error('❌ 查询订阅记录失败:', subError.message);
    } else if (!subscriptions || subscriptions.length === 0) {
        console.log('⚠️ 没有找到订阅记录');
    } else {
        console.log(`✅ 找到 ${subscriptions.length} 条订阅记录:`);
        subscriptions.forEach((sub, i) => {
            console.log(`   ${i+1}. 计划: ${sub.plan_type}, 状态: ${sub.status}`);
            console.log(`      PayPal ID: ${sub.paypal_subscription_id}`);
            console.log(`      创建时间: ${sub.created_at}`);
        });
    }
    console.log('');

    // 4. 诊断问题
    console.log('4. 问题诊断:');
    
    // 积分为0的问题
    if (user.credits === 0) {
        console.log('❌ 问题1: 用户积分为0');
        console.log('   解决方案: 添加初始积分');
        await fixZeroCredits(user);
    } else {
        console.log('✅ 用户积分正常');
    }
    
    // 订阅问题
    if (!subscriptions || subscriptions.length === 0) {
        console.log('⚠️ 问题2: 没有订阅记录');
        console.log('   可能原因: 订阅创建失败或数据库记录丢失');
    } else {
        const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
        if (activeSubscriptions.length === 0) {
            console.log('❌ 问题3: 没有活跃的订阅');
            console.log('   解决方案: 激活现有订阅或创建新订阅');
            await fixSubscription(user, subscriptions[0]);
        } else {
            console.log('✅ 订阅状态正常');
        }
    }
}

async function createNewUser() {
    console.log('正在创建新用户记录...');
    
    // 生成用户UUID
    const userUuid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建新用户记录
    const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
            uuid: userUuid,
            email: TARGET_EMAIL,
            name: TARGET_EMAIL.split('@')[0],
            credits: 20,
            total_credits_earned: 20,
            subscription_status: 'FREE',
            is_signed_in: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select();
    
    if (createError) {
        console.error('❌ 创建用户失败:', createError.message);
        return;
    }
    
    console.log('✅ 新用户创建成功!');
    console.log(`   ID: ${newUser[0].id}`);
    console.log(`   UUID: ${newUser[0].uuid}`);
    console.log(`   积分: ${newUser[0].credits}`);
    
    // 记录积分交易
    const { error: transError } = await supabase
        .from('credit_transactions')
        .insert({
            user_uuid: userUuid,
            transaction_type: 'EARN',
            amount: 20,
            balance_after: 20,
            description: '首次登录奖励',
            source: 'first_login_bonus'
        });
    
    if (transError) {
        console.warn('⚠️ 积分交易记录失败:', transError.message);
    } else {
        console.log('✅ 首次登录积分交易已记录');
    }
}

async function fixZeroCredits(user) {
    console.log('正在修复零积分问题...');
    
    const creditsToAdd = 20;
    
    // 更新用户积分
    const { error: updateError } = await supabase
        .from('users')
        .update({
            credits: creditsToAdd,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    
    if (updateError) {
        console.error('❌ 更新积分失败:', updateError.message);
        return;
    }
    
    console.log(`✅ 已添加 ${creditsToAdd} 积分`);
    
    // 记录积分交易
    const { error: transError } = await supabase
        .from('credit_transactions')
        .insert({
            user_uuid: user.uuid,
            transaction_type: 'EARN',
            amount: creditsToAdd,
            balance_after: creditsToAdd,
            description: '系统修复积分',
            source: 'system_fix'
        });
    
    if (transError) {
        console.warn('⚠️ 积分交易记录失败:', transError.message);
    } else {
        console.log('✅ 积分交易已记录');
    }
}

async function fixSubscription(user, subscription) {
    if (!subscription) {
        console.log('没有订阅记录可修复');
        return;
    }
    
    console.log('正在修复订阅问题...');
    
    // 更新订阅状态
    const { error: subError } = await supabase
        .from('user_subscriptions')
        .update({
            status: 'ACTIVE',
            updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
    
    if (subError) {
        console.error('❌ 更新订阅状态失败:', subError.message);
        return;
    }
    
    console.log('✅ 订阅状态已更新为ACTIVE');
    
    // 确定积分数量
    const planType = subscription.plan_type?.toLowerCase() || 'pro';
    const creditsToAdd = planType === 'max' ? 5000 : 1000;
    
    // 更新用户积分和订阅状态
    const currentCredits = user.credits || 0;
    const newCredits = currentCredits + creditsToAdd;
    
    const { error: updateError } = await supabase
        .from('users')
        .update({
            credits: newCredits,
            subscription_status: 'ACTIVE',
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    
    if (updateError) {
        console.error('❌ 更新用户状态失败:', updateError.message);
        return;
    }
    
    console.log(`✅ 用户积分已更新: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
    
    // 记录积分交易
    const { error: transError } = await supabase
        .from('credit_transactions')
        .insert({
            user_uuid: user.uuid,
            transaction_type: 'EARN',
            amount: creditsToAdd,
            balance_after: newCredits,
            description: `${planType.toUpperCase()} 订阅激活`,
            source: 'subscription_fix'
        });
    
    if (transError) {
        console.warn('⚠️ 积分交易记录失败:', transError.message);
    } else {
        console.log('✅ 积分交易已记录');
    }
}

// 运行主函数
main().catch(err => {
    console.error('程序执行错误:', err);
});