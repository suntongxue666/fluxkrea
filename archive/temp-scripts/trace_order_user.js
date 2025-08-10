// 通过订单ID追踪真实用户
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function traceOrderUser() {
    const subscriptionId = 'I-4V957XAPPN06';
    
    try {
        console.log(`🔍 追踪订单 ${subscriptionId} 的用户信息...`);
        
        // 1. 获取PayPal访问令牌
        const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'en_US',
                'Authorization': 'Basic ' + Buffer.from('AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8:EBbVan6rYdBhJj0GJXGGaUd_9QfAJFNpKmBgCUjBfJCzOHoidGVUmPOL_-8KJE7u-Nt-K8bEcHGGmhmi').toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        
        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
            console.error('❌ 获取PayPal访问令牌失败:', tokenData);
            return;
        }
        
        console.log('✅ PayPal访问令牌获取成功');
        
        // 2. 获取订阅详情
        const subscriptionResponse = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json'
            }
        });
        
        const subscriptionData = await subscriptionResponse.json();
        
        if (subscriptionResponse.status !== 200) {
            console.error('❌ 获取订阅详情失败:', subscriptionData);
            return;
        }
        
        console.log('✅ 订阅详情获取成功');
        console.log('📋 订阅信息:');
        console.log('订阅ID:', subscriptionData.id);
        console.log('状态:', subscriptionData.status);
        console.log('计划ID:', subscriptionData.plan_id);
        console.log('创建时间:', subscriptionData.create_time);
        
        // 3. 获取订阅者信息
        if (subscriptionData.subscriber) {
            console.log('\n👤 订阅者信息:');
            console.log('邮箱:', subscriptionData.subscriber.email_address);
            console.log('姓名:', subscriptionData.subscriber.name?.given_name, subscriptionData.subscriber.name?.surname);
            console.log('PayPal用户ID:', subscriptionData.subscriber.payer_id);
            
            const userEmail = subscriptionData.subscriber.email_address;
            
            if (userEmail) {
                console.log(`\n🎯 找到真实用户邮箱: ${userEmail}`);
                
                // 4. 在数据库中查找或创建用户
                await findOrCreateUser(userEmail, subscriptionId, subscriptionData);
            } else {
                console.error('❌ 未找到用户邮箱');
            }
        } else {
            console.error('❌ 订阅数据中没有订阅者信息');
        }
        
        // 5. 获取订阅交易历史
        const transactionsResponse = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}/transactions?start_time=2025-01-01T00:00:00Z&end_time=2025-12-31T23:59:59Z`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json'
            }
        });
        
        if (transactionsResponse.status === 200) {
            const transactionsData = await transactionsResponse.json();
            console.log('\n💳 交易历史:');
            transactionsData.transactions?.forEach((transaction, index) => {
                console.log(`${index + 1}. ${transaction.id} - ${transaction.status} - ${transaction.amount_with_breakdown?.gross_amount?.value} ${transaction.amount_with_breakdown?.gross_amount?.currency_code}`);
                console.log(`   时间: ${transaction.time}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 追踪订单用户失败:', error);
    }
}

async function findOrCreateUser(email, subscriptionId, subscriptionData) {
    const { createClient } = require('@supabase/supabase-js');
    
    const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    try {
        console.log(`\n🔍 在数据库中查找用户: ${email}`);
        
        // 查找现有用户
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        let targetUser = null;
        
        if (findError && findError.code === 'PGRST116') {
            // 用户不存在，创建新用户
            console.log('👤 用户不存在，创建新用户...');
            
            const newUserUuid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    uuid: newUserUuid,
                    email: email,
                    name: subscriptionData.subscriber?.name ? 
                        `${subscriptionData.subscriber.name.given_name || ''} ${subscriptionData.subscriber.name.surname || ''}`.trim() : 
                        email.split('@')[0],
                    credits: 0,
                    subscription_status: 'FREE',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (createError) {
                console.error('❌ 创建用户失败:', createError);
                return;
            }
            
            targetUser = newUser;
            console.log('✅ 新用户创建成功');
        } else if (findError) {
            console.error('❌ 查找用户失败:', findError);
            return;
        } else {
            targetUser = existingUser;
            console.log('✅ 找到现有用户');
        }
        
        console.log('👤 目标用户信息:');
        console.log('邮箱:', targetUser.email);
        console.log('UUID:', targetUser.uuid);
        console.log('当前积分:', targetUser.credits);
        console.log('订阅状态:', targetUser.subscription_status);
        
        // 激活订阅
        await activateSubscriptionForCorrectUser(targetUser, subscriptionId, subscriptionData);
        
    } catch (error) {
        console.error('❌ 查找或创建用户失败:', error);
    }
}

async function activateSubscriptionForCorrectUser(user, subscriptionId, subscriptionData) {
    const { createClient } = require('@supabase/supabase-js');
    
    const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    try {
        console.log(`\n🚀 为用户 ${user.email} 激活订阅 ${subscriptionId}...`);
        
        // 确定积分数量
        const planId = subscriptionData.plan_id;
        let creditsToAdd = 0;
        
        if (planId === 'P-5ML4271244454362WXNWU5NI') {
            creditsToAdd = 1000; // Pro Plan
        } else if (planId === 'P-3NJ78684DS796242VNCJBKQQ') {
            creditsToAdd = 5000; // Max Plan
        } else {
            console.error('❌ 未知的计划ID:', planId);
            return;
        }
        
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
                description: `订阅激活 - 获得${creditsToAdd}积分 (${subscriptionId})`,
                source: 'paypal_subscription'
            });
        
        if (transError) {
            console.log('⚠️ 记录积分交易失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        // 验证结果
        const { data: updatedUser, error: verifyError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', user.uuid)
            .single();
        
        if (verifyError) {
            console.error('❌ 验证失败:', verifyError);
        } else {
            console.log('\n🎉 订阅激活成功！');
            console.log(`👤 用户: ${updatedUser.email}`);
            console.log(`💰 当前积分: ${updatedUser.credits}`);
            console.log(`📊 订阅状态: ${updatedUser.subscription_status}`);
            console.log(`🆔 订阅ID: ${subscriptionId}`);
            console.log(`📋 计划ID: ${planId}`);
            
            console.log('\n📝 用户现在可以:');
            console.log(`1. 使用邮箱 ${updatedUser.email} 登录网站`);
            console.log(`2. 查看积分余额: ${updatedUser.credits}`);
            console.log('3. 享受订阅服务');
        }
        
    } catch (error) {
        console.error('❌ 激活订阅失败:', error);
    }
}

// 运行追踪
traceOrderUser();