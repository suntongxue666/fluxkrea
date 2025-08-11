/**
 * 删除测试用户脚本
 * 用于删除指定的测试用户，方便测试新用户注册流程
 */

const fs = require('fs');
const path = require('path');

console.log('🗑️ 测试用户删除脚本\n');

// 要删除的用户邮箱
const usersToDelete = [
    'sunwei7482@gmail.com',
    'tiktreeapp@gmail.com'
];

console.log('📋 准备删除以下用户:');
usersToDelete.forEach((email, index) => {
    console.log(`${index + 1}. ${email}`);
});

console.log('\n🔧 生成删除脚本...');

// 生成SQL删除脚本
const sqlScript = `
-- 删除测试用户脚本
-- 执行前请确保备份重要数据

BEGIN;

-- 删除用户的积分交易记录
DELETE FROM credit_transactions 
WHERE user_uuid IN (
    SELECT uuid FROM users 
    WHERE email IN ('${usersToDelete.join("', '")}')
);

-- 删除用户的生成记录（如果有相关表）
-- DELETE FROM generations 
-- WHERE user_uuid IN (
--     SELECT uuid FROM users 
--     WHERE email IN ('${usersToDelete.join("', '")}')
-- );

-- 删除用户记录
DELETE FROM users 
WHERE email IN ('${usersToDelete.join("', '")}');

-- 显示删除结果
SELECT 'Deleted users:' as message;
SELECT email, uuid FROM users WHERE email IN ('${usersToDelete.join("', '")}');

COMMIT;

-- 如果需要回滚，请使用: ROLLBACK;
`;

// 保存SQL脚本
fs.writeFileSync('delete-test-users.sql', sqlScript);
console.log('✅ 已生成SQL删除脚本: delete-test-users.sql');

// 生成JavaScript版本的删除脚本（使用Supabase客户端）
const jsScript = `
/**
 * 使用Supabase客户端删除测试用户
 * 在浏览器控制台中运行此脚本
 */

async function deleteTestUsers() {
    const usersToDelete = ['${usersToDelete.join("', '")}'];
    
    if (!window.supabaseClient) {
        console.error('❌ Supabase客户端未初始化');
        return;
    }
    
    console.log('🗑️ 开始删除测试用户...');
    
    try {
        // 1. 获取要删除的用户信息
        const { data: users, error: fetchError } = await window.supabaseClient
            .from('users')
            .select('id, uuid, email, credits')
            .in('email', usersToDelete);
            
        if (fetchError) {
            console.error('❌ 获取用户信息失败:', fetchError);
            return;
        }
        
        if (!users || users.length === 0) {
            console.log('ℹ️ 未找到要删除的用户');
            return;
        }
        
        console.log('📋 找到以下用户:');
        users.forEach(user => {
            console.log(\`  - \${user.email} (UUID: \${user.uuid}, 积分: \${user.credits})\`);
        });
        
        // 2. 删除积分交易记录
        const userUuids = users.map(u => u.uuid);
        const { error: transactionError } = await window.supabaseClient
            .from('credit_transactions')
            .delete()
            .in('user_uuid', userUuids);
            
        if (transactionError) {
            console.warn('⚠️ 删除积分交易记录失败:', transactionError);
        } else {
            console.log('✅ 已删除积分交易记录');
        }
        
        // 3. 删除用户记录
        const { error: deleteError } = await window.supabaseClient
            .from('users')
            .delete()
            .in('email', usersToDelete);
            
        if (deleteError) {
            console.error('❌ 删除用户失败:', deleteError);
            return;
        }
        
        console.log('✅ 用户删除成功！');
        
        // 4. 验证删除结果
        const { data: remainingUsers } = await window.supabaseClient
            .from('users')
            .select('email')
            .in('email', usersToDelete);
            
        if (!remainingUsers || remainingUsers.length === 0) {
            console.log('✅ 验证通过：所有指定用户已被删除');
        } else {
            console.warn('⚠️ 部分用户可能未被完全删除:', remainingUsers);
        }
        
    } catch (error) {
        console.error('❌ 删除过程中发生错误:', error);
    }
}

// 执行删除
deleteTestUsers();
`;

// 保存JavaScript脚本
fs.writeFileSync('delete-test-users-browser.js', jsScript);
console.log('✅ 已生成浏览器脚本: delete-test-users-browser.js');

// 生成HTML测试页面
const htmlPage = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>删除测试用户</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .user-item { padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px; }
        .button { padding: 10px 20px; margin: 10px 5px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .button:hover { background: #c82333; }
        .button.safe { background: #28a745; }
        .button.safe:hover { background: #218838; }
        .log { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; white-space: pre-wrap; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗑️ 删除测试用户</h1>
        
        <div class="warning">
            <strong>⚠️ 警告：</strong>此操作将永久删除用户数据，请确保你真的需要删除这些用户！
        </div>
        
        <h3>要删除的用户：</h3>
        <div class="user-item">📧 sunwei7482@gmail.com</div>
        <div class="user-item">📧 tiktreeapp@gmail.com</div>
        
        <h3>操作选项：</h3>
        <button class="button safe" onclick="checkUsers()">🔍 检查用户是否存在</button>
        <button class="button" onclick="deleteUsers()">🗑️ 删除用户</button>
        <button class="button safe" onclick="clearLog()">🧹 清空日志</button>
        
        <h3>操作日志：</h3>
        <div id="log" class="log">等待操作...</div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        // 初始化Supabase客户端
        const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        
        const usersToDelete = ['sunwei7482@gmail.com', 'tiktreeapp@gmail.com'];
        
        function log(message) {
            const logElement = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            logElement.textContent += \`[\${timestamp}] \${message}\\n\`;
            logElement.scrollTop = logElement.scrollHeight;
        }
        
        function clearLog() {
            document.getElementById('log').textContent = '日志已清空...\\n';
        }
        
        async function checkUsers() {
            log('🔍 检查用户是否存在...');
            
            try {
                const { data: users, error } = await supabase
                    .from('users')
                    .select('id, uuid, email, credits, created_at')
                    .in('email', usersToDelete);
                    
                if (error) {
                    log(\`❌ 查询失败: \${error.message}\`);
                    return;
                }
                
                if (!users || users.length === 0) {
                    log('ℹ️ 未找到指定的用户');
                    return;
                }
                
                log(\`📋 找到 \${users.length} 个用户:\`);
                users.forEach(user => {
                    log(\`  - \${user.email}\`);
                    log(\`    UUID: \${user.uuid}\`);
                    log(\`    积分: \${user.credits}\`);
                    log(\`    创建时间: \${user.created_at}\`);
                });
                
            } catch (error) {
                log(\`❌ 检查过程中发生错误: \${error.message}\`);
            }
        }
        
        async function deleteUsers() {
            if (!confirm('确定要删除这些用户吗？此操作不可撤销！')) {
                log('❌ 用户取消了删除操作');
                return;
            }
            
            log('🗑️ 开始删除用户...');
            
            try {
                // 1. 获取要删除的用户信息
                const { data: users, error: fetchError } = await supabase
                    .from('users')
                    .select('id, uuid, email, credits')
                    .in('email', usersToDelete);
                    
                if (fetchError) {
                    log(\`❌ 获取用户信息失败: \${fetchError.message}\`);
                    return;
                }
                
                if (!users || users.length === 0) {
                    log('ℹ️ 未找到要删除的用户');
                    return;
                }
                
                log(\`📋 准备删除 \${users.length} 个用户\`);
                
                // 2. 删除积分交易记录
                const userUuids = users.map(u => u.uuid);
                log('🔄 删除积分交易记录...');
                
                const { error: transactionError } = await supabase
                    .from('credit_transactions')
                    .delete()
                    .in('user_uuid', userUuids);
                    
                if (transactionError) {
                    log(\`⚠️ 删除积分交易记录失败: \${transactionError.message}\`);
                } else {
                    log('✅ 积分交易记录删除成功');
                }
                
                // 3. 删除用户记录
                log('🔄 删除用户记录...');
                
                const { error: deleteError } = await supabase
                    .from('users')
                    .delete()
                    .in('email', usersToDelete);
                    
                if (deleteError) {
                    log(\`❌ 删除用户失败: \${deleteError.message}\`);
                    return;
                }
                
                log('✅ 用户删除成功！');
                
                // 4. 验证删除结果
                log('🔄 验证删除结果...');
                
                const { data: remainingUsers } = await supabase
                    .from('users')
                    .select('email')
                    .in('email', usersToDelete);
                    
                if (!remainingUsers || remainingUsers.length === 0) {
                    log('✅ 验证通过：所有指定用户已被删除');
                } else {
                    log(\`⚠️ 部分用户可能未被完全删除: \${remainingUsers.map(u => u.email).join(', ')}\`);
                }
                
            } catch (error) {
                log(\`❌ 删除过程中发生错误: \${error.message}\`);
            }
        }
        
        // 页面加载完成后检查用户
        window.addEventListener('load', () => {
            log('📱 页面加载完成，Supabase客户端已初始化');
            setTimeout(checkUsers, 1000);
        });
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'public', 'delete-test-users.html'), htmlPage);
console.log('✅ 已生成删除用户页面: public/delete-test-users.html');

console.log('\n📖 使用说明:');
console.log('');
console.log('方法1 - 使用网页界面（推荐）:');
console.log('  访问: http://localhost:3001/delete-test-users.html');
console.log('  点击"检查用户是否存在"确认用户信息');
console.log('  点击"删除用户"执行删除操作');
console.log('');
console.log('方法2 - 使用SQL脚本:');
console.log('  1. 连接到你的Supabase数据库');
console.log('  2. 执行 delete-test-users.sql 脚本');
console.log('');
console.log('方法3 - 使用浏览器控制台:');
console.log('  1. 打开主页 http://localhost:3001/');
console.log('  2. 打开浏览器控制台');
console.log('  3. 复制并运行 delete-test-users-browser.js 中的代码');

console.log('\n⚠️ 重要提醒:');
console.log('- 删除操作不可撤销，请确保备份重要数据');
console.log('- 建议先使用"检查用户"功能确认用户信息');
console.log('- 删除后这些邮箱可以重新注册，获得新的20积分');

console.log('\n✅ 删除脚本生成完成！');