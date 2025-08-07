// PayPal Webhook处理器 - 修复版本，增强错误处理
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
    
    // 增加详细的日志记录
    console.log('🔔 Webhook请求详情:');
    console.log('   方法:', req.method);
    console.log('   URL:', req.url);
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    
    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS请求 - 返回CORS头');
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        console.log('❌ 非POST请求:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        console.log('📝 请求体:', JSON.stringify(req.body, null, 2));
        
        // 检查请求体是否存在
        if (!req.body) {
            console.log('❌ 请求体为空');
            return res.status(400).json({ error: 'Request body is required' });
        }
        
        const { event_type, resource } = req.body;
        
        // 基本验证
        if (!event_type) {
            console.log('❌ 缺少event_type');
            return res.status(400).json({ error: 'event_type is required' });
        }
        
        if (!resource) {
            console.log('❌ 缺少resource');
            return res.status(400).json({ error: 'resource is required' });
        }
        
        console.log('🔔 PayPal Webhook received:', event_type);
        console.log('📋 Resource ID:', resource.id || 'N/A');
        
        // 先记录webhook事件
        await logWebhookEvent(event_type, resource);
        
        // 处理不同类型的事件
        switch (event_type) {
            case 'BILLING.SUBSCRIPTION.CREATED':
                console.log('🆕 处理订阅创建事件');
                await handleSubscriptionCreated(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                console.log('🚀 处理订阅激活事件');
                await handleSubscriptionActivated(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                console.log('❌ 处理订阅取消事件');
                await handleSubscriptionCancelled(resource);
                break;
                
            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                console.log('⏸️ 处理订阅暂停事件');
                await handleSubscriptionSuspended(resource);
                break;
                
            case 'PAYMENT.SALE.COMPLETED':
                console.log('💳 处理支付完成事件');
                await handlePaymentCompleted(resource);
                break;
                
            default:
                console.log('⚠️ 未处理的事件类型:', event_type);
        }
        
        console.log('✅ Webhook处理完成');
        res.status(200).json({ 
            message: 'Webhook processed successfully',
            event_type: event_type,
            resource_id: resource.id || 'N/A',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Webhook处理错误:', error);
        console.error('❌ 错误堆栈:', error.stack);
        
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// 记录webhook事件 - 增强错误处理
async function logWebhookEvent(eventType, resource) {
    try {
        console.log('📝 记录webhook事件:', eventType);
        
        const { error } = await supabase
            .from('webhook_events')
            .insert({
                event_type: eventType,
                resource_data: resource,
                processed_at: new Date().toISOString()
            });
        
        if (error) {
            console.log('⚠️ 记录webhook事件失败:', error.message);
            console.log('⚠️ 错误详情:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Webhook事件记录成功');
        }
    } catch (error) {
        console.error('❌ 记录webhook事件异常:', error);
    }
}

// 处理订阅创建事件 - 修复版本
async function handleSubscriptionCreated(resource) {
    try {
        console.log('🆕 开始处理订阅创建事件:', resource.id);
        
        const subscriptionId = resource.id;
        const planId = resource.plan_id;
        const customId = resource.custom_id || '{}';
        
        console.log('📋 订阅详情:');
        console.log('   订阅ID:', subscriptionId);
        console.log('   计划ID:', planId);
        console.log('   自定义ID:', customId);
        
        // 解析custom_id中的用户信息
        let userInfo = {};
        try {
            if (customId && customId !== '{}') {
                userInfo = JSON.parse(customId);
            }
        } catch (e) {
            console.log('⚠️ 无法解析custom_id，使用默认处理');
            userInfo = { user_id: customId };
        }
        
        console.log('👤 解析的用户信息:', userInfo);
        
        // 使用字符串类型的订阅ID插入订阅记录
        const { error: upsertError } = await supabase
            .from('subscriptions')
            .upsert({
                subscription_id: subscriptionId, // 使用字符串字段
                user_uuid: userInfo.user_id || null,
                user_email: userInfo.email || null,
                plan_id: planId,
                plan_type: userInfo.plan_type || null,
                status: 'CREATED',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        
        if (upsertError) {
            console.error('❌ 更新订阅状态失败:', upsertError);
            console.error('❌ 错误详情:', JSON.stringify(upsertError, null, 2));
        } else {
            console.log('✅ 订阅创建事件处理完成');
        }
        
    } catch (error) {
        console.error('❌ 处理订阅创建事件失败:', error);
        console.error('❌ 错误堆栈:', error.stack);
    }
}

// 处理订阅激活事件 - 核心逻辑，增强错误处理
async function handleSubscriptionActivated(resource) {
    try {
        console.log('🚀 开始处理订阅激活事件:', resource.id);
        
        const subscriptionId = resource.id;
        const planId = resource.plan_id;
        const customId = resource.custom_id || '{}';
        
        // 获取计划详情
        const planDetails = PLAN_DETAILS[planId];
        if (!planDetails) {
            console.error('❌ 未知的计划ID:', planId);
            console.log('📋 可用的计划ID:', Object.keys(PLAN_DETAILS));
            return;
        }
        
        console.log('📋 计划详情:', planDetails);
        
        // 解析用户信息
        let userInfo = {};
        try {
            if (customId && customId !== '{}') {
                userInfo = JSON.parse(customId);
            }
        } catch (e) {
            console.log('⚠️ 无法解析custom_id，尝试查找订阅记录');
            
            // 从user_subscriptions表查找用户信息
            const { data: subData, error: subError } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('paypal_subscription_id', subscriptionId)
                .single();
            
            if (!subError && subData) {
                userInfo = {
                    user_id: subData.google_user_id,
                    email: subData.google_user_email,
                    plan_type: subData.plan_type
                };
                console.log('✅ 从订阅表找到用户信息:', userInfo);
            } else {
                console.log('⚠️ 从订阅表未找到用户信息，使用默认值');
                userInfo = {
                    user_id: 'unknown',
                    email: 'unknown',
                    plan_type: 'unknown'
                };
            }
        }
        
        console.log('👤 最终用户信息:', userInfo);
        
        // 查找用户 - 支持多种查找方式
        let user = null;
        
        // 1. 优先通过UUID查找
        if (userInfo.user_id && userInfo.user_id !== 'unknown') {
            console.log('🔍 通过UUID查找用户:', userInfo.user_id);
            
            const { data: userData, error: uuidError } = await supabase
                .from('users')
                .select('*')
                .eq('uuid', userInfo.user_id)
                .single();
            
            if (!uuidError && userData) {
                user = userData;
                console.log(`✅ 通过UUID找到用户: ${user.email || user.uuid}`);
            } else {
                console.log(`⚠️ 通过UUID未找到用户: ${uuidError?.message || 'not found'}`);
                
                // 2. 如果UUID查找失败，尝试通过邮箱查找
                if (userInfo.email && userInfo.email !== 'unknown') {
                    console.log('🔍 通过邮箱查找用户:', userInfo.email);
                    
                    const { data: emailData, error: emailError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', userInfo.email)
                        .single();
                    
                    if (!emailError && emailData) {
                        user = emailData;
                        console.log(`✅ 通过邮箱找到用户: ${user.email} (UUID: ${user.uuid})`);
                    } else {
                        console.log(`⚠️ 通过邮箱未找到用户: ${emailError?.message || 'not found'}`);
                    }
                }
            }
        }
        
        if (!user) {
            console.error('❌ 无法找到用户，跳过积分发放');
            console.log('💡 提示: 请确保用户已注册或订阅记录包含正确的用户信息');
            return;
        }
        
        // 计算新积分
        const currentCredits = user.credits || 0;
        const creditsToAdd = planDetails.credits;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`💰 积分更新计划: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 更新用户积分和订阅状态
        const { error: updateUserError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                total_credits_earned: (user.total_credits_earned || 0) + creditsToAdd,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateUserError) {
            console.error('❌ 更新用户积分失败:', updateUserError);
            return;
        }
        
        console.log('✅ 用户积分已更新');
        
        // 记录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_id: user.id,
                user_uuid: user.uuid,
                transaction_type: 'EARN',
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
        
        // 更新订阅状态表
        const { error: updateSubError } = await supabase
            .from('subscriptions')
            .upsert({
                subscription_id: subscriptionId,
                user_uuid: user.uuid,
                user_email: user.email,
                plan_id: planId,
                plan_type: userInfo.plan_type,
                status: 'ACTIVE',
                updated_at: new Date().toISOString()
            });
        
        if (updateSubError) {
            console.log('⚠️ 更新订阅状态失败:', updateSubError.message);
        }
        
        console.log('🎉 订阅激活处理完成！');
        console.log(`👤 用户: ${user.email || user.uuid}`);
        console.log(`💰 新积分: ${newCredits}`);
        console.log(`📊 订阅状态: ACTIVE`);
        
    } catch (error) {
        console.error('❌ 处理订阅激活事件失败:', error);
        console.error('❌ 错误堆栈:', error.stack);
    }
}

// 处理订阅取消事件
async function handleSubscriptionCancelled(resource) {
    try {
        console.log('❌ 开始处理订阅取消事件:', resource.id);
        
        const subscriptionId = resource.id;
        
        // 更新订阅状态
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'CANCELLED',
                updated_at: new Date().toISOString()
            })
            .eq('subscription_id', subscriptionId);
        
        if (updateError) {
            console.error('❌ 更新订阅状态失败:', updateError);
        } else {
            console.log('✅ 订阅取消事件处理完成');
        }
        
    } catch (error) {
        console.error('❌ 处理订阅取消事件失败:', error);
    }
}

// 处理订阅暂停事件
async function handleSubscriptionSuspended(resource) {
    try {
        console.log('⏸️ 开始处理订阅暂停事件:', resource.id);
        
        const subscriptionId = resource.id;
        
        // 更新订阅状态
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'SUSPENDED',
                updated_at: new Date().toISOString()
            })
            .eq('subscription_id', subscriptionId);
        
        if (updateError) {
            console.error('❌ 更新订阅状态失败:', updateError);
        } else {
            console.log('✅ 订阅暂停事件处理完成');
        }
        
    } catch (error) {
        console.error('❌ 处理订阅暂停事件失败:', error);
    }
}

// 处理支付完成事件
async function handlePaymentCompleted(resource) {
    try {
        console.log('💳 开始处理支付完成事件:', resource.id);
        console.log('✅ 支付完成事件处理完成');
        
    } catch (error) {
        console.error('❌ 处理支付完成事件失败:', error);
    }
}