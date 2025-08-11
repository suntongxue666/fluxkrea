/**
 * 检查Google登录后的用户状态
 * 分析用户数据和可能的问题
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGoogleLoginUsers() {
    console.log('👤 检查Google登录后的用户状态\n');
    
    // 1. 查看所有用户
    console.log('📋 1. 查看用户概况...');
    
    const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (allUsersError) {
        console.log('❌ 查询用户失败:', allUsersError.message);
        return;
    }
    
    console.log(`✅ 总用户数: ${allUsers?.length || 0}`);
    
    // 分析用户数据
    const usersWithEmail = allUsers?.filter(user => user.email) || [];
    const usersWithoutEmail = allUsers?.filter(user => !user.email) || [];
    const usersWithCredits = allUsers?.filter(user => user.credits > 0) || [];
    const usersWithZeroCredits = allUsers?.filter(user => user.credits === 0) || [];
    
    console.log(`   有邮箱的用户: ${usersWithEmail.length}`);
    console.log(`   无邮箱的用户: ${usersWithoutEmail.length}`);
    console.log(`   有积分的用户: ${usersWithCredits.length}`);
    console.log(`   零积分的用户: ${usersWithZeroCredits.length}`);
    
    // 2. 检查最近的Google登录用户
    console.log('\n📋 2. 最近的Google登录用户...');
    
    const recentUsers = allUsers?.slice(0, 10) || [];
    
    if (recentUsers.length > 0) {
        console.log('最近10个用户:');
        recentUsers.forEach((user, index) => {
            const email = user.email || 'N/A';
            const credits = user.credits || 0;
            const status = user.subscription_status || 'FREE';
            const createdAt = new Date(user.created_at).toLocaleString();
            
            console.log(`  ${index + 1}. ${email}`);
            console.log(`     积分: ${credits}, 状态: ${status}`);
            console.log(`     创建时间: ${createdAt}`);
            console.log(`     UUID: ${user.uuid}`);
            console.log('');
        });
    } else {
        console.log('⚠️ 没有找到用户');
    }
    
    // 3. 检查新用户积分分配
    console.log('📋 3. 检查新用户积分分配...');
    
    // 查找最近24小时内创建的用户
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentNewUsers = allUsers?.filter(user => user.created_at > yesterday) || [];
    
    console.log(`最近24小时内新用户: ${recentNewUsers.length}`);
    
    if (recentNewUsers.length > 0) {
        console.log('新用户积分情况:');
        recentNewUsers.forEach((user, index) => {
            const email = user.email || 'N/A';
            const credits = user.credits || 0;
            const expectedCredits = 20; // 新用户应该有20积分
            
            console.log(`  ${index + 1}. ${email} - ${credits}积分 ${credits === expectedCredits ? '✅' : '❌'}`);
            
            if (credits !== expectedCredits) {
                console.log(`     ⚠️ 应该有${expectedCredits}积分，实际${credits}积分`);
            }
        });
    }
    
    // 4. 检查积分交易记录
    console.log('\n📋 4. 检查积分交易记录...');
    
    const { data: transactions, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (transError) {
        console.log('❌ 查询交易记录失败:', transError.message);
    } else {
        console.log(`✅ 最近10笔交易记录:`);
        
        if (transactions && transactions.length > 0) {
            transactions.forEach((trans, index) => {
                const type = trans.transaction_type;
                const amount = trans.amount;
                const source = trans.source;
                const description = trans.description;
                const createdAt = new Date(trans.created_at).toLocaleString();
                
                console.log(`  ${index + 1}. ${type} ${amount}积分 - ${source}`);
                console.log(`     描述: ${description}`);
                console.log(`     时间: ${createdAt}`);
                console.log('');
            });
        } else {
            console.log('⚠️ 没有找到交易记录');
        }
    }
    
    // 5. 检查用户登录流程
    console.log('📋 5. 分析用户登录流程问题...');
    
    // 检查是否有用户没有获得初始积分
    const usersNeedingCredits = allUsers?.filter(user => 
        user.email && // 有邮箱（已登录）
        user.credits === 0 && // 但积分为0
        user.subscription_status === 'FREE' // 且是免费用户
    ) || [];
    
    if (usersNeedingCredits.length > 0) {
        console.log(`⚠️ 发现 ${usersNeedingCredits.length} 个用户可能需要初始积分:`);
        usersNeedingCredits.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} - UUID: ${user.uuid}`);
        });
        
        console.log('\n💡 修复这些用户的命令:');
        usersNeedingCredits.forEach(user => {
            console.log(`await addInitialCredits("${user.uuid}", 20, "新用户初始积分");`);
        });
    } else {
        console.log('✅ 所有已登录用户都有适当的积分');
    }
    
    // 6. 检查订阅用户
    console.log('\n📋 6. 检查订阅用户...');
    
    const subscribedUsers = allUsers?.filter(user => 
        user.subscription_status === 'ACTIVE'
    ) || [];
    
    console.log(`✅ 活跃订阅用户: ${subscribedUsers.length}`);
    
    if (subscribedUsers.length > 0) {
        subscribedUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email || 'N/A'} - ${user.credits}积分`);
        });
    }
    
    // 7. 生成用户状态报告
    console.log('\n📊 用户状态报告:');
    console.log('');
    console.log(`总用户数: ${allUsers?.length || 0}`);
    console.log(`有邮箱用户: ${usersWithEmail.length} (${Math.round(usersWithEmail.length / (allUsers?.length || 1) * 100)}%)`);
    console.log(`有积分用户: ${usersWithCredits.length} (${Math.round(usersWithCredits.length / (allUsers?.length || 1) * 100)}%)`);
    console.log(`订阅用户: ${subscribedUsers.length} (${Math.round(subscribedUsers.length / (allUsers?.length || 1) * 100)}%)`);
    console.log(`需要修复的用户: ${usersNeedingCredits.length}`);
    
    // 8. 提供修复建议
    console.log('\n💡 建议和下一步行动:');
    
    if (usersNeedingCredits.length > 0) {
        console.log('🔧 需要修复的问题:');
        console.log('- 有用户登录后没有获得初始20积分');
        console.log('- 建议为这些用户手动添加积分');
        console.log('');
        console.log('🚀 修复命令:');
        console.log('node check-google-login-users.js');
        console.log('然后在控制台执行修复函数');
    }
    
    if (recentNewUsers.length === 0) {
        console.log('📈 用户增长:');
        console.log('- 最近24小时内没有新用户注册');
        console.log('- 可能需要检查Google登录功能是否正常');
    }
    
    console.log('\n✅ 检查完成！');
    
    // 导出修复函数
    global.addInitialCredits = addInitialCredits;
    global.fixAllNewUsers = fixAllNewUsers;
    
    console.log('\n🛠️ 可用的修复函数:');
    console.log('- addInitialCredits(userUuid, credits, description)');
    console.log('- fixAllNewUsers() - 为所有需要的用户添加初始积分');
}

// 为用户添加初始积分
async function addInitialCredits(userUuid, credits, description = '新用户初始积分') {
    try {
        console.log(`🔧 为用户 ${userUuid} 添加 ${credits} 积分...`);
        
        // 查找用户
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userUuid);
        
        if (userError || !users || users.length === 0) {
            console.log('❌ 找不到用户:', userUuid);
            return false;
        }
        
        const user = users[0];
        const newCredits = (user.credits || 0) + credits;
        
        // 更新积分
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateError) {
            console.log('❌ 更新积分失败:', updateError.message);
            return false;
        }
        
        // 记录交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: userUuid,
                transaction_type: 'EARN',
                amount: credits,
                balance_after: newCredits,
                description: description,
                source: 'initial_credits'
            });
        
        if (transError) {
            console.log('⚠️ 交易记录失败:', transError.message);
        }
        
        console.log(`✅ 成功为 ${user.email || userUuid} 添加 ${credits} 积分`);
        return true;
        
    } catch (error) {
        console.log('❌ 添加积分失败:', error.message);
        return false;
    }
}

// 修复所有需要初始积分的用户
async function fixAllNewUsers() {
    console.log('🔧 批量修复所有需要初始积分的用户...');
    
    const { data: allUsers } = await supabase
        .from('users')
        .select('*');
    
    const usersNeedingCredits = allUsers?.filter(user => 
        user.email && 
        user.credits === 0 && 
        user.subscription_status === 'FREE'
    ) || [];
    
    console.log(`找到 ${usersNeedingCredits.length} 个需要修复的用户`);
    
    let successCount = 0;
    for (const user of usersNeedingCredits) {
        const success = await addInitialCredits(user.uuid, 20, '新用户初始积分补发');
        if (success) successCount++;
    }
    
    console.log(`✅ 批量修复完成: ${successCount}/${usersNeedingCredits.length} 成功`);
    return successCount;
}

// 执行检查
checkGoogleLoginUsers().catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
});