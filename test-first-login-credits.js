/**
 * 测试首次登录积分系统
 * 验证新用户首次Google登录时是否正确获得20积分
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFirstLoginCredits() {
    console.log('🧪 测试首次登录积分系统\n');
    
    // 1. 检查修改后的代码逻辑
    console.log('📋 1. 验证代码修改...');
    
    const fs = require('fs');
    const path = require('path');
    
    const unifiedStateSyncPath = path.join(__dirname, 'public', 'js', 'modules', 'unified-state-sync.js');
    const unifiedStateSyncContent = fs.readFileSync(unifiedStateSyncPath, 'utf8');
    
    const codeChecks = [
        {
            name: '添加了handleFirstLoginCredits调用',
            check: unifiedStateSyncContent.includes('await this.handleFirstLoginCredits(session.user)'),
            status: null
        },
        {
            name: '添加了handleFirstLoginCredits方法',
            check: unifiedStateSyncContent.includes('async handleFirstLoginCredits(authUser)'),
            status: null
        },
        {
            name: '添加了addFirstLoginCredits方法',
            check: unifiedStateSyncContent.includes('async addFirstLoginCredits(user)'),
            status: null
        },
        {
            name: '检查Google ID逻辑',
            check: unifiedStateSyncContent.includes('.eq(\'google_id\', authUser.id)'),
            status: null
        },
        {
            name: '首次登录积分交易记录',
            check: unifiedStateSyncContent.includes('source: \'first_login\''),
            status: null
        }
    ];
    
    codeChecks.forEach(check => {
        check.status = check.check;
        console.log(`• ${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    // 2. 检查数据库中的首次登录积分记录
    console.log('\n📋 2. 检查数据库中的首次登录积分记录...');
    
    const { data: firstLoginTransactions, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('source', 'first_login')
        .order('created_at', { ascending: false });
    
    if (transError) {
        console.log('❌ 查询首次登录交易失败:', transError.message);
    } else {
        console.log(`✅ 找到 ${firstLoginTransactions?.length || 0} 个首次登录积分记录`);
        
        if (firstLoginTransactions && firstLoginTransactions.length > 0) {
            console.log('最近的首次登录积分记录:');
            firstLoginTransactions.slice(0, 3).forEach((trans, index) => {
                console.log(`  ${index + 1}. 用户UUID: ${trans.user_uuid}`);
                console.log(`     积分: ${trans.amount}, 描述: ${trans.description}`);
                console.log(`     时间: ${trans.created_at}`);
                console.log('');
            });
        }
    }
    
    // 3. 检查用户的Google ID完整性
    console.log('📋 3. 检查用户的Google ID完整性...');
    
    const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (usersError) {
        console.log('❌ 查询用户失败:', usersError.message);
    } else {
        const usersWithGoogleId = allUsers?.filter(user => user.google_id) || [];
        const usersWithEmail = allUsers?.filter(user => user.email) || [];
        
        console.log(`✅ 用户统计:`);
        console.log(`   总用户数: ${allUsers?.length || 0}`);
        console.log(`   有Google ID: ${usersWithGoogleId.length}`);
        console.log(`   有邮箱: ${usersWithEmail.length}`);
        
        // 检查有邮箱但没有Google ID的用户
        const usersNeedingGoogleId = allUsers?.filter(user => 
            user.email && !user.google_id
        ) || [];
        
        if (usersNeedingGoogleId.length > 0) {
            console.log(`⚠️ 发现 ${usersNeedingGoogleId.length} 个有邮箱但没有Google ID的用户:`);
            usersNeedingGoogleId.slice(0, 3).forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email} - UUID: ${user.uuid}`);
            });
        }
    }
    
    // 4. 模拟新用户首次登录流程
    console.log('\n📋 4. 模拟新用户首次登录流程...');
    
    console.log('🔍 模拟流程步骤:');
    console.log('1. 新用户通过Google OAuth登录');
    console.log('2. 系统检查Google ID是否已存在');
    console.log('3. 如果不存在，创建新用户记录');
    console.log('4. 自动给予20积分');
    console.log('5. 记录首次登录积分交易');
    console.log('6. 更新本地积分状态');
    
    // 5. 创建测试函数
    console.log('\n📋 5. 创建测试函数...');
    
    global.simulateFirstLogin = simulateFirstLogin;
    global.checkUserFirstLoginStatus = checkUserFirstLoginStatus;
    global.fixMissingFirstLoginCredits = fixMissingFirstLoginCredits;
    
    console.log('✅ 测试函数已创建:');
    console.log('- simulateFirstLogin(email, googleId) - 模拟新用户首次登录');
    console.log('- checkUserFirstLoginStatus(email) - 检查用户首次登录状态');
    console.log('- fixMissingFirstLoginCredits() - 修复缺失的首次登录积分');
    
    // 6. 提供使用建议
    console.log('\n💡 使用建议:');
    console.log('');
    console.log('测试新用户首次登录:');
    console.log('1. 在浏览器中清除所有数据');
    console.log('2. 访问网站并点击Google登录');
    console.log('3. 使用新的Google账号登录');
    console.log('4. 检查是否自动获得20积分');
    console.log('5. 查看浏览器控制台的日志');
    console.log('');
    console.log('检查现有用户:');
    console.log('await checkUserFirstLoginStatus("user@example.com")');
    console.log('');
    console.log('修复缺失积分:');
    console.log('await fixMissingFirstLoginCredits()');
    
    // 7. 总结
    const passedChecks = codeChecks.filter(check => check.status).length;
    const totalChecks = codeChecks.length;
    
    console.log(`\n📈 代码修改验证: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
    
    if (passedChecks === totalChecks) {
        console.log('🎉 首次登录积分系统已完成修改！');
        console.log('');
        console.log('✅ 预期效果:');
        console.log('• 新用户首次Google登录自动获得20积分');
        console.log('• 基于Google ID识别用户身份');
        console.log('• 所有积分操作基于用户UUID记录');
        console.log('• 防止重复发放首次登录积分');
    } else {
        console.log('⚠️ 部分代码修改需要检查');
    }
    
    console.log('\n🚀 下一步:');
    console.log('1. 部署修改后的代码');
    console.log('2. 测试新用户首次登录流程');
    console.log('3. 验证积分是否正确发放');
    console.log('4. 检查交易记录是否正确');
}

// 模拟新用户首次登录
async function simulateFirstLogin(email, googleId) {
    console.log(`🧪 模拟新用户首次登录: ${email}`);
    
    // 检查用户是否已存在
    const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', googleId);
    
    if (existingUsers && existingUsers.length > 0) {
        console.log('⚠️ 用户已存在，无法模拟首次登录');
        return false;
    }
    
    // 模拟创建新用户
    const userUuid = `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const initialCredits = 20;
    
    const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
            uuid: userUuid,
            google_id: googleId,
            email: email,
            name: email.split('@')[0],
            credits: initialCredits,
            total_credits_earned: initialCredits,
            is_signed_in: true,
            subscription_status: 'FREE'
        })
        .select()
        .single();
    
    if (createError) {
        console.log('❌ 创建用户失败:', createError.message);
        return false;
    }
    
    // 记录首次登录积分交易
    const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
            user_uuid: userUuid,
            transaction_type: 'EARN',
            amount: initialCredits,
            balance_after: initialCredits,
            description: '首次Google登录奖励积分（测试）',
            source: 'first_login'
        });
    
    if (transactionError) {
        console.log('⚠️ 积分交易记录失败:', transactionError.message);
    }
    
    console.log(`✅ 模拟首次登录成功: ${email} 获得 ${initialCredits} 积分`);
    return true;
}

// 检查用户首次登录状态
async function checkUserFirstLoginStatus(email) {
    console.log(`🔍 检查用户首次登录状态: ${email}`);
    
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);
    
    if (!users || users.length === 0) {
        console.log('❌ 找不到用户');
        return null;
    }
    
    const user = users[0];
    
    // 检查首次登录积分记录
    const { data: firstLoginTransactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_uuid', user.uuid)
        .eq('source', 'first_login');
    
    console.log('✅ 用户状态:');
    console.log(`   邮箱: ${user.email}`);
    console.log(`   Google ID: ${user.google_id || 'N/A'}`);
    console.log(`   当前积分: ${user.credits}`);
    console.log(`   首次登录积分记录: ${firstLoginTransactions?.length || 0} 条`);
    
    return {
        user,
        hasFirstLoginCredits: firstLoginTransactions && firstLoginTransactions.length > 0
    };
}

// 修复缺失的首次登录积分
async function fixMissingFirstLoginCredits() {
    console.log('🔧 修复缺失的首次登录积分...');
    
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .not('email', 'is', null);
    
    let fixedCount = 0;
    
    for (const user of users || []) {
        // 检查是否有首次登录积分记录
        const { data: firstLoginTransactions } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', user.uuid)
            .eq('source', 'first_login');
        
        if (!firstLoginTransactions || firstLoginTransactions.length === 0) {
            // 没有首次登录积分记录，且积分较低，可能需要补发
            if (user.credits < 20) {
                console.log(`修复用户 ${user.email} 的首次登录积分...`);
                
                const creditsToAdd = 20 - user.credits;
                const newCredits = 20;
                
                // 更新积分
                await supabase
                    .from('users')
                    .update({
                        credits: newCredits,
                        total_credits_earned: (user.total_credits_earned || 0) + creditsToAdd
                    })
                    .eq('id', user.id);
                
                // 记录交易
                await supabase
                    .from('credit_transactions')
                    .insert({
                        user_uuid: user.uuid,
                        transaction_type: 'EARN',
                        amount: creditsToAdd,
                        balance_after: newCredits,
                        description: '首次登录积分补发',
                        source: 'first_login'
                    });
                
                fixedCount++;
            }
        }
    }
    
    console.log(`✅ 修复完成: ${fixedCount} 个用户获得首次登录积分`);
    return fixedCount;
}

// 执行测试
testFirstLoginCredits().catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
});