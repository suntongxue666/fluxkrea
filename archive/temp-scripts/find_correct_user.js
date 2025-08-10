// 查找正确的用户并激活订阅
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findAndActivateUser() {
    try {
        console.log('🔍 查找所有用户...');
        
        // 获取所有用户
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ 查询用户失败:', error);
            return;
        }
        
        console.log(`📋 找到 ${users.length} 个用户:`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. 邮箱: ${user.email || 'null'}`);
            console.log(`   UUID: ${user.uuid}`);
            console.log(`   积分: ${user.credits || 0}`);
            console.log(`   订阅状态: ${user.subscription_status || 'FREE'}`);
            console.log(`   创建时间: ${user.created_at}`);
            console.log('---');
        });
        
        // 查找有邮箱的用户
        const usersWithEmail = users.filter(user => user.email && user.email !== 'null');
        
        if (usersWithEmail.length > 0) {
            console.log(`\n📧 有邮箱的用户 (${usersWithEmail.length}个):`);
            usersWithEmail.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email} - 积分: ${user.credits || 0}`);
            });
            
            // 选择最近的有邮箱的用户
            const targetUser = usersWithEmail[0];
            console.log(`\n🎯 选择用户: ${targetUser.email}`);
            
            // 激活订阅
            await activateSubscriptionForUser(targetUser);
        } else {
            console.log('\n❌ 没有找到有邮箱的用户');
            console.log('💡 建议: 请先在网站上正确登录，然后再购买订阅');
        }
        
    } catch (error) {
        console.error('❌ 查找用户失败:', error);
    }
}

async function activateSubscriptionForUser(user) {
    try {
        const subscriptionId = 'I-4V957XAPPN06';
        const creditsToAdd = 1000; // Pro Plan
        
        console.log(`\n🚀 为用户 ${user.email} 激活订阅 ${subscriptionId}...`);
        
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
                description: `Pro Plan订阅激活 - 获得${creditsToAdd}积分`,
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
            console.log('\n🎉 激活成功！');
            console.log(`👤 用户: ${updatedUser.email}`);
            console.log(`💰 当前积分: ${updatedUser.credits}`);
            console.log(`📊 订阅状态: ${updatedUser.subscription_status}`);
            console.log(`🆔 订阅ID: ${subscriptionId}`);
            
            console.log('\n📝 接下来请:');
            console.log('1. 用这个邮箱登录网站');
            console.log('2. 检查积分是否正确显示');
            console.log('3. 测试跨页面积分同步');
        }
        
    } catch (error) {
        console.error('❌ 激活订阅失败:', error);
    }
}

// 运行查找和激活
findAndActivateUser();