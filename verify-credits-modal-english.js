/**
 * 积分弹窗英文文案验证脚本
 * 验证所有积分相关的文案是否已改为英文
 */

const fs = require('fs');
const path = require('path');

console.log('🌐 积分弹窗英文文案验证\n');

// 读取index.html文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查showCreditsModal函数中的英文文案
const showCreditsModalMatch = indexContent.match(/window\.showCreditsModal\s*=\s*function[\s\S]*?};/);
if (showCreditsModalMatch) {
    const modalFunction = showCreditsModalMatch[0];
    
    const englishChecks = [
        { name: '未登录标题', pattern: /Get Free Credits/, expected: true },
        { name: '未登录内容', pattern: /Get 20 free credits on your first login/, expected: true },
        { name: '积分为0标题', pattern: /Insufficient Credits/, expected: true },
        { name: '积分为0内容', pattern: /You have run out of credits/, expected: true },
        { name: '积分不足内容', pattern: /Current credits.*Generating images requires/, expected: true }
    ];
    
    englishChecks.forEach(check => {
        const result = check.pattern.test(modalFunction);
        console.log(`1. ${result === check.expected ? '✅' : '❌'} showCreditsModal - ${check.name}`);
    });
} else {
    console.log('1. ❌ 未找到showCreditsModal函数');
}

// 2. 检查HTML中的积分弹窗默认文案
const htmlModalChecks = [
    { name: 'HTML弹窗标题1', pattern: /Credits balance is 20/, expected: true },
    { name: 'HTML弹窗内容1', pattern: /Sign in with Google to Gain Free 20 Credits/, expected: true },
    { name: 'HTML弹窗标题2', pattern: /Insufficient Credits/, expected: true },
    { name: 'HTML弹窗内容2', pattern: /You don't have enough credits to generate images/, expected: true },
    { name: 'HTML按钮文案', pattern: /Upgrade Now.*Close/, expected: true }
];

htmlModalChecks.forEach(check => {
    const result = check.pattern.test(indexContent);
    console.log(`2. ${result === check.expected ? '✅' : '❌'} HTML默认文案 - ${check.name}`);
});

// 3. 检查ImageGenerator中的confirm对话框
const confirmDialogChecks = [
    { name: 'confirm对话框', pattern: /Insufficient Credits!.*Current credits.*Required credits.*Missing credits.*Click OK to go to Pricing page/, expected: true },
    { name: '继续生成提示', pattern: /Detected a previous generation task interrupted.*Would you like to continue generating now/, expected: true }
];

confirmDialogChecks.forEach(check => {
    const result = check.pattern.test(indexContent);
    console.log(`3. ${result === check.expected ? '✅' : '❌'} 确认对话框 - ${check.name}`);
});

// 4. 检查是否还有中文积分相关文案
const chinesePatterns = [
    /积分不足/,
    /您的积分/,
    /当前积分/,
    /需要积分/,
    /缺少积分/,
    /购买积分/,
    /立即升级/,
    /关闭/,
    /获取.*积分/,
    /免费积分/
];

const remainingChinese = [];
chinesePatterns.forEach(pattern => {
    if (pattern.test(indexContent)) {
        remainingChinese.push(pattern.toString());
    }
});

console.log(`4. ${remainingChinese.length === 0 ? '✅' : '❌'} 无剩余中文积分文案`);
if (remainingChinese.length > 0) {
    console.log(`   发现剩余中文模式: ${remainingChinese.join(', ')}`);
}

// 5. 显示当前的英文文案示例
console.log('\n📱 当前英文文案示例:');

// 提取showCreditsModal中的文案
const titleMatches = indexContent.match(/title\.textContent = '([^']+)'/g);
const contentMatches = indexContent.match(/Get \d+ free credits on your first login|You have run out of credits|Current credits.*Generating images requires/g);

if (titleMatches) {
    console.log('\n标题文案:');
    titleMatches.forEach(match => {
        const title = match.match(/'([^']+)'/)[1];
        console.log(`• ${title}`);
    });
}

if (contentMatches) {
    console.log('\n内容文案:');
    contentMatches.forEach(content => {
        console.log(`• ${content.substring(0, 50)}...`);
    });
}

// 6. 检查按钮文案
const buttonTextChecks = [
    { name: 'Sign in按钮', pattern: /Sign in/, expected: true },
    { name: 'Upgrade Now按钮', pattern: /Upgrade Now/, expected: true },
    { name: 'Close按钮', pattern: /Close/, expected: true }
];

buttonTextChecks.forEach(check => {
    const result = check.pattern.test(indexContent);
    console.log(`5. ${result === check.expected ? '✅' : '❌'} 按钮文案 - ${check.name}`);
});

// 7. 生成文案对照表
console.log('\n📋 中英文对照表:');
console.log('');
console.log('标题文案:');
console.log('• 获取免费积分 → Get Free Credits');
console.log('• 积分不足 → Insufficient Credits');
console.log('');
console.log('内容文案:');
console.log('• 首次登录即可获得20个免费积分 → Get 20 free credits on your first login');
console.log('• 您的积分已用完 → You have run out of credits');
console.log('• 当前积分 → Current credits');
console.log('• 生成图片需要X积分 → Generating images requires X credits');
console.log('');
console.log('按钮文案:');
console.log('• 立即升级 → Upgrade Now');
console.log('• 关闭 → Close');

// 8. 总结
const modalFunctionText = showCreditsModalMatch ? showCreditsModalMatch[0] : '';
const englishChecks = [
    { name: '未登录标题', pattern: /Get Free Credits/, expected: true },
    { name: '未登录内容', pattern: /Get 20 free credits on your first login/, expected: true },
    { name: '积分为0标题', pattern: /Insufficient Credits/, expected: true },
    { name: '积分为0内容', pattern: /You have run out of credits/, expected: true },
    { name: '积分不足内容', pattern: /Current credits.*Generating images requires/, expected: true }
];

const allChecks = [
    ...englishChecks.map(c => c.pattern.test(modalFunctionText)),
    ...htmlModalChecks.map(c => c.pattern.test(indexContent)),
    ...confirmDialogChecks.map(c => c.pattern.test(indexContent)),
    remainingChinese.length === 0,
    ...buttonTextChecks.map(c => c.pattern.test(indexContent))
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！积分弹窗文案已全部改为英文');
    console.log('');
    console.log('🎉 英文化完成:');
    console.log('• showCreditsModal函数中的所有文案已英文化');
    console.log('• HTML默认弹窗文案已英文化');
    console.log('• confirm对话框文案已英文化');
    console.log('• 按钮文案已英文化');
    console.log('• 无剩余中文积分相关文案');
} else {
    console.log('⚠️ 部分检查未通过，可能还有中文文案需要修改');
}

console.log('\n🧪 测试建议:');
console.log('1. 测试未登录用户点击Generate时的弹窗文案');
console.log('2. 测试积分为0时的弹窗文案');
console.log('3. 测试积分不足但不为0时的confirm对话框');
console.log('4. 检查所有按钮的文案是否为英文');