/**
 * 积分系统优化验证脚本
 * 验证所有优化功能是否正确实现
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证积分系统优化...\n');

// 读取文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const pricingPath = path.join(__dirname, 'public', 'pricing.html');
const unifiedStateSyncPath = path.join(__dirname, 'public', 'js', 'modules', 'unified-state-sync.js');

const indexContent = fs.readFileSync(indexPath, 'utf8');
const pricingContent = fs.readFileSync(pricingPath, 'utf8');
const unifiedStateSyncContent = fs.readFileSync(unifiedStateSyncPath, 'utf8');

console.log('📋 验证结果:');

// 1. 验证未注册用户Generate弹窗优化
console.log('\n1. 未注册用户Generate弹窗优化:');
const hasOptimizedModal = indexContent.includes('🎁 获取免费积分') && 
                         indexContent.includes('首次登录即可获得 20 个免费积分');
console.log(`   ${hasOptimizedModal ? '✅' : '❌'} 弹窗标题和内容已优化`);

const hasHTMLContent = indexContent.includes('content.innerHTML') && 
                      indexContent.includes('text-align: center');
console.log(`   ${hasHTMLContent ? '✅' : '❌'} 使用HTML格式化内容`);

// 2. 验证登录后只显示头像
console.log('\n2. 登录后只显示Gmail头像:');
const hasAvatarOnlyDisplay = unifiedStateSyncContent.includes('user-avatar') && 
                            unifiedStateSyncContent.includes('logged-in');
console.log(`   ${hasAvatarOnlyDisplay ? '✅' : '❌'} 登录后只显示头像`);

const hasAvatarCSS = indexContent.includes('.signin-btn.logged-in') && 
                    indexContent.includes('.user-avatar');
console.log(`   ${hasAvatarCSS ? '✅' : '❌'} 头像样式已添加`);

// 3. 验证用户信息下拉菜单
console.log('\n3. 用户信息下拉菜单:');
const hasDropdownHTML = indexContent.includes('userDropdown') && 
                       indexContent.includes('user-dropdown-content');
console.log(`   ${hasDropdownHTML ? '✅' : '❌'} 下拉菜单HTML结构已添加`);

const hasDropdownCSS = indexContent.includes('.user-dropdown {') && 
                      indexContent.includes('.dropdown-btn');
console.log(`   ${hasDropdownCSS ? '✅' : '❌'} 下拉菜单CSS样式已添加`);

const hasDropdownJS = indexContent.includes('toggleUserDropdown') && 
                     indexContent.includes('handleSignOut');
console.log(`   ${hasDropdownJS ? '✅' : '❌'} 下拉菜单JavaScript功能已添加`);

const hasUserInfo = indexContent.includes('dropdownUsername') && 
                   indexContent.includes('dropdownUserLevel') && 
                   indexContent.includes('dropdownValidTime');
console.log(`   ${hasUserInfo ? '✅' : '❌'} 用户信息显示元素已添加`);

// 4. 验证Pricing页面积分显示优化
console.log('\n4. Pricing页面积分显示优化:');
const hasCreditsIcon = pricingContent.includes('fas fa-coins') && 
                      pricingContent.includes('creditsAmount');
console.log(`   ${hasCreditsIcon ? '✅' : '❌'} 积分图标已添加`);

const hasConsistentStyle = pricingContent.includes('linear-gradient(135deg, #667eea 0%, #764ba2 100%)') && 
                          pricingContent.includes('border-radius: 20px');
console.log(`   ${hasConsistentStyle ? '✅' : '❌'} 积分显示样式已统一`);

// 5. 验证UnifiedStateSync集成
console.log('\n5. UnifiedStateSync集成:');
const hasUpdatedUserDisplay = unifiedStateSyncContent.includes('toggleUserDropdown') && 
                             unifiedStateSyncContent.includes('classList.add(\'logged-in\')');
console.log(`   ${hasUpdatedUserDisplay ? '✅' : '❌'} 用户显示更新逻辑已优化`);

// 6. 验证响应式设计
console.log('\n6. 响应式设计:');
const hasResponsiveCSS = indexContent.includes('@media (max-width: 768px)') && 
                        indexContent.includes('user-dropdown');
console.log(`   ${hasResponsiveCSS ? '✅' : '❌'} 响应式样式已添加`);

// 7. 验证测试页面
console.log('\n7. 测试页面:');
const testPagePath = path.join(__dirname, 'public', 'test-credits-optimization.html');
const hasTestPage = fs.existsSync(testPagePath);
console.log(`   ${hasTestPage ? '✅' : '❌'} 测试页面已创建`);

// 统计结果
const checks = [
    hasOptimizedModal,
    hasHTMLContent,
    hasAvatarOnlyDisplay,
    hasAvatarCSS,
    hasDropdownHTML,
    hasDropdownCSS,
    hasDropdownJS,
    hasUserInfo,
    hasCreditsIcon,
    hasConsistentStyle,
    hasUpdatedUserDisplay,
    hasResponsiveCSS,
    hasTestPage
];

const passedChecks = checks.filter(Boolean).length;
const totalChecks = checks.length;

console.log('\n📊 验证统计:');
console.log(`   通过: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
    console.log('\n🎉 所有优化功能验证通过！');
} else {
    console.log('\n⚠️ 部分功能需要检查，请查看上述详细结果');
}

console.log('\n🚀 功能测试指南:');
console.log('1. 访问 http://localhost:3001/ 测试主页功能');
console.log('2. 访问 http://localhost:3001/test-credits-optimization.html 运行自动化测试');
console.log('3. 访问 http://localhost:3001/pricing.html 测试Pricing页面');

console.log('\n📋 手动测试步骤:');
console.log('• 未登录状态下点击Generate按钮，检查弹窗内容');
console.log('• 登录后检查是否只显示圆形头像');
console.log('• 点击头像检查下拉菜单是否显示');
console.log('• 检查下拉菜单中的用户信息是否正确');
console.log('• 测试登出功能是否正常');
console.log('• 检查积分显示是否有金币图标');
console.log('• 验证跨页面积分显示的一致性');

console.log('\n🔧 如果发现问题:');
console.log('1. 检查浏览器控制台是否有JavaScript错误');
console.log('2. 确认所有CSS样式是否正确加载');
console.log('3. 验证UnifiedStateSync是否正确初始化');
console.log('4. 检查用户登录状态和积分同步');

console.log('\n✅ 积分系统优化验证完成！');