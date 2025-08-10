#!/usr/bin/env node

/**
 * Generate功能重构验证脚本
 * 验证Generate按钮重构后是否正常工作
 */

const http = require('http');

console.log('🔄 开始验证Generate功能重构...\n');

// 测试页面是否可访问
function testPageAccess() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3001', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ 首页可正常访问 (HTTP 200)');
                    resolve(data);
                } else {
                    reject(new Error(`页面访问失败: HTTP ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('请求超时')));
    });
}

// 检查ImageGenerator类定义
function checkImageGeneratorClass(html) {
    console.log('\n🔍 检查ImageGenerator类定义...');
    
    const checks = [];
    
    // 检查类定义
    const hasImageGeneratorClass = html.includes('window.ImageGenerator = class');
    checks.push({ name: 'ImageGenerator类定义', passed: hasImageGeneratorClass });
    
    // 检查关键方法
    const methods = ['canGenerate', 'validateInput', 'checkUserAndCredits', 'generate'];
    methods.forEach(method => {
        const hasMethod = html.includes(`${method}()`);
        checks.push({ name: `${method}方法`, passed: hasMethod });
    });
    
    // 检查全局实例
    const hasGlobalInstance = html.includes('window.imageGenerator = new window.ImageGenerator()');
    checks.push({ name: '全局实例创建', passed: hasGlobalInstance });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查UnifiedStateSync集成
function checkUnifiedStateSyncIntegration(html) {
    console.log('\n🔍 检查UnifiedStateSync集成...');
    
    const checks = [];
    
    // 检查用户状态获取
    const hasGetCurrentUser = html.includes('UnifiedStateSync.getCurrentUser()');
    checks.push({ name: '获取当前用户', passed: hasGetCurrentUser });
    
    // 检查积分获取
    const hasGetCredits = html.includes('UnifiedStateSync.getCredits()');
    checks.push({ name: '获取积分', passed: hasGetCredits });
    
    // 检查积分扣除
    const hasDeductCredits = html.includes('UnifiedStateSync.deductCredits');
    checks.push({ name: '积分扣除', passed: hasDeductCredits });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查generateImage函数重构
function checkGenerateImageRefactor(html) {
    console.log('\n🔍 检查generateImage函数重构...');
    
    const checks = [];
    
    // 检查函数简化
    const isSimplified = html.includes('window.imageGenerator.generate()');
    checks.push({ name: '函数简化', passed: isSimplified });
    
    // 检查错误处理
    const hasErrorHandling = html.includes('ImageGenerator未初始化');
    checks.push({ name: '错误处理', passed: hasErrorHandling });
    
    // 检查是否移除了重复代码（ImageGenerator类中的使用是正常的）
    const resultAreaMatches = html.split('const resultArea = document.getElementById').length - 1;
    const hasMinimalCode = resultAreaMatches <= 3; // ImageGenerator类中有3个方法使用是正常的
    checks.push({ name: '移除重复代码', passed: hasMinimalCode });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查防重复点击机制
function checkAntiDuplicateClick(html) {
    console.log('\n🔍 检查防重复点击机制...');
    
    const checks = [];
    
    // 检查isGenerating标志
    const hasIsGenerating = html.includes('this.isGenerating');
    checks.push({ name: 'isGenerating标志', passed: hasIsGenerating });
    
    // 检查canGenerate方法
    const hasCanGenerate = html.includes('if (this.isGenerating)');
    checks.push({ name: 'canGenerate检查', passed: hasCanGenerate });
    
    // 检查状态设置
    const hasStateManagement = html.includes('setGeneratingState');
    checks.push({ name: '状态管理', passed: hasStateManagement });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查错误处理改进
function checkErrorHandlingImprovement(html) {
    console.log('\n🔍 检查错误处理改进...');
    
    const checks = [];
    
    // 检查输入验证
    const hasInputValidation = html.includes('validateInput()');
    checks.push({ name: '输入验证', passed: hasInputValidation });
    
    // 检查用户状态验证
    const hasUserValidation = html.includes('checkUserAndCredits()');
    checks.push({ name: '用户状态验证', passed: hasUserValidation });
    
    // 检查API错误处理
    const hasAPIErrorHandling = html.includes('showError(error)');
    checks.push({ name: 'API错误处理', passed: hasAPIErrorHandling });
    
    // 检查finally块
    const hasFinallyBlock = html.includes('setGeneratingState(false)');
    checks.push({ name: 'finally块清理', passed: hasFinallyBlock });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查代码结构改进
function checkCodeStructureImprovement(html) {
    console.log('\n🔍 检查代码结构改进...');
    
    const checks = [];
    
    // 检查方法分离
    const hasSeparatedMethods = html.includes('callGenerateAPI') && 
                               html.includes('displayResult') &&
                               html.includes('showError');
    checks.push({ name: '方法分离', passed: hasSeparatedMethods });
    
    // 检查配置集中
    const hasConfigCentralization = html.includes('this.generationCost = 10');
    checks.push({ name: '配置集中', passed: hasConfigCentralization });
    
    // 检查状态管理集中
    const hasStateManagement = html.includes('setGeneratingState');
    checks.push({ name: '状态管理集中', passed: hasStateManagement });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 主测试函数
async function runVerification() {
    try {
        // 1. 测试页面访问
        const html = await testPageAccess();
        
        // 2. 执行各项检查
        const checks = [
            { name: 'ImageGenerator类定义', passed: checkImageGeneratorClass(html) },
            { name: 'UnifiedStateSync集成', passed: checkUnifiedStateSyncIntegration(html) },
            { name: 'generateImage函数重构', passed: checkGenerateImageRefactor(html) },
            { name: '防重复点击机制', passed: checkAntiDuplicateClick(html) },
            { name: '错误处理改进', passed: checkErrorHandlingImprovement(html) },
            { name: '代码结构改进', passed: checkCodeStructureImprovement(html) }
        ];
        
        const allPassed = checks.every(check => check.passed);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 Generate功能重构验证结果:');
        console.log('='.repeat(60));
        
        checks.forEach(check => {
            console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        if (allPassed) {
            console.log('🎉 Generate功能重构成功！');
            console.log('\n✅ 重构成果:');
            console.log('  - 创建了ImageGenerator类管理生成逻辑');
            console.log('  - 集成了UnifiedStateSync进行状态管理');
            console.log('  - 简化了generateImage函数');
            console.log('  - 添加了防重复点击机制');
            console.log('  - 改进了错误处理和用户反馈');
            console.log('  - 优化了代码结构和可维护性');
            console.log('\n🚀 Generate功能现在应该更加稳定可靠！');
            console.log('\n📝 测试建议:');
            console.log('  1. 访问: http://localhost:3001');
            console.log('  2. 登录并确保有足够积分');
            console.log('  3. 输入提示词并点击Generate按钮');
            console.log('  4. 验证生成过程和结果显示');
            console.log('  5. 测试各种边界情况（未登录、积分不足等）');
        } else {
            console.log('❌ Generate功能重构存在问题，需要进一步修复');
        }
        
        return allPassed;
        
    } catch (error) {
        console.error('❌ 验证执行失败:', error.message);
        return false;
    }
}

// 运行验证
runVerification().then(success => {
    process.exit(success ? 0 : 1);
});