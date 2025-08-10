// 通过邮箱激活订阅 I-4V957XAPPN06
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function activateSubscriptionByEmail() {
    try {
        const subscriptionId = 'I-4V957XAPPN06';
        console.log(`🚀 激活订阅: ${subscriptionId}`);
        console.log('这是一个Pro Plan订阅，将获得1000积分\n');
        
        // 询问用户邮箱
        const userEmail = await askQuestion('请输入购买订阅的用户邮箱: ');
        
        if (!userEmail || !userEmail.includes('@')) {
            console.error('❌ 请输入有效的邮箱地址');
            rl.close();
            return;
        }
        
        console.log(`\n🔍 查找用户: ${userEmail}`);
        
        // 查找用户
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail)
            .single();
        
        let targetUser = null;
        
        if (findError && findError.code === 'PGRST116') {
            // 用户不存在，询问是否创建
            const createUser = await askQuestion('用户不存在，是否创建新用户？(y/n): ');
            
            if (createUser.toLowerCase() !== 'y') {
                console.log('❌ 取消操作');
                rl.close();
                return;
            }
            
            console.log('👤 创建新用户...');
            
            const newUserUuid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    uuid: newUserUuid,
                    email: userEmail,
                    name: userEmail.split('@')[0],
                    credits: 0,
                    subscription_status: 'FREE',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (createError) {
                console.error('❌ 创建用户失败:', createError);
                rl.close();
                return;
            }
            
            targetUser = newUser;
            console.log('✅ 新用户创建成功');
        } else if (findError) {
            console.error('❌ 查找用户失败:', findError);
            rl.close();
            return;
        } else {
            targetUser = existingUser;
            console.log('✅ 找到现有用户');
        }
        
        console.log('\n👤 用户信息:');
        console.log('邮箱:', targetUser.email);
        console.log('UUID:', targetUser.uuid);
        console.log('当前积分:', targetUser.credits);
        console.log('订阅状态:', targetUser.subscription_status);
        
        // 确认激活
        const confirm = await askQuestion('\n确认为此用户激活Pro Plan订阅(+1000积分)？(y/n): ');
        
        if (confirm.toLowerCase() !== 'y') {
            console.log('❌ 取消操作');
            rl.close();
            return;
        }
        
        // 激活订阅
        await activateSubscription(targetUser, subscriptionId);
        
        rl.close();
        
    } catch (error) {
        console.error('❌ 激活订阅失败:', error);
        rl.close();
    }
}

async function activateSubscription(user, subscriptionId) {
    try {
        console.log(`\n🚀 激活订阅...`);
        
        const creditsToAdd = 1000; // Pro Plan
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
        
        // 创建订阅记录
        const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
                id: subscriptionId,
                user_uuid: user.uuid,
                plan_type: 'pro',
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        
        if (subError) {
            console.log('⚠️ 创建订阅记录失败 (可能表结构不同):', subError.message);
        } else {
            console.log('✅ 订阅记录已创建');
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
            console.log('='.repeat(50));
            console.log(`👤 用户: ${updatedUser.email}`);
            console.log(`💰 当前积分: ${updatedUser.credits}`);
            console.log(`📊 订阅状态: ${updatedUser.subscription_status}`);
            console.log(`🆔 订阅ID: ${subscriptionId}`);
            console.log('='.repeat(50));
            
            console.log('\n📝 接下来请:');
            console.log(`1. 使用邮箱 ${updatedUser.email} 登录网站`);
            console.log(`2. 检查积分是否正确显示为 ${updatedUser.credits}`);
            console.log('3. 测试跨页面积分同步功能');
            console.log('4. 验证订阅状态显示为 ACTIVE');
        }
        
    } catch (error) {
        console.error('❌ 激活订阅失败:', error);
    }
}

// 运行激活流程
console.log('🎯 PayPal订阅激活工具');
console.log('订阅ID: I-4V957XAPPN06 (Pro Plan - 1000积分)\n');

activateSubscriptionByEmail();