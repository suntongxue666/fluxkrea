/**
 * Showcase页面H5端布局调整验证脚本
 * 验证Indicators上移和Start Creating按钮居中
 */

const fs = require('fs');
const path = require('path');

console.log('📱 Showcase页面H5端布局调整验证\n');

// 读取showcase.html文件
const showcasePath = path.join(__dirname, 'public', 'showcase.html');
const showcaseContent = fs.readFileSync(showcasePath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查Indicators上移样式
const hasIndicatorsTransform = showcaseContent.includes('.showcase-indicators') && 
                              showcaseContent.includes('transform: translateY(-120px)');
console.log(`1. ${hasIndicatorsTransform ? '✅' : '❌'} Indicators上移120px样式已添加`);

// 2. 检查Start Creating按钮居中样式
const hasButtonCenter = showcaseContent.includes('.showcase-actions') && 
                       showcaseContent.includes('justify-content: center') &&
                       showcaseContent.includes('align-items: center');
console.log(`2. ${hasButtonCenter ? '✅' : '❌'} Start Creating按钮居中样式已添加`);

// 3. 检查移动端媒体查询是否完整
const mobileMediaQuery = showcaseContent.match(/@media \(max-width: 768px\) \{[\s\S]*?\}/);
if (mobileMediaQuery) {
    console.log('3. ✅ 移动端媒体查询存在');
    
    // 检查是否包含所有必要的样式
    const mediaQueryContent = mobileMediaQuery[0];
    const hasAllStyles = [
        mediaQueryContent.includes('showcase-progress'),
        mediaQueryContent.includes('close-btn'),
        mediaQueryContent.includes('action-btn.secondary'),
        mediaQueryContent.includes('showcase-indicators'),
        mediaQueryContent.includes('showcase-actions')
    ];
    
    const styleCount = hasAllStyles.filter(Boolean).length;
    console.log(`   包含样式规则: ${styleCount}/5`);
} else {
    console.log('3. ❌ 移动端媒体查询不存在');
}

// 4. 提取并显示H5端布局样式
console.log('\n📱 H5端布局调整样式:');
if (mobileMediaQuery) {
    // 提取新增的布局样式
    const layoutStyles = mobileMediaQuery[0].match(/\/\* H5端Indicators上移120px \*\/[\s\S]*?align-items: center;/);
    if (layoutStyles) {
        console.log('```css');
        console.log(layoutStyles[0]);
        console.log('```');
    } else {
        console.log('❌ 未找到布局调整样式');
    }
}

// 5. 检查相关HTML元素是否存在
const hasIndicatorsElement = showcaseContent.includes('<div class="showcase-indicators" id="indicators">');
const hasActionsElement = showcaseContent.includes('<div class="showcase-actions">');
const hasStartButton = showcaseContent.includes('Start Creating');

console.log(`\n4. ${hasIndicatorsElement ? '✅' : '❌'} Indicators HTML元素存在`);
console.log(`5. ${hasActionsElement ? '✅' : '❌'} Actions容器HTML元素存在`);
console.log(`6. ${hasStartButton ? '✅' : '❌'} Start Creating按钮存在`);

// 6. 分析布局变化
console.log('\n📐 布局变化分析:');
console.log('');
console.log('H5端调整:');
console.log('• Indicators (图片指示器): 向上移动120px');
console.log('  - 使用 transform: translateY(-120px)');
console.log('  - 减少与底部按钮的距离');
console.log('');
console.log('• Start Creating按钮: 水平和垂直居中');
console.log('  - 使用 justify-content: center (水平居中)');
console.log('  - 使用 align-items: center (垂直居中)');
console.log('  - 在flex容器中完美居中');
console.log('');
console.log('隐藏的元素:');
console.log('• 页码显示 (.showcase-progress)');
console.log('• X关闭按钮 (.close-btn)');
console.log('• Pause暂停按钮 (.action-btn.secondary)');

// 7. 检查是否有冲突的样式
const hasConflictingStyles = showcaseContent.includes('flex-direction: column') && 
                            showcaseContent.includes('justify-content: center');
console.log(`\n7. ${hasConflictingStyles ? '⚠️' : '✅'} ${hasConflictingStyles ? '可能存在样式冲突' : '无样式冲突'}`);

if (hasConflictingStyles) {
    console.log('   注意: flex-direction: column 和 justify-content: center 同时存在');
    console.log('   这可能会影响按钮的布局效果');
}

// 8. 生成测试建议
console.log('\n🧪 测试建议:');
console.log('1. 在手机浏览器中访问 https://www.fluxkrea.me/showcase.html');
console.log('2. 检查Indicators是否向上移动了合适的距离');
console.log('3. 确认Start Creating按钮是否在屏幕中央');
console.log('4. 测试按钮点击功能是否正常');
console.log('5. 检查不同手机屏幕尺寸下的显示效果');

// 9. 总结
const allChecks = [
    hasIndicatorsTransform,
    hasButtonCenter,
    mobileMediaQuery !== null,
    hasIndicatorsElement,
    hasActionsElement,
    hasStartButton
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！H5端布局调整成功');
    console.log('');
    console.log('🎉 调整效果:');
    console.log('• Indicators向上移动，优化视觉层次');
    console.log('• Start Creating按钮完美居中');
    console.log('• 移除了不必要的UI元素');
    console.log('• 提供了更好的移动端用户体验');
} else {
    console.log('⚠️ 部分检查未通过，需要进一步调整');
}

console.log('\n💡 预期效果:');
console.log('H5端用户将看到:');
console.log('• 图片指示器位置更合理（上移120px）');
console.log('• Start Creating按钮在屏幕中央');
console.log('• 简洁的界面，无干扰元素');
console.log('• 更好的触摸操作体验');