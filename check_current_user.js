// 检查当前登录用户的状态
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function checkCurrentUser() {
    console.log('🔍 检查当前登录用户状态...');
    console.log('='.repeat(50));

    try {
        // 查找所有sunwei7482@gmail.com的用户记录
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.sunwei7482@gmail.com&select=*&order=updated_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch users');
        }

        const users = await userResponse.json();
        
        console.log(`📋 找到 ${users.length} 个 sunwei7482@gmail.com 的用户记录:`);
        
        users.forEach((user, index) => {
            console.log(`\n用户 ${index + 1}:`);
            console.log(`  UUID: ${user.uuid}`);
            console.log(`  邮箱: ${user.email}`);
            console.log(`  积分: ${user.credits}`);
            console.log(`  订阅状态: ${user.subscription_status}`);
            console.log(`  订阅积分余额: ${user.subscription_credits_remaining || 0}`);
            console.log(`  是否已登录: ${user.is_signed_in ? 'Yes' : 'No'}`);
            console.log(`  最后活跃: ${user.last_seen_at}`);
            console.log(`  更新时间: ${user.updated_at}`);
        });

        // 找出当前活跃的用户（最近更新的）
        if (users.length > 0) {
            const activeUser = users[0]; // 按updated_at降序排列，第一个是最新的
            
            console.log('\n🎯 当前活跃用户:');
            console.log(`  UUID: ${activeUser.uuid}`);
            console.log(`  积分: ${activeUser.credits}`);
            console.log(`  订阅状态: ${activeUser.subscription_status}`);
            
            if (activeUser.credits < 5000 && activeUser.subscription_status !== 'ACTIVE') {
                console.log('\n⚠️  需要激活Max Plan订阅！');
                console.log('   应该有5000积分和ACTIVE状态');
                
                return activeUser.uuid;
            } else {
                console.log('\n✅ 用户状态正常');
                return null;
            }
        }

    } catch (error) {
        console.error('❌ 检查失败:', error);
    }
}

checkCurrentUser().then((needActivationUuid) => {
    if (needActivationUuid) {
        console.log(`\n🔧 需要为用户 ${needActivationUuid} 激活Max Plan订阅`);
        console.log('运行: node activate_current_user.js');
    } else {
        console.log('\n🎉 用户状态检查完成！');
    }
    process.exit(0);
}).catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
});