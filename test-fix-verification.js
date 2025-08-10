#!/usr/bin/env node

/**
 * UserManager修复验证脚本
 * 验证首页UserManager初始化问题是否已修复
 */

const http = require('http');

console.log('🔧 开始验证UserManager修复...\n');

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

// 检查是否还有对已禁用UserManager的引用
function checkDisabledUserManagerReferences(html) {
    console.log('\n🔍 检查已禁用UserManager的引用...');
    
    const problematicPatterns = [
        /userManager = new UserManager\(\)/g,
        /await userManager\.initialize\(\)/g,
        /userManager\.handleAuthenticatedUser/g,
        /userManager\.handleAnonymousUser/g,
        /userManager\.addCreditTransaction/g
    ];
    
    let foundIssues = false;
    
    problematicPatterns.forEach((pattern, index) => {
        const matches = html.match(pattern);
        if (matches) {
            console.log(`❌ 发现问题引用 ${index + 1}: ${matches[0]}`);
            foundIssues = true;
        }
    });
    
    if (!foundIssues) {
        console.log('✅ 未发现对已禁用UserManager的问题引用');
    }
    
    return !foundIssues;
}

// 检查UnifiedStateSync是否正确加载
function checkUnifiedStateSyncLoading(html) {
    console.log('\n🔍 检查UnifiedStateSync加载...');
    
    const hasUnifiedStateSyncScript = html.includes('js/modules/unified-state-sync.js');
    const hasHandleSignInClick = html.includes('handleSignInClick()');
    const hasUnifiedStateSyncReference = html.includes('window.UnifiedStateSync');
    
    console.log(`UnifiedStateSync脚本引用: ${hasUnifiedStateSyncScript ? '✅' : '❌'}`);
    console.log(`handleSignInClick函数: ${hasHandleSignInClick ? '✅' : '❌'}`);
    console.log(`UnifiedStateSync引用: ${hasUnifiedStateSyncReference ? '✅' : '❌'}`);
    
    return hasUnifiedStateSyncScript && hasHandleSignInClick && hasUnifiedStateSyncReference;
}

// 检查是否移除了重复的CreditsManager
function checkDuplicateCreditsManager(html) {
    console.log('\n🔍 检查重复CreditsManager类...');
    
    const creditsManagerMatches = html.match(/class CreditsManager/g);
    const creditsManagerCount = creditsManagerMatches ? creditsManagerMatches.length : 0;
    
    console.log(`CreditsManager类定义数量: ${creditsManagerCount}`);
    
    if (creditsManagerCount <= 1) {
        console.log('✅ 重复的CreditsManager类已移除');
        return true;
    } else {
        console.log('❌ 仍存在重复的CreditsManager类定义');
        return false;
    }
}

// 检查错误处理是否已修复
function checkErrorHandling(html) {
    console.log('\n🔍 检查错误处理修复...');
    
    const hasProblematicErrorHandling = html.includes('userManager = new UserManager();') && 
                                       html.includes('userManager.handleLocalMode();');
    
    if (!hasProblematicErrorHandling) {
        console.log('✅ 错误处理中的UserManager引用已修复');
        return true;
    } else {
        console.log('❌ 错误处理中仍有UserManager引用');
        return false;
    }
}

// 主测试函数
async function runTests() {
    try {
        // 1. 测试页面访问
        const html = await testPageAccess();
        
        // 2. 检查各项修复
        const checks = [
            checkDisabledUserManagerReferences(html),
            checkUnifiedStateSyncLoading(html),
            checkDuplicateCreditsManager(html),
            checkErrorHandling(html)
        ];
        
        const allPassed = checks.every(check => check);
        
        console.log('\n' + '='.repeat(50));
        if (allPassed) {
            console.log('🎉 所有检查通过！UserManager修复成功！');
            console.log('\n✅ 修复总结:');
            console.log('  - 移除了对已禁用UserManager的引用');
            console.log('  - 统一使用UnifiedStateSync进行状态管理');
            console.log('  - 移除了重复的CreditsManager类定义');
            console.log('  - 修复了错误处理中的问题引用');
            console.log('\n🚀 现在可以测试首页的登录和Generate功能了！');
        } else {
            console.log('❌ 部分检查未通过，需要进一步修复');
        }
        
        return allPassed;
        
    } catch (error) {
        console.error('❌ 测试执行失败:', error.message);
        return false;
    }
}

// 运行测试
runTests().then(success => {
    process.exit(success ? 0 : 1);
});