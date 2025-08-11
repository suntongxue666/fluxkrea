/**
 * 积分样式统一验证脚本
 * 验证首页和Pricing页面的积分显示样式是否完全统一
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 积分样式统一验证\n');

// 读取两个页面的文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const pricingPath = path.join(__dirname, 'public', 'pricing.html');

const indexContent = fs.readFileSync(indexPath, 'utf8');
const pricingContent = fs.readFileSync(pricingPath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查两个页面的积分显示CSS样式是否一致
const extractCreditsDisplayCSS = (content) => {
    const match = content.match(/\.credits-display \{[\s\S]*?\}/);
    return match ? match[0] : null;
};

const extractCreditsIconCSS = (content) => {
    const match = content.match(/\.credits-display i \{[\s\S]*?\}/);
    return match ? match[0] : null;
};

const indexCreditsCSS = extractCreditsDisplayCSS(indexContent);
const pricingCreditsCSS = extractCreditsDisplayCSS(pricingContent);
const indexIconCSS = extractCreditsIconCSS(indexContent);
const pricingIconCSS = extractCreditsIconCSS(pricingContent);

console.log(`1. ${indexCreditsCSS === pricingCreditsCSS ? '✅' : '❌'} 积分显示CSS样式一致`);
console.log(`2. ${indexIconCSS === pricingIconCSS ? '✅' : '❌'} 积分图标CSS样式一致`);

// 2. 检查HTML结构是否都有icon
const indexHasIcon = indexContent.includes('<i class="fas fa-coins"></i>');
const pricingHasIcon = pricingContent.includes('<i class="fas fa-coins"></i>');

console.log(`3. ${indexHasIcon ? '✅' : '❌'} 首页积分显示有图标`);
console.log(`4. ${pricingHasIcon ? '✅' : '❌'} Pricing页面积分显示有图标`);

// 3. 检查是否都有creditsAmount元素
const indexHasAmount = indexContent.includes('<span id="creditsAmount">');
const pricingHasAmount = pricingContent.includes('<span id="creditsAmount">');

console.log(`5. ${indexHasAmount ? '✅' : '❌'} 首页有积分数字显示`);
console.log(`6. ${pricingHasAmount ? '✅' : '❌'} Pricing页面有积分数字显示`);

// 4. 检查是否移除了H5端特殊样式
const indexHasH5Style = indexContent.includes('background: none !important');
const pricingHasH5Style = pricingContent.includes('background: none !important');

console.log(`7. ${!indexHasH5Style ? '✅' : '❌'} 首页已移除H5端特殊样式`);
console.log(`8. ${!pricingHasH5Style ? '✅' : '❌'} Pricing页面已移除H5端特殊样式`);

// 5. 显示当前的CSS样式
console.log('\n📱 当前积分显示CSS样式:');
if (indexCreditsCSS) {
    console.log('```css');
    console.log(indexCreditsCSS);
    console.log('```');
}

if (indexIconCSS) {
    console.log('```css');
    console.log(indexIconCSS);
    console.log('```');
}

// 6. 检查样式特征
const hasBlueBackground = indexCreditsCSS && indexCreditsCSS.includes('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
const hasWhiteText = indexCreditsCSS && indexCreditsCSS.includes('color: white');
const hasRoundedCorners = indexCreditsCSS && indexCreditsCSS.includes('border-radius: 20px');
const hasGoldIcon = indexIconCSS && indexIconCSS.includes('color: #ffd700');

console.log('\n🎨 样式特征检查:');
console.log(`• ${hasBlueBackground ? '✅' : '❌'} 蓝紫色渐变背景`);
console.log(`• ${hasWhiteText ? '✅' : '❌'} 白色文字`);
console.log(`• ${hasRoundedCorners ? '✅' : '❌'} 圆角边框`);
console.log(`• ${hasGoldIcon ? '✅' : '❌'} 金色图标`);

// 7. 生成HTML结构对比
console.log('\n📄 HTML结构对比:');
console.log('');
console.log('首页积分显示:');
const indexCreditsHTML = indexContent.match(/<div class="credits-display"[^>]*>[\s\S]*?<\/div>/);
if (indexCreditsHTML) {
    console.log(indexCreditsHTML[0].replace(/\s+/g, ' ').trim());
}

console.log('');
console.log('Pricing页面积分显示:');
const pricingCreditsHTML = pricingContent.match(/<div class="credits-display"[^>]*>[\s\S]*?<\/div>/);
if (pricingCreditsHTML) {
    console.log(pricingCreditsHTML[0].replace(/\s+/g, ' ').trim());
}

// 8. 总结
const allChecks = [
    indexCreditsCSS === pricingCreditsCSS,
    indexIconCSS === pricingIconCSS,
    indexHasIcon,
    pricingHasIcon,
    indexHasAmount,
    pricingHasAmount,
    !indexHasH5Style,
    !pricingHasH5Style,
    hasBlueBackground,
    hasWhiteText,
    hasRoundedCorners,
    hasGoldIcon
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！积分显示样式已完全统一');
    console.log('');
    console.log('🎉 当前效果:');
    console.log('• 首页和Pricing页面积分显示样式完全一致');
    console.log('• 都有金色的coins图标');
    console.log('• 都有蓝紫色渐变背景');
    console.log('• 都有白色文字和圆角边框');
    console.log('• 在所有设备上都保持一致的视觉效果');
} else {
    console.log('⚠️ 部分检查未通过，需要进一步调整');
}

console.log('\n🧪 测试建议:');
console.log('1. 在桌面浏览器中分别访问首页和Pricing页面');
console.log('2. 对比两个页面的积分显示是否完全一致');
console.log('3. 在移动设备上测试，确认样式保持一致');
console.log('4. 检查图标是否正确显示为金色coins图标');