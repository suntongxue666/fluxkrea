/**
 * H5端logo样式验证脚本
 * 验证移动端logo的字号、图标尺寸和间距调整
 */

const fs = require('fs');
const path = require('path');

console.log('📱 H5端logo样式验证\n');

// 读取index.html文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查H5端logo字号是否设置为16px
const h5LogoFontSize = indexContent.includes('@media (max-width: 768px)') && 
                      indexContent.includes('.logo {') && 
                      indexContent.includes('font-size: 16px;');

console.log(`1. ${h5LogoFontSize ? '✅' : '❌'} H5端logo字号设置为16px`);

// 2. 检查H5端logo图标尺寸是否设置为32x32
const h5LogoIconSize = indexContent.includes('.logo-icon {') && 
                      indexContent.includes('width: 32px;') && 
                      indexContent.includes('height: 32px;');

console.log(`2. ${h5LogoIconSize ? '✅' : '❌'} H5端logo图标尺寸设置为32x32`);

// 3. 检查H5端logo图标间距是否减少50%到6px
const h5LogoIconMargin = indexContent.includes('margin-right: 6px;');

console.log(`3. ${h5LogoIconMargin ? '✅' : '❌'} H5端logo图标间距设置为6px`);

// 4. 检查桌面端默认样式是否保持不变
const desktopLogoFontSize = indexContent.match(/\.logo \{[\s\S]*?font-size: 20px;/);
const desktopLogoIconSize = indexContent.match(/\.logo-icon \{[\s\S]*?width: 36px;[\s\S]*?height: 36px;/);
const desktopLogoIconMargin = indexContent.match(/\.logo-icon \{[\s\S]*?margin-right: 12px;/);

console.log(`4. ${desktopLogoFontSize ? '✅' : '❌'} 桌面端logo字号保持20px`);
console.log(`5. ${desktopLogoIconSize ? '✅' : '❌'} 桌面端logo图标保持36x36`);
console.log(`6. ${desktopLogoIconMargin ? '✅' : '❌'} 桌面端logo图标间距保持12px`);

// 5. 提取并显示H5端样式代码
console.log('\n📱 H5端logo样式代码:');
const h5StyleMatch = indexContent.match(/@media \(max-width: 768px\) \{[\s\S]*?\/\* H5端logo字号调整 \*\/[\s\S]*?\.logo-icon \{[\s\S]*?\}/);
if (h5StyleMatch) {
    console.log('```css');
    // 提取logo相关的样式
    const logoStyles = h5StyleMatch[0].match(/(\/\* H5端logo.*?\*\/[\s\S]*?\.logo-icon \{[\s\S]*?\})/);
    if (logoStyles) {
        console.log(logoStyles[1]);
    }
    console.log('```');
} else {
    console.log('❌ 未找到H5端logo样式代码');
}

// 6. 生成样式对比
console.log('\n📊 样式对比:');
console.log('');
console.log('桌面端 (>768px):');
console.log('• Logo字号: 20px');
console.log('• 图标尺寸: 36x36px');
console.log('• 图标间距: 12px');
console.log('');
console.log('H5端 (≤768px):');
console.log('• Logo字号: 16px (-4px)');
console.log('• 图标尺寸: 32x32px (-4px)');
console.log('• 图标间距: 6px (-50%)');

// 7. 检查HTML结构
const logoHTML = indexContent.match(/<a href="#" class="logo">[\s\S]*?<\/a>/);
console.log('\n📄 Logo HTML结构:');
if (logoHTML) {
    console.log('```html');
    console.log(logoHTML[0].replace(/\s+/g, ' ').trim());
    console.log('```');
}

// 8. 总结
const allChecks = [
    h5LogoFontSize,
    h5LogoIconSize,
    h5LogoIconMargin,
    desktopLogoFontSize !== null,
    desktopLogoIconSize !== null,
    desktopLogoIconMargin !== null
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！H5端logo样式调整成功');
    console.log('');
    console.log('🎉 调整效果:');
    console.log('• H5端logo更加紧凑，适合小屏幕显示');
    console.log('• 图标尺寸适中，保持清晰度');
    console.log('• 间距减少，节省宝贵的移动端空间');
    console.log('• 桌面端样式保持不变，确保一致性');
} else {
    console.log('⚠️ 部分检查未通过，需要进一步调整');
}

console.log('\n🧪 测试建议:');
console.log('1. 在桌面浏览器中访问首页，确认logo显示正常');
console.log('2. 将浏览器窗口缩小到768px以下，观察logo变化');
console.log('3. 在手机浏览器中访问首页，确认logo大小合适');
console.log('4. 检查logo图标的清晰度和对齐效果');

console.log('\n💡 设计说明:');
console.log('• 字号从20px减少到16px，更适合移动端阅读');
console.log('• 图标从36x36减少到32x32，保持比例协调');
console.log('• 间距从12px减少到6px，提高空间利用率');
console.log('• 响应式设计确保在不同设备上的最佳显示效果');