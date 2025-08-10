#!/usr/bin/env node

/**
 * 清理重复代码脚本
 * 删除旧的generateImage相关代码
 */

const fs = require('fs');

console.log('🧹 开始清理重复代码...\n');

try {
    // 读取文件
    let content = fs.readFileSync('public/index.html', 'utf8');
    
    console.log('📄 文件读取成功');
    
    // 查找并删除旧的generateImage相关代码块
    // 从"旧的try块开始已删除"到"积分系统和用户管理 - Supabase集成"之间的所有内容
    
    const startMarker = '        // 旧的try块开始已删除';
    const endMarker = '        // 积分系统和用户管理 - Supabase集成';
    
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        console.log(`📍 找到重复代码块: ${startIndex} - ${endIndex}`);
        
        // 删除重复代码块
        const beforeCode = content.substring(0, startIndex);
        const afterCode = content.substring(endIndex);
        
        const cleanedContent = beforeCode + '        // 旧的generateImage代码已完全清理\n\n        ' + afterCode.substring(8); // 移除开头的空格
        
        // 写回文件
        fs.writeFileSync('public/index.html', cleanedContent, 'utf8');
        
        console.log('✅ 重复代码清理完成');
        console.log(`📊 删除了 ${endIndex - startIndex} 个字符的重复代码`);
        
    } else {
        console.log('⚠️ 未找到指定的代码块标记');
        console.log(`startIndex: ${startIndex}, endIndex: ${endIndex}`);
    }
    
} catch (error) {
    console.error('❌ 清理失败:', error.message);
    process.exit(1);
}

console.log('\n🎉 代码清理完成！');