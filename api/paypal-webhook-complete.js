// 完整的PayPal Webhook处理器 - 自动处理订阅和积分
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 计划详情映射
const PLAN_DETAILS = {
    'P-5ML4271244454362WXNWU5NI': { name: 'Pro Plan', credits: 1000, price: 9.99 },
    'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000, price: 29.99 }
};

module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { event_type, resource } = req.body;
        
        console.log('🔔 PayPal Webhook received:', event_type);
        console.log('📋 Resource:', JSON.stringify(resource, null, 2));
        
        // 记录webhook事件
        await logWebhookEvent(event_type, resource);
        
        // 处理不同类型的事件
        switch (event_type) {
            case 'BILLING.SUBSCRIPTION.CREATED':
                await handleSubscriptionCreated(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                await handleSubscriptionActivated(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                await handleSubscriptionCancelled(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                await handleSubscriptionSuspended(resource);
                break;
                
            case 'PAYMENT.SALE.COMPLETED':
                await handlePaymentCompleted(resource);
                break;
                
            default:
                console.log('⚠️ Unhandled event type:', event_type);
        }
        
        res.status(200).json({ message: 'Webhook processed successfully' });
        
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 记录webhook事件
async function logWebhookEvent(eventType, resource) {
    try {
        const { error } = await supabase
            .from('webhook_events')
            .insert({
                event_type: eventType,
                resource_data: resource,
                processed_at: new Date().toISOString()
            });
        
        if (error) {
            console.log('⚠️ 记录webhook事件失败 (表可能不存在):', error.message);
        }
    } catch (error) {
        console.error('❌ 记录webhook事件异常:', error);
    }
}

// 处理订阅创建事件
async function handleSubscriptionCreated(resource) {
    try {
        console.log('🆕 处理订阅创建事件:', resource.id);
        
        const subscriptionId = resource.id;
        const planId = resource.plan_id;
        const customId = resource.custom_id;
        
        // 解析custom_id中的用户信息
        let userInfo = null;
        try {
            userInfo = JSON.parse(customId);
        } catch (e) {
            console.log('⚠️ 无法解析custom_id，使用默认处理');
            userInfo = { user_id: customId };
        }
        
        // 更新订阅状态
        const { error: updateError } = await supabase
            .from('subscriptions')
            .upsert({
                id: subscriptionId,
                user_uuid: userInfo.user_id,
                user_email: userInfo.email,
                plan_id: planId,
                plan_type: userInfo.plan_type,
                status: 'CREATED',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        
        if (updateError) {
            console.error('❌ 更新订阅状态失败:', updateError);
        } else {
            console.log('✅ 订阅创建事件处理完成');
        }
        
    } catch (error) {
        console.error('❌ 处理订阅创建事件失败:', error);
    }
}

// 处理订阅激活事件 - 核心积分发放逻辑
async function handleSubscriptionActivated(resource) {
    try {
        console.log('🚀 处理订阅激活事件:', resource.id);
        
        const subscriptionId = resource.id;
        const planId = resource.plan_id;
        const customId = resource.custom_id;
        
        // 获取计划详情
        const planDetails = PLAN_DETAILS[planId];
        if (!planDetails) {
            console.error('❌ 未知的计划ID:', planId);
            return;
        }
        
        console.log('📋 计划详情:', planDetails);
        
        // 解析用户信息
        let userInfo = null;
        try {
            userInfo = JSON.parse(customId);
        } catch (e) {
            console.log('⚠️ 无法解析custom_id，尝试查找订阅记录');
            
            // 从user_subscriptions表查找用户信息
            const { data: subData } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('paypal_subscription_id', subscriptionId)
                .single();
            
            if (subData) {
                userInfo = {
                    user_id: subData.google_user_id,
                    email: subData.google_user_email,
                    plan_type: subData.plan_type
                };
            } else {
                console.error('❌ 无法找到用户信息');
                return;
            }
        }
        
        console.log('👤 用户信息:', userInfo);
        
        // 查找用户 - 修复版本，支持多种查找方式
        let user = null;
        let userError = null;
        
        // 1. 优先通过UUID查找
        if (userInfo.user_id) {
            const { data: userData, error: uuidError } = await supabase
                .from('users')
                .select('*')
                .eq('uuid', userInfo.user_id)
                .single();
            
            if (!uuidError && userData) {
                user = userData;
                console.log(`✅ 通过UUID找到用户: ${user.email}`);
            } else {
                console.log(`⚠️ 通过UUID未找到用户，尝试邮箱查找...`);
                
                // 2. 如果UUID查找失败，尝试通过邮箱查找
                if (userInfo.email) {
                    const { data: emailData, error: emailError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', userInfo.email)
                        .single();
                    
                    if (!emailError && emailData) {
                        user = emailData;
                        console.log(`✅ 通过邮箱找到用户: ${user.email} (UUID: ${user.uuid})`);
                        
                        // 更新用户UUID以保持一致性
                        if (user.uuid !== userInfo.user_id) {
                            console.log(`🔧 更新用户UUID: ${user.uuid} -> ${userInfo.user_id}`);
                            await supabase
                                .from('users')
                                .update({ uuid: userInfo.user_id })
                                .eq('id', user.id);
                            user.uuid = userInfo.user_id;
                        }
                    } else {
                        userError = emailError;
                    }
                } else {
                    userError = uuidError;
                }
            }
        }
        
        if (userError) {
            console.error('❌ 查找用户失败:', userError);
            return;
        }
        
        // 计算新积分
        const currentCredits = user.credits || 0;
        const creditsToAdd = planDetails.credits;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`💰 积分更新: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 更新用户积分和订阅状态
        const { error: updateUserError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('uuid', userInfo.user_id);
        
        if (updateUserError) {
            console.error('❌ 更新用户积分失败:', updateUserError);
            return;
        }
        
        console.log('✅ 用户积分已更新');
        
        // 记录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: userInfo.user_id,
                transaction_type: 'SUBSCRIPTION_PURCHASE',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `${planDetails.name}订阅激活 - 获得${creditsToAdd}积分`,
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
            .eq('id', subscriptionId);
        
        if (updateSubError) {
            console.log('⚠️ 更新订阅状态失败:', updateSubError.message);
        }
        
        // 更新user_subscriptions表
        const { error: updateUserSubError } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
        
        if (updateUserSubError) {
            console.log('⚠️ 更新用户订阅记录失败:', updateUserSubError.message);
        }
        
        console.log('🎉 订阅激活处理完成！');
        console.log(`👤 用户: ${user.email}`);
        console.log(`💰 新积分: ${newCredits}`);
        console.log(`📊 订阅状态: ACTIVE`);
        
    } catch (error) {
        console.error('❌ 处理订阅激活事件失败:', error);
    }
}

// 处理订阅取消事件
async function handleSubscriptionCancelled(resource) {
    try {
        console.log('❌ 处理订阅取消事件:', resource.id);
        
        const subscriptionId = resource.id;
        
        // 更新订阅状态
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'CANCELLED',
                updated_at: new Date().toISOString()
            })
            .eq('id', subscriptionId);
        
        if (updateError) {
            console.error('❌ 更新订阅状态失败:', updateError);
        }
        
        // 更新用户订阅状态
        const { error: updateUserSubError } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'CANCELLED',
                updated_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
        
        if (updateUserSubError) {
            console.log('⚠️ 更新用户订阅记录失败:', updateUserSubError.message);
        }
        
        console.log('✅ 订阅取消事件处理完成');
        
    } catch (error) {
        console.error('❌ 处理订阅取消事件失败:', error);
    }
}

// 处理订阅暂停事件
async function handleSubscriptionSuspended(resource) {
    try {
        console.log('⏸️ 处理订阅暂停事件:', resource.id);
        
        const subscriptionId = resource.id;
        
        // 更新订阅状态
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'SUSPENDED',
                updated_at: new Date().toISOString()
            })
            .eq('id', subscriptionId);
        
        if (updateError) {
            console.error('❌ 更新订阅状态失败:', updateError);
        }
        
        console.log('✅ 订阅暂停事件处理完成');
        
    } catch (error) {
        console.error('❌ 处理订阅暂停事件失败:', error);
    }
}

// 处理支付完成事件
async function handlePaymentCompleted(resource) {
    try {
        console.log('💳 处理支付完成事件:', resource.id);
        
        // 这里可以处理定期支付的逻辑
        // 比如每月续费时给用户添加积分
        
        console.log('✅ 支付完成事件处理完成');
        
    } catch (error) {
        console.error('❌ 处理支付完成事件失败:', error);
    }
}