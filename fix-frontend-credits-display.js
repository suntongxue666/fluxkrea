// 修复前端积分显示问题
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 要修复的用户邮箱
const TARGET_EMAIL = 'sunwei7482@gmail.com';

async function main() {
    console.log('===== 前端积分显示修复工具 =====');
    console.log(`目标用户: ${TARGET_EMAIL}`);
    console.log('');
    
    try {
        // 1. 检查数据库中的积分
        console.log('1. 检查数据库中的积分...');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', TARGET_EMAIL);
        
        if (userError) {
            console.error('❌ 查询用户失败:', userError.message);
            return;
        }
        
        if (!users || users.length === 0) {
            console.error('❌ 找不到用户:', TARGET_EMAIL);
            return;
        }
        
        const user = users[0];
        console.log(`✅ 数据库中用户积分: ${user.credits}`);
        
        // 2. 检查API响应
        console.log('\n2. 测试API响应...');
        console.log('请在浏览器中打开以下URL:');
        console.log(`http://localhost:3001/api/get-user-credits?debug=1`);
        console.log('这将检查API是否正常运行');
        
        // 3. 检查前端缓存
        console.log('\n3. 前端缓存问题解决方案:');
        console.log('请在浏览器中执行以下步骤:');
        console.log('1) 打开开发者工具 (F12)');
        console.log('2) 切换到"应用"或"Application"标签');
        console.log('3) 在左侧找到"存储"或"Storage"下的"本地存储"或"Local Storage"');
        console.log('4) 查找并删除以下键:');
        console.log('   - flux_krea_credits');
        console.log('   - flux_krea_last_sync');
        console.log('5) 刷新页面');
        
        // 4. 创建修复脚本
        console.log('\n4. 创建前端修复脚本...');
        
        const fixScript = `
// 前端积分显示修复脚本
// 复制此脚本到浏览器控制台执行

// 清除本地存储中的积分缓存
localStorage.removeItem('flux_krea_credits');
localStorage.removeItem('flux_krea_last_sync');

// 强制重新获取积分
async function forceRefreshCredits() {
    try {
        const response = await fetch('/api/get-user-credits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        console.log('API响应:', data);
        
        if (data.success) {
            console.log('✅ 积分已更新:', data.credits);
            
            // 更新本地存储
            const userIdentifier = localStorage.getItem('flux_krea_user') || 'default';
            const creditsObj = {};
            creditsObj[userIdentifier] = data.credits;
            localStorage.setItem('flux_krea_credits', JSON.stringify(creditsObj));
            localStorage.setItem('flux_krea_last_sync', Date.now().toString());
            
            // 更新显示
            const creditsElements = document.querySelectorAll('#creditsAmount, .credits-amount');
            creditsElements.forEach(element => {
                if (element) {
                    element.textContent = data.credits;
                }
            });
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('creditsUpdated', {
                detail: { credits: data.credits }
            }));
            
            // 尝试调用全局更新函数
            if (window.creditsSync && typeof window.creditsSync.updateDisplay === 'function') {
                window.creditsSync.updateDisplay();
            }
            
            return data.credits;
        } else {
            console.error('❌ 获取积分失败:', data.error || '未知错误');
            return null;
        }
    } catch (error) {
        console.error('❌ 请求出错:', error);
        return null;
    }
}

// 执行刷新
forceRefreshCredits().then(credits => {
    if (credits !== null) {
        alert('积分已更新: ' + credits);
    } else {
        alert('积分更新失败，请查看控制台获取详细信息');
    }
});
`;
        
        console.log('前端修复脚本已生成，请复制以下代码到浏览器控制台执行:');
        console.log('```javascript');
        console.log(fixScript);
        console.log('```');
        
        // 5. 保存脚本到文件
        const fs = require('fs');
        fs.writeFileSync('frontend-fix.js', fixScript);
        console.log('\n✅ 修复脚本已保存到 frontend-fix.js');
        
    } catch (err) {
        console.error('程序执行错误:', err);
    }
}

// 运行主函数
main();