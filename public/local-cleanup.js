
/**
 * 本地数据清理脚本
 * 清理浏览器存储和缓存
 */

console.log('🧹 开始本地数据清理...');

// 清理localStorage
const keysToRemove = [
    'flux_krea_user',
    'flux_krea_credits',
    'flux_krea_state_change',
    'user_credits',
    'currentUser',
    'pending_generation_prompt',
    'redirect_after_signin'
];

keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log('✅ 已清理 localStorage:', key);
    }
});

// 清理sessionStorage
const sessionKeys = [
    'temp_user_data',
    'generation_session',
    'auth_state'
];

sessionKeys.forEach(key => {
    if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        console.log('✅ 已清理 sessionStorage:', key);
    }
});

// 重置全局变量
if (window.currentUser) {
    window.currentUser = null;
    console.log('✅ 已重置 window.currentUser');
}

if (window.UnifiedStateSync) {
    window.UnifiedStateSync.setCredits(0);
    console.log('✅ 已重置积分状态');
}

console.log('✅ 本地数据清理完成！');
console.log('💡 建议刷新页面以确保所有状态重置');
