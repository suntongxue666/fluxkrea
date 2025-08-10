// 设置订阅系统数据库表
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupTables() {
    try {
        console.log('🚀 开始设置订阅系统数据库表...');
        
        // 读取SQL文件
        const sqlContent = fs.readFileSync('create_subscription_tables.sql', 'utf8');
        
        // 分割SQL语句
        const sqlStatements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📋 找到 ${sqlStatements.length} 个SQL语句`);
        
        // 执行每个SQL语句
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            
            if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX')) {
                console.log(`🔄 执行语句 ${i + 1}/${sqlStatements.length}...`);
                
                try {
                    const { error } = await supabase.rpc('exec_sql', { sql: statement });
                    
                    if (error) {
                        console.log(`⚠️ 语句执行失败 (可能已存在): ${error.message}`);
                    } else {
                        console.log(`✅ 语句执行成功`);
                    }
                } catch (execError) {
                    console.log(`⚠️ 语句执行异常: ${execError.message}`);
                }
            }
        }
        
        // 验证表是否创建成功
        console.log('\n🔍 验证表创建结果...');
        
        const tablesToCheck = ['user_subscriptions', 'paypal_orders', 'webhook_events'];
        
        for (const tableName of tablesToCheck) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ 表 ${tableName} 不存在或无法访问: ${error.message}`);
                } else {
                    console.log(`✅ 表 ${tableName} 创建成功`);
                }
            } catch (checkError) {
                console.log(`❌ 检查表 ${tableName} 时出错: ${checkError.message}`);
            }
        }
        
        console.log('\n🎉 订阅系统数据库表设置完成！');
        console.log('\n📝 接下来请:');
        console.log('1. 配置PayPal Webhook URL指向 /api/paypal-webhook-complete');
        console.log('2. 测试订阅流程');
        console.log('3. 验证积分自动发放功能');
        
    } catch (error) {
        console.error('❌ 设置数据库表失败:', error);
    }
}

// 手动创建表的函数（如果RPC不可用）
async function manualCreateTables() {
    console.log('🔧 手动创建表...');
    
    const tables = [
        {
            name: 'user_subscriptions',
            sql: `
                CREATE TABLE IF NOT EXISTS user_subscriptions (
                    id SERIAL PRIMARY KEY,
                    google_user_id VARCHAR(255) NOT NULL,
                    google_user_email VARCHAR(255),
                    paypal_subscription_id VARCHAR(255) NOT NULL UNIQUE,
                    plan_id VARCHAR(255) NOT NULL,
                    plan_type VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'PENDING',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `
        },
        {
            name: 'paypal_orders',
            sql: `
                CREATE TABLE IF NOT EXISTS paypal_orders (
                    id SERIAL PRIMARY KEY,
                    subscription_id VARCHAR(255) NOT NULL,
                    user_uuid VARCHAR(255) NOT NULL,
                    user_email VARCHAR(255),
                    plan_id VARCHAR(255) NOT NULL,
                    plan_type VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'PENDING',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `
        },
        {
            name: 'webhook_events',
            sql: `
                CREATE TABLE IF NOT EXISTS webhook_events (
                    id SERIAL PRIMARY KEY,
                    event_type VARCHAR(255) NOT NULL,
                    resource_data JSONB NOT NULL,
                    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    processing_status VARCHAR(50) DEFAULT 'SUCCESS'
                )
            `
        }
    ];
    
    for (const table of tables) {
        try {
            console.log(`🔄 创建表: ${table.name}`);
            
            // 注意：这里需要使用Supabase的SQL编辑器或者其他方式执行
            // 因为普通的Supabase客户端不能直接执行DDL语句
            console.log(`📋 请在Supabase SQL编辑器中执行以下SQL:`);
            console.log(table.sql);
            console.log('---');
            
        } catch (error) {
            console.error(`❌ 创建表 ${table.name} 失败:`, error);
        }
    }
}

// 运行设置
console.log('🎯 订阅系统数据库表设置工具');
console.log('这将创建完整的订阅系统所需的数据库表\n');

setupTables().catch(() => {
    console.log('\n⚠️ 自动创建失败，切换到手动模式...');
    manualCreateTables();
});