// 修复用户标识不一致问题
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixUserIdentification() {
    console.log('🔧 修复用户标识不一致问题...');
    
    try {
        // 1. 查找所有有Google ID的用户
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .not('google_id', 'is', null);
        
        if (usersError) {
            console.error('❌ 查询用户失败:', usersError);
            return;
        }
        
        console.log(`📋 找到 ${users.length} 个Google用户`);
        
        for (const user of users) {
            console.log(`\n🔍 处理用户: ${user.email} (Google ID: ${user.google_id})`);
            
            // 确保UUID字段与Google ID一致
            if (user.uuid !== user.google_id) {
                console.log(`🔧 更新UUID: ${user.uuid} -> ${user.google_id}`);
                
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ uuid: user.google_id })
                    .eq('id', user.id);
                
                if (updateError) {
                    console.error(`❌ 更新UUID失败:`, updateError);
                } else {
                    console.log(`✅ UUID已更新`);
                }
            } else {
                console.log(`✅ UUID已正确: ${user.uuid}`);
            }
        }
        
        console.log('\n🎉 用户标识修复完成！');
        
    } catch (error) {
        console.error('❌ 修复过程中发生错误:', error);
    }
}

fixUserIdentification();