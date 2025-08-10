#!/usr/bin/env node

/**
 * Generate按钮诊断脚本
 * 诊断首页Generate按钮事件绑定和功能问题
 */

const http = require('http');

console.log('🎯 开始诊断Generate按钮功能...\n');

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

// 检查Generate按钮绑定
function checkGenerateButtonBinding(html) {
    console.log('\n🔍 检查Generate按钮绑定...');
    
    // 检查按钮元素
    const hasGenerateBtn = html.includes('id="generateBtn"');
    console.log(`Generate按钮元素: ${hasGenerateBtn ? '✅' : '❌'}`);
    
    // 检查onclick绑定
    const hasOnclickBinding = html.includes('onclick="generateImage()"');
    console.log(`onclick事件绑定: ${hasOnclickBinding ? '✅' : '❌'}`);
    
    // 检查按钮样式类
    const hasGenerateBtnClass = html.includes('class="generate-btn"');
    console.log(`按钮样式类: ${hasGenerateBtnClass ? '✅' : '❌'}`);
    
    return hasGenerateBtn && hasOnclickBinding && hasGenerateBtnClass;
}

// 检查generateImage函数定义
function checkGenerateImageFunction(html) {
    console.log('\n🔍 检查generateImage函数定义...');
    
    // 检查函数定义
    const hasGenerateImageFunction = html.includes('window.generateImage = async function');
    console.log(`generateImage函数定义: ${hasGenerateImageFunction ? '✅' : '❌'}`);
    
    // 检查函数调用日志
    const hasCallLog = html.includes('generateImage函数被正确调用');
    console.log(`函数调用日志: ${hasCallLog ? '✅' : '❌'}`);
    
    // 检查用户状态检查
    const hasUserStateCheck = html.includes('const currentUser = window.currentUser');
    console.log(`用户状态检查: ${hasUserStateCheck ? '✅' : '❌'}`);
    
    return hasGenerateImageFunction && hasCallLog && hasUserStateCheck;
}

// 检查必要的DOM元素
function checkRequiredDOMElements(html) {
    console.log('\n🔍 检查必要的DOM元素...');
    
    // 检查提示词输入框
    const hasPromptInput = html.includes('id="prompt"');
    console.log(`提示词输入框: ${hasPromptInput ? '✅' : '❌'}`);
    
    // 检查结果显示区域
    const hasResultArea = html.includes('id="resultArea"');
    console.log(`结果显示区域: ${hasResultArea ? '✅' : '❌'}`);
    
    // 检查Generate按钮
    const hasGenerateBtn = html.includes('id="generateBtn"');
    console.log(`Generate按钮: ${hasGenerateBtn ? '✅' : '❌'}`);
    
    return hasPromptInput && hasResultArea && hasGenerateBtn;
}

// 检查用户状态管理
function checkUserStateManagement(html) {
    console.log('\n🔍 检查用户状态管理...');
    
    // 检查currentUser变量使用
    const usesCurrentUser = html.includes('window.currentUser');
    console.log(`使用currentUser变量: ${usesCurrentUser ? '✅' : '❌'}`);
    
    // 检查积分检查逻辑
    const hasCreditsCheck = html.includes('currentUser.credits') && 
                           html.includes('generationCost');
    console.log(`积分检查逻辑: ${hasCreditsCheck ? '✅' : '❌'}`);
    
    // 检查登录状态检查
    const hasLoginCheck = html.includes('if (!currentUser)');
    console.log(`登录状态检查: ${hasLoginCheck ? '✅' : '❌'}`);
    
    // 检查弹窗显示
    const hasModalShow = html.includes('showCreditsModal()');
    console.log(`积分弹窗显示: ${hasModalShow ? '✅' : '❌'}`);
    
    return usesCurrentUser && hasCreditsCheck && hasLoginCheck && hasModalShow;
}

// 检查API调用逻辑
function checkAPICallLogic(html) {
    console.log('\n🔍 检查API调用逻辑...');
    
    // 检查API端点
    const hasAPIEndpoint = html.includes('/api/generate');
    console.log(`API端点: ${hasAPIEndpoint ? '✅' : '❌'}`);
    
    // 检查请求参数
    const hasRequestParams = html.includes('prompt: prompt') && 
                            html.includes('width: 1024') &&
                            html.includes('height: 1024');
    console.log(`请求参数: ${hasRequestParams ? '✅' : '❌'}`);
    
    // 检查响应处理
    const hasResponseHandling = html.includes('response.ok') && 
                               html.includes('result.success');
    console.log(`响应处理: ${hasResponseHandling ? '✅' : '❌'}`);
    
    // 检查错误处理
    const hasErrorHandling = html.includes('catch (error)') && 
                            html.includes('图像生成失败');
    console.log(`错误处理: ${hasErrorHandling ? '✅' : '❌'}`);
    
    return hasAPIEndpoint && hasRequestParams && hasResponseHandling && hasErrorHandling;
}

// 检查积分扣除逻辑
function checkCreditsDeductionLogic(html) {
    console.log('\n🔍 检查积分扣除逻辑...');
    
    // 检查积分扣除
    const hasCreditsDeduction = html.includes('window.currentUser.credits = Math.max(0, window.currentUser.credits - generationCost)');
    console.log(`积分扣除逻辑: ${hasCreditsDeduction ? '✅' : '❌'}`);
    
    // 检查localStorage更新
    const hasLocalStorageUpdate = html.includes('localStorage.setItem(\'flux_krea_user\'');
    console.log(`localStorage更新: ${hasLocalStorageUpdate ? '✅' : '❌'}`);
    
    // 检查积分显示更新
    const hasCreditsDisplayUpdate = html.includes('window.updateCreditsDisplay');
    console.log(`积分显示更新: ${hasCreditsDisplayUpdate ? '✅' : '❌'}`);
    
    return hasCreditsDeduction && hasLocalStorageUpdate && hasCreditsDisplayUpdate;
}

// 检查UI状态管理
function checkUIStateManagement(html) {
    console.log('\n🔍 检查UI状态管理...');
    
    // 检查按钮禁用逻辑
    const hasButtonDisable = html.includes('generateBtn.disabled = true') && 
                             html.includes('generateBtn.disabled = false');
    console.log(`按钮禁用逻辑: ${hasButtonDisable ? '✅' : '❌'}`);
    
    // 检查按钮文本更新
    const hasButtonTextUpdate = html.includes('Generating...') && 
                                html.includes('Generate</span>');
    console.log(`按钮文本更新: ${hasButtonTextUpdate ? '✅' : '❌'}`);
    
    // 检查结果显示
    const hasResultDisplay = html.includes('resultArea.innerHTML') && 
                             html.includes('正在生成图像');
    console.log(`结果显示逻辑: ${hasResultDisplay ? '✅' : '❌'}`);
    
    return hasButtonDisable && hasButtonTextUpdate && hasResultDisplay;
}

// 检查潜在问题
function checkPotentialIssues(html) {
    console.log('\n🔍 检查潜在问题...');
    
    const issues = [];
    
    // 检查是否有重复的函数定义
    const generateImageMatches = html.match(/window\.generateImage\s*=\s*async\s*function/g);
    if (generateImageMatches && generateImageMatches.length > 1) {
        issues.push(`发现${generateImageMatches.length}个generateImage函数定义`);
    } else if (generateImageMatches && generateImageMatches.length === 1) {
        console.log('✅ 找到1个generateImage函数定义（正常）');
    }
    
    // 检查是否有冲突的事件绑定
    const onclickMatches = html.match(/generateBtn\.onclick.*=/g);
    if (onclickMatches && onclickMatches.length > 0) {
        issues.push('发现可能冲突的onclick事件绑定');
    }
    
    // 检查是否缺少必要的依赖
    if (!html.includes('UnifiedStateSync')) {
        issues.push('可能缺少UnifiedStateSync依赖');
    }
    
    if (issues.length === 0) {
        console.log('✅ 未发现明显的潜在问题');
        return true;
    } else {
        console.log('❌ 发现潜在问题:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        return false;
    }
}

// 主诊断函数
async function runDiagnosis() {
    try {
        // 1. 测试页面访问
        const html = await testPageAccess();
        
        // 2. 执行各项检查
        const checks = [
            { name: 'Generate按钮绑定', passed: checkGenerateButtonBinding(html) },
            { name: 'generateImage函数定义', passed: checkGenerateImageFunction(html) },
            { name: '必要DOM元素', passed: checkRequiredDOMElements(html) },
            { name: '用户状态管理', passed: checkUserStateManagement(html) },
            { name: 'API调用逻辑', passed: checkAPICallLogic(html) },
            { name: '积分扣除逻辑', passed: checkCreditsDeductionLogic(html) },
            { name: 'UI状态管理', passed: checkUIStateManagement(html) },
            { name: '潜在问题检查', passed: checkPotentialIssues(html) }
        ];
        
        const allPassed = checks.every(check => check.passed);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 Generate按钮诊断结果:');
        console.log('='.repeat(60));
        
        checks.forEach(check => {
            console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        if (allPassed) {
            console.log('🎉 Generate按钮功能完整！');
            console.log('\n✅ 诊断总结:');
            console.log('  - Generate按钮正确绑定到generateImage()函数');
            console.log('  - generateImage函数定义完整');
            console.log('  - 所有必要的DOM元素都存在');
            console.log('  - 用户状态管理逻辑正确');
            console.log('  - API调用逻辑完整');
            console.log('  - 积分扣除逻辑正确');
            console.log('  - UI状态管理完善');
            console.log('\n🚀 Generate功能应该可以正常工作！');
            console.log('\n📝 测试建议:');
            console.log('  1. 访问: http://localhost:3001');
            console.log('  2. 确保已登录且有足够积分');
            console.log('  3. 输入提示词并点击Generate按钮');
            console.log('  4. 检查是否正常生成图片');
        } else {
            console.log('❌ Generate按钮存在问题，需要修复');
            console.log('\n🔧 建议修复步骤:');
            console.log('  1. 检查未通过的项目');
            console.log('  2. 修复相关代码');
            console.log('  3. 重新运行诊断');
        }
        
        return allPassed;
        
    } catch (error) {
        console.error('❌ 诊断执行失败:', error.message);
        return false;
    }
}

// 运行诊断
runDiagnosis().then(success => {
    process.exit(success ? 0 : 1);
});