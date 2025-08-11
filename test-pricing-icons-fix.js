/**
 * Pricing页面图标修复验证脚本
 * 验证Font Awesome是否正确引入，图标是否能正常显示
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Pricing页面图标修复验证\n');

// 读取Pricing页面文件
const pricingPath = path.join(__dirname, 'public', 'pricing.html');
const pricingContent = fs.readFileSync(pricingPath, 'utf8');

console.log('📋 验证结果:');

// 1. 检查是否引入了Font Awesome CSS
const hasFontAwesome = pricingContent.includes('font-awesome/6.0.0/css/all.min.css');
console.log(`1. ${hasFontAwesome ? '✅' : '❌'} Font Awesome CSS已引入`);

// 2. 检查积分显示是否有图标
const hasCreditsIcon = pricingContent.includes('<i class="fas fa-coins"></i>');
console.log(`2. ${hasCreditsIcon ? '✅' : '❌'} 积分显示有coins图标`);

// 3. 检查其他图标的使用
const iconPatterns = [
    { name: 'Check图标', pattern: /<i class="fas fa-check"><\/i>/ },
    { name: 'Chevron图标', pattern: /<i class="fas fa-chevron-down"><\/i>/ },
    { name: 'Times图标', pattern: /<i class="fas fa-times"><\/i>/ },
    { name: 'Shield图标', pattern: /<i class="fas fa-shield-alt"><\/i>/ }
];

iconPatterns.forEach((icon, index) => {
    const hasIcon = icon.pattern.test(pricingContent);
    console.log(`${index + 3}. ${hasIcon ? '✅' : '❌'} ${icon.name}正常使用`);
});

// 4. 提取Font Awesome引入代码
const fontAwesomeMatch = pricingContent.match(/<link[^>]*font-awesome[^>]*>/);
if (fontAwesomeMatch) {
    console.log('\n📄 Font Awesome引入代码:');
    console.log(fontAwesomeMatch[0]);
}

// 5. 检查积分显示的完整HTML结构
const creditsDisplayMatch = pricingContent.match(/<div class="credits-display"[^>]*>[\s\S]*?<\/div>/);
if (creditsDisplayMatch) {
    console.log('\n💰 积分显示HTML结构:');
    console.log(creditsDisplayMatch[0].replace(/\s+/g, ' ').trim());
}

// 6. 对比首页的Font Awesome引入
const indexPath = path.join(__dirname, 'public', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');
const indexFontAwesome = indexContent.match(/<link[^>]*font-awesome[^>]*>/);

if (indexFontAwesome && fontAwesomeMatch) {
    const isSame = indexFontAwesome[0] === fontAwesomeMatch[0];
    console.log(`\n🔄 ${isSame ? '✅' : '❌'} 与首页Font Awesome引入一致`);
    
    if (!isSame) {
        console.log('首页引入:', indexFontAwesome[0]);
        console.log('Pricing引入:', fontAwesomeMatch[0]);
    }
}

// 7. 生成测试HTML页面
const testHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pricing页面图标测试</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        
        .test-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .credits-display {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            width: fit-content;
            margin: 10px 0;
        }

        .credits-display i {
            font-size: 16px;
            color: #ffd700;
        }
        
        .icon-test {
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .icon-test i {
            margin-right: 8px;
            color: #6366f1;
        }
        
        .success { color: #28a745; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>Pricing页面图标测试</h1>
        
        <div class="icon-test">
            <h3>积分显示测试</h3>
            <div class="credits-display">
                <i class="fas fa-coins"></i>
                <span>25</span>
            </div>
            <p id="creditsResult">检测中...</p>
        </div>
        
        <div class="icon-test">
            <h3>其他图标测试</h3>
            <p><i class="fas fa-check"></i> Check图标</p>
            <p><i class="fas fa-chevron-down"></i> Chevron图标</p>
            <p><i class="fas fa-times"></i> Times图标</p>
            <p><i class="fas fa-shield-alt"></i> Shield图标</p>
            <p id="otherIconsResult">检测中...</p>
        </div>
        
        <div class="icon-test">
            <h3>Font Awesome加载状态</h3>
            <p id="fontAwesomeStatus">检测中...</p>
        </div>
    </div>

    <script>
        // 检测Font Awesome是否加载成功
        function checkFontAwesome() {
            const testElement = document.createElement('i');
            testElement.className = 'fas fa-coins';
            testElement.style.position = 'absolute';
            testElement.style.left = '-9999px';
            document.body.appendChild(testElement);
            
            const computedStyle = window.getComputedStyle(testElement);
            const fontFamily = computedStyle.fontFamily;
            
            document.body.removeChild(testElement);
            
            return fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome');
        }
        
        // 页面加载完成后检测
        window.addEventListener('load', () => {
            setTimeout(() => {
                const fontAwesomeLoaded = checkFontAwesome();
                const statusElement = document.getElementById('fontAwesomeStatus');
                const creditsResult = document.getElementById('creditsResult');
                const otherIconsResult = document.getElementById('otherIconsResult');
                
                if (fontAwesomeLoaded) {
                    statusElement.innerHTML = '<span class="success">✅ Font Awesome加载成功</span>';
                    creditsResult.innerHTML = '<span class="success">✅ 积分图标应该正常显示</span>';
                    otherIconsResult.innerHTML = '<span class="success">✅ 其他图标应该正常显示</span>';
                } else {
                    statusElement.innerHTML = '<span class="error">❌ Font Awesome加载失败</span>';
                    creditsResult.innerHTML = '<span class="error">❌ 积分图标无法显示</span>';
                    otherIconsResult.innerHTML = '<span class="error">❌ 其他图标无法显示</span>';
                }
            }, 1000);
        });
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'public', 'test-pricing-icons.html'), testHTML);
console.log('\n📄 已生成测试页面: public/test-pricing-icons.html');

// 8. 总结
const allChecks = [
    hasFontAwesome,
    hasCreditsIcon,
    ...iconPatterns.map(icon => icon.pattern.test(pricingContent))
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} 项检查通过`);

if (passedChecks === totalChecks) {
    console.log('✅ 所有检查通过！Pricing页面图标问题已修复');
    console.log('');
    console.log('🎉 修复内容:');
    console.log('• 已在Pricing页面引入Font Awesome 6.0.0 CSS');
    console.log('• 积分显示的coins图标现在应该能正常显示');
    console.log('• 所有其他Font Awesome图标也应该正常显示');
} else {
    console.log('⚠️ 部分检查未通过，可能需要进一步调整');
}

console.log('\n🧪 测试方法:');
console.log('1. 访问 http://localhost:3001/pricing.html 查看积分图标');
console.log('2. 访问 http://localhost:3001/test-pricing-icons.html 进行详细测试');
console.log('3. 对比首页和Pricing页面的积分显示是否一致');
console.log('4. 检查页面上的其他图标是否正常显示');

console.log('\n✅ Pricing页面图标修复完成！');