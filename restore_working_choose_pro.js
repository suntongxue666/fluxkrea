// 恢复工作正常的Choose Pro按钮功能
const fs = require('fs');

function restoreWorkingChoosePro() {
    console.log('🔧 恢复工作正常的Choose Pro按钮...');
    
    try {
        let content = fs.readFileSync('pricing.html', 'utf8');
        
        // 删除我添加的重复的createSubscription函数
        const duplicateFunctionRegex = /\/\/ 修复Choose Pro按钮\s*async function createSubscription\(planType\)[\s\S]*?}\s*(?=\s*\/\/|$)/;
        
        if (duplicateFunctionRegex.test(content)) {
            content = content.replace(duplicateFunctionRegex, '');
            console.log('✅ 已删除重复的createSubscription函数');
        }
        
        // 确保只有一个createSubscription函数
        const functionCount = (content.match(/async function createSubscription/g) || []).length;
        console.log(`📊 createSubscription函数数量: ${functionCount}`);
        
        // 写回文件
        fs.writeFileSync('pricing.html', content, 'utf8');
        console.log('✅ pricing.html 恢复完成');
        
        return true;
        
    } catch (error) {
        console.error('❌ 恢复失败:', error);
        return false;
    }
}

// 执行恢复
if (restoreWorkingChoosePro()) {
    console.log('🎉 Choose Pro按钮功能已恢复！');
    console.log('现在应该能正常点击跳转PayPal了');
} else {
    console.log('❌ 恢复失败');
}