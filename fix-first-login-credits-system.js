/**
 * 修复首次Google登录积分系统
 * 确保新用户首次登录获得20积分，并基于Google用户ID记录所有操作
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFirstLoginCreditsSystem() {
    console.log('🔧 修复首次Google登录积分系统\n');
    
    // 1. 检查当前用户数据结构
    console.log('📋 1. 检查当前用户数据结构...');
    
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);
    
    if (usersError) {
        console.log('❌ 查询用户失败:', usersError.message);
        return;
    }
    
    if (users && users.length > 0) {
        console.log('✅ 用户表结构:');
        const sampleUser = users[0];
        Object.keys(sampleUser).forEach(key => {
            console.log(`   - ${key}: ${typeof sampleUser[key]}`);
        });
        
        // 检查Google ID字段
        const hasGoogleId = users.some(user => user.google_id);
        const hasEmail = users.some(user => user.email);
        
        console.log(`\n📊 数据完整性:`);
        console.log(`   有Google ID的用户: ${users.filter(u => u.google_id).length}/${users.length}`);
        console.log(`   有邮箱的用户: ${users.filter(u => u.email).length}/${users.length}`);
        console.log(`   有积分的用户: ${users.filter(u => u.credits > 0).length}/${users.length}`);
    }
    
    // 2. 检查积分交易记录结构
    console.log('\n📋 2. 检查积分交易记录结构...');
    
    const { data: transactions, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .limit(5);
    
    if (transError) {
        console.log('❌ 查询交易记录失败:', transError.message);
    } else if (transactions && transactions.length > 0) {
        console.log('✅ 交易记录表结构:');
        const sampleTrans = transactions[0];
        Object.keys(sampleTrans).forEach(key => {
            console.log(`   - ${key}: ${typeof sampleTrans[key]}`);
        });
        
        // 分析交易类型
        const earnTransactions = transactions.filter(t => t.transaction_type === 'EARN');
        const spendTransactions = transactions.filter(t => t.transaction_type === 'SPEND');
        
        console.log(`\n📊 交易类型分析:`);
        console.log(`   EARN交易: ${earnTransactions.length}`);
        console.log(`   SPEND交易: ${spendTransactions.length}`);
        
        // 检查首次登录积分记录
        const firstLoginCredits = transactions.filter(t => 
            t.description && t.description.includes('首次登录') || 
            t.description && t.description.includes('新用户') ||
            t.source === 'first_login'
        );
        
        console.log(`   首次登录积分记录: ${firstLoginCredits.length}`);
    }
    
    // 3. 分析首次登录流程
    console.log('\n📋 3. 分析首次登录流程...');
    
    console.log('🔍 当前首次登录流程应该是:');
    console.log('1. 用户点击Google登录');
    console.log('2. Google OAuth认证成功');
    console.log('3. 检查用户是否已存在（基于Google ID）');
    console.log('4. 如果是新用户，创建用户记录并给予20积分');
    console.log('5. 记录首次登录积分交易');
    console.log('6. 后续所有操作基于Google用户ID');
    
    // 4. 检查可能的问题
    console.log('\n📋 4. 检查可能的问题...');
    
    // 检查是否有用户没有Google ID
    const usersWithoutGoogleId = users?.filter(user => !user.google_id) || [];
    if (usersWithoutGoogleId.length > 0) {
        console.log(`⚠️ 发现 ${usersWithoutGoogleId.length} 个用户没有Google ID:`);
        usersWithoutGoogleId.slice(0, 3).forEach((user, index) => {
            console.log(`   ${index + 1}. UUID: ${user.uuid}, Email: ${user.email || 'N/A'}`);
        });
    }
    
    // 检查是否有用户积分为0但应该有首次登录积分
    const usersNeedingFirstLoginCredits = users?.filter(user => 
        user.email && // 有邮箱（已登录）
        user.credits === 0 && // 积分为0
        user.subscription_status === 'FREE' // 免费用户
    ) || [];
    
    if (usersNeedingFirstLoginCredits.length > 0) {
        console.log(`⚠️ 发现 ${usersNeedingFirstLoginCredits.length} 个用户可能缺少首次登录积分:`);
        usersNeedingFirstLoginCredits.slice(0, 3).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email}, UUID: ${user.uuid}`);
        });
    }
    
    // 5. 提供修复方案
    console.log('\n📋 5. 修复方案...');
    
    console.log('🔧 需要确保的关键点:');
    console.log('');
    console.log('1. 用户表必须有google_id字段');
    console.log('2. 首次登录时检查Google ID是否已存在');
    console.log('3. 新用户自动获得20积分');
    console.log('4. 记录首次登录积分交易');
    console.log('5. 所有后续操作基于Google用户ID');
    
    // 6. 创建修复函数
    console.log('\n📋 6. 创建修复函数...');
    
    global.addFirstLoginCredits = addFirstLoginCredits;
    global.fixUserGoogleId = fixUserGoogleId;
    global.batchFixFirstLoginCredits = batchFixFirstLoginCredits;
    global.verifyUserIdConsistency = verifyUserIdConsistency;
    
    console.log('✅ 修复函数已创建:');
    console.log('- addFirstLoginCredits(userUuid) - 为用户添加首次登录积分');
    console.log('- fixUserGoogleId(userUuid, googleId) - 修复用户的Google ID');
    console.log('- batchFixFirstLoginCredits() - 批量修复所有需要的用户');
    console.log('- verifyUserIdConsistency() - 验证用户ID一致性');
    
    // 7. 检查登录代码
    console.log('\n📋 7. 检查登录代码建议...');
    
    console.log('🔍 需要检查的代码文件:');
    console.log('- public/index.html 中的Google登录处理');
    console.log('- public/js/modules/unified-state-sync.js 中的用户创建逻辑');
    console.log('- 确保使用Google ID作为主要标识符');
    
    console.log('\n💡 关键代码检查点:');
    console.log('1. 登录成功后是否正确保存Google ID');
    console.log('2. 是否检查用户是否为新用户');
    console.log('3. 是否为新用户自动添加20积分');
    console.log('4. 积分交易是否正确记录user_uuid');
    
    // 8. 生成测试用例
    console.log('\n📋 8. 测试用例...');
    
    console.log('🧪 需要测试的场景:');
    console.log('1. 全新用户首次Google登录');
    console.log('2. 已存在用户再次登录');
    console.log('3. 用户消费积分');
    console.log('4. 用户购买积分');
    console.log('5. 跨设备登录同步');
    
    console.log('\n✅ 修复系统已准备就绪！');
}

// 为用户添加首次登录积分
async function addFirstLoginCredits(userUuid) {
    try {
        console.log(`🎁 为用户 ${userUuid} 添加首次登录积分...`);
        
        // 查找用户
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userUuid);
        
        if (userError || !users || users.length === 0) {
            console.log('❌ 找不到用户:', userUuid);
            return false;
        }
        
        const user = users[0];
        
        // 检查是否已经有首次登录积分
        const { data: existingTransactions } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', userUuid)
            .eq('source', 'first_login');
        
        if (existingTransactions && existingTransactions.length > 0) {
            console.log('⚠️ 用户已经有首次登录积分记录');
            return false;
        }
        
        const creditsToAdd = 20;
        const newCredits = (user.credits || 0) + creditsToAdd;
        
        // 更新用户积分
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateError) {
            console.log('❌ 更新用户积分失败:', updateError.message);
            return false;
        }
        
        // 记录首次登录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: userUuid,
                transaction_type: 'EARN',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: '首次Google登录奖励积分',
                source: 'first_login'
            });
        
        if (transError) {
            console.log('⚠️ 积分交易记录失败:', transError.message);
        }
        
        console.log(`✅ 成功为 ${user.email || userUuid} 添加首次登录积分: ${creditsToAdd}`);
        return true;
        
    } catch (error) {
        console.log('❌ 添加首次登录积分失败:', error.message);
        return false;
    }
}

// 修复用户的Google ID
async function fixUserGoogleId(userUuid, googleId) {
    try {
        console.log(`🔧 修复用户 ${userUuid} 的Google ID...`);
        
        const { error } = await supabase
            .from('users')
            .update({
                google_id: googleId,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', userUuid);
        
        if (error) {
            console.log('❌ 更新Google ID失败:', error.message);
            return false;
        }
        
        console.log(`✅ 成功更新用户 ${userUuid} 的Google ID: ${googleId}`);
        return true;
        
    } catch (error) {
        console.log('❌ 修复Google ID失败:', error.message);
        return false;
    }
}

// 批量修复首次登录积分
async function batchFixFirstLoginCredits() {
    console.log('🔧 批量修复首次登录积分...');
    
    const { data: users } = await supabase
        .from('users')
        .select('*');
    
    const usersNeedingCredits = users?.filter(user => 
        user.email && 
        user.credits === 0 && 
        user.subscription_status === 'FREE'
    ) || [];
    
    console.log(`找到 ${usersNeedingCredits.length} 个需要首次登录积分的用户`);
    
    let successCount = 0;
    for (const user of usersNeedingCredits) {
        const success = await addFirstLoginCredits(user.uuid);
        if (success) successCount++;
    }
    
    console.log(`✅ 批量修复完成: ${successCount}/${usersNeedingCredits.length} 成功`);
    return successCount;
}

// 验证用户ID一致性
async function verifyUserIdConsistency() {
    console.log('🔍 验证用户ID一致性...');
    
    const { data: users } = await supabase
        .from('users')
        .select('*');
    
    const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*');
    
    console.log(`用户总数: ${users?.length || 0}`);
    console.log(`交易记录总数: ${transactions?.length || 0}`);
    
    // 检查孤立的交易记录
    const userUuids = new Set(users?.map(u => u.uuid) || []);
    const orphanedTransactions = transactions?.filter(t => !userUuids.has(t.user_uuid)) || [];
    
    if (orphanedTransactions.length > 0) {
        console.log(`⚠️ 发现 ${orphanedTransactions.length} 个孤立的交易记录`);
    } else {
        console.log('✅ 所有交易记录都有对应的用户');
    }
    
    // 检查用户积分与交易记录的一致性
    let inconsistentUsers = 0;
    for (const user of users || []) {
        const userTransactions = transactions?.filter(t => t.user_uuid === user.uuid) || [];
        const calculatedCredits = userTransactions.reduce((sum, t) => {
            return sum + (t.transaction_type === 'EARN' ? t.amount : -t.amount);
        }, 0);
        
        if (Math.abs(calculatedCredits - (user.credits || 0)) > 0.01) {
            inconsistentUsers++;
            if (inconsistentUsers <= 3) {
                console.log(`⚠️ 用户 ${user.email || user.uuid} 积分不一致: 实际${user.credits}, 计算${calculatedCredits}`);
            }
        }
    }
    
    if (inconsistentUsers > 0) {
        console.log(`⚠️ 发现 ${inconsistentUsers} 个用户积分不一致`);
    } else {
        console.log('✅ 所有用户积分与交易记录一致');
    }
    
    return {
        totalUsers: users?.length || 0,
        totalTransactions: transactions?.length || 0,
        orphanedTransactions: orphanedTransactions.length,
        inconsistentUsers
    };
}

// 执行修复
fixFirstLoginCreditsSystem().catch(error => {
    console.error('❌ 修复失败:', error);
    process.exit(1);
});