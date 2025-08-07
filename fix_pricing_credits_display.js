// 修复pricing页面积分显示问题
const fs = require('fs');
const path = require('path');

function fixPricingCreditsDisplay() {
    console.log('🔧 修复pricing页面积分显示问题...');
    
    try {
        // 读取pricing.html文件
        const pricingPath = path.join(__dirname, 'pricing.html');
        let content = fs.readFileSync(pricingPath, 'utf8');
        
        console.log('📄 已读取pricing.html文件');
        
        // 1. 修复积分显示初始化逻辑
        const newInitScript = `
        // 修复版本 - 确保积分正确显示
        document.addEventListener('DOMContentLoaded', async function() {
            console.log('🚀 Pricing页面初始化...');
            
            // 1. 首先检查用户登录状态
            await initializeUserState();
            
            // 2. 初始化积分同步系统
            if (window.creditsSync) {
                // 立即更新显示
                await updateCreditsDisplay();
                
                // 监听积分变化
                window.addEventListener('creditsUpdated', function(event) {
                    console.log('积分已更新:', event.detail.credits);
                    updateCreditsDisplay();
                });
                
                // 定期刷新积分显示
                setInterval(updateCreditsDisplay, 10000); // 每10秒刷新一次
            } else {
                console.warn('积分同步系统未加载，使用默认显示');
            }
            
            // 3. 更新导航栏显示
            updateNavigationDisplay();
        });
        
        // 更新积分显示的专用函数
        async function updateCreditsDisplay() {
            try {
                console.log('🔄 更新积分显示...');
                
                // 从数据库获取最新积分
                if (currentUser && currentUser.uuid) {
                    await syncUserCreditsFromDatabase();
                }
                
                // 获取当前积分
                let currentCredits = 0;
                if (window.creditsSync) {
                    currentCredits = window.creditsSync.getCredits();
                } else if (currentUser && currentUser.credits !== undefined) {
                    currentCredits = currentUser.credits;
                }
                
                console.log('💰 当前积分:', currentCredits);
                
                // 更新所有积分显示元素
                const creditsElements = document.querySelectorAll('#creditsAmount, .credits-amount');
                creditsElements.forEach(element => {
                    if (element) {
                        // 添加动画效果
                        element.style.transition = 'all 0.3s ease';
                        element.textContent = currentCredits;
                        
                        // 闪烁效果表示更新
                        element.style.color = '#10b981';
                        setTimeout(() => {
                            element.style.color = '';
                        }, 500);
                    }
                });
                
                // 更新localStorage中的积分
                if (window.creditsSync) {
                    window.creditsSync.setCredits(currentCredits);
                }
                
                console.log('✅ 积分显示已更新:', currentCredits);
                
            } catch (error) {
                console.error('❌ 更新积分显示失败:', error);
            }
        }`;
        
        // 2. 替换现有的初始化脚本
        const initScriptRegex = /document\.addEventListener\('DOMContentLoaded'[\s\S]*?}\);/;
        if (initScriptRegex.test(content)) {
            content = content.replace(initScriptRegex, newInitScript.trim());
            console.log('✅ 已替换初始化脚本');
        } else {
            // 如果没找到，在</script>前添加
            const scriptEndIndex = content.lastIndexOf('</script>');
            if (scriptEndIndex !== -1) {
                content = content.slice(0, scriptEndIndex) + 
                         '\n        ' + newInitScript + '\n        ' + 
                         content.slice(scriptEndIndex);
                console.log('✅ 已添加初始化脚本');
            }
        }
        
        // 3. 确保积分显示元素有正确的ID
        if (!content.includes('id="creditsAmount"')) {
            content = content.replace(
                /<span[^>]*>20<\/span>/g,
                '<span id="creditsAmount">--</span>'
            );
            console.log('✅ 已修复积分显示元素ID');
        }
        
        // 4. 添加实时积分同步的CSS动画
        const creditsAnimationCSS = `
        /* 积分显示动画 */
        #creditsAmount, .credits-amount {
            transition: all 0.3s ease;
            font-weight: 600;
        }
        
        #creditsAmount.updating, .credits-amount.updating {
            color: #10b981 !important;
            transform: scale(1.1);
        }
        
        .credits-display {
            position: relative;
        }
        
        .credits-display::after {
            content: '';
            position: absolute;
            top: -2px;
            right: -2px;
            width: 6px;
            height: 6px;
            background: #10b981;
            border-radius: 50%;
            opacity: 0;
            animation: pulse 2s infinite;
        }
        
        .credits-display.live::after {
            opacity: 1;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }`;
        
        // 在</style>标签前添加CSS
        const styleEndIndex = content.lastIndexOf('</style>');
        if (styleEndIndex !== -1) {
            content = content.slice(0, styleEndIndex) + 
                     creditsAnimationCSS + '\n        ' + 
                     content.slice(styleEndIndex);
            console.log('✅ 已添加积分显示动画CSS');
        }
        
        // 写回文件
        fs.writeFileSync(pricingPath, content, 'utf8');
        console.log('✅ pricing.html文件更新完成');
        
        return true;
        
    } catch (error) {
        console.error('❌ 修复pricing页面积分显示失败:', error);
        return false;
    }
}

// 运行修复
if (fixPricingCreditsDisplay()) {
    console.log('🎉 pricing页面积分显示修复完成！');
    console.log('修复内容:');
    console.log('1. ✅ 修复了积分显示初始化逻辑');
    console.log('2. ✅ 添加了实时积分同步功能');
    console.log('3. ✅ 添加了积分更新动画效果');
    console.log('4. ✅ 确保积分显示元素有正确的ID');
    console.log('5. ✅ 添加了定期刷新机制');
} else {
    console.log('❌ pricing页面积分显示修复失败');
    process.exit(1);
}