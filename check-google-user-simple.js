/**
 * 简单检查Google用户信息
 */
const { createClient } = require('@supabase/supabase-js');

// 使用与check-google-login-users.js相同的配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGoogleUser() {
    const targetEmail = 'sunwei7482@gmail.com';
    console.log(`🔍 检查Google用户: ${targetEmail}\n`);
    
    try {
        // 1. 查询用户表
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('email', targetEmail);
        
        if (usersError) {
            console.error('❌ 查询用户失败:', usersError.message);
        } else {
            console.log(`📊 找到 ${users?.length || 0} 个匹配的用户记录:`);
            
            if (users && users.length > 0) {
                users.forEach((user, index) => {
                    console.log(`\n👤 用户 #${index + 1}:`);
                    console.log(`ID: ${user.id}`);
                    console.log(`UUID: ${user.uuid}`);
                    console.log(`邮箱: ${user.email}`);
                    console.log(`积分: ${user.credits || 0}`);
                    console.log(`订阅状态: ${user.subscription_status || 'FREE'}`);
                    console.log(`创建时间: ${new Date(user.created_at).toLocaleString()}`);
                    console.log(`更新时间: ${new Date(user.updated_at).toLocaleString()}`);
                    
                    if (user.metadata) {
                        console.log('元数据:');
                        console.log(JSON.stringify(user.metadata, null, 2));
                    }
                });
            }
        }
        
        // 2. 查询积分交易记录
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_email', targetEmail)
            .order('created_at', { ascending: false });
        
        console.log('\n💰 积分交易记录:');
        
        if (transError) {
            console.error('❌ 查询交易记录失败:', transError.message);
        } else if (!transactions || transactions.length === 0) {
            console.log('没有找到交易记录');
            
            // 尝试通过UUID查询
            if (users && users.length > 0) {
                const userUuids = users.map(u => u.uuid);
                
                for (const uuid of userUuids) {
                    const { data: uuidTrans, error: uuidTransError } = await supabase
                        .from('credit_transactions')
                        .select('*')
                        .eq('user_uuid', uuid)
                        .order('created_at', { ascending: false });
                    
                    if (!uuidTransError && uuidTrans && uuidTrans.length > 0) {
                        console.log(`通过UUID(${uuid})找到 ${uuidTrans.length} 条交易记录:`);
                        
                        uuidTrans.forEach((trans, index) => {
                            console.log(`\n🧾 交易 #${index + 1}:`);
                            console.log(`类型: ${trans.transaction_type}`);
                            console.log(`金额: ${trans.amount}`);
                            console.log(`来源: ${trans.source}`);
                            console.log(`描述: ${trans.description}`);
                            console.log(`交易后余额: ${trans.balance_after}`);
                            console.log(`时间: ${new Date(trans.created_at).toLocaleString()}`);
                        });
                    }
                }
            }
        } else {
            console.log(`找到 ${transactions.length} 条交易记录:`);
            
            transactions.forEach((trans, index) => {
                console.log(`\n🧾 交易 #${index + 1}:`);
                console.log(`类型: ${trans.transaction_type}`);
                console.log(`金额: ${trans.amount}`);
                console.log(`来源: ${trans.source}`);
                console.log(`描述: ${trans.description}`);
                console.log(`交易后余额: ${trans.balance_after}`);
                console.log(`时间: ${new Date(trans.created_at).toLocaleString()}`);
            });
        }
        
        // 3. 检查auth.users表(如果存在)
        try {
            const { data: authUsers, error: authError } = await supabase.rpc('get_auth_users_by_email', { 
                email_param: targetEmail 
            });
            
            console.log('\n🔐 Auth用户信息:');
            
            if (authError) {
                console.log('❌ 查询auth.users失败或函数不存在:', authError.message);
            } else if (authUsers && authUsers.length > 0) {
                console.log(`找到 ${authUsers.length} 条auth用户记录:`);
                console.log(JSON.stringify(authUsers, null, 2));
            } else {
                console.log('没有找到auth用户记录');
            }
        } catch (e) {
            console.log('❌ 无法查询auth.users表:', e.message);
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

// 执行检查
checkGoogleUser().catch(error => {
    console.error('❌ 执行出错:', error);
});