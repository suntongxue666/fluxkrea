/**
 * 新用户积分问题诊断脚本
 * 专门排查为什么新用户登录后积分为0的问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 新用户积分问题诊断\n');

// 读取index.html文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('📋 诊断结果:');

// 1. 检查系统默认积分设置
const systemSettingsMatch = indexContent.match(/systemSettings\s*=\s*\{[\s\S]*?default_credits:\s*(\d+)/);
if (systemSettingsMatch) {
    const defaultCredits = systemSettingsMatch[1];
    console.log(`1. ✅ 系统默认积分设置: ${defaultCredits}`);
} else {
    console.log('1. ❌ 未找到系统默认积分设置');
}

// 2. 检查新用户创建时的积分设置
const userCreationMatch = indexContent.match(/credits:\s*systemSettings\.default_credits\s*\|\|\s*(\d+)/g);
if (userCreationMatch && userCreationMatch.length > 0) {
    console.log(`2. ✅ 新用户创建积分设置: ${userCreationMatch.length} 处设置`);
    userCreationMatch.forEach((match, index) => {
        console.log(`   设置${index + 1}: ${match}`);
    });
} else {
    console.log('2. ❌ 未找到新用户创建时的积分设置');
}

// 3. 检查积分交易记录创建
const creditTransactionMatch = indexContent.match(/addCreditTransaction[\s\S]*?新用户注册奖励/);
if (creditTransactionMatch) {
    console.log('3. ✅ 找到新用户积分交易记录创建');
} else {
    console.log('3. ❌ 未找到新用户积分交易记录创建');
}

// 4. 检查UnifiedStateSync中的积分同步
const unifiedStateSyncPath = path.join(__dirname, 'public', 'js', 'modules', 'unified-state-sync.js');
if (fs.existsSync(unifiedStateSyncPath)) {
    const unifiedStateSyncContent = fs.readFileSync(unifiedStateSyncPath, 'utf8');

    const syncChecks = [
        { name: '积分同步API', pattern: /syncCreditsFromAPI/, found: unifiedStateSyncContent.includes('syncCreditsFromAPI') },
        { name: '积分设置方法', pattern: /setCredits/, found: unifiedStateSyncContent.includes('setCredits') },
        { name: '数据库积分更新', pattern: /updateCreditsInDatabase/, found: unifiedStateSyncContent.includes('updateCreditsInDatabase') }
    ];

    console.log('\n4. UnifiedStateSync积分功能检查:');
    syncChecks.forEach(check => {
        console.log(`   ${check.found ? '✅' : '❌'} ${check.name}`);
    });
} else {
    console.log('4. ❌ UnifiedStateSync模块文件不存在');
}

// 5. 检查登录成功后的积分同步逻辑
const loginSyncMatch = indexContent.match(/登录后积分同步成功|syncCreditsFromAPI/g);
if (loginSyncMatch && loginSyncMatch.length > 0) {
    console.log(`5. ✅ 登录后积分同步逻辑: ${loginSyncMatch.length} 处调用`);
} else {
    console.log('5. ❌ 未找到登录后积分同步逻辑');
}

// 6. 分析可能的问题原因
console.log('\n🔍 可能的问题原因分析:');
console.log('');
console.log('1. **数据库层面问题**:');
console.log('   - 数据库表的默认值设置可能被覆盖');
console.log('   - 可能存在触发器或约束导致积分被重置为0');
console.log('   - 用户表的credits字段可能有NOT NULL DEFAULT 0约束');
console.log('');
console.log('2. **API调用问题**:');
console.log('   - 新用户创建的API调用可能失败');
console.log('   - 积分交易记录创建可能失败');
console.log('   - Supabase客户端权限问题');
console.log('');
console.log('3. **时序问题**:');
console.log('   - 用户创建和积分设置之间可能存在竞态条件');
console.log('   - 积分同步可能在用户创建之前执行');
console.log('   - 多个积分设置调用可能相互覆盖');
console.log('');
console.log('4. **缓存问题**:');
console.log('   - 前端可能缓存了旧的用户数据');
console.log('   - localStorage中可能存在冲突数据');
console.log('   - 浏览器可能缓存了旧的API响应');

// 7. 生成排查建议
console.log('\n🛠️ 排查建议:');
console.log('');
console.log('**立即检查项目**:');
console.log('1. 检查Supabase数据库中users表的默认值设置');
console.log('2. 查看数据库日志，确认用户创建时的积分值');
console.log('3. 检查是否有数据库触发器影响积分设置');
console.log('');
console.log('**代码层面修复**:');
console.log('1. 在用户创建后立即强制设置积分为20');
console.log('2. 添加积分设置失败的重试机制');
console.log('3. 增加详细的日志记录，追踪积分设置过程');
console.log('');
console.log('**测试验证**:');
console.log('1. 使用新的Gmail账号测试注册流程');
console.log('2. 在浏览器开发者工具中监控API调用');
console.log('3. 检查控制台日志中的积分相关信息');

// 8. 生成修复代码建议
console.log('\n💡 修复代码建议:');
console.log('');
console.log('在用户创建成功后，添加强制积分设置:');
console.log('```javascript');
console.log('// 在用户创建成功后立即设置积分');
console.log('if (data && data.id) {');
console.log('    // 强制更新积分为20');
console.log('    const { error: creditsError } = await supabaseClient');
console.log('        .from("users")');
console.log('        .update({ credits: 20, total_credits_earned: 20 })');
console.log('        .eq("id", data.id);');
console.log('    ');
console.log('    if (creditsError) {');
console.log('        console.error("❌ 强制设置积分失败:", creditsError);');
console.log('    } else {');
console.log('        console.log("✅ 强制设置积分成功: 20");');
console.log('    }');
console.log('    ');
console.log('    // 同步到前端状态');
console.log('    if (window.UnifiedStateSync) {');
console.log('        window.UnifiedStateSync.setCredits(20);');
console.log('    }');
console.log('}');
console.log('```');

console.log('\n🎯 针对sunwei7482@gmail.com的特殊处理:');
console.log('由于该账号已从数据库删除，下次登录时应该会创建新用户记录。');
console.log('建议在用户创建逻辑中添加额外的验证和日志记录。');

console.log('\n📞 如需进一步协助:');
console.log('1. 提供浏览器控制台的完整日志');
console.log('2. 检查Supabase数据库中的用户记录');
console.log('3. 确认API调用的响应状态');
console.log('4. 验证系统设置是否正确加载');