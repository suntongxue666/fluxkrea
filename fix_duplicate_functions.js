// 修复pricing页面中重复的函数定义
const fs = require('fs');
const path = require('path');

function fixDuplicateFunctions() {
    console.log('🔧 修复pricing页面重复函数问题...');
    
    try {
        // 读取pricing.html文件
        const pricingPath = path.join(__dirname, 'pricing.html');
        let content = fs.readFileSync(pricingPath, 'utf8');
        
        console.log('📄 已读取pricing.html文件');
        
        // 删除第二个checkSupabaseSession函数（从2086行开始的那个）
        const duplicateFunctionRegex = /\/\/ 检查Supabase会话\s*async function checkSupabaseSession\(\)[\s\S]*?}\s*}/;
        
        // 查找并删除重复的函数
        const matches = content.match(duplicateFunctionRegex);
        if (matches) {
            content = content.replace(duplicateFunctionRegex, '');
            console.log('✅ 已删除重复的checkSupabaseSession函数');
        }
        
        // 确保只有一个正确的checkSupabaseSession函数
        const functionCount = (content.match(/async function checkSupabaseSession/g) || []).length;
        console.log(`📊 checkSupabaseSession函数数量: ${functionCount}`);
        
        if (functionCount > 1) {
            console.warn('⚠️ 仍然存在多个checkSupabaseSession函数');
        }
        
        // 写回文件
        fs.writeFileSync(pricingPath, content, 'utf8');
        console.log('✅ pricing.html文件更新完成');
        
        return true;
        
    } catch (error) {
        console.error('❌ 修复重复函数失败:', error);
        return false;
    }
}

// 运行修复
if (fixDuplicateFunctions()) {
    console.log('🎉 重复函数修复完成！');
} else {
    console.log('❌ 重复函数修复失败');
    process.exit(1);
}