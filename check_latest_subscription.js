// 检查最新订阅的详细信息
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function checkLatestSubscription() {
    console.log('🔍 检查最新订阅信息...');
    console.log('='.repeat(50));

    const userId = 'user_1754239290136_toqa4uqugas'; // sunwei7482@gmail.com

    try {
        // 获取用户当前状态
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?uuid=eq.${userId}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user');
        }

        const users = await userResponse.json();
        const user = users[0];

        console.log('👤 当前用户状态:');
        console.log(`  邮箱: ${user.email}`);
        console.log(`  当前积分: ${user.credits}`);
        console.log(`  订阅状态: ${user.subscription_status}`);
        console.log(`  更新时间: ${user.updated_at}`);

        // 检查最近的积分交易
        console.log('\n💳 最近的积分交易:');
        const transResponse = await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions?user_uuid=eq.${userId}&order=created_at.desc&limit=5&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (transResponse.ok) {
            const transactions = await transResponse.json();
            transactions.forEach((trans, index) => {
                console.log(`\n交易 ${index + 1}:`);
                console.log(`  类型: ${trans.transaction_type}`);
                console.log(`  金额: ${trans.amount}`);
                console.log(`  余额: ${trans.balance_after}`);
                console.log(`  描述: ${trans.description}`);
                console.log(`  来源: ${trans.source}`);
                console.log(`  时间: ${trans.created_at}`);
            });
        }

        console.log('\n🤔 分析:');
        
        // 根据当前积分判断应该是哪个计划
        if (user.credits === 1000) {
            console.log('❌ 当前积分1000，但如果你购买的是Max Plan，应该是5000积分');
            console.log('💡 需要修正积分数量');
            
            console.log('\n🔧 修正方案:');
            console.log('如果你确认购买的是Max Plan (5000积分)，我可以帮你修正积分');
            console.log('请确认你购买的计划:');
            console.log('- Pro Plan: $9.99/月, 1000积分');
            console.log('- Max Plan: $19.99/月, 5000积分');
            
        } else if (user.credits === 5000) {
            console.log('✅ 当前积分5000，符合Max Plan');
        } else {
            console.log(`🤷 当前积分${user.credits}，请确认购买的计划`);
        }

    } catch (error) {
        console.error('❌ 检查失败:', error);
    }
}

checkLatestSubscription().then(() => {
    console.log('\n📋 请确认你购买的计划，我可以帮你修正积分数量');
    process.exit(0);
}).catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
});