/**
 * Showcase页面布局改进验证脚本
 * 验证行距减少和按钮居中效果
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Showcase页面布局改进验证\n');

// 读取showcase.html文件
const showcasePath = path.join(__dirname, 'public', 'showcase.html');
const showcaseContent = fs.readFileSync(showcasePath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查showcase-controls的gap是否减少到10px（50%）
const controlsGapMatch = showcaseContent.match(/\.showcase-controls \{[\s\S]*?gap: (\d+)px;[\s\S]*?\}/);
if (controlsGapMatch) {
    const gapValue = parseInt(controlsGapMatch[1]);
    const isCorrectGap = gapValue === 10;
    console.log(`1. ${isCorrectGap ? '✅' : '❌'} 控制区域行距已减少到50% (${gapValue}px)`);
} else {
    console.log('1. ❌ 未找到showcase-controls的gap设置');
}

// 2. 检查action-btn是否有居中样式
const actionBtnMatch = showcaseContent.match(/\.action-btn \{[\s\S]*?\}/);
if (actionBtnMatch) {
    const btnStyles = actionBtnMatch[0];
    const hasFlexDisplay = btnStyles.includes('display: flex');
    const hasAlignItems = btnStyles.includes('align-items: center');
    const hasJustifyContent = btnStyles.includes('justify-content: center');
    const hasTextAlign = btnStyles.includes('text-align: center');
    
    console.log(`2. ${hasFlexDisplay ? '✅' : '❌'} 按钮使用flex布局`);
    console.log(`3. ${hasAlignItems ? '✅' : '❌'} 按钮垂直居中`);
    console.log(`4. ${hasJustifyContent ? '✅' : '❌'} 按钮水平居中`);
    console.log(`5. ${hasTextAlign ? '✅' : '❌'} 按钮文本居中`);
} else {
    console.log('2-5. ❌ 未找到action-btn样式');
}

// 3. 检查showcase-actions是否有完整的居中样式
const actionsMatch = showcaseContent.match(/\.showcase-actions \{[\s\S]*?\}/);
if (actionsMatch) {
    const actionsStyles = actionsMatch[0];
    const hasJustifyCenter = actionsStyles.includes('justify-content: center');
    const hasAlignCenter = actionsStyles.includes('align-items: center');
    const hasFullWidth = actionsStyles.includes('width: 100%');
    
    console.log(`6. ${hasJustifyCenter ? '✅' : '❌'} 按钮容器水平居中`);
    console.log(`7. ${hasAlignCenter ? '✅' : '❌'} 按钮容器垂直居中`);
    console.log(`8. ${hasFullWidth ? '✅' : '❌'} 按钮容器全宽`);
} else {
    console.log('6-8. ❌ 未找到showcase-actions样式');
}

// 4. 显示当前的CSS样式
console.log('\n📱 当前样式代码:');

if (controlsGapMatch) {
    console.log('\nshowcase-controls样式:');
    console.log('```css');
    console.log(controlsGapMatch[0]);
    console.log('```');
}

if (actionBtnMatch) {
    console.log('\naction-btn样式:');
    console.log('```css');
    console.log(actionBtnMatch[0]);
    console.log('```');
}

if (actionsMatch) {
    console.log('\nshowcase-actions样式:');
    console.log('```css');
    console.log(actionsMatch[0]);
    console.log('```');
}

// 5. 检查HTML结构
const startCreatingButtonMatch = showcaseContent.match(/<a href="index\.html#generator" class="action-btn primary">[\s\S]*?<\/a>/);
if (startCreatingButtonMatch) {
    console.log('\nStart Creating按钮HTML:');
    console.log('```html');
    console.log(startCreatingButtonMatch[0].replace(/\s+/g, ' ').trim());
    console.log('```');
    
    const hasIcon = startCreatingButtonMatch[0].includes('fas fa-rocket');
    const hasText = startCreatingButtonMatch[0].includes('Start Creating');
    console.log(`9. ${hasIcon ? '✅' : '❌'} 按钮包含图标`);
    console.log(`10. ${hasText ? '✅' : '❌'} 按钮包含文本`);
} else {
    console.log('9-10. ❌ 未找到Start Creating按钮');
}

// 6. 生成改进总结
console.log('\n📋 改进总结:');
console.log('');
console.log('布局优化:');
console.log('• 页面标识符和图片的行距从20px减少到10px (50%)');
console.log('• Start Creating按钮完全居中显示');
console.log('• 按钮内的图标和文本居中对齐');
console.log('• 按钮容器使用flex布局确保居中');
console.log('');
console.log('视觉效果:');
console.log('• 更紧凑的布局，减少视觉干扰');
console.log('• 更好的按钮对齐和视觉平衡');
console.log('• 保持响应式设计兼容性');

// 7. 检查移动端样式是否保持
const mobileStyleMatch = showcaseContent.match(/@media \(max-width: 768px\) \{[\s\S]*?\}/);
if (mobileStyleMatch) {
    const mobileStyles = mobileStyleMatch[0];
    const hasProgressHidden = mobileStyles.includes('.showcase-progress') && mobileStyles.includes('display: none !important');
    const hasCloseHidden = mobileStyles.includes('.close-btn') && mobileStyles.includes('display: none !important');
    const hasPauseHidden = mobileStyles.includes('.action-btn.secondary') && mobileStyles.includes('display: none !important');
    
    console.log('\n📱 移动端样式保持:');
    console.log(`11. ${hasProgressHidden ? '✅' : '❌'} 页码隐藏样式保持`);
    console.log(`12. ${hasCloseHidden ? '✅' : '❌'} X按钮隐藏样式保持`);
    console.log(`13. ${hasPauseHidden ? '✅' : '❌'} Pause按钮隐藏样式保持`);
} else {
    console.log('11-13. ❌ 移动端样式可能丢失');
}

// 8. 总结
const allChecks = [
    controlsGapMatch && parseInt(controlsGapMatch[1]) === 10,
    actionBtnMatch && actionBtnMatch[0].includes('display: flex'),
    actionBtnMatch && actionBtnMatch[0].includes('align-items: center'),
    actionBtnMatch && actionBtnMatch[0].includes('justify-content: center'),
    actionBtnMatch && actionBtnMatch[0].includes('text-align: center'),
    actionsMatch && actionsMatch[0].includes('justify-content: center'),
    actionsMatch && actionsMatch[0].includes('align-items: center'),
    actionsMatch && actionsMatch[0].includes('width: 100%'),
    startCreatingButtonMatch && startCreatingButtonMatch[0].includes('fas fa-rocket'),
    startCreatingButtonMatch && startCreatingButtonMatch[0].includes('Start Creating'),
    mobileStyleMatch && mobileStyleMatch[0].includes('.showcase-progress') && mobileStyleMatch[0].includes('display: none !important'),
    mobileStyleMatch && mobileStyleMatch[0].includes('.close-btn') && mobileStyleMatch[0].includes('display: none !important'),
    mobileStyleMatch && mobileStyleMatch[0].includes('.action-btn.secondary') && mobileStyleMatch[0].includes('display: none !important')
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！Showcase页面布局改进成功');
    console.log('');
    console.log('🎉 改进效果:');
    console.log('• 页面更加紧凑，视觉层次更清晰');
    console.log('• Start Creating按钮完美居中');
    console.log('• 按钮内容对齐优化');
    console.log('• 保持了移动端的隐藏功能');
} else {
    console.log('⚠️ 部分检查未通过，需要进一步调整');
}

console.log('\n🧪 测试建议:');
console.log('1. 访问 https://www.fluxkrea.me/showcase.html');
console.log('2. 观察页面标识符和图片之间的间距是否减少');
console.log('3. 确认Start Creating按钮是否完全居中');
console.log('4. 在移动端测试隐藏功能是否正常');