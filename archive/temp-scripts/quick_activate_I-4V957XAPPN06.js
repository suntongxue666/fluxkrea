// 快速激活订阅 I-4V957XAPPN06
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function quickActivate() {
    const subscriptionId = 'I-4V957XAPPN06';
    
    // 请在这里输入购买订阅的用户邮箱
    const USER_EMAIL = ''; // 请填入用户邮箱
    
    if (!USER_EMAIL) {
        console.log('❌ 请在脚本中填入用户邮箱');
        console.log('请编辑 quick_activate_I-4V957XAPPN06.js 文件');
        console.log('在第10行 const USER_EMAIL = \'\'; 中填入邮箱');
        return;
    }
    
    try {
        console.log(`🚀 激活订阅: ${subscriptionId}`);
        console.log(`👤 用户邮箱: ${USER_EMAIL}`);
        console.log(`💰 积分奖励: 1000 (Pro Plan)\n`);
        
        // 查找或创建用户
        let targetUser = null;
        
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', USER_EMAIL)
            .single();
        
        if (findError && findError.code === 'PGRST116') {
            // 创建新用户
            console.log('👤 创建新用户...');
            
            const newUserUuid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    uuid: newUserUuid,
                    email: USER_EMAIL,
                    name: USER_EMAIL.split('@')[0],
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
        
        console.log('\n📋 用户信息:');
        console.log('邮箱:', targetUser.email);
        console.log('UUID:', targetUser.uuid);
        console.log('当前积分:', targetUser.credits);
        console.log('订阅状态:', targetUser.subscription_status);
        
        // 激活订阅
        const creditsToAdd = 1000;
        const currentCredits = targetUser.credits || 0;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`\n💰 积分更新: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 更新用户
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('uuid', targetUser.uuid);
        
        if (updateError) {
            console.error('❌ 更新用户失败:', updateError);
            return;
        }
        
        console.log('✅ 用户积分已更新');
        
        // 记录交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: targetUser.uuid,
                transaction_type: 'SUBSCRIPTION_PURCHASE',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `Pro Plan订阅激活 - 获得${creditsToAdd}积分 (${subscriptionId})`,
                source: 'paypal_subscription'
            });
        
        if (transError) {
            console.log('⚠️ 记录交易失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        // 验证结果
        const { data: updatedUser } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', targetUser.uuid)
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
        console.log('4. 测试跨页面积分同步功能');
        
    } catch (error) {
        console.error('❌ 激活失败:', error);
    }
}

quickActivate();