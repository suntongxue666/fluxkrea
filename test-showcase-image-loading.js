/**
 * Showcase页面图片加载测试脚本
 * 检查图片加载功能是否正常
 */

const fs = require('fs');
const path = require('path');

console.log('🖼️ Showcase页面图片加载测试\n');

// 读取showcase.html文件
const showcasePath = path.join(__dirname, 'public', 'showcase.html');
const showcaseContent = fs.readFileSync(showcasePath, 'utf8');

console.log('📋 图片加载功能检查:');

// 1. 检查图片数组是否存在
const hasImageArray = showcaseContent.includes('const showcaseImages = [') && 
                     showcaseContent.includes('https://');
console.log(`1. ${hasImageArray ? '✅' : '❌'} 图片数组存在`);

// 2. 检查初始化函数是否修复
const hasFixedInit = showcaseContent.includes('function initializeShowcase()') && 
                    !showcaseContent.includes('totalImagesElement.textContent');
console.log(`2. ${hasFixedInit ? '✅' : '❌'} 初始化函数已修复（移除totalImages引用）`);

// 3. 检查updateUI函数是否修复
const hasFixedUpdateUI = showcaseContent.includes('function updateUI(') && 
                        !showcaseContent.includes('currentIndexElement.textContent');
console.log(`3. ${hasFixedUpdateUI ? '✅' : '❌'} updateUI函数已修复（移除currentIndex引用）`);

// 4. 检查图片预加载函数
const hasPreloadFunction = showcaseContent.includes('function preloadImage(') && 
                          showcaseContent.includes('img.onload') && 
                          showcaseContent.includes('img.onerror');
console.log(`4. ${hasPreloadFunction ? '✅' : '❌'} 图片预加载函数存在`);

// 5. 检查showImage函数
const hasShowImageFunction = showcaseContent.includes('function showImage(') && 
                            showcaseContent.includes('showcaseImage.src');
console.log(`5. ${hasShowImageFunction ? '✅' : '❌'} showImage函数存在`);

// 6. 检查HTML元素
const hasImageContainer = showcaseContent.includes('<div class="showcase-image-container"') && 
                         showcaseContent.includes('id="imageContainer"');
const hasImageElement = showcaseContent.includes('<img class="showcase-image"') && 
                       showcaseContent.includes('id="showcaseImage"');
const hasIndicators = showcaseContent.includes('<div class="showcase-indicators"') && 
                     showcaseContent.includes('id="indicators"');

console.log(`6. ${hasImageContainer ? '✅' : '❌'} 图片容器HTML存在`);
console.log(`7. ${hasImageElement ? '✅' : '❌'} 图片元素HTML存在`);
console.log(`8. ${hasIndicators ? '✅' : '❌'} 指示器容器HTML存在`);

// 7. 检查自动播放功能
const hasAutoplay = showcaseContent.includes('function startAutoplay()') && 
                   showcaseContent.includes('function pauseAutoplay()');
console.log(`9. ${hasAutoplay ? '✅' : '❌'} 自动播放功能存在`);

// 8. 检查页面加载事件
const hasPageLoad = showcaseContent.includes('window.addEventListener') && 
                   showcaseContent.includes('DOMContentLoaded');
console.log(`10. ${hasPageLoad ? '✅' : '❌'} 页面加载事件监听存在`);

// 9. 提取图片数组内容
console.log('\n🖼️ 图片数组内容:');
const imageArrayMatch = showcaseContent.match(/const showcaseImages = \[([\s\S]*?)\];/);
if (imageArrayMatch) {
    const imageUrls = imageArrayMatch[1].match(/'([^']+)'/g);
    if (imageUrls) {
        console.log(`图片总数: ${imageUrls.length}`);
        console.log('图片来源分布:');
        
        const sources = {};
        imageUrls.forEach(url => {
            const cleanUrl = url.replace(/'/g, '');
            if (cleanUrl.includes('zhimg.com')) {
                sources['知乎图床'] = (sources['知乎图床'] || 0) + 1;
            } else if (cleanUrl.includes('replicate.delivery')) {
                sources['Replicate'] = (sources['Replicate'] || 0) + 1;
            } else {
                sources['其他'] = (sources['其他'] || 0) + 1;
            }
        });
        
        Object.entries(sources).forEach(([source, count]) => {
            console.log(`• ${source}: ${count}张`);
        });
    }
} else {
    console.log('❌ 未找到图片数组');
}

// 10. 检查可能的错误原因
console.log('\n🔍 潜在问题检查:');

const potentialIssues = [];

// 检查是否有对已删除元素的引用
if (showcaseContent.includes('getElementById(\'totalImages\')')) {
    potentialIssues.push('仍有对totalImages元素的引用');
}
if (showcaseContent.includes('getElementById(\'currentIndex\')')) {
    potentialIssues.push('仍有对currentIndex元素的引用');
}

// 检查初始化调用
if (!showcaseContent.includes('initializeShowcase()')) {
    potentialIssues.push('缺少initializeShowcase()调用');
}

// 检查loading元素
if (!showcaseContent.includes('hideLoading')) {
    potentialIssues.push('缺少loading隐藏逻辑');
}

if (potentialIssues.length === 0) {
    console.log('✅ 未发现明显问题');
} else {
    potentialIssues.forEach(issue => {
        console.log(`⚠️ ${issue}`);
    });
}

// 11. 生成修复建议
console.log('\n🛠️ 修复建议:');
console.log('1. 确保所有对已删除DOM元素的引用都已移除');
console.log('2. 检查浏览器控制台是否有JavaScript错误');
console.log('3. 验证图片URL是否可访问（可能存在跨域或链接失效问题）');
console.log('4. 确认页面加载完成后initializeShowcase()被正确调用');
console.log('5. 检查CSS样式是否影响图片显示');

// 12. 测试步骤
console.log('\n🧪 测试步骤:');
console.log('1. 打开浏览器开发者工具');
console.log('2. 访问 https://www.fluxkrea.me/showcase.html');
console.log('3. 查看Console标签页是否有错误信息');
console.log('4. 检查Network标签页图片请求状态');
console.log('5. 确认图片容器和指示器是否正确显示');

// 13. 总结
const allChecks = [
    hasImageArray,
    hasFixedInit,
    hasFixedUpdateUI,
    hasPreloadFunction,
    hasShowImageFunction,
    hasImageContainer,
    hasImageElement,
    hasIndicators,
    hasAutoplay,
    hasPageLoad
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 检查总结: ${passedChecks}/${totalChecks} 项通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 图片加载功能应该已修复！');
    console.log('如果仍有问题，请检查浏览器控制台错误信息。');
} else {
    console.log('⚠️ 发现问题，需要进一步修复');
}

console.log('\n💡 如果图片仍无法加载，可能的原因:');
console.log('• 图片URL失效或存在跨域限制');
console.log('• 网络连接问题');
console.log('• 浏览器缓存问题');
console.log('• CSS样式隐藏了图片元素');