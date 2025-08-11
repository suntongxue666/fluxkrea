/**
 * 检查用户积分和交易记录
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserCredits() {
    const targetEmail = 'sunwei7482@gmail.com';
    console.log(`🔍 检查用户积分和交易记录: ${targetEmail}\n`);
    
    try {
        // 1. 获取用户信息
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('email', targetEmail);
        
        if (usersError) {
            console.error('❌ 查询用户失败:', usersError.message);
            return;
        }
        
        if (!users || users.length === 0) {
            console.log('⚠️ 没有找到匹配的用户');
            return;
        }
        
        const user = users[0];
        console.log(`👤 用户信息:`);
        console.log(`ID: ${user.id}`);
        console.log(`UUID: ${user.uuid}`);
        console.log(`邮箱: ${user.email}`);
        console.log(`积分: ${user.credits}`);
        console.log(`订阅状态: ${user.subscription_status || 'FREE'}`);
        console.log(`创建时间: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`更新时间: ${new Date(user.updated_at).toLocaleString()}`);
        
        // 2. 获取交易记录
        console.log(`\n💰 查询积分交易记录...`);
        
        // 查询该用户的交易记录
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', user.uuid)
            .order('created_at', { ascending: false });
        
        if (transError) {
            console.error(`❌ 查询交易记录失败: ${transError.message}`);
            
            // 检查表结构
            console.log('\n📋 检查credit_transactions表结构:');
            
            const { data: sampleRecord, error: sampleError } = await supabase
                .from('credit_transactions')
                .select('*')
                .limit(1);
            
            if (!sampleError && sampleRecord && sampleRecord.length > 0) {
                console.log('表结构(从样本记录推断):');
                console.log(Object.keys(sampleRecord[0]).join(', '));
            } else {
                console.log('❌ 无法获取表结构样本');
            }
            
            return;
        }
        
        if (!transactions || transactions.length === 0) {
            console.log('⚠️ 没有找到交易记录');
            return;
        }
        
        console.log(`找到 ${transactions.length} 条交易记录:`);
        
        transactions.forEach((trans, index) => {
            console.log(`\n🧾 交易 #${index + 1}:`);
            console.log(`类型: ${trans.transaction_type}`);
            console.log(`金额: ${trans.amount}`);
            console.log(`来源: ${trans.source}`);
            console.log(`描述: ${trans.description || '无描述'}`);
            console.log(`交易后余额: ${trans.balance_after}`);
            console.log(`时间: ${new Date(trans.created_at).toLocaleString()}`);
        });
        
        // 3. 检查前端显示问题
        console.log('\n🔍 检查可能的前端显示问题:');
        console.log('数据库中的积分值: ' + user.credits);
        console.log('如果前端显示为0，可能存在以下问题:');
        console.log('1. 前端缓存未更新');
        console.log('2. 前端获取用户数据的API调用失败');
        console.log('3. 前端代码中有bug，没有正确显示积分值');
        console.log('4. 权限问题导致前端无法读取积分值');
        
        // 4. 提供解决建议
        console.log('\n💡 解决建议:');
        console.log('1. 清除浏览器缓存并重新登录');
        console.log('2. 检查前端获取用户数据的API调用');
        console.log('3. 检查RLS策略是否允许用户读取自己的积分');
        console.log('4. 检查前端代码中显示积分的逻辑');
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

// 执行检查
checkUserCredits().catch(error => {
    console.error('❌ 执行出错:', error);
});