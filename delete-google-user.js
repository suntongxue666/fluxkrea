/**
 * 彻底删除指定Google用户的所有记录
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteGoogleUser() {
    const targetEmail = 'sunwei7482@gmail.com';
    console.log(`🗑️ 删除Google用户: ${targetEmail}\n`);
    
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
        
        const userUuids = users.map(user => user.uuid);
        const userIds = users.map(user => user.id);
        
        console.log('用户UUID列表:', userUuids);
        console.log('用户ID列表:', userIds);
        
        // 2. 删除交易记录
        console.log('\n🗑️ 删除交易记录...');
        
        for (const uuid of userUuids) {
            const { data: deleteTransResult, error: deleteTransError } = await supabase
                .from('credit_transactions')
                .delete()
                .eq('user_uuid', uuid);
            
            if (deleteTransError) {
                console.error(`❌ 删除用户 ${uuid} 的交易记录失败:`, deleteTransError.message);
            } else {
                console.log(`✅ 成功删除用户 ${uuid} 的交易记录`);
            }
        }
        
        // 3. 删除用户记录
        console.log('\n🗑️ 删除用户记录...');
        
        const { data: deleteUserResult, error: deleteUserError } = await supabase
            .from('users')
            .delete()
            .eq('email', targetEmail);
        
        if (deleteUserError) {
            console.error('❌ 删除用户记录失败:', deleteUserError.message);
        } else {
            console.log(`✅ 成功删除 ${targetEmail} 的用户记录`);
        }
        
        // 4. 尝试删除auth.users表中的记录(可能需要特殊权限)
        console.log('\n🗑️ 尝试删除auth.users表中的记录...');
        console.log('⚠️ 注意: 这可能需要特殊权限，如果失败请使用Supabase管理界面操作');
        
        try {
            const { data: deleteAuthResult, error: deleteAuthError } = await supabase.rpc('delete_auth_user', { 
                email_param: targetEmail 
            });
            
            if (deleteAuthError) {
                console.log('❌ 删除auth.users记录失败:', deleteAuthError.message);
                console.log('请使用Supabase管理界面手动删除auth.users表中的记录');
            } else {
                console.log('✅ 成功删除auth.users表中的记录');
            }
        } catch (e) {
            console.log('❌ 无法访问auth.users表:', e.message);
            console.log('请使用Supabase管理界面手动删除auth.users表中的记录');
        }
        
        // 5. 验证删除结果
        console.log('\n🔍 验证删除结果...');
        
        const { data: checkUsers, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('email', targetEmail);
        
        if (checkError) {
            console.error('❌ 验证失败:', checkError.message);
        } else {
            const remainingCount = checkUsers?.length || 0;
            if (remainingCount === 0) {
                console.log('✅ 验证成功: 所有用户记录已删除');
            } else {
                console.log(`⚠️ 验证失败: 仍有 ${remainingCount} 条用户记录未删除`);
                console.log(checkUsers);
            }
        }
        
    } catch (error) {
        console.error('❌ 删除失败:', error.message);
    }
}

// 执行删除
deleteGoogleUser().catch(error => {
    console.error('❌ 执行出错:', error);
});