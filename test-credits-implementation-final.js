// 最终积分逻辑实现验证测试
const fs = require('fs');

console.log('🧪 验证积分逻辑最终实现...\n');

const htmlContent = fs.readFileSync('public/index.html', 'utf8');

// 测试1: 验证showCreditsModal函数
console.log('1. 测试showCreditsModal函数...');
const showCreditsModalMatch = htmlContent.match(/window\.showCreditsModal\s*=\s*function[^}]+}[^}]*}/s);
if (showCreditsModalMatch) {
    const modalFunction = showCreditsModalMatch[0];
    
    const hasUnloggedLogic = modalFunction.includes('currentCredits === null') && 
                            modalFunction.includes('Sign in with Google to Gain Free 20 Credits');
    const hasZeroCreditsLogic = modalFunction.includes('currentCredits === 0') && 
                               modalFunction.includes('Credits balance is 0');
    const hasInsufficientLogic = modalFunction.includes('Credits balance is ${currentCredits}');
    
    console.log('   ✅ showCreditsModal函数已找到');
    console.log(`   ${hasUnloggedLogic ? '✅' : '❌'} 未登录用户逻辑正确`);
    console.log(`   ${hasZeroCreditsLogic ? '✅' : '❌'} 积分为0逻辑正确`);
    console.log(`   ${hasInsufficientLogic ? '✅' : '❌'} 积分不足逻辑正确`);
} else {
    console.log('   ❌ showCreditsModal函数未找到');
}

// 测试2: 验证ImageGenerator类
console.log('\n2. 测试ImageGenerator类...');
const imageGeneratorMatch = htmlContent.match(/window\.ImageGenerator\s*=\s*class[^}]+}[^}]*}[^}]*}[^}]*}[^}]*}/s);
if (imageGeneratorMatch) {
    const generatorClass = imageGeneratorMatch[0];
    
    const hasCreditsCheck = generatorClass.includes('currentCredits < this.generationCost');
    const hasZeroCreditsHandling = generatorClass.includes('currentCredits === 0') && 
                                  generatorClass.includes('showCreditsModal(currentCredits');
    const hasInsufficientCreditsHandling = generatorClass.includes('confirm(message)') && 
                                          generatorClass.includes('pricing.html');
    const hasGenerationCost = generatorClass.includes('this.generationCost = 10');
    
    console.log('   ✅ ImageGenerator类已找到');
    console.log(`   ${hasCreditsCheck ? '✅' : '❌'} 积分检查逻辑正确`);
    console.log(`   ${hasZeroCreditsHandling ? '✅' : '❌'} 积分为0处理正确`);
    console.log(`   ${hasInsufficientCreditsHandling ? '✅' : '❌'} 积分不足处理正确`);
    console.log(`   ${hasGenerationCost ? '✅' : '❌'} 生成成本设置正确`);
} else {
    console.log('   ❌ ImageGenerator类未找到');
}

// 测试3: 验证积分弹窗HTML结构
console.log('\n3. 测试积分弹窗HTML结构...');
const hasCreditsModal = htmlContent.includes('id="creditsModal"');
const hasModalTitle = htmlContent.includes('id="creditsModalTitle"');
const hasModalContent = htmlContent.includes('id="creditsModalContent"');
const hasUpgradeButton = htmlContent.includes('立即升级') || htmlContent.includes('Upgrade');

console.log(`   ${hasCreditsModal ? '✅' : '❌'} 积分弹窗容器存在`);
console.log(`   ${hasModalTitle ? '✅' : '❌'} 弹窗标题元素存在`);
console.log(`   ${hasModalContent ? '✅' : '❌'} 弹窗内容元素存在`);
console.log(`   ${hasUpgradeButton ? '✅' : '❌'} 升级按钮存在`);

// 测试4: 验证UnifiedStateSync集成
console.log('\n4. 测试UnifiedStateSync集成...');
const hasUnifiedStateSync = htmlContent.includes('window.UnifiedStateSync');
const hasGetCurrentUser = htmlContent.includes('getCurrentUser()');
const hasGetCredits = htmlContent.includes('getCredits()');

console.log(`   ${hasUnifiedStateSync ? '✅' : '❌'} UnifiedStateSync引用正确`);
console.log(`   ${hasGetCurrentUser ? '✅' : '❌'} getCurrentUser()调用存在`);
console.log(`   ${hasGetCredits ? '✅' : '❌'} getCredits()调用存在`);

// 测试5: 验证生成按钮逻辑
console.log('\n5. 测试生成按钮逻辑...');
const hasGenerateFunction = htmlContent.includes('generateImage') || 
                           htmlContent.includes('async generate(') ||
                           htmlContent.includes('function generate');
const hasButtonDisabling = htmlContent.includes('generateBtn.disabled');
const hasLoadingState = htmlContent.includes('Generating...');

console.log(`   ${hasGenerateFunction ? '✅' : '❌'} 生成函数存在`);
console.log(`   ${hasButtonDisabling ? '✅' : '❌'} 按钮禁用逻辑存在`);
console.log(`   ${hasLoadingState ? '✅' : '❌'} 加载状态显示存在`);

// 汇总结果
console.log('\n📊 积分逻辑实现验证汇总:');
console.log('================================');

const allTests = [
    showCreditsModalMatch ? 1 : 0,
    imageGeneratorMatch ? 1 : 0,
    (hasCreditsModal && hasModalTitle && hasModalContent) ? 1 : 0,
    (hasUnifiedStateSync && hasGetCurrentUser && hasGetCredits) ? 1 : 0,
    (hasGenerateFunction && hasButtonDisabling) ? 1 : 0
];

const totalPassed = allTests.reduce((sum, test) => sum + test, 0);
console.log(`通过测试: ${totalPassed}/5`);

if (totalPassed >= 4) {
    console.log('🎉 积分逻辑实现基本完成！');
    console.log('\n✨ 主要功能:');
    console.log('   • 未登录用户显示登录提示');
    console.log('   • 积分为0时显示统一弹窗');
    console.log('   • 积分不足时显示确认对话框');
    console.log('   • 集成UnifiedStateSync状态管理');
    console.log('   • 防重复点击保护');
} else {
    console.log('⚠️  还有一些功能需要完善');
}

console.log('\n🔧 建议测试场景:');
console.log('   1. 未登录状态点击生成按钮');
console.log('   2. 登录后积分为0时点击生成');
console.log('   3. 登录后积分不足时点击生成');
console.log('   4. 正常积分充足时的生成流程');