#!/usr/bin/env node

/**
 * UserManager完整修复验证脚本
 * 验证任务1.1-1.4的所有修复是否完成
 */

const http = require('http');

console.log('🎯 开始完整验证UserManager修复...\n');

// 测试页面访问
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

// 测试UnifiedStateSync文件
function testUnifiedStateSyncFile() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3001/js/modules/unified-state-sync.js', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`UnifiedStateSync文件访问失败: HTTP ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('请求超时')));
    });
}

// 任务1.1：诊断UserManager初始化问题
function verifyTask11(html) {
    console.log('\n📋 任务1.1：诊断UserManager初始化问题');
    
    const issues = [];
    
    // 检查是否还有对已禁用UserManager的引用
    const problematicPatterns = [
        /userManager = new UserManager\(\)/g,
        /await userManager\.initialize\(\)/g
    ];
    
    problematicPatterns.forEach(pattern => {
        const matches = html.match(pattern);
        if (matches) {
            issues.push(`发现问题引用: ${matches[0]}`);
        }
    });
    
    if (issues.length === 0) {
        console.log('✅ 已禁用UserManager的问题引用已清理');
        return true;
    } else {
        console.log('❌ 仍存在问题引用:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        return false;
    }
}

// 任务1.2：修复UserManager初始化流程
function verifyTask12(html) {
    console.log('\n📋 任务1.2：修复UserManager初始化流程');
    
    const checks = [];
    
    // 检查是否使用UnifiedStateSync
    const usesUnifiedStateSync = html.includes('UnifiedStateSync') && 
                                 html.includes('js/modules/unified-state-sync.js');
    checks.push({ name: '使用UnifiedStateSync', passed: usesUnifiedStateSync });
    
    // 检查是否移除了重复的CreditsManager
    const creditsManagerCount = (html.match(/class CreditsManager/g) || []).length;
    const noDuplicateCreditsManager = creditsManagerCount <= 1;
    checks.push({ name: '移除重复CreditsManager', passed: noDuplicateCreditsManager });
    
    // 检查错误处理是否修复
    const hasProperErrorHandling = !html.includes('userManager = new UserManager();') ||
                                   html.includes('已禁用，使用UnifiedStateSync');
    checks.push({ name: '错误处理修复', passed: hasProperErrorHandling });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 任务1.3：修复Google登录按钮事件绑定
function verifyTask13(html) {
    console.log('\n📋 任务1.3：修复Google登录按钮事件绑定');
    
    const checks = [];
    
    // 检查主登录按钮绑定
    const hasMainSigninBtn = /<div class="signin-btn" onclick="handleSignInClick\(\)">/.test(html);
    checks.push({ name: '主登录按钮绑定', passed: hasMainSigninBtn });
    
    // 检查handleSignInClick函数
    const hasHandleSignInClick = /async function handleSignInClick\(\)/.test(html);
    checks.push({ name: 'handleSignInClick函数', passed: hasHandleSignInClick });
    
    // 检查是否使用UnifiedStateSync
    const usesUnifiedStateSyncSignIn = html.includes('UnifiedStateSync.signIn()') ||
                                      html.includes('UnifiedStateSync.signOut()');
    checks.push({ name: '使用UnifiedStateSync登录', passed: usesUnifiedStateSyncSignIn });
    
    // 检查冲突的onclick覆盖是否已禁用
    const onclickPatterns = [
        /signinBtn\.onclick = \(\) => this\.signIn\(\)/,
        /signinBtn\.onclick = \(\) => this\.signOut\(\)/,
        /signinBtn\.onclick = \(\) => this\.showUserMenu\(\)/,
        /signinBtn\.onclick = \(\) => this\.signInWithGoogle\(\)/
    ];
    
    let hasActiveOverrides = false;
    onclickPatterns.forEach(pattern => {
        const matches = html.match(pattern);
        if (matches) {
            const matchIndex = html.indexOf(matches[0]);
            const lineStart = html.lastIndexOf('\n', matchIndex);
            const lineEnd = html.indexOf('\n', matchIndex);
            const line = html.substring(lineStart, lineEnd);
            
            if (!line.trim().startsWith('//')) {
                hasActiveOverrides = true;
            }
        }
    });
    
    checks.push({ name: '移除onclick覆盖冲突', passed: !hasActiveOverrides });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 任务1.4：完善登录成功后的UI更新
function verifyTask14(html, jsContent) {
    console.log('\n📋 任务1.4：完善登录成功后的UI更新');
    
    const checks = [];
    
    // 检查认证状态监听器
    const hasAuthStateListener = jsContent.includes('onAuthStateChange') &&
                                 jsContent.includes('SIGNED_IN');
    checks.push({ name: '认证状态监听器', passed: hasAuthStateListener });
    
    // 检查UI更新方法
    const hasUIUpdateMethods = jsContent.includes('updateUI()') &&
                              jsContent.includes('updateUserDisplay()') &&
                              jsContent.includes('updateCreditsDisplay()');
    checks.push({ name: 'UI更新方法', passed: hasUIUpdateMethods });
    
    // 检查登录按钮更新逻辑
    const hasSigninBtnUpdate = jsContent.includes('signin-btn') &&
                              jsContent.includes('avatar_url') &&
                              jsContent.includes('google-icon');
    checks.push({ name: '登录按钮更新逻辑', passed: hasSigninBtnUpdate });
    
    // 检查onclick属性保护
    const hasOnclickProtection = jsContent.includes('originalOnclick') &&
                                jsContent.includes('getAttribute(\'onclick\')');
    checks.push({ name: 'onclick属性保护', passed: hasOnclickProtection });
    
    // 检查积分同步
    const hasCreditSync = jsContent.includes('syncCreditsFromAPI') &&
                         jsContent.includes('setCredits');
    checks.push({ name: '积分同步机制', passed: hasCreditSync });
    
    // 检查状态持久化
    const hasStatePersistence = jsContent.includes('localStorage.setItem') &&
                               jsContent.includes('flux_krea_user');
    checks.push({ name: '状态持久化', passed: hasStatePersistence });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 主测试函数
async function runCompleteVerification() {
    try {
        console.log('🔍 加载文件...');
        const html = await testPageAccess();
        const jsContent = await testUnifiedStateSyncFile();
        
        console.log('\n🎯 开始验证各个任务...');
        
        const taskResults = [
            { name: '任务1.1 - 诊断UserManager初始化问题', passed: verifyTask11(html) },
            { name: '任务1.2 - 修复UserManager初始化流程', passed: verifyTask12(html) },
            { name: '任务1.3 - 修复Google登录按钮事件绑定', passed: verifyTask13(html) },
            { name: '任务1.4 - 完善登录成功后的UI更新', passed: verifyTask14(html, jsContent) }
        ];
        
        const allTasksPassed = taskResults.every(task => task.passed);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 任务完成情况总结:');
        console.log('='.repeat(60));
        
        taskResults.forEach(task => {
            console.log(`${task.passed ? '✅' : '❌'} ${task.name}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        if (allTasksPassed) {
            console.log('🎉 所有任务验证通过！UserManager修复完成！');
            console.log('\n🚀 修复成果:');
            console.log('  ✅ 移除了对已禁用UserManager的引用');
            console.log('  ✅ 统一使用UnifiedStateSync进行状态管理');
            console.log('  ✅ 修复了Google登录按钮事件绑定');
            console.log('  ✅ 完善了登录成功后的UI更新');
            console.log('  ✅ 实现了跨页面状态同步');
            console.log('  ✅ 保护了onclick事件绑定');
            console.log('\n🎯 现在可以继续执行任务2：修复Generate功能！');
        } else {
            console.log('❌ 部分任务验证未通过，需要进一步修复');
        }
        
        return allTasksPassed;
        
    } catch (error) {
        console.error('❌ 验证执行失败:', error.message);
        return false;
    }
}

// 运行完整验证
runCompleteVerification().then(success => {
    process.exit(success ? 0 : 1);
});