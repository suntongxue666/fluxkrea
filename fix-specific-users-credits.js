/**
 * 修复特定用户的积分问题
 * sunwei7482@gmail.com 和 tiktreeapp@gmail.com 登录后积分为0的问题
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSpecificUsersCredits() {
    console.log('🔧 修复特定用户积分问题\n');
    
    const problemUsers = ['sunwei7482@gmail.com', 'tiktreeapp@gmail.com'];
    
    for (const email of problemUsers) {
        console.log(`\n📋 处理用户: ${email}`);
        
        // 1. 查找用户
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);
        
        if (userError) {
            console.log(`❌ 查询用户失败: ${userError.message}`);
            continue;
        }
        
        if (!users || users.length === 0) {
            console.log(`⚠️ 用户不存在: ${email}`);
            console.log('   用户可能还没有重新登录创建记录');
            continue;
        }
        
        const user = users[0];
        console.log(`✅ 找到用户: ${email}`);
        console.log(`   当前积分: ${user.credits}`);
        console.log(`   UUID: ${user.uuid}`);
        console.log(`   创建时间: ${user.created_at}`);
        
        // 2. 检查是否需要添加积分
        if (user.credits === 0) {
            console.log(`🔧 为用户 ${email} 添加20积分...`);
            
            // 更新积分
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    credits: 20,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            
            if (updateError) {
                console.log(`❌ 更新积分失败: ${updateError.message}`);
                continue;
            }
            
            // 记录积分交易
            const { error: transError } = await supabase
                .from('credit_transactions')
                .insert({
                    user_uuid: user.uuid,
                    transaction_type: 'EARN',
                    amount: 20,
                    balance_after: 20,
                    description: '新用户首次登录积分补发',
                    source: 'first_login_fix'
                });
            
            if (transError) {
                console.log(`⚠️ 积分交易记录失败: ${transError.message}`);
            } else {
                console.log(`✅ 积分交易已记录`);
            }
            
            console.log(`✅ 成功为 ${email} 添加20积分！`);
        } else {
            console.log(`✅ 用户 ${email} 已有 ${user.credits} 积分，无需修复`);
        }
    }
    
    // 3. 验证修复结果
    console.log('\n📋 验证修复结果...');
    
    for (const email of problemUsers) {
        const { data: users } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);
        
        if (users && users.length > 0) {
            const user = users[0];
            console.log(`✅ ${email}: ${user.credits} 积分`);
        } else {
            console.log(`⚠️ ${email}: 用户不存在`);
        }
    }
    
    console.log('\n🎯 修复完成！');
    console.log('如果用户仍然看到0积分，请让他们刷新页面或重新登录。');
}

// 执行修复
fixSpecificUsersCredits().catch(error => {
    console.error('❌ 修复失败:', error);
    process.exit(1);
});