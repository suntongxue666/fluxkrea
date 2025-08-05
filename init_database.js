// 数据库初始化脚本
// 用于在Supabase中创建PayPal订阅相关的表结构

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY'; // 需要service_role密钥

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function initializeDatabase() {
    console.log('🚀 开始初始化PayPal订阅数据库...');
    
    try {
        // 读取SQL文件
        const sqlContent = fs.readFileSync('database_schema.sql', 'utf8');
        
        // 分割SQL语句（简单的分割，实际可能需要更复杂的解析）
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📋 准备执行 ${statements.length} 个SQL语句...`);
        
        // 执行每个SQL语句
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`⚡ 执行语句 ${i + 1}/${statements.length}...`);
                    const { error } = await supabase.rpc('exec_sql', { 
                        sql_query: statement 
                    });
                    
                    if (error) {
                        console.error(`❌ 语句 ${i + 1} 执行失败:`, error);
                    } else {
                        console.log(`✅ 语句 ${i + 1} 执行成功`);
                    }
                } catch (err) {
                    console.error(`❌ 语句 ${i + 1} 执行异常:`, err.message);
                }
            }
        }
        
        // 验证表创建
        console.log('\n🔍 验证表创建结果...');
        await verifyTables();
        
        console.log('\n🎉 数据库初始化完成！');
        
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        process.exit(1);
    }
}

async function verifyTables() {
    const expectedTables = ['subscriptions', 'payments', 'subscription_history'];
    
    for (const tableName of expectedTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ 表 ${tableName} 验证失败:`, error.message);
            } else {
                console.log(`✅ 表 ${tableName} 创建成功`);
            }
        } catch (err) {
            console.log(`❌ 表 ${tableName} 验证异常:`, err.message);
        }
    }
}

// 创建测试数据（可选）
async function createTestData() {
    console.log('\n🧪 创建测试数据...');
    
    try {
        // 创建测试订阅记录
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .insert({
                user_id: 1,
                user_uuid: 'test-user-uuid',
                paypal_subscription_id: 'I-TEST123456789',
                paypal_plan_id: 'P-5S785818YS7424947NCJBKQA',
                plan_name: 'pro',
                status: 'ACTIVE',
                credits_per_month: 1000,
                price: 9.99,
                currency: 'USD'
            })
            .select()
            .single();
        
        if (subError) {
            console.log('❌ 测试订阅创建失败:', subError.message);
        } else {
            console.log('✅ 测试订阅创建成功:', subscription.id);
            
            // 创建测试支付记录
            const { data: payment, error: payError } = await supabase
                .from('payments')
                .insert({
                    subscription_id: subscription.id,
                    user_id: 1,
                    user_uuid: 'test-user-uuid',
                    paypal_payment_id: 'PAY-TEST123456789',
                    amount: 9.99,
                    currency: 'USD',
                    status: 'COMPLETED',
                    credits_awarded: 1000,
                    paid_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (payError) {
                console.log('❌ 测试支付创建失败:', payError.message);
            } else {
                console.log('✅ 测试支付创建成功:', payment.id);
            }
        }
        
    } catch (error) {
        console.log('❌ 测试数据创建失败:', error.message);
    }
}

// 主函数
async function main() {
    if (SUPABASE_SERVICE_KEY === 'YOUR_SUPABASE_SERVICE_KEY') {
        console.error('❌ 请先设置SUPABASE_SERVICE_KEY');
        console.log('在Supabase Dashboard > Settings > API中获取service_role密钥');
        process.exit(1);
    }
    
    await initializeDatabase();
    
    // 询问是否创建测试数据
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('\n❓ 是否创建测试数据？(y/N): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            await createTestData();
        }
        
        console.log('\n✨ 所有操作完成！');
        rl.close();
        process.exit(0);
    });
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { initializeDatabase, verifyTables, createTestData };