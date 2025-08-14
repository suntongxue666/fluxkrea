/**
 * 前端订阅功能修复工具
 * 
 * 这个脚本用于修复前端订阅功能的问题
 * 使用方法: node fix-frontend-subscription.js
 */

const fs = require('fs');
const path = require('path');

// 修复配置
const CONFIG = {
  // 前端文件路径
  frontendFilePath: './public/js/subscription-handler.js',
  
  // 备份文件路径
  backupFilePath: './public/js/subscription-handler.backup.js',
  
  // 是否启用详细日志
  enableVerboseLogging: true
};

/**
 * 备份前端文件
 */
function backupFrontendFile() {
  console.log('🔄 备份前端文件...');
  
  try {
    if (fs.existsSync(CONFIG.frontendFilePath)) {
      const content = fs.readFileSync(CONFIG.frontendFilePath, 'utf8');
      fs.writeFileSync(CONFIG.backupFilePath, content);
      console.log('✅ 前端文件备份成功:', CONFIG.backupFilePath);
    } else {
      console.error('❌ 前端文件不存在:', CONFIG.frontendFilePath);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 备份前端文件失败:', error);
    process.exit(1);
  }
}

/**
 * 修复API调用
 */
function fixApiCall(content) {
  console.log('🔄 修复API调用...');
  
  // 修复API调用路径
  const updatedContent = content.replace(
    /const paypalResponse = await fetch\('\/api\/simple-paypal-subscription'/g,
    `// 获取当前环境的API路径
                const apiPath = window.location.hostname === 'localhost' ? 
                    'http://localhost:3000/api/simple-paypal-subscription' : 
                    '/api/simple-paypal-subscription';
                
                console.log(\`🔄 使用API路径: \${apiPath}\`);
                
                const paypalResponse = await fetch(apiPath`
  );
  
  return updatedContent;
}

/**
 * 增强错误处理
 */
function enhanceErrorHandling(content) {
  console.log('🔄 增强错误处理...');
  
  // 增强错误处理
  let updatedContent = content.replace(
    /if \(!paypalResponse\.ok\) {.*?throw new Error\(errorMessage\);.*?}/gs,
    `if (!paypalResponse.ok) {
                    let errorMessage = '创建订阅失败';
                    try {
                        const errorData = await paypalResponse.json();
                        console.error('PayPal API 错误:', errorData);
                        errorMessage = errorData.error || errorData.message || 
                                      (errorData.details && errorData.details.message) || 
                                      '创建订阅失败 (错误码: ' + paypalResponse.status + ')';
                    } catch (e) {
                        console.error('解析错误响应失败:', e);
                    }
                    throw new Error(errorMessage);
                }`
  );
  
  // 增强错误显示
  updatedContent = updatedContent.replace(
    /showError\(message\) {.*?}/gs,
    `showError(message) {
            console.error('❌ 显示错误:', message);
            
            // 检查是否已存在错误消息元素
            let errorElement = document.getElementById('subscription-error');
            
            if (!errorElement) {
                // 创建错误消息元素
                errorElement = document.createElement('div');
                errorElement.id = 'subscription-error';
                errorElement.style.cssText = 'position: fixed; top: 20px; right: 20px; background-color: #f44336; color: white; padding: 15px; border-radius: 4px; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2); max-width: 80%; word-wrap: break-word;';
                document.body.appendChild(errorElement);
            }
            
            // 设置错误消息
            errorElement.textContent = message;
            
            // 显示错误消息
            errorElement.style.display = 'block';
            
            // 添加关闭按钮
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.style.cssText = 'position: absolute; top: 5px; right: 10px; cursor: pointer; font-size: 18px;';
            closeButton.onclick = function() {
                errorElement.style.display = 'none';
            };
            errorElement.appendChild(closeButton);
            
            // 10秒后自动隐藏
            setTimeout(() => {
                if (errorElement.style.display !== 'none') {
                    errorElement.style.display = 'none';
                }
            }, 10000);
        }`
  );
  
  return updatedContent;
}

/**
 * 修复变量重复声明
 */
function fixVariableRedeclaration(content) {
  console.log('🔄 修复变量重复声明...');
  
  // 修复变量重复声明
  const updatedContent = content.replace(
    /const subscriptionData = {[\s\S]*?googleUserId,[\s\S]*?googleUserEmail,[\s\S]*?paypalSubscriptionId: paypalData\.subscriptionID,[\s\S]*?planId,[\s\S]*?planType[\s\S]*?};/g,
    `const subscriptionAssociation = {
                    googleUserId,
                    googleUserEmail,
                    paypalSubscriptionId: paypalData.subscriptionID,
                    planId,
                    planType
                };`
  );
  
  return updatedContent;
}

/**
 * 修复前端文件
 */
function fixFrontendFile() {
  console.log('🔄 修复前端文件...');
  
  try {
    // 读取前端文件
    const content = fs.readFileSync(CONFIG.frontendFilePath, 'utf8');
    
    // 应用修复
    let updatedContent = content;
    updatedContent = fixApiCall(updatedContent);
    updatedContent = enhanceErrorHandling(updatedContent);
    updatedContent = fixVariableRedeclaration(updatedContent);
    
    // 写入修复后的文件
    fs.writeFileSync(CONFIG.frontendFilePath, updatedContent);
    
    console.log('✅ 前端文件修复成功');
  } catch (error) {
    console.error('❌ 修复前端文件失败:', error);
    process.exit(1);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始修复前端订阅功能...');
  
  // 备份前端文件
  backupFrontendFile();
  
  // 修复前端文件
  fixFrontendFile();
  
  console.log('\n✅ 修复完成');
  console.log('👉 请刷新浏览器以应用更改');
  console.log('👉 如果需要恢复备份，请运行: cp', CONFIG.backupFilePath, CONFIG.frontendFilePath);
}

// 执行主函数
main();