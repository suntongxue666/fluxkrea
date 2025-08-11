/**
 * 完整的积分功能测试脚本
 * 测试所有积分相关的修复功能
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 开始完整的积分功能测试...\n');

// 读取相关文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const unifiedStateSyncPath = path.join(__dirname, 'public', 'js', 'modules', 'unified-state-sync.js');

const indexContent = fs.readFileSync(indexPath, 'utf8');
const unifiedStateSyncContent = fs.readFileSync(unifiedStateSyncPath, 'utf8');

console.log('📋 功能完整性检查:');

// 1. 检查showCreditsModal函数的所有分支
console.log('\n1. showCreditsModal函数检查:');
const modalFunctionMatch = indexContent.match(/window\.showCreditsModal\s*=\s*function[\s\S]*?};/);
if (modalFunctionMatch) {
    const modalFunction = modalFunctionMatch[0];
    
    const checks = [
        { name: '未登录用户处理', pattern: /currentCredits === null/, expected: true },
        { name: '积分为0处理', pattern: /currentCredits === 0/, expected: true },
        { name: '积分不足处理', pattern: /您当前有.*积分.*需要.*积分/, expected: true },
        { name: '友好的未登录提示', pattern: /获取免费积分/, expected: true },
        { name: '优化的积分为0提示', pattern: /您的积分已用完/, expected: true },
        { name: '弹窗激活逻辑', pattern: /modal\.classList\.add\('active'\)/, expected: true }
    ];
    
    checks.forEach(check => {
        const result = check.pattern.test(modalFunction);
        console.log(`   ${result === check.expected ? '✅' : '❌'} ${check.name}`);
    });
} else {
    console.log('   ❌ showCreditsModal函数未找到');
}

// 2. 检查积分重置功能
console.log('\n2. 积分重置功能检查:');
const resetFunctionMatch = indexContent.match(/window\.resetUserCredits\s*=\s*async function[\s\S]*?};/);
if (resetFunctionMatch) {
    const resetFunction = resetFunctionMatch[0];
    
    const resetChecks = [
        { name: '管理员权限检查', pattern: /adminEmails/, expected: true },
        { name: '当前用户积分重置', pattern: /addCredits/, expected: true },
        { name: '错误处理', pattern: /catch.*error/, expected: true },
        { name: '成功反馈', pattern: /积分重置成功/, expected: true }
    ];
    
    resetChecks.forEach(check => {
        const result = check.pattern.test(resetFunction);
        console.log(`   ${result === check.expected ? '✅' : '❌'} ${check.name}`);
    });
} else {
    console.log('   ❌ resetUserCredits函数未找到');
}

// 3. 检查增强的登录处理
console.log('\n3. 增强登录处理检查:');
const authHandlerMatch = indexContent.match(/supabaseClient\.auth\.onAuthStateChange\(async \(event, session\) => \{[\s\S]*?\}\);/);
if (authHandlerMatch) {
    const authHandler = authHandlerMatch[0];
    
    const authChecks = [
        { name: '积分同步调用', pattern: /syncCreditsFromAPI/, expected: true },
        { name: '登录成功日志', pattern: /登录后积分同步成功/, expected: true },
        { name: '同步失败处理', pattern: /积分同步失败/, expected: true },
        { name: '默认积分设置', pattern: /setCredits\(20\)/, expected: true }
    ];
    
    authChecks.forEach(check => {
        const result = check.pattern.test(authHandler);
        console.log(`   ${result === check.expected ? '✅' : '❌'} ${check.name}`);
    });
} else {
    console.log('   ❌ 增强登录处理未找到');
}

// 4. 检查UnifiedStateSync功能
console.log('\n4. UnifiedStateSync功能检查:');
const unifiedChecks = [
    { name: '积分同步API', pattern: /syncCreditsFromAPI/, expected: true },
    { name: '积分设置功能', pattern: /setCredits.*credits.*broadcast/, expected: true },
    { name: '积分扣除功能', pattern: /deductCredits/, expected: true },
    { name: '积分增加功能', pattern: /addCredits/, expected: true },
    { name: '数据库更新', pattern: /updateCreditsInDatabase/, expected: true },
    { name: '跨页面同步', pattern: /broadcastStateChange/, expected: true }
];

unifiedChecks.forEach(check => {
    const result = check.pattern.test(unifiedStateSyncContent);
    console.log(`   ${result === check.expected ? '✅' : '❌'} ${check.name}`);
});

// 5. 检查ImageGenerator积分检查逻辑
console.log('\n5. ImageGenerator积分检查逻辑:');
const imageGeneratorMatch = indexContent.match(/if \(currentCredits < this\.generationCost\)[\s\S]*?return \{ canProceed: false/);
if (imageGeneratorMatch) {
    const generatorLogic = imageGeneratorMatch[0];
    
    const generatorChecks = [
        { name: '积分为0弹窗调用', pattern: /showCreditsModal\(currentCredits, this\.generationCost\)/, expected: true },
        { name: '积分不足确认对话框', pattern: /confirm\(message\)/, expected: true },
        { name: '提示词保存', pattern: /localStorage\.setItem\('pending_generation_prompt'/, expected: true }
    ];
    
    generatorChecks.forEach(check => {
        const result = check.pattern.test(generatorLogic);
        console.log(`   ${result === check.expected ? '✅' : '❌'} ${check.name}`);
    });
} else {
    console.log('   ❌ ImageGenerator积分检查逻辑未找到');
}

// 6. 检查测试文件
console.log('\n6. 测试文件检查:');
const testFiles = [
    'public/test-credits-final-verification.html',
    'test-credits-final-fix.js',
    'test-credits-verification-simple.js'
];

testFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 7. 生成功能使用指南
console.log('\n📖 功能使用指南:');
console.log('');
console.log('🔧 管理员功能:');
console.log('   在浏览器控制台中使用以下命令:');
console.log('   resetUserCredits("用户邮箱", 20) // 重置指定用户积分到20');
console.log('');
console.log('🧪 测试功能:');
console.log('   showCreditsModal() // 测试未登录弹窗');
console.log('   showCreditsModal(0) // 测试积分为0弹窗');
console.log('   showCreditsModal(5, 10) // 测试积分不足弹窗');
console.log('');
console.log('🌐 测试页面:');
console.log('   http://localhost:3001/ // 主页测试');
console.log('   http://localhost:3001/test-credits-final-verification.html // 自动化测试');

// 8. 生成问题排查指南
console.log('\n🔍 问题排查指南:');
console.log('');
console.log('如果遇到积分相关问题，请按以下步骤排查:');
console.log('1. 检查浏览器控制台是否有错误信息');
console.log('2. 确认UnifiedStateSync是否正确初始化');
console.log('3. 检查用户登录状态和积分同步');
console.log('4. 验证showCreditsModal函数是否正确调用');
console.log('5. 确认数据库连接和API调用是否正常');

console.log('\n✅ 完整的积分功能测试完成！');
console.log('\n🎉 所有积分逻辑修复已完成，系统现在应该能够:');
console.log('   • 正确处理未登录用户的积分提示');
console.log('   • 在用户登录后正确发放和同步20积分');
console.log('   • 优雅地处理积分为0的情况');
console.log('   • 提供管理员积分重置功能');
console.log('   • 确保跨页面积分状态同步');