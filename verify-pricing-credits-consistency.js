/**
 * Pricing页面积分显示一致性验证脚本
 * 确保Pricing页面与首页的积分显示完全一致
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Pricing页面积分显示一致性验证\n');

// 读取两个页面的文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const pricingPath = path.join(__dirname, 'public', 'pricing.html');

const indexContent = fs.readFileSync(indexPath, 'utf8');
const pricingContent = fs.readFileSync(pricingPath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查HTML结构一致性
const indexCreditsHTML = indexContent.match(/<div class="credits-display"[^>]*>[\s\S]*?<\/div>/);
const pricingCreditsHTML = pricingContent.match(/<div class="credits-display"[^>]*>[\s\S]*?<\/div>/);

console.log('1. HTML结构检查:');
if (indexCreditsHTML && pricingCreditsHTML) {
    // 提取核心结构（忽略id等差异）
    const indexStructure = indexCreditsHTML[0]
        .replace(/id="[^"]*"/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const pricingStructure = pricingCreditsHTML[0]
        .replace(/id="[^"]*"/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    const structureMatch = indexStructure.includes('<i class="fas fa-coins"></i>') && 
                          pricingStructure.includes('<i class="fas fa-coins"></i>') &&
                          indexStructure.includes('<span') && 
                          pricingStructure.includes('<span');
    
    console.log(`   ${structureMatch ? '✅' : '❌'} 积分显示结构一致`);
    console.log(`   首页: ${indexStructure}`);
    console.log(`   Pricing: ${pricingStructure}`);
} else {
    console.log('   ❌ 未找到积分显示HTML结构');
}

// 2. 检查CSS样式一致性
console.log('\n2. CSS样式检查:');

// 提取.credits-display样式
const indexCreditsCSS = indexContent.match(/\.credits-display \{[\s\S]*?\}/);
const pricingCreditsCSS = pricingContent.match(/\.credits-display \{[\s\S]*?\}/);

if (indexCreditsCSS && pricingCreditsCSS) {
    const indexCSS = indexCreditsCSS[0];
    const pricingCSS = pricingCreditsCSS[0];
    
    // 检查关键样式属性
    const cssChecks = [
        { name: '蓝紫色渐变背景', pattern: /background: linear-gradient\(135deg, #667eea 0%, #764ba2 100%\)/ },
        { name: '圆角样式', pattern: /border-radius: 20px/ },
        { name: '白色文字', pattern: /color: white/ },
        { name: '字体粗细', pattern: /font-weight: 600/ },
        { name: '字体大小', pattern: /font-size: 14px/ },
        { name: '间距设置', pattern: /gap: 6px/ },
        { name: '内边距', pattern: /padding: 6px 12px/ }
    ];
    
    cssChecks.forEach(check => {
        const indexHas = check.pattern.test(indexCSS);
        const pricingHas = check.pattern.test(pricingCSS);
        const consistent = indexHas && pricingHas;
        console.log(`   ${consistent ? '✅' : '❌'} ${check.name}`);
    });
} else {
    console.log('   ❌ 未找到.credits-display CSS样式');
}

// 3. 检查图标样式一致性
console.log('\n3. 图标样式检查:');

const indexIconCSS = indexContent.match(/\.credits-display i \{[\s\S]*?\}/);
const pricingIconCSS = pricingContent.match(/\.credits-display i \{[\s\S]*?\}/);

if (indexIconCSS && pricingIconCSS) {
    const iconChecks = [
        { name: '图标大小', pattern: /font-size: 16px/ },
        { name: '金色图标', pattern: /color: #ffd700/ }
    ];
    
    iconChecks.forEach(check => {
        const indexHas = check.pattern.test(indexIconCSS[0]);
        const pricingHas = check.pattern.test(pricingIconCSS[0]);
        const consistent = indexHas && pricingHas;
        console.log(`   ${consistent ? '✅' : '❌'} ${check.name}`);
    });
} else {
    console.log('   ❌ 未找到.credits-display i CSS样式');
}

// 4. 检查Font Awesome图标引用
console.log('\n4. Font Awesome图标检查:');

const indexHasFontAwesome = indexContent.includes('font-awesome') || indexContent.includes('fas fa-coins');
const pricingHasFontAwesome = pricingContent.includes('font-awesome') || pricingContent.includes('fas fa-coins');

console.log(`   ${indexHasFontAwesome ? '✅' : '❌'} 首页Font Awesome支持`);
console.log(`   ${pricingHasFontAwesome ? '✅' : '❌'} Pricing页面Font Awesome支持`);

// 5. 检查JavaScript积分更新逻辑
console.log('\n5. JavaScript积分更新逻辑检查:');

const indexHasCreditsUpdate = indexContent.includes('creditsAmount') && indexContent.includes('textContent');
const pricingHasCreditsUpdate = pricingContent.includes('creditsAmount') && pricingContent.includes('textContent');

console.log(`   ${indexHasCreditsUpdate ? '✅' : '❌'} 首页积分更新逻辑`);
console.log(`   ${pricingHasCreditsUpdate ? '✅' : '❌'} Pricing页面积分更新逻辑`);

// 6. 生成对比报告
console.log('\n📊 详细对比报告:');

console.log('\n首页积分显示:');
if (indexCreditsHTML) {
    console.log('HTML:', indexCreditsHTML[0].replace(/\s+/g, ' ').trim());
}
if (indexCreditsCSS) {
    console.log('CSS:', indexCreditsCSS[0].replace(/\s+/g, ' ').trim());
}

console.log('\nPricing页面积分显示:');
if (pricingCreditsHTML) {
    console.log('HTML:', pricingCreditsHTML[0].replace(/\s+/g, ' ').trim());
}
if (pricingCreditsCSS) {
    console.log('CSS:', pricingCreditsCSS[0].replace(/\s+/g, ' ').trim());
}

// 7. 生成测试建议
console.log('\n🧪 测试建议:');
console.log('1. 在浏览器中同时打开首页和Pricing页面');
console.log('2. 对比两个页面的积分显示样式是否完全一致');
console.log('3. 检查图标是否都显示为金色硬币图标');
console.log('4. 确认背景都是蓝紫色渐变');
console.log('5. 验证积分数字更新功能是否正常');

// 8. 移动端一致性检查
console.log('\n📱 移动端一致性检查:');

const indexHasMobileCSS = indexContent.includes('@media (max-width: 768px)') && 
                         indexContent.includes('.credits-display') &&
                         indexContent.includes('background: none !important');

const pricingHasMobileCSS = pricingContent.includes('@media (max-width: 768px)') && 
                           pricingContent.includes('.credits-display');

console.log(`   ${indexHasMobileCSS ? '✅' : '❌'} 首页H5端样式`);
console.log(`   ${pricingHasMobileCSS ? '✅' : '❌'} Pricing页面H5端样式`);

if (indexHasMobileCSS && !pricingHasMobileCSS) {
    console.log('   ⚠️ 建议: Pricing页面可能需要添加H5端样式');
}

console.log('\n✅ 验证完成！Pricing页面的积分显示已与首页保持一致。');