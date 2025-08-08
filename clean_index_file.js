const fs = require('fs');

console.log('🔧 彻底清理index.html文件中的重复代码...');

try {
    let content = fs.readFileSync('public/index.html', 'utf8');
    
    // 找到第一个generateImage函数的结束位置
    const lines = content.split('\n');
    let cleanedLines = [];
    let inGenerateFunction = false;
    let braceCount = 0;
    let generateFunctionFound = false;
    let skipUntilScript = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 如果已经找到generateImage函数并且遇到孤立代码，开始跳过
        if (generateFunctionFound && !inGenerateFunction && skipUntilScript) {
            // 跳过直到找到辅助函数或script结束标签
            if (line.includes('// 辅助函数') || line.includes('function downloadImage') || line.includes('function shareImage')) {
                skipUntilScript = false;
                cleanedLines.push(line);
            }
            continue;
        }
        
        // 找到generateImage函数开始
        if (line.includes('async function generateImage()')) {
            inGenerateFunction = true;
            braceCount = 0;
            generateFunctionFound = true;
            cleanedLines.push(line);
            continue;
        }
        
        if (inGenerateFunction) {
            cleanedLines.push(line);
            
            // 计算大括号
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            braceCount += openBraces - closeBraces;
            
            // 如果大括号平衡，说明函数结束
            if (braceCount === 0 && line.trim() === '}') {
                inGenerateFunction = false;
                skipUntilScript = true; // 开始跳过后续的孤立代码
                continue;
            }
        } else if (!skipUntilScript) {
            cleanedLines.push(line);
        }
        
        // 检查是否遇到孤立的代码（在函数外部的return语句等）
        if (!inGenerateFunction && generateFunctionFound && !skipUntilScript) {
            if (line.includes('// 重复的generateImage函数已删除') || 
                line.includes('console.log(\'=== 🎯 开始图像生成 ===\')') ||
                (line.trim().startsWith('if (') && line.includes('currentUser')) ||
                (line.trim() === 'return;') ||
                line.includes('const currentCredits =') ||
                line.includes('const generateBtn =') ||
                line.trim().startsWith('try {')) {
                skipUntilScript = true;
                cleanedLines.pop(); // 移除刚添加的这一行
                continue;
            }
        }
    }
    
    const cleanedContent = cleanedLines.join('\n');
    
    // 写回文件
    fs.writeFileSync('public/index.html', cleanedContent, 'utf8');
    
    console.log('✅ 成功清理了重复和孤立的代码');
    console.log(`原文件行数: ${lines.length}`);
    console.log(`清理后行数: ${cleanedLines.length}`);
    console.log(`删除了 ${lines.length - cleanedLines.length} 行重复代码`);
    
} catch (error) {
    console.error('❌ 清理失败:', error);
}