// 检查特定订单的积分发放情况
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

async function checkOrderCredits() {
    console.log('🔍 检查订单 I-WK6UTE0104DU 的积分发放情况...');
    console.log('='.repeat(60));

    const orderId = 'I-WK6UTE0104DU';

    try {
        // 1. 在订阅表中查找该订单
        console.log('📋 检查订阅记录...');
        const subResponse = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?paypal_subscription_id=eq.${orderId}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const subscriptions = await subResponse.json();
        
        if (subscriptions.length > 0) {
            console.log(`✅ 找到 ${subscriptions.length} 条订阅记录:`);
            subscriptions.forEach((sub, index) => {
                console.log(`\n订阅 ${index + 1}:`);
                console.log(`  ID: ${sub.id}`);
                console.log(`  用户UUID: ${sub.user_uuid}`);
                console.log(`  计划: ${sub.plan_name}`);
                console.log(`  积分: ${sub.credits_per_month}`);
                console.log(`  价格: $${sub.price}`);
                console.log(`  状态: ${sub.status}`);
                console.log(`  创建时间: ${sub.created_at}`);
            });
        } else {
            console.log('❌ 未找到订阅记录');
        }

        // 2. 在支付表中查找该订单
        console.log('\n💰 检查支付记录...');
        const payResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?paypal_payment_id=eq.${orderId}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const payments = await payResponse.json();
        
        if (payments.length > 0) {
            console.log(`✅ 找到 ${payments.length} 条支付记录:`);
            payments.forEach((pay, index) => {
                console.log(`\n支付 ${index + 1}:`);
                console.log(`  ID: ${pay.id}`);
                console.log(`  用户UUID: ${pay.user_uuid}`);
                console.log(`  金额: $${pay.amount}`);
                console.log(`  积分奖励: ${pay.credits_awarded}`);
                console.log(`  状态: ${pay.status}`);
                console.log(`  支付时间: ${pay.paid_at}`);
            });
        } else {
            console.log('❌ 未找到支付记录');
        }

        // 3. 在积分交易记录中查找该订单
        console.log('\n💳 检查积分交易记录...');
        const transResponse = await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions?reference_id=eq.${orderId}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const transactions = await transResponse.json();
        
        if (transactions.length > 0) {
            console.log(`✅ 找到 ${transactions.length} 条积分交易记录:`);
            transactions.forEach((trans, index) => {
                console.log(`\n交易 ${index + 1}:`);
                console.log(`  ID: ${trans.id}`);
                console.log(`  用户UUID: ${trans.user_uuid}`);
                console.log(`  类型: ${trans.transaction_type}`);
                console.log(`  积分: ${trans.amount}`);
                console.log(`  余额: ${trans.balance_after}`);
                console.log(`  描述: ${trans.description}`);
                console.log(`  时间: ${trans.created_at}`);
            });
        } else {
            console.log('❌ 未找到积分交易记录');
        }

        // 4. 模糊搜索包含该订单ID的记录
        console.log('\n🔎 模糊搜索相关记录...');
        
        // 搜索描述中包含订单ID的积分交易
        const fuzzyTransResponse = await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions?description=ilike.*${orderId}*&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const fuzzyTransactions = await fuzzyTransResponse.json();
        
        if (fuzzyTransactions.length > 0) {
            console.log(`✅ 在描述中找到 ${fuzzyTransactions.length} 条相关记录:`);
            fuzzyTransactions.forEach((trans, index) => {
                console.log(`\n相关交易 ${index + 1}:`);
                console.log(`  用户UUID: ${trans.user_uuid}`);
                console.log(`  积分: ${trans.amount}`);
                console.log(`  描述: ${trans.description}`);
                console.log(`  时间: ${trans.created_at}`);
            });
        }

        // 5. 检查sunwei7482@gmail.com的所有用户记录
        console.log('\n👤 检查sunwei7482@gmail.com的用户状态...');
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.sunwei7482@gmail.com&select=*&order=updated_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const users = await userResponse.json();
        
        if (users.length > 0) {
            console.log(`✅ 找到 ${users.length} 个用户记录:`);
            users.forEach((user, index) => {
                console.log(`\n用户 ${index + 1}:`);
                console.log(`  UUID: ${user.uuid}`);
                console.log(`  积分: ${user.credits}`);
                console.log(`  订阅状态: ${user.subscription_status}`);
                console.log(`  订阅积分余额: ${user.subscription_credits_remaining || 0}`);
                console.log(`  最后更新: ${user.updated_at}`);
            });
        }

        // 6. 总结分析
        console.log('\n📊 分析结果:');
        if (subscriptions.length === 0 && payments.length === 0 && transactions.length === 0 && fuzzyTransactions.length === 0) {
            console.log('❌ 订单 I-WK6UTE0104DU 的积分尚未发放到任何账号');
            console.log('💡 建议: 需要手动激活该订单的积分');
            
            // 判断是什么计划
            console.log('\n🔧 激活建议:');
            console.log('如果是Pro Plan (1000积分): node activate_by_email.js');
            console.log('如果是Max Plan (5000积分): 修改activate_by_email.js中的计划类型');
        } else {
            console.log('✅ 订单相关记录已找到，积分可能已发放');
        }

    } catch (error) {
        console.error('❌ 检查失败:', error);
    }
}

checkOrderCredits().then(() => {
    console.log('\n🎉 订单积分检查完成！');
    process.exit(0);
}).catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
});