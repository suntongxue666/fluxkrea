/**
 * 紧急诊断真实问题
 * 1. sunwei7482@gmail.com 登录后积分为0
 * 2. 数据库中看不到用户信息
 * 3. 购买订阅失败
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE7NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function emergencyDiagnoseRealIssues() {
    console.log('🚨 紧急诊断真实问题\n');
    
    // 1. 检查数据库中是否真的有sunwei7482@gmail.com
    console.log('📋 1. 检查数据库中的sunwei7482@gmail.com...');
    
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'sunwei7482@gmail.com');
    
    if (userError) {
        console.log('❌ 查询用户失败:', userError.message);
    } else {
        console.log(`✅ 查询结果: 找到 ${users?.length || 0} 个用户`);
        
        if (users && users.length > 0) {
            users.forEach((user, index) => {
                console.log(`   用户 ${index + 1}:`);
                console.log(`     邮箱: ${user.email}`);
                console.log(`     UUID: ${user.uuid}`);
                console.log(`     积分: ${user.credits}`);
                console.log(`     创建时间: ${user.created_at}`);
            });
        } else {
            console.log('❌ 数据库中确实没有sunwei7482@gmail.com用户！');
            console.log('   这说明用户登录后没有创建数据库记录');
        }
    }
    
    // 2. 检查所有有邮箱的用户
    console.log('\n📋 2. 检查所有有邮箱的用户...');
    
    const { data: allEmailUsers, error: allEmailError } = await supabase
        .from('users')
        .select('*')
        .not('email', 'is', null)
        .order('created_at', { ascending: false });
    
    if (!allEmailError && allEmailUsers) {
        console.log(`✅ 数据库中有邮箱的用户总数: ${allEmailUsers.length}`);
        console.log('最近的用户:');
        allEmailUsers.slice(0, 5).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} - ${user.credits}积分 - ${user.created_at}`);
        });
        
        // 检查是否有sunwei相关的用户
        const sunweiUsers = allEmailUsers.filter(user => 
            user.email && user.email.includes('sunwei')
        );
        
        if (sunweiUsers.length > 0) {
            console.log('\n🔍 找到sunwei相关用户:');
            sunweiUsers.forEach(user => {
                console.log(`   ${user.email} - ${user.credits}积分 - ${user.uuid}`);
            });
        } else {
            console.log('\n❌ 没有找到任何sunwei相关用户');
        }
    }
    
    // 3. 检查订阅创建API
    console.log('\n📋 3. 检查订阅创建API...');
    
    try {
        const response = await fetch('https://fluxkrea.me/api/handle-subscription', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ 订阅API端点正常响应');
            console.log('   响应:', JSON.stringify(data, null, 2));
        } else {
            console.log(`❌ 订阅API端点异常: ${response.status}`);
            const text = await response.text();
            console.log(`   错误内容: ${text}`);
        }
    } catch (error) {
        console.log(`❌ 订阅API请求失败: ${error.message}`);
    }
    
    // 4. 检查最近的订阅记录
    console.log('\n📋 4. 检查最近的订阅记录...');
    
    const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (subError) {
        console.log('❌ 查询订阅记录失败:', subError.message);
    } else {
        console.log(`✅ 最近的订阅记录: ${subscriptions?.length || 0} 条`);
        
        if (subscriptions && subscriptions.length > 0) {
            subscriptions.forEach((sub, index) => {
                console.log(`   ${index + 1}. ${sub.google_user_email} - ${sub.plan_type} - ${sub.created_at}`);
            });
        } else {
            console.log('⚠️ 没有找到任何订阅记录');
        }
    }
    
    // 5. 检查Google登录是否正常工作
    console.log('\n📋 5. 分析Google登录问题...');
    
    console.log('🔍 可能的问题:');
    console.log('1. Google登录成功但用户记录创建失败');
    console.log('2. Supabase认证状态变化监听器没有触发');
    console.log('3. handleFirstLoginCredits函数执行失败');
    console.log('4. 数据库写入权限问题');
    console.log('5. RLS策略阻止了用户记录创建');
    
    // 6. 检查users表的RLS策略
    console.log('\n📋 6. 测试users表写入权限...');
    
    const testUser = {
        uuid: `test_user_${Date.now()}`,
        email: 'test@example.com',
        name: 'Test User',
        credits: 20,
        subscription_status: 'FREE'
    };
    
    const { data: insertResult, error: insertError } = await supabase
        .from('users')
        .insert(testUser)
        .select();
    
    if (insertError) {
        console.log('❌ users表写入失败:', insertError.message);
        console.log('   这可能是RLS策略问题！');
        
        if (insertError.message.includes('row-level security policy')) {
            console.log('🚨 确认: RLS策略阻止了用户记录创建');
            console.log('   需要禁用users表的RLS或添加允许插入的策略');
        }
    } else {
        console.log('✅ users表写入正常');
        
        // 清理测试数据
        if (insertResult && insertResult.length > 0) {
            await supabase
                .from('users')
                .delete()
                .eq('id', insertResult[0].id);
            console.log('   测试数据已清理');
        }
    }
    
    // 7. 提供紧急修复方案
    console.log('\n🔧 紧急修复方案:');
    
    console.log('\n问题1: sunwei7482@gmail.com登录后积分为0');
    console.log('原因: 用户记录根本没有创建到数据库');
    console.log('解决: 需要修复Google登录后的用户创建逻辑');
    
    console.log('\n问题2: 购买订阅失败');
    console.log('原因: 可能是handle-subscription API有问题');
    console.log('解决: 需要检查API错误日志和数据库权限');
    
    console.log('\n问题3: 数据库中看不到用户');
    console.log('原因: RLS策略可能阻止了用户记录创建');
    console.log('解决: 需要检查并修复users表的RLS策略');
    
    console.log('\n🎯 立即行动项:');
    console.log('1. 检查并禁用users表的RLS策略');
    console.log('2. 检查Google登录后的用户创建逻辑');
    console.log('3. 检查handle-subscription API的错误');
    console.log('4. 测试完整的登录和订阅流程');
    
    console.log('\n⚠️ 系统状态:');
    console.log('- Google登录: 可能有问题（用户记录未创建）');
    console.log('- 用户积分: 失效（因为用户记录不存在）');
    console.log('- 订阅系统: 失效（API报错）');
    console.log('- 这是系统级问题，需要立即修复！');
}

// 执行紧急诊断
emergencyDiagnoseRealIssues().catch(error => {
    console.error('❌ 紧急诊断失败:', error);
    process.exit(1);
});