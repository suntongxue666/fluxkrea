// 检查PayPal支付记录脚本
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// Supabase REST API helper
async function supabaseQuery(table, options = {}) {
    const { select = '*', order, limit, filter } = options;
    
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;
    
    if (order) {
        url += `&order=${order.column}.${order.ascending ? 'asc' : 'desc'}`;
    }
    
    if (limit) {
        url += `&limit=${limit}`;
    }
    
    if (filter) {
        url += `&${filter.column}=ilike.%25${filter.value}%25`;
    }
    
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
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (subError) {
            console.error('❌ 查询订阅记录失败:', subError.message);
        } else {
            console.log(`✅ 找到 ${subscriptions.length} 条订阅记录`);
            subscriptions.forEach((sub, index) => {
                console.log(`\n订阅 ${index + 1}:`);
                console.log(`  ID: ${sub.id}`);
                console.log(`  PayPal订阅ID: ${sub.paypal_subscription_id}`);
                console.log(`  计划: ${sub.plan_name} (${sub.credits_per_month}积分)`);
                console.log(`  价格: $${sub.price}`);
                console.log(`  状态: ${sub.status}`);
                console.log(`  用户UUID: ${sub.user_uuid}`);
                console.log(`  创建时间: ${sub.created_at}`);
            });
        }

        // 2. 检查支付记录
        console.log('\n💰 检查支付记录...');
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (payError) {
            console.error('❌ 查询支付记录失败:', payError.message);
        } else {
            console.log(`✅ 找到 ${payments.length} 条支付记录`);
            payments.forEach((payment, index) => {
                console.log(`\n支付 ${index + 1}:`);
                console.log(`  ID: ${payment.id}`);
                console.log(`  PayPal支付ID: ${payment.paypal_payment_id}`);
                console.log(`  金额: $${payment.amount}`);
                console.log(`  状态: ${payment.status}`);
                console.log(`  积分奖励: ${payment.credits_awarded}`);
                console.log(`  用户UUID: ${payment.user_uuid}`);
                console.log(`  支付时间: ${payment.paid_at}`);
                console.log(`  创建时间: ${payment.created_at}`);
            });
        }

        // 3. 检查用户积分更新
        console.log('\n👤 检查用户积分...');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('uuid, email, credits, subscription_status, current_subscription_id, subscription_credits_remaining')
            .order('updated_at', { ascending: false })
            .limit(10);

        if (userError) {
            console.error('❌ 查询用户记录失败:', userError.message);
        } else {
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
        }

        // 4. 检查积分交易记录
        console.log('\n💳 检查积分交易记录...');
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (transError) {
            console.error('❌ 查询积分交易失败:', transError.message);
        } else {
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
        }

        // 5. 查找特定Account ID相关记录
        console.log('\n🔎 查找Account ID 7ZAPM2VBBJX78 相关记录...');
        
        // 在各个表中搜索这个ID
        const searchQueries = [
            { table: 'subscriptions', field: 'paypal_subscription_id' },
            { table: 'payments', field: 'paypal_payment_id' },
            { table: 'payments', field: 'paypal_order_id' }
        ];

        for (const query of searchQueries) {
            const { data, error } = await supabase
                .from(query.table)
                .select('*')
                .ilike(query.field, '%7ZAPM2VBBJX78%');

            if (!error && data && data.length > 0) {
                console.log(`✅ 在 ${query.table}.${query.field} 中找到匹配记录:`);
                data.forEach(record => {
                    console.log(`  记录ID: ${record.id}`);
                    console.log(`  匹配字段: ${record[query.field]}`);
                    console.log(`  详细信息:`, record);
                });
            }
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