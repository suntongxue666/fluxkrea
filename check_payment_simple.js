// 简化的PayPal支付记录检查脚本
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// Supabase REST API helper
async function supabaseQuery(table, params = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
    
    const response = await fetch(url, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

async function checkPaymentRecord() {
    console.log('🔍 检查PayPal支付记录...');
    console.log('Account ID: 7ZAPM2VBBJX78');
    console.log('预期金额: $9.99 (Pro Plan)');
    console.log('预期积分: 1000');
    console.log('='.repeat(50));

    try {
        // 1. 检查订阅记录
        console.log('\n📋 检查订阅记录...');
        const subscriptions = await supabaseQuery('subscriptions', 'select=*&order=created_at.desc&limit=10');
        
        console.log(`✅ 找到 ${subscriptions.length} 条订阅记录`);
        subscriptions.forEach((sub, index) => {
            console.log(`\n订阅 ${index + 1}:`);
            console.log(`  ID: ${sub.id}`);
            console.log(`  PayPal订阅ID: ${sub.paypal_subscription_id}`);
            console.log(`  计划: ${sub.plan_name} (${sub.credits_per_month}积分)`);
            console.log(`  价格: ${sub.price}`);
            console.log(`  状态: ${sub.status}`);
            console.log(`  用户UUID: ${sub.user_uuid}`);
            console.log(`  创建时间: ${sub.created_at}`);
        });

        // 2. 检查支付记录
        console.log('\n💰 检查支付记录...');
        const payments = await supabaseQuery('payments', 'select=*&order=created_at.desc&limit=10');
        
        console.log(`✅ 找到 ${payments.length} 条支付记录`);
        payments.forEach((payment, index) => {
            console.log(`\n支付 ${index + 1}:`);
            console.log(`  ID: ${payment.id}`);
            console.log(`  PayPal支付ID: ${payment.paypal_payment_id}`);
            console.log(`  金额: ${payment.amount}`);
            console.log(`  状态: ${payment.status}`);
            console.log(`  积分奖励: ${payment.credits_awarded}`);
            console.log(`  用户UUID: ${payment.user_uuid}`);
            console.log(`  支付时间: ${payment.paid_at}`);
            console.log(`  创建时间: ${payment.created_at}`);
        });

        // 3. 检查用户积分更新
        console.log('\n👤 检查用户积分...');
        const users = await supabaseQuery('users', 'select=uuid,email,credits,subscription_status,current_subscription_id,subscription_credits_remaining&order=updated_at.desc&limit=10');
        
        console.log(`✅ 找到 ${users.length} 个用户记录`);
        users.forEach((user, index) => {
            console.log(`\n用户 ${index + 1}:`);
            console.log(`  UUID: ${user.uuid}`);
            console.log(`  邮箱: ${user.email || '未设置'}`);
            console.log(`  当前积分: ${user.credits}`);
            console.log(`  订阅状态: ${user.subscription_status || 'FREE'}`);
            console.log(`  订阅ID: ${user.current_subscription_id || '无'}`);
            console.log(`  订阅积分余额: ${user.subscription_credits_remaining || 0}`);
        });

        // 4. 检查积分交易记录
        console.log('\n💳 检查积分交易记录...');
        const transactions = await supabaseQuery('credit_transactions', 'select=*&order=created_at.desc&limit=10');
        
        console.log(`✅ 找到 ${transactions.length} 条积分交易记录`);
        transactions.forEach((trans, index) => {
            console.log(`\n交易 ${index + 1}:`);
            console.log(`  ID: ${trans.id}`);
            console.log(`  用户UUID: ${trans.user_uuid}`);
            console.log(`  类型: ${trans.transaction_type}`);
            console.log(`  金额: ${trans.amount}`);
            console.log(`  余额: ${trans.balance_after}`);
            console.log(`  描述: ${trans.description}`);
            console.log(`  来源: ${trans.source}`);
            console.log(`  时间: ${trans.created_at}`);
        });

        // 5. 查找特定Account ID相关记录
        console.log('\n🔎 查找Account ID 7ZAPM2VBBJX78 相关记录...');
        
        // 搜索包含这个ID的记录
        try {
            const subSearch = await supabaseQuery('subscriptions', 'select=*&paypal_subscription_id=ilike.*7ZAPM2VBBJX78*');
            if (subSearch.length > 0) {
                console.log('✅ 在订阅记录中找到匹配:');
                subSearch.forEach(record => {
                    console.log(`  订阅ID: ${record.id}, PayPal ID: ${record.paypal_subscription_id}`);
                });
            }
        } catch (e) {
            console.log('订阅记录搜索无结果');
        }

        try {
            const paySearch = await supabaseQuery('payments', 'select=*&paypal_payment_id=ilike.*7ZAPM2VBBJX78*');
            if (paySearch.length > 0) {
                console.log('✅ 在支付记录中找到匹配:');
                paySearch.forEach(record => {
                    console.log(`  支付ID: ${record.id}, PayPal ID: ${record.paypal_payment_id}`);
                });
            }
        } catch (e) {
            console.log('支付记录搜索无结果');
        }

    } catch (error) {
        console.error('❌ 检查过程中发生错误:', error);
    }
}

// 运行检查
checkPaymentRecord().then(() => {
    console.log('\n🎉 检查完成！');
    process.exit(0);
}).catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
});