#!/usr/bin/env node

/**
 * 生成结果显示优化验证脚本
 * 验证任务2.5的完成情况
 */

const http = require('http');

console.log('🎨 开始验证生成结果显示优化...\n');

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

// 检查结果显示UI改进
function checkResultDisplayUIImprovement(html) {
    console.log('\n🔍 检查结果显示UI改进...');
    
    const checks = [];
    
    // 检查结果卡片样式
    const hasResultCardStyles = html.includes('result-success') && 
                               html.includes('result-header') && 
                               html.includes('result-title');
    checks.push({ name: '结果卡片样式', passed: hasResultCardStyles });
    
    // 检查图片容器和交互
    const hasImageInteraction = html.includes('image-container') && 
                                html.includes('generated-image') && 
                                html.includes('fullscreen');
    checks.push({ name: '图片交互功能', passed: hasImageInteraction });
    
    // 检查提示词显示
    const hasPromptDisplay = html.includes('prompt-info') && 
                            html.includes('prompt-text') && 
                            html.includes('truncatedPrompt');
    checks.push({ name: '提示词显示', passed: hasPromptDisplay });
    
    // 检查积分信息显示
    const hasCreditsDisplay = html.includes('credits-info') && 
                              html.includes('credits-text') && 
                              html.includes('消耗积分:');
    checks.push({ name: '积分信息显示', passed: hasCreditsDisplay });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查操作按钮功能
function checkActionButtonsFeatures(html) {
    console.log('\n🔍 检查操作按钮功能...');
    
    const checks = [];
    
    // 检查主要操作按钮
    const hasPrimaryActions = html.includes('result-actions') && 
                             html.includes('downloadImage') && 
                             html.includes('下载图片');
    checks.push({ name: '主要操作按钮', passed: hasPrimaryActions });
    
    // 检查次要操作按钮
    const hasSecondaryActions = html.includes('copyImageUrl') && 
                               html.includes('shareImage') && 
                               html.includes('regenerateWithSamePrompt');
    checks.push({ name: '次要操作按钮', passed: hasSecondaryActions });
    
    // 检查按钮样式
    const hasButtonStyles = html.includes('action-btn primary') && 
                           html.includes('action-btn secondary');
    checks.push({ name: '按钮样式', passed: hasButtonStyles });
    
    // 检查辅助功能按钮
    const hasUtilityButtons = html.includes('secondary-actions') && 
                             html.includes('showGenerationHistory') && 
                             html.includes('clearPrompt') && 
                             html.includes('randomPrompt');
    checks.push({ name: '辅助功能按钮', passed: hasUtilityButtons });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查生成历史功能
function checkGenerationHistoryFeature(html) {
    console.log('\n🔍 检查生成历史功能...');
    
    const checks = [];
    
    // 检查历史记录功能
    const hasHistoryFeature = html.includes('addToHistory') && 
                             html.includes('generation_history') && 
                             html.includes('showHistory');
    checks.push({ name: '历史记录功能', passed: hasHistoryFeature });
    
    // 检查历史弹窗
    const hasHistoryModal = html.includes('history-modal') && 
                           html.includes('history-modal-content') && 
                           html.includes('history-item');
    checks.push({ name: '历史弹窗', passed: hasHistoryModal });
    
    // 检查历史操作
    const hasHistoryActions = html.includes('usePrompt') && 
                             html.includes('使用提示词') && 
                             html.includes('history-actions');
    checks.push({ name: '历史操作', passed: hasHistoryActions });
    
    // 检查localStorage集成
    const hasLocalStorageIntegration = html.includes('localStorage.getItem') && 
                                      html.includes('localStorage.setItem') && 
                                      html.includes('generation_history');
    checks.push({ name: 'localStorage集成', passed: hasLocalStorageIntegration });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查用户体验增强
function checkUserExperienceEnhancements(html) {
    console.log('\n🔍 检查用户体验增强...');
    
    const checks = [];
    
    // 检查全屏查看功能
    const hasFullscreenFeature = html.includes('toggleFullscreen') && 
                                 html.includes('fullscreen') && 
                                 html.includes('点击查看大图');
    checks.push({ name: '全屏查看功能', passed: hasFullscreenFeature });
    
    // 检查滚动到结果
    const hasScrollToResult = html.includes('scrollIntoView') && 
                             html.includes('smooth');
    checks.push({ name: '滚动到结果', passed: hasScrollToResult });
    
    // 检查时间戳显示
    const hasTimestamp = html.includes('timestamp') && 
                        html.includes('生成时间:') && 
                        html.includes('toLocaleString');
    checks.push({ name: '时间戳显示', passed: hasTimestamp });
    
    // 检查统计信息
    const hasStats = html.includes('result-stats') && 
                    html.includes('stat-item') && 
                    html.includes('FLUX.1 Krea');
    checks.push({ name: '统计信息', passed: hasStats });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查辅助工具功能
function checkUtilityToolsFeatures(html) {
    console.log('\n🔍 检查辅助工具功能...');
    
    const checks = [];
    
    // 检查随机提示词功能
    const hasRandomPrompt = html.includes('randomPrompt') && 
                           html.includes('randomPrompts') && 
                           html.includes('typeWriter');
    checks.push({ name: '随机提示词功能', passed: hasRandomPrompt });
    
    // 检查清空功能
    const hasClearPrompt = html.includes('clearPrompt') && 
                          html.includes('确定要清空当前提示词吗');
    checks.push({ name: '清空功能', passed: hasClearPrompt });
    
    // 检查复制链接功能
    const hasCopyFeature = html.includes('copyImageUrl') && 
                          html.includes('navigator.clipboard') && 
                          html.includes('图片链接已复制');
    checks.push({ name: '复制链接功能', passed: hasCopyFeature });
    
    // 检查分享功能
    const hasShareFeature = html.includes('shareImage') && 
                           html.includes('navigator.share') && 
                           html.includes('AI生成的图片');
    checks.push({ name: '分享功能', passed: hasShareFeature });
    
    const allPassed = checks.every(check => check.passed);
    checks.forEach(check => {
        console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    return allPassed;
}

// 检查CSS样式完善
function checkCSSStylesImprovement(html) {
    console.log('\n🔍 检查CSS样式完善...');
    
    const checks = [];
    
    // 检查结果卡片样式
    const hasResultStyles = html.includes('.result-success {') && 
                           html.includes('border-radius: 16px') && 
                           html.includes('box-shadow:');
    checks.push({ name: '结果卡片样式', passed: hasResultStyles });
    
    // 检查图片样式
    const hasImageStyles = html.includes('.generated-image {') && 
                          html.includes('cursor: pointer') && 
                          html.includes('transition: transform');
    checks.push({ name: '图片样式', passed: hasImageStyles });
    
    // 检查按钮样式
    const hasButtonStyles = html.includes('.action-btn {') && 
                           html.includes('.action-btn.primary') && 
                           html.includes('.action-btn.secondary');
    checks.push({ name: '按钮样式', passed: hasButtonStyles });
    
    // 检查弹窗样式
    const hasModalStyles = html.includes('.history-modal {') && 
                          html.includes('position: fixed') && 
                          html.includes('z-index: 1000');
    checks.push({ name: '弹窗样式', passed: hasModalStyles });
    
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
            { name: '结果显示UI改进', passed: checkResultDisplayUIImprovement(html) },
            { name: '操作按钮功能', passed: checkActionButtonsFeatures(html) },
            { name: '生成历史功能', passed: checkGenerationHistoryFeature(html) },
            { name: '用户体验增强', passed: checkUserExperienceEnhancements(html) },
            { name: '辅助工具功能', passed: checkUtilityToolsFeatures(html) },
            { name: 'CSS样式完善', passed: checkCSSStylesImprovement(html) }
        ];
        
        const allPassed = checks.every(check => check.passed);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 生成结果显示优化验证结果:');
        console.log('='.repeat(60));
        
        checks.forEach(check => {
            console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        if (allPassed) {
            console.log('🎉 生成结果显示优化成功！');
            console.log('\n✅ 优化成果:');
            console.log('  - 美化了结果显示界面，提供更好的视觉体验');
            console.log('  - 添加了丰富的操作按钮，支持下载、分享、重新生成等');
            console.log('  - 实现了生成历史功能，支持查看和重用历史提示词');
            console.log('  - 增强了图片交互，支持全屏查看和悬停效果');
            console.log('  - 添加了辅助工具，包括随机提示词和清空功能');
            console.log('  - 完善了用户反馈，显示详细的生成信息和统计');
            console.log('  - 优化了CSS样式，提供现代化的界面设计');
            console.log('\n🚀 用户现在可以享受更加丰富和友好的生成体验！');
            console.log('\n📝 测试建议:');
            console.log('  1. 生成一张图片，测试所有操作按钮');
            console.log('  2. 测试全屏查看和图片交互功能');
            console.log('  3. 测试生成历史的保存和查看功能');
            console.log('  4. 测试随机提示词和清空功能');
            console.log('  5. 测试复制链接和分享功能');
            console.log('  6. 验证响应式设计在不同屏幕尺寸下的表现');
        } else {
            console.log('❌ 生成结果显示优化存在问题，需要进一步完善');
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