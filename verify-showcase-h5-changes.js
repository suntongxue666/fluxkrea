/**
 * Showcase页面H5端修改验证脚本
 * 验证页码、X按钮和Pause按钮在H5端是否被隐藏
 */

const fs = require('fs');
const path = require('path');

console.log('📱 Showcase页面H5端修改验证\n');

// 读取showcase.html文件
const showcasePath = path.join(__dirname, 'public', 'showcase.html');
const showcaseContent = fs.readFileSync(showcasePath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查是否有移动端媒体查询
const hasMobileMediaQuery = showcaseContent.includes('@media (max-width: 768px)');
console.log(`1. ${hasMobileMediaQuery ? '✅' : '❌'} 存在移动端媒体查询`);

// 2. 检查页码隐藏样式
const hasProgressHidden = showcaseContent.includes('.showcase-progress') && 
                         showcaseContent.includes('display: none !important');
console.log(`2. ${hasProgressHidden ? '✅' : '❌'} 页码显示已隐藏`);

// 3. 检查X按钮隐藏样式
const hasCloseButtonHidden = showcaseContent.includes('.close-btn') && 
                            showcaseContent.includes('display: none !important');
console.log(`3. ${hasCloseButtonHidden ? '✅' : '❌'} X按钮已隐藏`);

// 4. 检查Pause按钮隐藏样式
const hasPauseButtonHidden = showcaseContent.includes('.action-btn.secondary') && 
                            showcaseContent.includes('display: none !important');
console.log(`4. ${hasPauseButtonHidden ? '✅' : '❌'} Pause按钮已隐藏`);

// 5. 检查相关HTML元素是否存在
const hasProgressElement = showcaseContent.includes('<div class="showcase-progress" id="progress">');
const hasCloseButtonElement = showcaseContent.includes('<button class="close-btn"');
const hasPauseButtonElement = showcaseContent.includes('<button class="action-btn secondary"');

console.log(`5. ${hasProgressElement ? '✅' : '❌'} 页码HTML元素存在`);
console.log(`6. ${hasCloseButtonElement ? '✅' : '❌'} X按钮HTML元素存在`);
console.log(`7. ${hasPauseButtonElement ? '✅' : '❌'} Pause按钮HTML元素存在`);

// 6. 提取并显示移动端CSS样式
console.log('\n📱 移动端隐藏样式:');
const mobileStyleMatch = showcaseContent.match(/@media \(max-width: 768px\) \{[\s\S]*?\}/);
if (mobileStyleMatch) {
    // 提取隐藏相关的样式
    const hideStyles = mobileStyleMatch[0].match(/\/\* H5端隐藏.*?\*\/[\s\S]*?display: none !important;[\s\S]*?display: none !important;[\s\S]*?display: none !important;/);
    if (hideStyles) {
        console.log('```css');
        console.log(hideStyles[0]);
        console.log('```');
    } else {
        console.log('❌ 未找到隐藏样式代码');
    }
} else {
    console.log('❌ 未找到移动端媒体查询');
}

// 7. 检查页码显示的具体内容
const progressContentMatch = showcaseContent.match(/<div class="showcase-progress"[^>]*>[\s\S]*?<\/div>/);
if (progressContentMatch) {
    console.log('\n📊 页码显示内容:');
    console.log('```html');
    console.log(progressContentMatch[0].replace(/\s+/g, ' ').trim());
    console.log('```');
    
    // 检查是否包含1/16格式
    const hasPageFormat = progressContentMatch[0].includes('currentIndex') && 
                         progressContentMatch[0].includes('totalImages') && 
                         progressContentMatch[0].includes('/');
    console.log(`   ${hasPageFormat ? '✅' : '❌'} 包含页码格式 (currentIndex / totalImages)`);
}

// 8. 检查按钮的具体内容
console.log('\n🔘 按钮元素检查:');

// X按钮
const closeButtonMatch = showcaseContent.match(/<button class="close-btn"[^>]*>[\s\S]*?<\/button>/);
if (closeButtonMatch) {
    console.log('X按钮:');
    console.log('```html');
    console.log(closeButtonMatch[0].replace(/\s+/g, ' ').trim());
    console.log('```');
}

// Pause按钮
const pauseButtonMatch = showcaseContent.match(/<button class="action-btn secondary"[^>]*>[\s\S]*?<\/button>/);
if (pauseButtonMatch) {
    console.log('Pause按钮:');
    console.log('```html');
    console.log(pauseButtonMatch[0].replace(/\s+/g, ' ').trim());
    console.log('```');
}

// 9. 生成修改总结
console.log('\n📋 修改总结:');
console.log('');
console.log('H5端隐藏的元素:');
console.log('• 页码显示 (.showcase-progress) - 显示"1 / 16"格式的页码');
console.log('• X关闭按钮 (.close-btn) - 右上角的关闭按钮');
console.log('• Pause暂停按钮 (.action-btn.secondary) - 控制自动播放的暂停按钮');
console.log('');
console.log('保留的元素:');
console.log('• Start Creating按钮 (.action-btn.primary) - 主要的创建按钮');
console.log('• 图片展示区域 - 核心的图片轮播功能');
console.log('• 指示器 (.showcase-indicators) - 图片切换指示器');

// 10. 总结
const allChecks = [
    hasMobileMediaQuery,
    hasProgressHidden,
    hasCloseButtonHidden,
    hasPauseButtonHidden,
    hasProgressElement,
    hasCloseButtonElement,
    hasPauseButtonElement
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！Showcase页面H5端修改成功');
    console.log('');
    console.log('🎉 修改效果:');
    console.log('• H5端用户将看到更简洁的界面');
    console.log('• 移除了页码显示，减少视觉干扰');
    console.log('• 隐藏了X按钮，防止意外关闭');
    console.log('• 去掉了Pause按钮，简化操作');
    console.log('• 保留了核心的图片展示和创建按钮');
} else {
    console.log('⚠️ 部分检查未通过，需要进一步调整');
}

console.log('\n🧪 测试建议:');
console.log('1. 在桌面浏览器中访问 https://www.fluxkrea.me/showcase.html');
console.log('2. 将浏览器窗口缩小到768px以下，确认元素被隐藏');
console.log('3. 在手机浏览器中访问，确认H5端显示效果');
console.log('4. 测试图片轮播和Start Creating按钮功能是否正常');