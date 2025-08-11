/**
 * 全面检查所有相关表中的用户数据
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
    const targetEmail = 'sunwei7482@gmail.com';
    console.log(`🔍 全面检查用户数据: ${targetEmail}\n`);
    
    try {
        // 1. 检查public.users表
        console.log('📊 检查public.users表:');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('email', targetEmail);
        
        if (usersError) {
            console.error('❌ 查询users表失败:', usersError.message);
        } else {
            console.log(`找到 ${users?.length || 0} 条记录`);
            if (users && users.length > 0) {
                users.forEach((user, index) => {
                    console.log(`\n用户 #${index + 1}:`);
                    console.log(JSON.stringify(user, null, 2));
                });
            }
        }
        
        // 2. 检查auth.users表 (通过RPC函数)
        console.log('\n📊 尝试检查auth.users表:');
        try {
            // 尝试使用RPC函数
            const { data: authUsers, error: authError } = await supabase.rpc('check_auth_users', { 
                email_param: targetEmail 
            });
            
            if (authError) {
                console.log('❌ RPC函数调用失败:', authError.message);
                console.log('尝试直接查询auth.users表...');
                
                // 尝试直接查询
                const { data: directAuthUsers, error: directAuthError } = await supabase
                    .from('auth.users')
                    .select('*')
                    .eq('email', targetEmail);
                
                if (directAuthError) {
                    console.log('❌ 直接查询auth.users表失败:', directAuthError.message);
                } else {
                    console.log(`找到 ${directAuthUsers?.length || 0} 条记录`);
                    if (directAuthUsers && directAuthUsers.length > 0) {
                        console.log(JSON.stringify(directAuthUsers, null, 2));
                    }
                }
            } else {
                console.log(`找到 ${authUsers?.length || 0} 条记录`);
                if (authUsers && authUsers.length > 0) {
                    console.log(JSON.stringify(authUsers, null, 2));
                }
            }
        } catch (e) {
            console.log('❌ 无法访问auth.users表:', e.message);
        }
        
        // 3. 检查auth.identities表 (如果存在)
        console.log('\n📊 尝试检查auth.identities表:');
        try {
            const { data: identities, error: identitiesError } = await supabase.rpc('check_auth_identities', { 
                email_param: targetEmail 
            });
            
            if (identitiesError) {
                console.log('❌ RPC函数调用失败:', identitiesError.message);
            } else {
                console.log(`找到 ${identities?.length || 0} 条记录`);
                if (identities && identities.length > 0) {
                    console.log(JSON.stringify(identities, null, 2));
                }
            }
        } catch (e) {
            console.log('❌ 无法访问auth.identities表:', e.message);
        }
        
        // 4. 检查credit_transactions表
        console.log('\n📊 检查credit_transactions表:');
        
        // 先获取用户UUID
        const userUuids = users?.map(u => u.uuid) || [];
        
        if (userUuids.length === 0) {
            console.log('没有找到用户UUID，无法查询交易记录');
        } else {
            for (const uuid of userUuids) {
                console.log(`\n查询用户UUID: ${uuid} 的交易记录:`);
                
                const { data: transactions, error: transError } = await supabase
                    .from('credit_transactions')
                    .select('*')
                    .eq('user_uuid', uuid)
                    .order('created_at', { ascending: false });
                
                if (transError) {
                    console.error('❌ 查询交易记录失败:', transError.message);
                } else {
                    console.log(`找到 ${transactions?.length || 0} 条交易记录`);
                    if (transactions && transactions.length > 0) {
                        transactions.forEach((trans, index) => {
                            console.log(`\n交易 #${index + 1}:`);
                            console.log(JSON.stringify(trans, null, 2));
                        });
                    }
                }
            }
        }
        
        // 5. 检查profiles表 (如果存在)
        console.log('\n📊 检查profiles表:');
        try {
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', targetEmail);
            
            if (profilesError) {
                console.log('❌ 查询profiles表失败:', profilesError.message);
            } else {
                console.log(`找到 ${profiles?.length || 0} 条记录`);
                if (profiles && profiles.length > 0) {
                    profiles.forEach((profile, index) => {
                        console.log(`\n档案 #${index + 1}:`);
                        console.log(JSON.stringify(profile, null, 2));
                    });
                }
            }
        } catch (e) {
            console.log('❌ 无法访问profiles表:', e.message);
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

// 执行检查
checkAllTables().catch(error => {
    console.error('❌ 执行出错:', error);
});