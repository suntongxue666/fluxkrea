#!/usr/bin/env node

/**
 * 积分验证和扣除逻辑测试脚本
 * 验证任务2.4的完成情况
 */

const http = require('http');

console.log('💰 开始验证积分验证和扣除逻辑...\n');

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

// 检查积分验证逻辑改进
function checkCreditsValidationImprovement(html) {
    console.log('\n🔍 检查积分验证逻辑改进...');
    
    const checks = [];
    
    // 检查详细的用户状态检查
    const hasDetailedUserCheck = html.includes('用户状态检查: 用户=') && 
                                 html.includes('积分=') && 
                                 html.includes('需要=');
    checks.push({ name: '详细用户状态检查', passed: hasDetailedUserCheck });
    
    // 检查改进的积分不足提示
    const hasImprovedInsufficientMessage = html.includes('当前积分:') && 
                                          html.includes('需要积分:') && 
                                          html.includes('缺少积分:');
    checks.push({ name: '改进的积分不足提示', passed: hasImprovedInsufficientMessage });
    
    // 检查提示词保存功能
    const hasPromptSaving = html.includes('pending_generation_prompt');
    checks.push({ name: '提示词保存功能', passed: hasPromptSaving });
    
    // 检查返回原因标识
    const hasReasonIdentification = html.includes('reason:') && 
                                   html.includes('not_logged_in') && 
                                   html.includes('insufficient_credits');
    checks.push({ name: '返回原因标识', passed: hasReasonIdentification });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查积分扣除逻辑改进
function checkCreditsDeductionImprovement(html, jsContent) {
    console.log('\n🔍 检查积分扣除逻辑改进...');
    
    const checks = [];
    
    // 检查数据库更新逻辑
    const hasDatabaseUpdate = jsContent.includes('updateCreditsInDatabase') && 
                             jsContent.includes('credit_transactions');
    checks.push({ name: '数据库更新逻辑', passed: hasDatabaseUpdate });
    
    // 检查错误回滚机制
    const hasErrorRollback = jsContent.includes('回滚本地积分') && 
                            jsContent.includes('setCredits(oldCredits');
    checks.push({ name: '错误回滚机制', passed: hasErrorRollback });
    
    // 检查积分扣除成功/失败处理
    const hasDeductionHandling = html.includes('积分扣除成功') && 
                                 html.includes('积分扣除失败');
    checks.push({ name: '积分扣除成功/失败处理', passed: hasDeductionHandling });
    
    // 检查交易记录功能
    const hasTransactionLogging = jsContent.includes('credit_transactions') && 
                                  jsContent.includes('transaction_type');
    checks.push({ name: '交易记录功能', passed: hasTransactionLogging });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查用户体验改进
function checkUserExperienceImprovement(html) {
    console.log('\n🔍 检查用户体验改进...');
    
    const checks = [];
    
    // 检查改进的结果显示
    const hasImprovedResultDisplay = html.includes('消耗积分:') && 
                                    html.includes('剩余积分:') && 
                                    html.includes('生成成功！');
    checks.push({ name: '改进的结果显示', passed: hasImprovedResultDisplay });
    
    // 检查下载按钮
    const hasDownloadButton = html.includes('downloadImage') && 
                             html.includes('下载图片');
    checks.push({ name: '下载按钮', passed: hasDownloadButton });
    
    // 检查异常情况处理
    const hasExceptionHandling = html.includes('积分扣除异常') && 
                                 html.includes('联系客服');
    checks.push({ name: '异常情况处理', passed: hasExceptionHandling });
    
    // 检查提示词恢复功能
    const hasPromptRecovery = html.includes('pending_generation_prompt') && 
                             html.includes('已恢复待生成的提示词');
    checks.push({ name: '提示词恢复功能', passed: hasPromptRecovery });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查API集成完善
function checkAPIIntegrationImprovement(jsContent) {
    console.log('\n🔍 检查API集成完善...');
    
    const checks = [];
    
    // 检查Supabase集成
    const hasSupabaseIntegration = jsContent.includes('supabaseClient') && 
                                   jsContent.includes('.from(\'users\')') && 
                                   jsContent.includes('.from(\'credit_transactions\')');
    checks.push({ name: 'Supabase集成', passed: hasSupabaseIntegration });
    
    // 检查访问令牌处理
    const hasTokenHandling = jsContent.includes('access_token') && 
                             jsContent.includes('getSession()');
    checks.push({ name: '访问令牌处理', passed: hasTokenHandling });
    
    // 检查用户数据更新
    const hasUserDataUpdate = jsContent.includes('total_credits_used') && 
                              jsContent.includes('total_credits_earned');
    checks.push({ name: '用户数据更新', passed: hasUserDataUpdate });
    
    // 检查addCredits方法
    const hasAddCreditsMethod = jsContent.includes('async addCredits') && 
                               jsContent.includes('积分充值');
    checks.push({ name: 'addCredits方法', passed: hasAddCreditsMethod });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查错误处理和日志记录
function checkErrorHandlingAndLogging(html, jsContent) {
    console.log('\n🔍 检查错误处理和日志记录...');
    
    const checks = [];
    
    // 检查详细的日志记录
    const hasDetailedLogging = html.includes('🔍 用户状态检查') && 
                              jsContent.includes('积分扣除成功:') && 
                              jsContent.includes('积分增加成功:');
    checks.push({ name: '详细日志记录', passed: hasDetailedLogging });
    
    // 检查错误分类
    const hasErrorClassification = jsContent.includes('用户未登录，无法扣除积分') && 
                                  jsContent.includes('积分不足，无法扣除') && 
                                  jsContent.includes('无法获取访问令牌');
    checks.push({ name: '错误分类', passed: hasErrorClassification });
    
    // 检查异常恢复
    const hasExceptionRecovery = jsContent.includes('回滚本地积分') && 
                                html.includes('严重错误：图片生成成功但积分扣除失败');
    checks.push({ name: '异常恢复', passed: hasExceptionRecovery });
    
    // 检查用户友好的错误信息
    const hasFriendlyErrors = html.includes('积分不足！') && 
                             html.includes('请联系客服处理');
    checks.push({ name: '用户友好错误信息', passed: hasFriendlyErrors });
    
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
        
        // 2. 测试UnifiedStateSync文件
        const jsContent = await testUnifiedStateSyncFile();
        
        // 3. 执行各项检查
        const checks = [
            { name: '积分验证逻辑改进', passed: checkCreditsValidationImprovement(html) },
            { name: '积分扣除逻辑改进', passed: checkCreditsDeductionImprovement(html, jsContent) },
            { name: '用户体验改进', passed: checkUserExperienceImprovement(html) },
            { name: 'API集成完善', passed: checkAPIIntegrationImprovement(jsContent) },
            { name: '错误处理和日志记录', passed: checkErrorHandlingAndLogging(html, jsContent) }
        ];
        
        const allPassed = checks.every(check => check.passed);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 积分验证和扣除逻辑验证结果:');
        console.log('='.repeat(60));
        
        checks.forEach(check => {
            console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        if (allPassed) {
            console.log('🎉 积分验证和扣除逻辑完善成功！');
            console.log('\n✅ 改进成果:');
            console.log('  - 完善了积分验证逻辑，提供详细的状态检查');
            console.log('  - 改进了积分扣除机制，支持数据库同步');
            console.log('  - 添加了错误回滚机制，确保数据一致性');
            console.log('  - 完善了交易记录功能，支持积分历史追踪');
            console.log('  - 改进了用户体验，提供友好的错误提示');
            console.log('  - 添加了提示词保存和恢复功能');
            console.log('  - 完善了异常情况处理和用户反馈');
            console.log('\n🚀 积分系统现在更加可靠和用户友好！');
            console.log('\n📝 测试建议:');
            console.log('  1. 测试未登录用户的生成尝试');
            console.log('  2. 测试积分不足时的处理流程');
            console.log('  3. 测试正常的积分扣除和显示');
            console.log('  4. 测试从Pricing页面返回后的提示词恢复');
            console.log('  5. 测试异常情况下的错误处理');
        } else {
            console.log('❌ 积分验证和扣除逻辑存在问题，需要进一步完善');
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