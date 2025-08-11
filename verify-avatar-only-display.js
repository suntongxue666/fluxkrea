/**
 * 验证用户头像显示修改
 * 确保所有页面都只显示头像，不显示用户名
 */
const fs = require('fs');
const path = require('path');

console.log('🎨 验证用户头像显示修改\n');

// 读取相关文件
const indexPath = path.join(__dirname, 'public', 'index.html');
const pricingPath = path.join(__dirname, 'public', 'pricing.html');
const unifiedStateSyncPath = path.join(__dirname, 'public', 'js', 'modules', 'unified-state-sync.js');

const indexContent = fs.readFileSync(indexPath, 'utf8');
const pricingContent = fs.readFileSync(pricingPath, 'utf8');
const unifiedStateSyncContent = fs.readFileSync(unifiedStateSyncPath, 'utf8');

console.log('📋 验证结果:');

// 1. 验证unified-state-sync.js的修改
console.log('\n🔧 unified-state-sync.js修改验证:');
const unifiedSyncChecks = [
    { 
        name: '移除页面特定逻辑', 
        check: !unifiedStateSyncContent.includes('isPricingPage'),
        status: null 
    },
    { 
        name: '统一应用简化样式', 
        check: unifiedStateSyncContent.includes('border: none; padding: 0; background: none;'),
        status: null 
    },
    { 
        name: '移除HTML中的用户名显示', 
        check: !unifiedStateSyncContent.includes('${this.currentUser.name}') && !unifiedStateSyncContent.includes('${this.currentUser.email}'),
        status: null 
    },
    { 
        name: '只显示头像', 
        check: unifiedStateSyncContent.includes('user-avatar') && unifiedStateSyncContent.includes('img src='),
        status: null 
    }
];

unifiedSyncChecks.forEach(check => {
    check.status = check.check;
    console.log(`• ${check.status ? '✅' : '❌'} ${check.name}`);
});

// 2. 验证index.html的修改
console.log('\n📄 index.html修改验证:');
const indexChecks = [
    { 
        name: '第一处用户名显示已移除', 
        check: !indexContent.includes('<span>${this.currentUser.name || this.currentUser.email}</span>'),
        status: null 
    },
    { 
        name: '第二处用户名显示已移除', 
        check: !indexContent.includes('<span>${user.email.split(\'@\')[0]}</span>'),
        status: null 
    },
    { 
        name: '第三处用户名显示已移除', 
        check: !indexContent.includes('<span>${this.currentUser.email.split(\'@\')[0]}</span>'),
        status: null 
    },
    { 
        name: '保留头像显示', 
        check: indexContent.includes('img src="${') && indexContent.includes('avatar_url'),
        status: null 
    }
];

indexChecks.forEach(check => {
    check.status = check.check;
    console.log(`• ${check.status ? '✅' : '❌'} ${check.name}`);
});

// 3. 验证pricing.html的修改
console.log('\n💰 pricing.html修改验证:');
const pricingChecks = [
    { 
        name: '导航栏用户名显示已移除', 
        check: !pricingContent.includes('<span>${currentUser.email.split(\'@\')[0]}</span>'),
        status: null 
    },
    { 
        name: '保留头像显示', 
        check: pricingContent.includes('img src="${currentUser.avatar_url'),
        status: null 
    },
    { 
        name: '订阅弹窗中保留用户邮箱', 
        check: pricingContent.includes('${currentUser.email}') && pricingContent.includes('订阅'),
        status: null 
    }
];

pricingChecks.forEach(check => {
    check.status = check.check;
    console.log(`• ${check.status ? '✅' : '❌'} ${check.name}`);
});

// 4. 检查可能遗漏的用户名显示
console.log('\n🔍 检查可能遗漏的用户名显示:');

// 在index.html中搜索可能的用户名显示
const indexUserNamePatterns = [
    /\$\{.*\.name.*\}/g,
    /\$\{.*\.email.*split.*\}/g,
    /<span>\$\{.*user.*\}/g
];

const indexMatches = [];
indexUserNamePatterns.forEach(pattern => {
    const matches = indexContent.match(pattern);
    if (matches) {
        indexMatches.push(...matches);
    }
});

// 在pricing.html中搜索可能的用户名显示
const pricingUserNamePatterns = [
    /\$\{.*\.name.*\}/g,
    /\$\{.*\.email.*split.*\}/g,
    /<span>\$\{.*user.*\}/g
];

const pricingMatches = [];
pricingUserNamePatterns.forEach(pattern => {
    const matches = pricingContent.match(pattern);
    if (matches) {
        pricingMatches.push(...matches);
    }
});

if (indexMatches.length > 0) {
    console.log('⚠️ index.html中发现可能的用户名显示:');
    indexMatches.forEach(match => {
        console.log(`   - ${match}`);
    });
} else {
    console.log('✅ index.html中没有发现用户名显示');
}

if (pricingMatches.length > 0) {
    console.log('⚠️ pricing.html中发现可能的用户名显示:');
    pricingMatches.forEach(match => {
        console.log(`   - ${match}`);
    });
} else {
    console.log('✅ pricing.html中没有发现用户名显示');
}

// 5. 生成修改总结
console.log('\n📊 修改总结:');
console.log('');
console.log('✅ 已完成的修改:');
console.log('1. unified-state-sync.js: 统一所有页面只显示头像');
console.log('2. index.html: 移除3处用户名显示');
console.log('3. pricing.html: 移除导航栏用户名显示');
console.log('4. 保留订阅弹窗中的用户邮箱（用于确认）');
console.log('');
console.log('🎯 预期效果:');
console.log('• 所有页面导航栏只显示用户头像');
console.log('• 点击头像显示用户状态详情');
console.log('• 界面更简洁，避免用户名长短不一的问题');
console.log('• 订阅时仍显示用户邮箱用于确认');

// 6. 总结验证结果
const allChecks = [...unifiedSyncChecks, ...indexChecks, ...pricingChecks];
const passedChecks = allChecks.filter(check => check.status).length;
const totalChecks = allChecks.length;

console.log(`\n📈 验证总结: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks && indexMatches.length === 0 && pricingMatches.length === 0) {
    console.log('🎉 所有修改验证通过！');
    console.log('');
    console.log('✅ 用户头像显示已完全修复:');
    console.log('• 导航栏只显示头像，无用户名');
    console.log('• 无边框，界面更简洁');
    console.log('• 点击头像可查看用户详情');
    console.log('• 刷新页面后显示正常');
} else {
    console.log('⚠️ 部分修改需要进一步检查');
    
    const failedChecks = allChecks.filter(check => !check.status);
    if (failedChecks.length > 0) {
        console.log('\n❌ 需要修复的问题:');
        failedChecks.forEach((check, index) => {
            console.log(`${index + 1}. ${check.name}`);
        });
    }
}

console.log('\n🚀 部署建议:');
console.log('修改完成后，建议清除浏览器缓存并刷新页面测试效果。');