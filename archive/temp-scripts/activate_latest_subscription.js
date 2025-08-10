// 激活最新的订阅 I-Y21YW3WN78JX
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function activateLatestSubscription() {
    console.log('🚀 激活最新订阅 I-Y21YW3WN78JX...');
    console.log('='.repeat(50));

    const userId = 'user_1754239290136_toqa4uqugas'; // sunwei7482@gmail.com
    const subscriptionId = 'I-Y21YW3WN78JX'; // 最新的订阅ID
    const planType = 'max'; // 最新订阅是Max Plan
    
    const planDetails = {
        name: 'Max Plan',
        credits: 5000, // Max Plan是5000积分
        price: 19.99,
        planId: 'P-3NJ78684DS796242VNCJBKQQ'
    };

    try {
        console.log('📋 激活信息:');
        console.log(`  用户: sunwei7482@gmail.com`);
        console.log(`  订阅ID: ${subscriptionId}`);
        console.log(`  计划: ${planDetails.name}`);
        console.log(`  积分: ${planDetails.credits}`);

        // 1. 获取当前用户状态
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${userId}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const users = await userResponse.json();
        const user = users[0];
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + planDetails.credits;
        
        console.log(`✅ 当前积分: ${currentCredits}`);
        console.log(`✅ 新积分: ${newCredits}`);

        // 2. 更新用户积分和订阅状态
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                subscription_credits_remaining: planDetails.credits,
                subscription_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (updateResponse.ok) {
            console.log(`✅ 积分更新成功: ${currentCredits} → ${newCredits}`);
            console.log('✅ 订阅状态: ACTIVE');
        } else {
            const error = await updateResponse.text();
            console.log('❌ 更新失败:', error);
        }

        console.log('\n🎉 订阅激活完成！');

    } catch (error) {
        console.error('❌ 激活失败:', error);
    }
}

activateLatestSubscription().then(() => {
    console.log('\n🔄 请运行: node check_payment_simple.js 验证结果');
    process.exit(0);
});