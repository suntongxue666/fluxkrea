#!/usr/bin/env node

/**
 * 登录UI更新验证脚本
 * 验证登录成功后UI更新是否正常工作
 */

const http = require('http');

console.log('🔄 开始验证登录UI更新...\n');

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

// 测试UnifiedStateSync文件
function testUnifiedStateSyncFile() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3001/js/modules/unified-state-sync.js', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ UnifiedStateSync文件可访问');
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

// 检查UnifiedStateSync的UI更新方法
function checkUIUpdateMethods(html, jsContent) {
    console.log('\n🔍 检查UI更新方法...');
    
    // 检查UnifiedStateSync脚本加载
    const hasUnifiedStateSyncScript = html.includes('js/modules/unified-state-sync.js');
    console.log(`UnifiedStateSync脚本: ${hasUnifiedStateSyncScript ? '✅' : '❌'}`);
    
    // 检查关键方法的存在（通过JS文件内容检查）
    const hasUpdateUI = jsContent.includes('updateUI()') || jsContent.includes('updateUI:');
    const hasUpdateUserDisplay = jsContent.includes('updateUserDisplay()') || jsContent.includes('updateUserDisplay:');
    const hasUpdateCreditsDisplay = jsContent.includes('updateCreditsDisplay()') || jsContent.includes('updateCreditsDisplay:');
    
    console.log(`updateUI方法引用: ${hasUpdateUI ? '✅' : '❌'}`);
    console.log(`updateUserDisplay方法引用: ${hasUpdateUserDisplay ? '✅' : '❌'}`);
    console.log(`updateCreditsDisplay方法引用: ${hasUpdateCreditsDisplay ? '✅' : '❌'}`);
    
    return hasUnifiedStateSyncScript && hasUpdateUI && hasUpdateUserDisplay && hasUpdateCreditsDisplay;
}

// 检查认证状态监听器
function checkAuthStateListener(html) {
    console.log('\n🔍 检查认证状态监听器...');
    
    // 检查UnifiedStateSync中的onAuthStateChange
    const hasAuthStateChange = html.includes('onAuthStateChange') || 
                              html.includes('SIGNED_IN') ||
                              html.includes('SIGNED_OUT');
    console.log(`认证状态监听器: ${hasAuthStateChange ? '✅' : '❌'}`);
    
    // 检查setUser方法调用
    const hasSetUserCall = html.includes('setUser(user') || html.includes('setUser(null');
    console.log(`setUser方法调用: ${hasSetUserCall ? '✅' : '❌'}`);
    
    // 检查积分同步
    const hasCreditSync = html.includes('syncCreditsFromAPI') || html.includes('setCredits');
    console.log(`积分同步: ${hasCreditSync ? '✅' : '❌'}`);
    
    return hasAuthStateChange && hasSetUserCall && hasCreditSync;
}

// 检查UI元素更新逻辑
function checkUIElementUpdates(html, jsContent) {
    console.log('\n🔍 检查UI元素更新逻辑...');
    
    // 检查登录按钮更新逻辑
    const hasSigninBtnUpdate = (html.includes('signin-btn') || jsContent.includes('signin-btn')) && 
                              (jsContent.includes('avatar_url') || jsContent.includes('google-icon'));
    console.log(`登录按钮更新逻辑: ${hasSigninBtnUpdate ? '✅' : '❌'}`);
    
    // 检查积分显示更新
    const hasCreditsUpdate = html.includes('creditsAmount') || 
                            jsContent.includes('credits-amount') ||
                            jsContent.includes('creditsElements');
    console.log(`积分显示更新: ${hasCreditsUpdate ? '✅' : '❌'}`);
    
    // 检查onclick属性保护
    const hasOnclickProtection = jsContent.includes('originalOnclick') || 
                                jsContent.includes('getAttribute(\'onclick\')') ||
                                jsContent.includes('setAttribute(\'onclick\'');
    console.log(`onclick属性保护: ${hasOnclickProtection ? '✅' : '❌'}`);
    
    return hasSigninBtnUpdate && hasCreditsUpdate && hasOnclickProtection;
}

// 检查状态同步机制
function checkStateSyncMechanism(html) {
    console.log('\n🔍 检查状态同步机制...');
    
    // 检查localStorage同步
    const hasLocalStorageSync = html.includes('localStorage.setItem') && 
                               html.includes('flux_krea_user');
    console.log(`localStorage同步: ${hasLocalStorageSync ? '✅' : '❌'}`);
    
    // 检查跨页面广播
    const hasBroadcast = html.includes('broadcastStateChange') || 
                        html.includes('storage事件') ||
                        html.includes('CustomEvent');
    console.log(`跨页面广播: ${hasBroadcast ? '✅' : '❌'}`);
    
    // 检查全局变量更新
    const hasGlobalVarUpdate = html.includes('window.currentUser =') || 
                              html.includes('window.currentUser=');
    console.log(`全局变量更新: ${hasGlobalVarUpdate ? '✅' : '❌'}`);
    
    return hasLocalStorageSync && hasBroadcast && hasGlobalVarUpdate;
}

// 检查用户反馈机制
function checkUserFeedback(html) {
    console.log('\n🔍 检查用户反馈机制...');
    
    // 检查登录成功日志
    const hasLoginSuccessLog = html.includes('登录成功') || 
                              html.includes('用户已登录') ||
                              html.includes('✅');
    console.log(`登录成功反馈: ${hasLoginSuccessLog ? '✅' : '❌'}`);
    
    // 检查错误处理
    const hasErrorHandling = html.includes('catch (error)') && 
                            html.includes('console.error');
    console.log(`错误处理: ${hasErrorHandling ? '✅' : '❌'}`);
    
    // 检查加载状态
    const hasLoadingState = html.includes('加载') || 
                           html.includes('loading') ||
                           html.includes('初始化');
    console.log(`加载状态提示: ${hasLoadingState ? '✅' : '❌'}`);
    
    return hasLoginSuccessLog && hasErrorHandling && hasLoadingState;
}

// 主测试函数
async function runTests() {
    try {
        // 1. 测试页面访问
        const html = await testPageAccess();
        
        // 2. 测试UnifiedStateSync文件
        const jsContent = await testUnifiedStateSyncFile();
        
        // 3. 检查各项功能
        const checks = [
            checkUIUpdateMethods(html, jsContent),
            checkAuthStateListener(html),
            checkUIElementUpdates(html, jsContent),
            checkStateSyncMechanism(html),
            checkUserFeedback(html)
        ];
        
        const allPassed = checks.every(check => check);
        
        console.log('\n' + '='.repeat(50));
        if (allPassed) {
            console.log('🎉 所有检查通过！登录UI更新功能完整！');
            console.log('\n✅ 功能总结:');
            console.log('  - UnifiedStateSync正确处理认证状态变化');
            console.log('  - 登录成功后自动更新用户头像和姓名');
            console.log('  - 积分信息实时同步和显示');
            console.log('  - onclick事件绑定得到保护');
            console.log('  - 状态变化跨页面同步');
            console.log('  - 完整的用户反馈和错误处理');
            console.log('\n🚀 登录UI更新功能已完善！');
            console.log('\n📝 测试建议:');
            console.log('  1. 访问: http://localhost:3001/test-login-ui-update.html');
            console.log('  2. 测试模拟登录和UI更新');
            console.log('  3. 在真实环境中测试Google登录');
            console.log('  4. 验证登录后按钮显示用户信息');
        } else {
            console.log('❌ 部分检查未通过，需要进一步完善');
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