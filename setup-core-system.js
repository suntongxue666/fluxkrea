/**
 * 核心系统设置 - Google登录、积分、订阅
 * 重新实现用户系统的核心功能
 */

// 1. 用户Google登录处理
function handleGoogleLogin(googleUser) {
    const userInfo = {
        email: googleUser.email,
        name: googleUser.name,
        avatar_url: googleUser.picture,
        google_id: googleUser.sub
    };
    
    console.log('Google登录用户信息:', userInfo);
    
    // 检查用户是否存在，不存在则创建并给20积分
    return createOrUpdateUser(userInfo);
}

// 2. 创建或更新用户
async function createOrUpdateUser(userInfo) {
    try {
        // 先查找用户
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', userInfo.email)
            .single();
        
        if (existingUser) {
            console.log('用户已存在:', existingUser);
            return existingUser;
        }
        
        // 用户不存在，创建新用户
        const newUser = {
            uuid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: userInfo.email,
            name: userInfo.name,
            avatar_url: userInfo.avatar_url,
            google_id: userInfo.google_id,
            credits: 20, // 首次登录给20积分
            subscription_status: 'FREE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data: user, error: createError } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();
        
        if (createError) {
            console.error('创建用户失败:', createError);
            throw createError;
        }
        
        // 记录首次登录积分奖励
        await recordCreditTransaction({
            user_uuid: user.uuid,
            transaction_type: 'EARN',
            amount: 20,
            balance_after: 20,
            description: '首次登录奖励',
            source: 'first_login_bonus'
        });
        
        console.log('新用户创建成功:', user);
        return user;
        
    } catch (error) {
        console.error('用户创建/更新失败:', error);
        throw error;
    }
}

// 3. 记录积分交易
async function recordCreditTransaction(transaction) {
    try {
        const { data, error } = await supabase
            .from('credit_transactions')
            .insert([{
                user_uuid: transaction.user_uuid,
                transaction_type: transaction.transaction_type, // 'EARN' or 'SPEND'
                amount: transaction.amount,
                balance_after: transaction.balance_after,
                description: transaction.description,
                source: transaction.source, // 'first_login_bonus', 'subscription', 'generation'
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) {
            console.error('积分交易记录失败:', error);
            throw error;
        }
        
        console.log('积分交易记录成功:', data);
        return data;
        
    } catch (error) {
        console.error('积分交易记录异常:', error);
        throw error;
    }
}

// 4. 消费积分（AI图片生成）
async function spendCredits(userEmail, amount, description = 'AI图片生成') {
    try {
        // 获取用户当前积分
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail)
            .single();
        
        if (userError || !user) {
            throw new Error('用户不存在');
        }
        
        if (user.credits < amount) {
            throw new Error('积分不足');
        }
        
        const newBalance = user.credits - amount;
        
        // 更新用户积分
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                credits: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('email', userEmail);
        
        if (updateError) {
            throw updateError;
        }
        
        // 记录消费交易
        await recordCreditTransaction({
            user_uuid: user.uuid,
            transaction_type: 'SPEND',
            amount: amount,
            balance_after: newBalance,
            description: description,
            source: 'generation'
        });
        
        console.log(`用户 ${userEmail} 消费 ${amount} 积分，余额: ${newBalance}`);
        return { success: true, newBalance };
        
    } catch (error) {
        console.error('积分消费失败:', error);
        return { success: false, error: error.message };
    }
}

// 5. 创建订阅记录
async function createSubscription(subscriptionData) {
    try {
        const subscription = {
            google_user_email: subscriptionData.userEmail,
            paypal_subscription_id: subscriptionData.subscriptionId,
            plan_type: subscriptionData.planType, // 'BASIC' or 'PREMIUM'
            status: 'ACTIVE',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('user_subscriptions')
            .insert([subscription])
            .select()
            .single();
        
        if (error) {
            console.error('创建订阅失败:', error);
            throw error;
        }
        
        // 更新用户订阅状态
        await supabase
            .from('users')
            .update({ 
                subscription_status: subscriptionData.planType,
                updated_at: new Date().toISOString()
            })
            .eq('email', subscriptionData.userEmail);
        
        console.log('订阅创建成功:', data);
        return data;
        
    } catch (error) {
        console.error('订阅创建异常:', error);
        throw error;
    }
}

// 6. 处理PayPal Webhook
async function handlePayPalWebhook(eventData) {
    try {
        // 记录webhook事件
        const { data: webhookRecord, error: webhookError } = await supabase
            .from('webhook_events')
            .insert([{
                event_type: eventData.event_type,
                resource_data: eventData,
                status: 'processing',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (webhookError) {
            console.error('Webhook记录失败:', webhookError);
            return;
        }
        
        // 处理不同类型的事件
        switch (eventData.event_type) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                await handleSubscriptionActivated(eventData);
                break;
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                await handleSubscriptionCancelled(eventData);
                break;
            case 'PAYMENT.SALE.COMPLETED':
                await handlePaymentCompleted(eventData);
                break;
        }
        
        // 更新webhook状态为已处理
        await supabase
            .from('webhook_events')
            .update({ status: 'processed' })
            .eq('id', webhookRecord.id);
        
    } catch (error) {
        console.error('Webhook处理失败:', error);
    }
}

// 7. 订阅计划配置
const SUBSCRIPTION_PLANS = {
    BASIC: {
        name: 'Basic Plan',
        credits_per_month: 100,
        price: '$9.99'
    },
    PREMIUM: {
        name: 'Premium Plan', 
        credits_per_month: 300,
        price: '$19.99'
    }
};

// 导出函数供其他模块使用
module.exports = {
    handleGoogleLogin,
    createOrUpdateUser,
    recordCreditTransaction,
    spendCredits,
    createSubscription,
    handlePayPalWebhook,
    SUBSCRIPTION_PLANS
};

console.log('✅ 核心系统设置完成');
console.log('📋 功能包括:');
console.log('- Google登录处理');
console.log('- 首次登录20积分奖励');
console.log('- 积分消费记录');
console.log('- 订阅管理');
console.log('- PayPal Webhook处理');