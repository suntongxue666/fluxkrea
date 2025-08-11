/**
 * 检查特定用户的积分交易记录
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserTransactions() {
    const targetEmail = 'sunwei7482@gmail.com';
    console.log(`🔍 检查用户交易记录: ${targetEmail}\n`);
    
    try {
        // 1. 先获取用户信息
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
        
        console.log(`📊 找到 ${users.length} 个用户记录:`);
        
        // 2. 检查每个用户的交易记录
        for (const user of users) {
            console.log(`\n👤 用户: ${user.email} (UUID: ${user.uuid})`);
            console.log(`ID: ${user.id}, 积分: ${user.credits}, 状态: ${user.subscription_status || 'FREE'}`);
            
            // 查询该用户的交易记录
            const { data: transactions, error: transError } = await supabase
                .from('credit_transactions')
                .select('*')
                .eq('user_uuid', user.uuid)
                .order('created_at', { ascending: false });
            
            if (transError) {
                console.error(`❌ 查询交易记录失败: ${transError.message}`);
                continue;
            }
            
            if (!transactions || transactions.length === 0) {
                console.log('⚠️ 没有找到交易记录');
                continue;
            }
            
            console.log(`💰 找到 ${transactions.length} 条交易记录:`);
            
            transactions.forEach((trans, index) => {
                console.log(`\n🧾 交易 #${index + 1}:`);
                console.log(`类型: ${trans.transaction_type}`);
                console.log(`金额: ${trans.amount}`);
                console.log(`来源: ${trans.source}`);
                console.log(`描述: ${trans.description || '无描述'}`);
                console.log(`交易后余额: ${trans.balance_after}`);
                console.log(`时间: ${new Date(trans.created_at).toLocaleString()}`);
            });
        }
        
        // 3. 检查表结构
        console.log('\n📋 检查credit_transactions表结构:');
        
        const { data: tableInfo, error: tableError } = await supabase
            .rpc('get_table_columns', { table_name: 'credit_transactions' })
            .catch(() => ({ data: null, error: { message: 'RPC函数不存在' } }));
        
        if (tableError) {
            console.log('⚠️ 无法获取表结构:', tableError.message);
            
            // 尝试直接查询一条记录来推断结构
            const { data: sampleRecord, error: sampleError } = await supabase
                .from('credit_transactions')
                .select('*')
                .limit(1);
            
            if (!sampleError && sampleRecord && sampleRecord.length > 0) {
                console.log('表结构(从样本记录推断):');
                console.log(Object.keys(sampleRecord[0]).join(', '));
            }
        } else if (tableInfo) {
            console.log('表结构:');
            console.log(tableInfo);
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

// 执行检查
checkUserTransactions().catch(error => {
    console.error('❌ 执行出错:', error);
});