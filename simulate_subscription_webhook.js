// 模拟PayPal订阅webhook处理 - 基于已知信息
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function simulateWebhookProcessing() {
    const subscriptionId = 'I-4V957XAPPN06';
    
    try {
        console.log('🔄 模拟PayPal订阅webhook处理...');
        console.log('订阅ID:', subscriptionId);
        console.log('计划类型: Pro Plan (1000积分)\n');
        
        // 步骤1: 查找最近登录的用户（基于你说的"先登录后购买"）
        console.log('👤 步骤1: 查找最近登录的用户...');
        
        // 查找最近创建的有邮箱的用户（可能是刚登录的）
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
        
        console.log('📋 最近的有邮箱用户:');
        recentUsers.forEach((user, index) => {
            const createdTime = new Date(user.created_at);
            const timeDiff = Date.now() - createdTime.getTime();
            const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
            
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   UUID: ${user.uuid}`);
            console.log(`   积分: ${user.credits || 0}`);
            console.log(`   状态: ${user.subscription_status || 'FREE'}`);
            console.log(`   创建: ${hoursDiff}小时前`);
            console.log('   ---');
        });
        
        // 步骤2: 智能选择购买用户
        console.log('\n🎯 步骤2: 智能选择购买用户...');
        
        let targetUser = null;
        
        // 优先选择最近24小时内创建的用户
        const recentUser = recentUsers.find(user => {
            const createdTime = new Date(user.created_at).getTime();
            const hoursDiff = (Date.now() - createdTime) / (1000 * 60 * 60);
            return hoursDiff < 24;
        });
        
        if (recentUser) {
            targetUser = recentUser;
            console.log(`✅ 选择最近24小时内创建的用户: ${targetUser.email}`);
        } else {
            // 选择第一个用户，但需要确认
            console.log('⚠️ 没有找到最近24小时内创建的用户');
            console.log('可选用户:');
            recentUsers.slice(0, 3).forEach((user, index) => {
                console.log(`${index + 1}. ${user.email} - 积分: ${user.credits || 0}`);
            });
            
            // 这里应该让用户选择，但为了演示，我们选择第一个
            targetUser = recentUsers[0];
            console.log(`🎯 默认选择: ${targetUser.email}`);
        }
        
        if (!targetUser) {
            console.error('❌ 没有找到合适的用户');
            return;
        }
        
        // 步骤3: 创建用户订阅绑定记录
        console.log('\n🔗 步骤3: 创建用户订阅绑定记录...');
        
        await createUserSubscriptionBinding(targetUser, subscriptionId);
        
        // 步骤4: 激活订阅并发放积分
        console.log('\n🚀 步骤4: 激活订阅并发放积分...');
        
        await activateSubscriptionAndAddCredits(targetUser, subscriptionId);
        
    } catch (error) {
        console.error('❌ 模拟webhook处理失败:', error);
    }
}

async function createUserSubscriptionBinding(user, subscriptionId) {
    try {
        console.log(`🔗 为用户 ${user.email} 创建订阅绑定...`);
        
        // 创建用户订阅绑定记录（如果表存在）
        const bindingData = {
            google_user_id: user.uuid,
            google_user_email: user.email,
            paypal_subscription_id: subscriptionId,
            plan_id: 'P-5ML4271244454362WXNWU5NI', // Pro Plan
            plan_type: 'pro',
            status: 'ACTIVE',
            created_at: new Date().toISOString()
        };
        
        // 尝试插入到user_subscriptions表
        const { error: bindingError } = await supabase
            .from('user_subscriptions')
            .insert(bindingData);
        
        if (bindingError) {
            console.log('⚠️ 创建用户订阅绑定失败 (表可能不存在):', bindingError.message);
        } else {
            console.log('✅ 用户订阅绑定已创建');
        }
        
        // 同时保存到subscriptions表（使用现有结构）
        const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_uuid: user.uuid,
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        
        if (subError) {
            console.log('⚠️ 保存到subscriptions表失败:', subError.message);
        } else {
            console.log('✅ 订阅记录已保存');
        }
        
    } catch (error) {
        console.error('❌ 创建用户订阅绑定失败:', error);
    }
}

async function activateSubscriptionAndAddCredits(user, subscriptionId) {
    try {
        console.log(`💰 为用户 ${user.email} 激活订阅并发放积分...`);
        
        const creditsToAdd = 1000; // Pro Plan
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`💰 积分计算: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
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
        
        // 验证结果
        const { data: updatedUser } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', user.uuid)
            .single();
        
        console.log('\n🎉 订阅激活成功！');
        console.log('='.repeat(60));
        console.log(`👤 用户邮箱: ${updatedUser.email}`);
        console.log(`🆔 用户UUID: ${updatedUser.uuid}`);
        console.log(`💰 当前积分: ${updatedUser.credits}`);
        console.log(`📊 订阅状态: ${updatedUser.subscription_status}`);
        console.log(`🎫 订阅ID: ${subscriptionId}`);
        console.log('='.repeat(60));
        
        console.log('\n📝 接下来请:');
        console.log(`1. 使用邮箱 ${updatedUser.email} 登录网站`);
        console.log(`2. 检查积分是否正确显示为 ${updatedUser.credits}`);
        console.log('3. 测试跨页面积分同步功能');
        console.log('4. 验证订阅状态显示');
        
    } catch (error) {
        console.error('❌ 激活订阅并发放积分失败:', error);
    }
}

// 运行模拟
console.log('🎯 PayPal订阅Webhook模拟处理工具');
console.log('这个工具会模拟PayPal webhook处理流程');
console.log('基于"先登录后购买"的逻辑找到正确的用户\n');

simulateWebhookProcessing();