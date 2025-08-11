/**
 * 检查并修复首次登录积分系统
 * 专门针对sunwei7482@gmail.com和tiktreeapp@gmail.com的问题
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixFirstLoginCredits() {
    console.log('🔍 检查并修复首次登录积分系统\n');
    
    const problemUsers = ['sunwei7482@gmail.com', 'tiktreeapp@gmail.com'];
    
    for (const email of problemUsers) {
        console.log(`\n📋 详细检查用户: ${email}`);
        
        // 1. 查找用户记录
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
            console.log('   用户需要重新登录以创建记录');
            continue;
        }
        
        const user = users[0];
        console.log(`✅ 用户信息:`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   UUID: ${user.uuid}`);
        console.log(`   当前积分: ${user.credits}`);
        console.log(`   创建时间: ${user.created_at}`);
        console.log(`   更新时间: ${user.updated_at}`);
        
        // 2. 检查首次登录积分交易记录
        const { data: firstLoginTransactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', user.uuid)
            .eq('source', 'first_login');
        
        if (transError) {
            console.log(`❌ 查询积分交易失败: ${transError.message}`);
        } else {
            console.log(`📊 首次登录积分交易记录: ${firstLoginTransactions?.length || 0} 条`);
            
            if (firstLoginTransactions && firstLoginTransactions.length > 0) {
                firstLoginTransactions.forEach((trans, index) => {
                    console.log(`   ${index + 1}. ${trans.transaction_type} ${trans.amount}积分 - ${trans.created_at}`);
                });
            }
        }
        
        // 3. 检查所有积分交易记录
        const { data: allTransactions, error: allTransError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', user.uuid)
            .order('created_at', { ascending: false });
        
        if (!allTransError && allTransactions) {
            console.log(`📊 所有积分交易记录: ${allTransactions.length} 条`);
            allTransactions.forEach((trans, index) => {
                console.log(`   ${index + 1}. ${trans.transaction_type} ${trans.amount}积分 - ${trans.source} - ${trans.created_at}`);
            });
        }
        
        // 4. 分析问题并修复
        if (user.credits === 0) {
            console.log(`🚨 问题确认: 用户 ${email} 积分为0`);
            
            if (!firstLoginTransactions || firstLoginTransactions.length === 0) {
                console.log(`🔧 修复: 为用户添加首次登录积分...`);
                
                // 添加20积分
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
                
                // 记录交易
                const { error: transInsertError } = await supabase
                    .from('credit_transactions')
                    .insert({
                        user_uuid: user.uuid,
                        transaction_type: 'EARN',
                        amount: 20,
                        balance_after: 20,
                        description: '首次Google登录奖励积分（手动修复）',
                        source: 'first_login_manual_fix'
                    });
                
                if (transInsertError) {
                    console.log(`⚠️ 积分交易记录失败: ${transInsertError.message}`);
                } else {
                    console.log(`✅ 积分交易已记录`);
                }
                
                console.log(`✅ 修复完成: ${email} 现在有20积分`);
            } else {
                console.log(`⚠️ 用户已有首次登录记录但积分为0，可能是其他问题`);
            }
        } else {
            console.log(`✅ 用户积分正常: ${user.credits}`);
        }
    }
    
    // 5. 检查首次登录积分系统是否正常工作
    console.log('\n📋 检查首次登录积分系统...');
    
    // 查找最近创建的用户
    const { data: recentUsers, error: recentError } = await supabase
        .from('users')
        .select('*')
        .not('email', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (!recentError && recentUsers) {
        console.log(`✅ 最近5个有邮箱的用户:`);
        
        for (const user of recentUsers) {
            const { data: firstLoginTrans } = await supabase
                .from('credit_transactions')
                .select('*')
                .eq('user_uuid', user.uuid)
                .eq('source', 'first_login');
            
            const hasFirstLogin = firstLoginTrans && firstLoginTrans.length > 0;
            console.log(`   ${user.email}: ${user.credits}积分 ${hasFirstLogin ? '✅' : '❌'} 首次登录记录`);
        }
    }
    
    // 6. 提供解决方案
    console.log('\n💡 问题分析和解决方案:');
    
    console.log('🎯 可能的问题原因:');
    console.log('1. 首次登录积分逻辑没有被触发');
    console.log('2. 用户登录时handleFirstLoginCredits函数执行失败');
    console.log('3. 数据库写入权限问题');
    console.log('4. 前端缓存问题导致显示不正确');
    
    console.log('\n🔧 立即解决方案:');
    console.log('1. 已为积分为0的用户手动添加20积分');
    console.log('2. 用户需要刷新页面或重新登录查看更新');
    console.log('3. 如果问题持续，需要检查前端积分同步逻辑');
    
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
            console.log(`⚠️ ${email}: 用户不存在（需要重新登录）`);
        }
    }
    
    console.log('\n🎯 修复完成！');
    console.log('请让用户清除浏览器缓存并重新登录，应该能看到正确的积分。');
}

// 执行检查和修复
checkAndFixFirstLoginCredits().catch(error => {
    console.error('❌ 检查修复失败:', error);
    process.exit(1);
});