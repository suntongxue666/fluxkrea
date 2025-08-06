// 检查数据库表结构
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function checkTables() {
    console.log('🔍 检查数据库表结构...');
    console.log('='.repeat(50));

    const tables = ['users', 'subscriptions', 'payments', 'credit_transactions'];
    
    for (const table of tables) {
        console.log(`\n📋 检查表: ${table}`);
        
        try {
            const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`;
            
            const response = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ 表 ${table} 存在，可以访问`);
                console.log(`   记录数量: ${data.length}`);
            } else {
                const error = await response.text();
                console.log(`❌ 表 ${table} 访问失败:`);
                console.log(`   状态码: ${response.status}`);
                console.log(`   错误信息: ${error}`);
            }
        } catch (error) {
            console.log(`❌ 表 ${table} 检查失败:`, error.message);
        }
    }
    
    // 测试插入权限
    console.log('\n🧪 测试插入权限...');
    
    try {
        const testData = {
            user_uuid: 'test_user_' + Date.now(),
            paypal_subscription_id: 'test_sub_' + Date.now(),
            plan_name: 'Test Plan',
            status: 'ACTIVE',
            credits_per_month: 1000,
            price: 9.99
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ 插入测试成功:', result);
            
            // 清理测试数据
            const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${result[0].id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (deleteResponse.ok) {
                console.log('✅ 测试数据已清理');
            }
        } else {
            const error = await response.text();
            console.log('❌ 插入测试失败:');
            console.log('   状态码:', response.status);
            console.log('   错误信息:', error);
        }
    } catch (error) {
        console.log('❌ 插入测试异常:', error.message);
    }
}

checkTables().then(() => {
    console.log('\n🎉 数据库检查完成！');
    process.exit(0);
}).catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
});