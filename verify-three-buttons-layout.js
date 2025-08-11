/**
 * 三按钮布局验证脚本
 * 验证检查用户状态、调试Generate、生成历史三个按钮是否在一排
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 三按钮布局验证\n');

// 读取index.html文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查三个按钮是否在同一个flex容器中
const threeButtonsInFlex = indexContent.match(/<div style="display: flex; gap: 10px; margin-top: 10px;">[\s\S]*?checkUserState[\s\S]*?debugGenerate[\s\S]*?showGenerationHistory[\s\S]*?<\/div>/);

console.log(`1. ${threeButtonsInFlex ? '✅' : '❌'} 三个按钮在同一个flex容器中`);

// 2. 检查按钮顺序是否正确
const correctOrder = threeButtonsInFlex && 
                    threeButtonsInFlex[0].indexOf('checkUserState') < threeButtonsInFlex[0].indexOf('debugGenerate') &&
                    threeButtonsInFlex[0].indexOf('debugGenerate') < threeButtonsInFlex[0].indexOf('showGenerationHistory');

console.log(`2. ${correctOrder ? '✅' : '❌'} 按钮顺序正确 (检查用户状态 → 调试Generate → 生成历史)`);

// 3. 检查每个按钮的样式是否一致
const buttonStyles = [
    threeButtonsInFlex && threeButtonsInFlex[0].includes('background: #6f42c1'), // 检查用户状态 - 紫色
    threeButtonsInFlex && threeButtonsInFlex[0].includes('background: #dc3545'), // 调试Generate - 红色
    threeButtonsInFlex && threeButtonsInFlex[0].includes('background: #28a745')  // 生成历史 - 绿色
];

console.log(`3. ${buttonStyles[0] ? '✅' : '❌'} 检查用户状态按钮样式正确 (紫色)`);
console.log(`4. ${buttonStyles[1] ? '✅' : '❌'} 调试Generate按钮样式正确 (红色)`);
console.log(`5. ${buttonStyles[2] ? '✅' : '❌'} 生成历史按钮样式正确 (绿色)`);

// 4. 检查按钮图标是否正确
const buttonIcons = [
    threeButtonsInFlex && threeButtonsInFlex[0].includes('👤 检查用户状态'),
    threeButtonsInFlex && threeButtonsInFlex[0].includes('🐛 调试Generate'),
    threeButtonsInFlex && threeButtonsInFlex[0].includes('📚 生成历史')
];

console.log(`6. ${buttonIcons[0] ? '✅' : '❌'} 检查用户状态按钮图标正确 (👤)`);
console.log(`7. ${buttonIcons[1] ? '✅' : '❌'} 调试Generate按钮图标正确 (🐛)`);
console.log(`8. ${buttonIcons[2] ? '✅' : '❌'} 生成历史按钮图标正确 (📚)`);

// 5. 显示当前的三按钮布局
console.log('\n📱 当前三按钮布局:');
if (threeButtonsInFlex) {
    console.log('```html');
    // 格式化显示，每个按钮一行
    const formatted = threeButtonsInFlex[0]
        .replace(/>\s*<button/g, '>\n    <button')
        .replace(/<\/div>/, '\n</div>');
    console.log(formatted);
    console.log('```');
}

// 6. 检查提示词区域的按钮布局
const promptButtons = indexContent.match(/<div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">[\s\S]*?<\/div>/);
const hasPromptButtons = promptButtons && 
                        promptButtons[0].includes('pastePrompt') &&
                        promptButtons[0].includes('clearPrompt') &&
                        promptButtons[0].includes('randomPrompt');

console.log(`\n9. ${hasPromptButtons ? '✅' : '❌'} 提示词区域按钮布局正确`);

// 7. 生成布局总结
console.log('\n📐 当前完整布局:');
console.log('');
console.log('1. 提示词输入框区域 (右对齐):');
console.log('   📋 Paste | 🗑️ Clear | 🎲 随机');
console.log('');
console.log('2. 调试功能区域 (一排显示):');
console.log('   👤 检查用户状态 | 🐛 调试Generate | 📚 生成历史');
console.log('');
console.log('3. 按钮颜色方案:');
console.log('   • 检查用户状态: 紫色 (#6f42c1)');
console.log('   • 调试Generate: 红色 (#dc3545)');
console.log('   • 生成历史: 绿色 (#28a745)');

// 8. 总结
const allChecks = [
    threeButtonsInFlex !== null,
    correctOrder,
    ...buttonStyles,
    ...buttonIcons,
    hasPromptButtons
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！三按钮布局完美');
    console.log('');
    console.log('🎉 布局特点:');
    console.log('• 三个调试按钮整齐排列在一行');
    console.log('• 每个按钮都有独特的颜色和图标');
    console.log('• 提示词区域按钮右对齐');
    console.log('• 所有按钮尺寸一致，间距合理');
} else {
    console.log('⚠️ 部分检查未通过，需要进一步调整');
}

console.log('\n🧪 测试建议:');
console.log('1. 访问首页，查看调试区域的三个按钮是否在一排');
console.log('2. 确认按钮颜色：紫色、红色、绿色');
console.log('3. 测试每个按钮的功能是否正常');
console.log('4. 检查在不同屏幕尺寸下的显示效果');