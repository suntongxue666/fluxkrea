// 测试指纹防重复逻辑
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function testFingerprintLogic() {
    console.log('🧪 测试指纹防重复逻辑...');
    console.log('='.repeat(50));

    try {
        // 1. 查看所有用户的指纹信息
        console.log('📋 查看用户指纹信息...');
        const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=uuid,email,fingerprint,credits,created_at&order=created_at.desc&limit=10`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const users = await usersResponse.json();
        
        console.log(`找到 ${users.length} 个用户记录:`);
        users.forEach((user, index) => {
            console.log(`\n用户 ${index + 1}:`);
            console.log(`  UUID: ${user.uuid}`);
            console.log(`  邮箱: ${user.email || '未设置'}`);
            console.log(`  指纹: ${user.fingerprint || '未设置'}`);
            console.log(`  积分: ${user.credits}`);
            console.log(`  创建时间: ${user.created_at}`);
        });

        // 2. 检查是否有重复指纹
        console.log('\n🔍 检查重复指纹...');
        const fingerprintMap = {};
        let duplicateCount = 0;

        users.forEach(user => {
            if (user.fingerprint) {
                if (fingerprintMap[user.fingerprint]) {
                    fingerprintMap[user.fingerprint].push(user);
                    duplicateCount++;
                } else {
                    fingerprintMap[user.fingerprint] = [user];
                }
            }
        });

        if (duplicateCount > 0) {
            console.log(`⚠️  发现 ${duplicateCount} 个重复指纹:`);
            Object.entries(fingerprintMap).forEach(([fingerprint, userList]) => {
                if (userList.length > 1) {
                    console.log(`\n指纹 ${fingerprint}:`);
                    userList.forEach(user => {
                        console.log(`  - UUID: ${user.uuid}, 积分: ${user.credits}, 邮箱: ${user.email || '未设置'}`);
                    });
                }
            });
        } else {
            console.log('✅ 没有发现重复指纹');
        }

        // 3. 检查积分发放逻辑
        console.log('\n💰 检查积分发放逻辑...');
        const anonymousUsers = users.filter(user => !user.email);
        const totalCreditsGiven = anonymousUsers.reduce((sum, user) => sum + (user.credits || 0), 0);
        
        console.log(`匿名用户数量: ${anonymousUsers.length}`);
        console.log(`总发放积分: ${totalCreditsGiven}`);
        console.log(`平均积分: ${anonymousUsers.length > 0 ? (totalCreditsGiven / anonymousUsers.length).toFixed(1) : 0}`);

        if (anonymousUsers.length > 0) {
            const expectedCredits = anonymousUsers.length * 20; // 每个用户应该20积分
            if (totalCreditsGiven > expectedCredits) {
                console.log(`⚠️  可能存在重复发放积分问题:`);
                console.log(`   预期总积分: ${expectedCredits} (${anonymousUsers.length} × 20)`);
                console.log(`   实际总积分: ${totalCreditsGiven}`);
                console.log(`   多发放积分: ${totalCreditsGiven - expectedCredits}`);
            } else {
                console.log('✅ 积分发放正常');
            }
        }

        // 4. 建议优化措施
        console.log('\n💡 优化建议:');
        console.log('1. 基于指纹查找用户，防止重复发放积分');
        console.log('2. 合并相同指纹的用户记录');
        console.log('3. 定期清理无效的用户记录');
        console.log('4. 监控积分发放异常');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

testFingerprintLogic().then(() => {
    console.log('\n🎉 指纹逻辑测试完成！');
    process.exit(0);
}).catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
});