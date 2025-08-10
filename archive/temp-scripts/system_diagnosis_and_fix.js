// 系统全面诊断和修复工具
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runSystemDiagnosis() {
    console.log('🔍 开始系统全面诊断...');
    console.log('='.repeat(60));
    
    const results = {
        database: {},
        apis: {},
        userSystem: {},
        subscriptionSystem: {},
        recommendations: []
    };
    
    // 1. 数据库诊断
    console.log('\n📊 1. 数据库结构诊断');
    console.log('-'.repeat(40));
    
    const tables = ['users', 'user_subscriptions', 'subscriptions', 'paypal_orders', 'webhook_events', 'credit_transactions'];
    
    for (const tableName of tables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ ${tableName}: ${error.message}`);
                results.database[tableName] = { status: 'error', message: error.message };
                
                if (error.code === '42P01') {
                    results.recommendations.push(`创建缺失的表: ${tableName}`);
                }
            } else {
                console.log(`✅ ${tableName}: 可访问`);
                results.database[tableName] = { status: 'ok', recordCount: data.length };
            }
        } catch (err) {
            console.log(`❌ ${tableName}: 检查失败 - ${err.message}`);
            results.database[tableName] = { status: 'error', message: err.message };
        }
    }
    
    // 2. 用户系统诊断
    console.log('\n👥 2. 用户系统诊断');
    console.log('-'.repeat(40));
    
    try {
        // 检查用户数据一致性
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, uuid, google_id, email, credits, subscription_status');
        
        if (usersError) {
            console.log('❌ 无法查询用户数据');
            results.userSystem.status = 'error';
        } else {
            console.log(`✅ 找到 ${users.length} 个用户`);
            
            // 检查数据一致性
            const inconsistentUsers = users.filter(u => u.google_id && u.uuid !== u.google_id);
            const duplicateEmails = {};
            
            users.forEach(user => {
                if (user.email) {
                    duplicateEmails[user.email] = (duplicateEmails[user.email] || 0) + 1;
                }
            });
            
            const duplicates = Object.entries(duplicateEmails).filter(([email, count]) => count > 1);
            
            console.log(`   - UUID不一致用户: ${inconsistentUsers.length}`);
            console.log(`   - 重复邮箱: ${duplicates.length}`);
            
            results.userSystem = {
                status: 'ok',
                totalUsers: users.length,
                inconsistentUsers: inconsistentUsers.length,
                duplicateEmails: duplicates.length
            };
            
            if (inconsistentUsers.length > 0) {
                results.recommendations.push('修复用户UUID不一致问题');
            }
            if (duplicates.length > 0) {
                results.recommendations.push('清理重复用户记录');
            }
        }
    } catch (error) {
        console.log('❌ 用户系统检查失败:', error.message);
        results.userSystem.status = 'error';
    }
    
    // 3. 订阅系统诊断
    console.log('\n🔗 3. 订阅系统诊断');
    console.log('-'.repeat(40));
    
    try {
        // 检查订阅关联
        if (results.database.user_subscriptions?.status === 'ok') {
            const { data: subscriptions, error } = await supabase
                .from('user_subscriptions')
                .select('*');
            
            if (!error) {
                console.log(`✅ 找到 ${subscriptions.length} 个订阅关联`);
                results.subscriptionSystem.subscriptions = subscriptions.length;
                
                // 检查孤立的订阅
                const orphanedSubs = [];
                for (const sub of subscriptions) {
                    const { data: user } = await supabase
                        .from('users')
                        .select('id')
                        .eq('uuid', sub.google_user_id)
                        .single();
                    
                    if (!user) {
                        orphanedSubs.push(sub);
                    }
                }
                
                console.log(`   - 孤立订阅: ${orphanedSubs.length}`);
                results.subscriptionSystem.orphanedSubscriptions = orphanedSubs.length;
                
                if (orphanedSubs.length > 0) {
                    results.recommendations.push('修复孤立的订阅关联');
                }
            }
        } else {
            console.log('❌ 订阅关联表不存在');
            results.subscriptionSystem.status = 'missing_table';
        }
    } catch (error) {
        console.log('❌ 订阅系统检查失败:', error.message);
        results.subscriptionSystem.status = 'error';
    }
    
    // 4. API健康检查
    console.log('\n🔌 4. API健康检查');
    console.log('-'.repeat(40));
    
    const apiEndpoints = [
        { name: 'handle-subscription', path: '/api/handle-subscription' },
        { name: 'get-user-credits', path: '/api/get-user-credits' },
        { name: 'paypal-webhook', path: '/api/paypal-webhook-minimal' }
    ];
    
    for (const api of apiEndpoints) {
        try {
            // 这里只是检查文件是否存在，实际测试需要服务器运行
            console.log(`⚠️ ${api.name}: 需要服务器运行时测试`);
            results.apis[api.name] = { status: 'needs_testing' };
        } catch (error) {
            console.log(`❌ ${api.name}: ${error.message}`);
            results.apis[api.name] = { status: 'error', message: error.message };
        }
    }
    
    // 5. 生成修复建议
    console.log('\n🛠️ 5. 修复建议');
    console.log('-'.repeat(40));
    
    if (results.recommendations.length === 0) {
        console.log('✅ 系统状态良好，无需修复');
    } else {
        console.log('发现以下问题需要修复:');
        results.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
    }
    
    // 6. 生成修复脚本
    console.log('\n📝 6. 生成修复脚本');
    console.log('-'.repeat(40));
    
    if (results.database.user_subscriptions?.status === 'error') {
        console.log('需要执行: emergency_table_creation.sql');
    }
    
    if (results.userSystem.inconsistentUsers > 0) {
        console.log('需要执行: node fix_user_identification.js');
    }
    
    if (results.userSystem.duplicateEmails > 0) {
        console.log('需要执行: node fix_duplicate_users.js');
    }
    
    console.log('\n🎯 诊断完成!');
    console.log('='.repeat(60));
    
    return results;
}

// 自动修复功能
async function runAutoFix() {
    console.log('\n🔧 开始自动修复...');
    
    try {
        // 1. 修复用户标识不一致
        console.log('\n1. 修复用户标识不一致...');
        const { data: users } = await supabase
            .from('users')
            .select('*')
            .not('google_id', 'is', null);
        
        for (const user of users || []) {
            if (user.uuid !== user.google_id) {
                console.log(`🔧 更新用户 ${user.email} 的UUID`);
                
                const { error } = await supabase
                    .from('users')
                    .update({ uuid: user.google_id })
                    .eq('id', user.id);
                
                if (error) {
                    console.log(`❌ 更新失败: ${error.message}`);
                } else {
                    console.log(`✅ 更新成功`);
                }
            }
        }
        
        // 2. 创建测试订阅关联（如果表存在）
        console.log('\n2. 验证订阅关联功能...');
        try {
            const testData = {
                google_user_id: 'test-user-' + Date.now(),
                google_user_email: 'test@example.com',
                paypal_subscription_id: 'I-TEST-' + Date.now(),
                plan_id: 'P-TEST123',
                plan_type: 'test',
                status: 'ACTIVE'
            };
            
            const { error } = await supabase
                .from('user_subscriptions')
                .insert(testData);
            
            if (error) {
                console.log(`❌ 订阅关联测试失败: ${error.message}`);
            } else {
                console.log(`✅ 订阅关联功能正常`);
                
                // 清理测试数据
                await supabase
                    .from('user_subscriptions')
                    .delete()
                    .eq('paypal_subscription_id', testData.paypal_subscription_id);
            }
        } catch (error) {
            console.log(`❌ 订阅关联表不存在或无权限`);
        }
        
        console.log('\n✅ 自动修复完成!');
        
    } catch (error) {
        console.error('❌ 自动修复失败:', error);
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--fix')) {
        await runAutoFix();
    } else {
        await runSystemDiagnosis();
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runSystemDiagnosis, runAutoFix };