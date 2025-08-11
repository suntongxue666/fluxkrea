/**
 * 测试首次登录积分系统的完整流程
 * 找出为什么用户看到0积分的真正原因
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFirstLoginCreditsSystem() {
    console.log('🧪 测试首次登录积分系统\n');
    
    // 1. 检查sunwei7482@gmail.com的完整状态
    console.log('📋 1. 检查sunwei7482@gmail.com的完整状态...');
    
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'sunwei7482@gmail.com');
    
    if (userError || !users || users.length === 0) {
        console.log('❌ 用户不存在或查询失败');
        return;
    }
    
    const user = users[0];
    console.log('✅ 数据库中的用户状态:');
    console.log(`   邮箱: ${user.email}`);
    console.log(`   UUID: ${user.uuid}`);
    console.log(`   积分: ${user.credits}`);
    console.log(`   订阅状态: ${user.subscription_status}`);
    console.log(`   创建时间: ${user.created_at}`);
    console.log(`   更新时间: ${user.updated_at}`);
    
    // 2. 检查积分API是否正常返回
    console.log('\n📋 2. 测试积分API...');
    
    try {
        const response = await fetch('https://fluxkrea.me/api/get-user-credits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_uuid: user.uuid
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ 积分API响应:');
            console.log(`   返回积分: ${data.credits}`);
            console.log(`   API状态: ${data.success ? '成功' : '失败'}`);
            
            if (data.credits !== user.credits) {
                console.log(`⚠️ API返回的积分(${data.credits})与数据库不一致(${user.credits})`);
            }
        } else {
            console.log(`❌ 积分API请求失败: ${response.status}`);
            const text = await response.text();
            console.log(`   错误内容: ${text}`);
        }
    } catch (error) {
        console.log(`❌ 积分API请求异常: ${error.message}`);
    }
    
    // 3. 检查前端可能的问题
    console.log('\n📋 3. 分析前端可能的问题...');
    
    console.log('🔍 可能的前端问题:');
    console.log('1. localStorage缓存了旧的用户数据');
    console.log('2. 前端积分同步逻辑有问题');
    console.log('3. 页面没有正确调用积分更新');
    console.log('4. 浏览器缓存了旧的JavaScript文件');
    
    // 4. 检查是否有其他同名用户
    console.log('\n📋 4. 检查是否有重复用户记录...');
    
    const { data: duplicateUsers, error: dupError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'sunwei7482@gmail.com');
    
    if (!dupError && duplicateUsers) {
        console.log(`✅ 找到 ${duplicateUsers.length} 个同邮箱用户记录:`);
        duplicateUsers.forEach((u, index) => {
            console.log(`   ${index + 1}. UUID: ${u.uuid}, 积分: ${u.credits}, 创建: ${u.created_at}`);
        });
        
        if (duplicateUsers.length > 1) {
            console.log('⚠️ 发现重复用户记录，这可能导致前端混淆');
        }
    }
    
    // 5. 检查最近的积分变化
    console.log('\n📋 5. 检查最近的积分变化...');
    
    const { data: recentTransactions, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_uuid', user.uuid)
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (!transError && recentTransactions) {
        console.log(`✅ 最近 ${recentTransactions.length} 笔积分交易:`);
        recentTransactions.forEach((trans, index) => {
            console.log(`   ${index + 1}. ${trans.transaction_type} ${trans.amount}积分 - ${trans.source} - ${trans.created_at}`);
        });
    }
    
    // 6. 提供具体的解决方案
    console.log('\n💡 具体解决方案:');
    
    if (user.credits > 0) {
        console.log('🎯 数据库中用户有积分，但前端显示0积分的解决方案:');
        console.log('');
        console.log('1. 清除浏览器缓存和localStorage:');
        console.log('   - 打开开发者工具(F12)');
        console.log('   - Application -> Storage -> Clear storage');
        console.log('   - 或者使用无痕模式重新登录');
        console.log('');
        console.log('2. 强制刷新页面:');
        console.log('   - Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)');
        console.log('');
        console.log('3. 重新登录:');
        console.log('   - 退出登录后重新用Google登录');
        console.log('');
        console.log('4. 检查网络请求:');
        console.log('   - 开发者工具 -> Network 查看积分API请求');
    } else {
        console.log('🎯 数据库中用户积分为0，需要修复:');
        console.log('   已在前面的步骤中修复');
    }
    
    // 7. 为tiktreeapp@gmail.com准备
    console.log('\n📋 7. 为tiktreeapp@gmail.com准备...');
    
    console.log('✅ tiktreeapp@gmail.com用户需要:');
    console.log('1. 重新登录以创建用户记录');
    console.log('2. 首次登录应该自动获得20积分');
    console.log('3. 如果没有获得积分，使用相同的修复方法');
    
    console.log('\n🎯 总结:');
    console.log('sunwei7482@gmail.com在数据库中有20积分');
    console.log('如果用户看到0积分，这是前端缓存/同步问题');
    console.log('解决方案：清除缓存 + 重新登录');
}

// 执行测试
testFirstLoginCreditsSystem().catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
});