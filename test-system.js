/**
 * 测试核心系统功能
 * 模拟 sunwei7482@gmail.com 用户的完整流程
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

// 模拟Google用户数据
const mockGoogleUser = {
    email: 'sunwei7482@gmail.com',
    name: 'Sun Wei',
    picture: 'https://lh3.googleusercontent.com/a/default-user',
    sub: 'google_123456789'
};

async function testCompleteFlow() {
    console.log('🚀 开始测试完整用户流程\n');
    
    try {
        // 1. 测试Google登录和用户创建
        console.log('1️⃣ 测试Google登录...');
        const user = await createOrUpdateUser(mockGoogleUser);
        console.log('✅ 用户创建成功:', user.email, '积分:', user.credits);
        
        // 2. 测试积分消费
        console.log('\n2️⃣ 测试积分消费...');
        const spendResult = await spendCredits(user.email, 5, 'AI图片生成测试');
        console.log('✅ 积分消费结果:', spendResult);
        
        // 3. 测试创建订阅
        console.log('\n3️⃣ 测试创建订阅...');
        const subscription = await createSubscription({
            userEmail: user.email,
            subscriptionId: 'paypal_sub_test_123',
            planType: 'BASIC'
        });
        console.log('✅ 订阅创建成功:', subscription.plan_type);
        
        // 4. 查看最终状态
        console.log('\n4️⃣ 查看最终用户状态...');
        const { data: finalUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
        
        console.log('👤 最终用户状态:');
        console.log('   邮箱:', finalUser.email);
        console.log('   积分:', finalUser.credits);
        console.log('   订阅状态:', finalUser.subscription_status);
        
        // 5. 查看积分交易记录
        console.log('\n5️⃣ 查看积分交易记录...');
        const { data: transactions } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', finalUser.uuid)
            .order('created_at', { ascending: false });
        
        console.log('💳 积分交易记录:');
        transactions.forEach((trans, index) => {
            console.log(`   ${index + 1}. ${trans.transaction_type} ${trans.amount} - ${trans.description} (余额: ${trans.balance_after})`);
        });
        
        // 6. 查看订阅记录
        console.log('\n6️⃣ 查看订阅记录...');
        const { data: subscriptions } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('google_user_email', finalUser.email);
        
        console.log('📋 订阅记录:');
        subscriptions.forEach((sub, index) => {
            console.log(`   ${index + 1}. ${sub.plan_type} - ${sub.status} (PayPal ID: ${sub.paypal_subscription_id})`);
        });
        
        console.log('\n🎉 测试完成！系统运行正常');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 核心函数实现（从setup-core-system.js复制）
async function createOrUpdateUser(userInfo) {
    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', userInfo.email)
            .single();
        
        if (existingUser) {
            console.log('用户已存在:', existingUser.email);
            return existingUser;
        }
        
        const newUser = {
            uuid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: userInfo.email,
            name: userInfo.name,
            avatar_url: userInfo.picture,
            google_id: userInfo.sub,
            credits: 20,
            subscription_status: 'FREE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data: user, error } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();
        
        if (error) throw error;
        
        await recordCreditTransaction({
            user_uuid: user.uuid,
            transaction_type: 'EARN',
            amount: 20,
            balance_after: 20,
            description: '首次登录奖励',
            source: 'first_login_bonus'
        });
        
        return user;
        
    } catch (error) {
        console.error('用户创建失败:', error);
        throw error;
    }
}

async function recordCreditTransaction(transaction) {
    const { data, error } = await supabase
        .from('credit_transactions')
        .insert([{
            user_uuid: transaction.user_uuid,
            transaction_type: transaction.transaction_type,
            amount: transaction.amount,
            balance_after: transaction.balance_after,
            description: transaction.description,
            source: transaction.source,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function spendCredits(userEmail, amount, description = 'AI图片生成') {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail)
            .single();
        
        if (error || !user) throw new Error('用户不存在');
        if (user.credits < amount) throw new Error('积分不足');
        
        const newBalance = user.credits - amount;
        
        await supabase
            .from('users')
            .update({ 
                credits: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('email', userEmail);
        
        await recordCreditTransaction({
            user_uuid: user.uuid,
            transaction_type: 'SPEND',
            amount: amount,
            balance_after: newBalance,
            description: description,
            source: 'generation'
        });
        
        return { success: true, newBalance };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function createSubscription(subscriptionData) {
    const subscription = {
        google_user_email: subscriptionData.userEmail,
        paypal_subscription_id: subscriptionData.subscriptionId,
        plan_type: subscriptionData.planType,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([subscription])
        .select()
        .single();
    
    if (error) throw error;
    
    await supabase
        .from('users')
        .update({ 
            subscription_status: subscriptionData.planType,
            updated_at: new Date().toISOString()
        })
        .eq('email', subscriptionData.userEmail);
    
    return data;
}

// 运行测试
testCompleteFlow();