// 修复重复用户记录
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixDuplicateUsers() {
    console.log('🔧 修复重复用户记录...');
    
    try {
        // 查找重复的邮箱
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('❌ 查询用户失败:', error);
            return;
        }
        
        // 按邮箱分组
        const usersByEmail = {};
        users.forEach(user => {
            if (user.email) {
                if (!usersByEmail[user.email]) {
                    usersByEmail[user.email] = [];
                }
                usersByEmail[user.email].push(user);
            }
        });
        
        // 处理重复用户
        for (const [email, userList] of Object.entries(usersByEmail)) {
            if (userList.length > 1) {
                console.log(`\n🔍 发现重复用户: ${email} (${userList.length} 条记录)`);
                
                // 找到最新的有Google ID的记录作为主记录
                const primaryUser = userList.find(u => u.google_id) || userList[userList.length - 1];
                const duplicateUsers = userList.filter(u => u.id !== primaryUser.id);
                
                console.log(`✅ 主记录: ID ${primaryUser.id}, UUID: ${primaryUser.uuid}, 积分: ${primaryUser.credits}`);
                
                // 合并积分
                let totalCredits = primaryUser.credits || 0;
                for (const dupUser of duplicateUsers) {
                    totalCredits += dupUser.credits || 0;
                    console.log(`🔄 合并记录: ID ${dupUser.id}, UUID: ${dupUser.uuid}, 积分: ${dupUser.credits}`);
                }
                
                // 更新主记录的积分
                if (totalCredits !== primaryUser.credits) {
                    console.log(`💰 更新积分: ${primaryUser.credits} -> ${totalCredits}`);
                    
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ credits: totalCredits })
                        .eq('id', primaryUser.id);
                    
                    if (updateError) {
                        console.error('❌ 更新积分失败:', updateError);
                    } else {
                        console.log('✅ 积分已更新');
                    }
                }
                
                // 删除重复记录
                for (const dupUser of duplicateUsers) {
                    console.log(`🗑️ 删除重复记录: ID ${dupUser.id}`);
                    
                    const { error: deleteError } = await supabase
                        .from('users')
                        .delete()
                        .eq('id', dupUser.id);
                    
                    if (deleteError) {
                        console.error('❌ 删除失败:', deleteError);
                    } else {
                        console.log('✅ 记录已删除');
                    }
                }
            }
        }
        
        console.log('\n🎉 重复用户记录修复完成！');
        
    } catch (error) {
        console.error('❌ 修复过程中发生错误:', error);
    }
}

fixDuplicateUsers();