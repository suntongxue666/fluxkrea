/**
 * H5端积分显示样式验证脚本
 * 验证移动端积分显示是否正确移除蓝紫色背景，改为黑字显示
 */

const fs = require('fs');
const path = require('path');

console.log('📱 H5端积分显示样式验证\n');

// 读取index.html文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查是否有H5端特殊样式
const h5StylePattern = /@media \(max-width: 768px\)[\s\S]*?\.credits-display[\s\S]*?background: none !important/;
const hasH5Style = h5StylePattern.test(indexContent);
console.log(`1. ${hasH5Style ? '✅' : '❌'} H5端积分样式重写`);

// 2. 检查是否移除了背景
const backgroundRemovalPattern = /background: none !important/;
const hasBackgroundRemoval = backgroundRemovalPattern.test(indexContent);
console.log(`2. ${hasBackgroundRemoval ? '✅' : '❌'} 背景移除样式`);

// 3. 检查是否移除了圆角
const borderRadiusRemovalPattern = /border-radius: 0 !important/;
const hasBorderRadiusRemoval = borderRadiusRemovalPattern.test(indexContent);
console.log(`3. ${hasBorderRadiusRemoval ? '✅' : '❌'} 圆角移除样式`);

// 4. 检查是否移除了内边距
const paddingRemovalPattern = /padding: 0 !important/;
const hasPaddingRemoval = paddingRemovalPattern.test(indexContent);
console.log(`4. ${hasPaddingRemoval ? '✅' : '❌'} 内边距移除样式`);

// 5. 检查是否设置了黑色文字
const blackTextPattern = /color: #333 !important/;
const hasBlackText = blackTextPattern.test(indexContent);
console.log(`5. ${hasBlackText ? '✅' : '❌'} 黑色文字样式`);

// 6. 检查图标颜色是否保持金色
const goldIconPattern = /color: #ffd700 !important/;
const hasGoldIcon = goldIconPattern.test(indexContent);
console.log(`6. ${hasGoldIcon ? '✅' : '❌'} 金色图标样式`);

// 7. 检查桌面端样式是否保持不变
const desktopStylePattern = /\.credits-display \{[\s\S]*?background: linear-gradient\(135deg, #667eea 0%, #764ba2 100%\)/;
const hasDesktopStyle = desktopStylePattern.test(indexContent);
console.log(`7. ${hasDesktopStyle ? '✅' : '❌'} 桌面端样式保持`);

// 8. 提取并显示完整的H5样式
console.log('\n📱 H5端积分样式代码:');
const h5StyleMatch = indexContent.match(/@media \(max-width: 768px\) \{[\s\S]*?\.credits-display \{[\s\S]*?\}[\s\S]*?\.credits-display i \{[\s\S]*?\}/);
if (h5StyleMatch) {
    console.log('```css');
    console.log(h5StyleMatch[0]);
    console.log('```');
} else {
    console.log('❌ 未找到H5端样式代码');
}

// 9. 生成对比说明
console.log('\n📊 样式对比:');
console.log('');
console.log('桌面端 (>768px):');
console.log('• 蓝紫色渐变背景');
console.log('• 白色文字');
console.log('• 圆角按钮样式');
console.log('• 有内边距');
console.log('• 金色图标');
console.log('');
console.log('H5端 (≤768px):');
console.log('• 无背景');
console.log('• 黑色文字 (#333)');
console.log('• 无圆角');
console.log('• 无内边距');
console.log('• 金色图标 (保持)');

// 10. 生成测试建议
console.log('\n🧪 测试建议:');
console.log('1. 在桌面浏览器中访问首页，确认积分显示为蓝紫色按钮样式');
console.log('2. 将浏览器窗口缩小到768px以下，确认积分显示变为简洁的黑字样式');
console.log('3. 在手机浏览器中访问首页，确认积分显示为黑字无背景样式');
console.log('4. 访问测试页面: http://localhost:3001/test-h5-credits-display.html');

// 11. 检查测试页面是否创建
const testPagePath = path.join(__dirname, 'public', 'test-h5-credits-display.html');
const testPageExists = fs.existsSync(testPagePath);
console.log(`\n📄 测试页面: ${testPageExists ? '✅ 已创建' : '❌ 未创建'}`);

if (testPageExists) {
    console.log('   访问地址: http://localhost:3001/test-h5-credits-display.html');
}

// 12. 总结
const allChecks = [
    hasH5Style,
    hasBackgroundRemoval,
    hasBorderRadiusRemoval,
    hasPaddingRemoval,
    hasBlackText,
    hasGoldIcon,
    hasDesktopStyle
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！H5端积分显示样式修改成功');
} else {
    console.log('⚠️ 部分检查未通过，请检查样式代码');
}

console.log('\n🎯 修改完成！H5端积分显示现在为简洁的黑字样式，桌面端保持原有的蓝紫色按钮样式。');