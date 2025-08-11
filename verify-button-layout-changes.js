/**
 * 按钮布局修改验证脚本
 * 验证按钮位置调整是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 按钮布局修改验证\n');

// 读取index.html文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查原来的🗑️清空和🎲速记按钮是否已删除
const hasOldClearButton = indexContent.includes('🗑️ 清空');
const hasOldRandomButton = indexContent.includes('🎲 随机') && indexContent.includes('secondary-btn');

console.log(`1. ${!hasOldClearButton ? '✅' : '❌'} 原🗑️清空按钮已删除`);
console.log(`2. ${!hasOldRandomButton ? '✅' : '❌'} 原🎲速记按钮已删除`);

// 2. 检查生成历史按钮是否移动到调试Generate右侧
const debugGenerateSection = indexContent.match(/debugGenerate[\s\S]*?showGenerationHistory/);
const historyButtonInDebugArea = debugGenerateSection !== null;

console.log(`3. ${historyButtonInDebugArea ? '✅' : '❌'} 生成历史按钮已移动到调试Generate右侧`);

// 3. 检查🎲速记按钮是否在Clear按钮右侧
const promptButtonsSection = indexContent.match(/clearPrompt[\s\S]*?randomPrompt/);
const randomButtonAfterClear = promptButtonsSection !== null;

console.log(`4. ${randomButtonAfterClear ? '✅' : '❌'} 🎲速记按钮已移动到Clear按钮右侧`);

// 4. 检查按钮是否使用了相同的样式类
const newRandomButtonUsesCorrectClass = indexContent.includes('class="clear-btn" onclick="randomPrompt()"');

console.log(`5. ${newRandomButtonUsesCorrectClass ? '✅' : '❌'} 🎲速记按钮使用了与Clear按钮相同的样式`);

// 5. 检查按钮是否右对齐
const hasRightAlignment = indexContent.includes('justify-content: flex-end');

console.log(`6. ${hasRightAlignment ? '✅' : '❌'} 提示词按钮区域右对齐`);

// 6. 检查调试按钮是否使用了flex布局
const debugButtonsUseFlex = indexContent.includes('display: flex; gap: 10px') && 
                           indexContent.includes('debugGenerate') && 
                           indexContent.includes('showGenerationHistory');

console.log(`7. ${debugButtonsUseFlex ? '✅' : '❌'} 调试按钮区域使用flex布局`);

// 7. 显示当前的按钮布局
console.log('\n📱 当前按钮布局:');

// 提示词区域按钮
const promptButtonsMatch = indexContent.match(/<div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">[\s\S]*?<\/div>/);
if (promptButtonsMatch) {
    console.log('\n提示词区域按钮:');
    console.log('```html');
    console.log(promptButtonsMatch[0].replace(/\s+/g, ' ').trim());
    console.log('```');
}

// 调试区域按钮
const debugButtonsMatch = indexContent.match(/<div style="display: flex; gap: 10px; margin-top: 10px;">[\s\S]*?<\/div>/);
if (debugButtonsMatch) {
    console.log('\n调试区域按钮:');
    console.log('```html');
    console.log(debugButtonsMatch[0].replace(/\s+/g, ' ').trim());
    console.log('```');
}

// 8. 检查secondary-actions区域是否只剩生成历史按钮
const secondaryActionsMatch = indexContent.match(/<div class="secondary-actions"[\s\S]*?<\/div>/);
const onlyHistoryInSecondary = secondaryActionsMatch && 
                              !secondaryActionsMatch[0].includes('🗑️') && 
                              !secondaryActionsMatch[0].includes('🎲') &&
                              !secondaryActionsMatch[0].includes('showGenerationHistory');

console.log(`8. ${onlyHistoryInSecondary ? '✅' : '❌'} secondary-actions区域已清理`);

// 9. 生成布局说明
console.log('\n📐 新的布局结构:');
console.log('');
console.log('1. 提示词输入框区域:');
console.log('   • Paste按钮 | Clear按钮 | 🎲随机按钮 (右对齐)');
console.log('');
console.log('2. 调试区域:');
console.log('   • 🐛调试Generate按钮 | 📚生成历史按钮 (并排显示)');
console.log('');
console.log('3. secondary-actions区域:');
console.log('   • 已清理，移除了重复的按钮');

// 10. 总结
const allChecks = [
    !hasOldClearButton,
    !hasOldRandomButton,
    historyButtonInDebugArea,
    randomButtonAfterClear,
    newRandomButtonUsesCorrectClass,
    hasRightAlignment,
    debugButtonsUseFlex,
    onlyHistoryInSecondary
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！按钮布局修改成功');
    console.log('');
    console.log('🎉 修改完成:');
    console.log('• 删除了原来的🗑️清空和🎲速记按钮');
    console.log('• 🎲速记按钮移动到Clear按钮右侧，样式一致');
    console.log('• 📚生成历史按钮移动到调试Generate右侧');
    console.log('• 所有按钮都正确对齐和布局');
} else {
    console.log('⚠️ 部分检查未通过，需要进一步调整');
}

console.log('\n🧪 测试建议:');
console.log('1. 访问首页，检查提示词输入框右侧的按钮布局');
console.log('2. 确认🎲随机按钮与Clear按钮样式一致');
console.log('3. 检查调试区域的两个按钮是否并排显示');
console.log('4. 测试所有按钮的功能是否正常工作');