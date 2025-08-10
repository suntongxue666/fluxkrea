#!/usr/bin/env node

/**
 * 登录按钮修复验证脚本
 * 验证Google登录按钮事件绑定是否正确修复
 */

const http = require('http');

console.log('🔐 开始验证登录按钮修复...\n');

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

// 检查登录按钮绑定
function checkSignInButtonBinding(html) {
    console.log('\n🔍 检查登录按钮绑定...');
    
    // 检查主要登录按钮
    const signinBtnPattern = /<div class="signin-btn" onclick="handleSignInClick\(\)">/;
    const hasMainSigninBtn = signinBtnPattern.test(html);
    console.log(`主登录按钮绑定: ${hasMainSigninBtn ? '✅' : '❌'}`);
    
    // 检查handleSignInClick函数定义
    const handleSignInClickPattern = /async function handleSignInClick\(\)/;
    const hasHandleSignInClick = handleSignInClickPattern.test(html);
    console.log(`handleSignInClick函数: ${hasHandleSignInClick ? '✅' : '❌'}`);
    
    // 检查函数内容是否使用UnifiedStateSync
    const usesUnifiedStateSync = html.includes('window.UnifiedStateSync.signIn()') || 
                                 html.includes('window.UnifiedStateSync.signOut()');
    console.log(`使用UnifiedStateSync: ${usesUnifiedStateSync ? '✅' : '❌'}`);
    
    return hasMainSigninBtn && hasHandleSignInClick && usesUnifiedStateSync;
}

// 检查冲突的事件绑定是否已修复
function checkConflictingBindings(html) {
    console.log('\n🔍 检查冲突的事件绑定...');
    
    // 检查是否还有直接的onclick覆盖（更全面的检查）
    const onclickPatterns = [
        /signinBtn\.onclick = \(\) => this\.signIn\(\)/,
        /signinBtn\.onclick = \(\) => this\.signOut\(\)/,
        /signinBtn\.onclick = \(\) => this\.showUserMenu\(\)/,
        /signinBtn\.onclick = \(\) => this\.signInWithGoogle\(\)/
    ];
    
    let foundActiveOverrides = [];
    onclickPatterns.forEach((pattern, index) => {
        const matches = html.match(pattern);
        if (matches) {
            // 检查这个匹配是否在注释中
            const matchIndex = html.indexOf(matches[0]);
            const lineStart = html.lastIndexOf('\n', matchIndex);
            const lineEnd = html.indexOf('\n', matchIndex);
            const line = html.substring(lineStart, lineEnd);
            
            // 如果不是注释，则认为是活跃的覆盖
            if (!line.trim().startsWith('//')) {
                foundActiveOverrides.push(matches[0]);
            }
        }
    });
    
    const hasOnclickOverride = foundActiveOverrides.length > 0;
    
    if (!hasOnclickOverride) {
        console.log('✅ 没有发现onclick覆盖冲突');
    } else {
        console.log('❌ 仍存在onclick覆盖冲突:');
        foundActiveOverrides.forEach(override => {
            console.log(`   - ${override}`);
        });
    }
    
    // 检查UserStateManager的signIn/signOut是否已禁用
    const userStateSignInDisabled = html.includes('UserStateManager.signIn已禁用');
    const userStateSignOutDisabled = html.includes('UserStateManager.signOut已禁用');
    
    console.log(`UserStateManager.signIn已禁用: ${userStateSignInDisabled ? '✅' : '❌'}`);
    console.log(`UserStateManager.signOut已禁用: ${userStateSignOutDisabled ? '✅' : '❌'}`);
    
    return !hasOnclickOverride && userStateSignInDisabled && userStateSignOutDisabled;
}

// 检查UnifiedStateSync集成
function checkUnifiedStateSyncIntegration(html) {
    console.log('\n🔍 检查UnifiedStateSync集成...');
    
    // 检查脚本加载
    const hasUnifiedStateSyncScript = html.includes('js/modules/unified-state-sync.js');
    console.log(`UnifiedStateSync脚本: ${hasUnifiedStateSyncScript ? '✅' : '❌'}`);
    
    // 检查Supabase初始化
    const hasSupabaseInit = html.includes('js/supabase-init.js');
    console.log(`Supabase初始化: ${hasSupabaseInit ? '✅' : '❌'}`);
    
    // 检查handleSignInClick中的逻辑
    const hasUserStateCheck = html.includes('getCurrentUser()');
    const hasSignInCall = html.includes('UnifiedStateSync.signIn()');
    const hasSignOutCall = html.includes('UnifiedStateSync.signOut()');
    
    console.log(`用户状态检查: ${hasUserStateCheck ? '✅' : '❌'}`);
    console.log(`登录调用: ${hasSignInCall ? '✅' : '❌'}`);
    console.log(`登出调用: ${hasSignOutCall ? '✅' : '❌'}`);
    
    return hasUnifiedStateSyncScript && hasSupabaseInit && 
           hasUserStateCheck && hasSignInCall && hasSignOutCall;
}

// 检查弹窗登录集成
function checkModalSignInIntegration(html) {
    console.log('\n🔍 检查弹窗登录集成...');
    
    // 检查signInFromModal函数
    const hasSignInFromModal = html.includes('window.signInFromModal');
    console.log(`signInFromModal函数: ${hasSignInFromModal ? '✅' : '❌'}`);
    
    // 检查是否正确调用主登录按钮
    const callsMainSigninBtn = html.includes('signinBtn.click()');
    console.log(`调用主登录按钮: ${callsMainSigninBtn ? '✅' : '❌'}`);
    
    return hasSignInFromModal && callsMainSigninBtn;
}

// 主测试函数
async function runTests() {
    try {
        // 1. 测试页面访问
        const html = await testPageAccess();
        
        // 2. 检查各项修复
        const checks = [
            checkSignInButtonBinding(html),
            checkConflictingBindings(html),
            checkUnifiedStateSyncIntegration(html),
            checkModalSignInIntegration(html)
        ];
        
        const allPassed = checks.every(check => check);
        
        console.log('\n' + '='.repeat(50));
        if (allPassed) {
            console.log('🎉 所有检查通过！登录按钮修复成功！');
            console.log('\n✅ 修复总结:');
            console.log('  - 登录按钮正确绑定到handleSignInClick()');
            console.log('  - handleSignInClick统一使用UnifiedStateSync');
            console.log('  - 移除了冲突的onclick覆盖');
            console.log('  - 禁用了UserStateManager的登录方法');
            console.log('  - 弹窗登录正确集成');
            console.log('\n🚀 现在可以测试Google登录功能了！');
            console.log('\n📝 测试建议:');
            console.log('  1. 访问: http://localhost:3001');
            console.log('  2. 点击右上角"Sign in"按钮');
            console.log('  3. 检查是否弹出Google登录窗口');
            console.log('  4. 测试登录后按钮是否变为用户信息');
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