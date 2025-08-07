// 修复JavaScript错误
const fs = require('fs');

function fixJavaScriptErrors() {
    console.log('🔧 修复JavaScript错误...');
    
    try {
        let content = fs.readFileSync('pricing.html', 'utf8');
        
        // 1. 删除调用不存在函数的代码
        content = content.replace(/updateNavigationDisplay\(\);/g, '// updateNavigationDisplay(); // 已注释');
        
        // 2. 确保createSubscription函数正确定义
        const createSubscriptionFix = `
        // 确保createSubscription函数存在
        if (typeof createSubscription === 'undefined') {
            window.createSubscription = async function(planType) {
                console.log('🎯 Choose Pro按钮被点击:', planType);
                
                // 检查用户登录状态
                if (!currentUser) {
                    console.log('❌ 用户未登录');
                    alert('请先登录后再购买订阅');
                    return;
                }
                
                console.log('✅ 用户已登录，继续订阅流程');
                
                try {
                    // 调用openSubscriptionModal函数
                    if (typeof openSubscriptionModal === 'function') {
                        await openSubscriptionModal(planType);
                    } else {
                        console.error('❌ openSubscriptionModal函数不存在');
                        alert('订阅功能初始化中，请稍后重试');
                    }
                } catch (error) {
                    console.error('❌ 打开订阅弹窗失败:', error);
                    alert('订阅功能暂时不可用，请稍后重试');
                }
            };
        }`;
        
        // 在用户状态恢复逻辑后添加createSubscription函数定义
        const insertIndex = content.indexOf('// 修复Choose Pro按钮 - 重写createSubscription函数');
        if (insertIndex !== -1) {
            content = content.slice(0, insertIndex) + 
                     createSubscriptionFix + '\n        ' +
                     content.slice(insertIndex);
        } else {
            // 如果没找到，在最后一个</script>前添加
            const lastScriptIndex = content.lastIndexOf('</script>');
            if (lastScriptIndex !== -1) {
                content = content.slice(0, lastScriptIndex) + 
                         createSubscriptionFix + '\n        ' + 
                         content.slice(lastScriptIndex);
            }
        }
        
        fs.writeFileSync('pricing.html', content, 'utf8');
        console.log('✅ JavaScript错误修复完成');
        
        return true;
        
    } catch (error) {
        console.error('❌ 修复失败:', error);
        return false;
    }
}

// 执行修复
if (fixJavaScriptErrors()) {
    console.log('🎉 JavaScript错误修复完成！Choose Pro按钮现在应该能正常工作');
} else {
    console.log('❌ 修复失败');
}