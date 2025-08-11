/**
 * 修复订阅API语法错误
 */
const fs = require('fs');
const path = require('path');

// 修复handle-subscription.js文件
function fixHandleSubscription() {
  const filePath = path.join(process.cwd(), 'api', 'handle-subscription.js');
  
  try {
    // 读取文件内容
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复语法错误
    content = content.replace(/const supabase = createClient\(SUPABASE_URL SUPABASE_ANON_KEY\);/, 
                            'const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);');
    
    // 修复其他语法错误（逗号缺失）
    content = content.replace(/console\.log\('📝 处理订阅关联:' \{/g, 
                            "console.log('📝 处理订阅关联:', {");
    
    content = content.replace(/googleUserId\s+googleUserEmail/g, 'googleUserId,\n            googleUserEmail');
    content = content.replace(/googleUserEmail\s+paypalSubscriptionId/g, 'googleUserEmail,\n            paypalSubscriptionId');
    content = content.replace(/paypalSubscriptionId\s+planId/g, 'paypalSubscriptionId,\n            planId');
    content = content.replace(/planId\s+planType/g, 'planId,\n            planType');
    
    // 修复其他对象属性的逗号缺失
    content = content.replace(/uuid: googleUserId\s+email: googleUserEmail/g, 'uuid: googleUserId,\n                        email: googleUserEmail');
    content = content.replace(/email: googleUserEmail\s+name:/g, 'email: googleUserEmail,\n                        name:');
    content = content.replace(/name: .+\s+credits:/g, match => match.replace(/\s+credits:/, ',\n                        credits:'));
    content = content.replace(/credits: 0\s+subscription_status:/g, 'credits: 0,\n                        subscription_status:');
    content = content.replace(/subscription_status: 'PENDING'\s+created_at:/g, 'subscription_status: \'PENDING\',\n                        created_at:');
    
    // 修复用户订阅关联对象的逗号缺失
    content = content.replace(/google_user_id: googleUserId\s+google_user_email:/g, 'google_user_id: googleUserId,\n                google_user_email:');
    content = content.replace(/google_user_email: googleUserEmail\s+paypal_subscription_id:/g, 'google_user_email: googleUserEmail,\n                paypal_subscription_id:');
    content = content.replace(/paypal_subscription_id: paypalSubscriptionId\s+plan_id:/g, 'paypal_subscription_id: paypalSubscriptionId,\n                plan_id:');
    content = content.replace(/plan_id: planId\s+plan_type:/g, 'plan_id: planId,\n                plan_type:');
    content = content.replace(/plan_type: planType\s+status:/g, 'plan_type: planType,\n                status:');
    content = content.replace(/status: 'PENDING'\s+created_at:/g, 'status: \'PENDING\',\n                created_at:');
    
    // 修复subscriptions表更新对象的逗号缺失
    content = content.replace(/id: paypalSubscriptionId\s+user_uuid:/g, 'id: paypalSubscriptionId,\n                user_uuid:');
    content = content.replace(/user_uuid: googleUserId\s+user_email:/g, 'user_uuid: googleUserId,\n                user_email:');
    content = content.replace(/user_email: googleUserEmail\s+plan_id:/g, 'user_email: googleUserEmail,\n                plan_id:');
    content = content.replace(/plan_id: planId\s+plan_type:/g, 'plan_id: planId,\n                plan_type:');
    content = content.replace(/plan_type: planType\s+status:/g, 'plan_type: planType,\n                status:');
    content = content.replace(/status: 'PENDING'\s+created_at:/g, 'status: \'PENDING\',\n                created_at:');
    content = content.replace(/created_at: new Date\(\).toISOString\(\)\s+updated_at:/g, 'created_at: new Date().toISOString(),\n                updated_at:');
    
    // 修复响应对象的逗号缺失
    content = content.replace(/message: 'Subscription saved successfully'\s+user_id:/g, 'message: \'Subscription saved successfully\',\n            user_id:');
    content = content.replace(/user_id: googleUserId\s+subscription_id:/g, 'user_id: googleUserId,\n            subscription_id:');
    
    // 修复eq函数参数的逗号缺失
    content = content.replace(/\.eq\('uuid' googleUserId\)/g, '.eq(\'uuid\', googleUserId)');
    content = content.replace(/\.eq\('id' emailUser\.id\)/g, '.eq(\'id\', emailUser.id)');
    content = content.replace(/\.eq\('uuid' googleUserId\)/g, '.eq(\'uuid\', googleUserId)');
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ handle-subscription.js 文件已修复');
    
    return true;
  } catch (error) {
    console.error('❌ 修复handle-subscription.js失败:', error);
    return false;
  }
}

// 修复paypal-webhook.js文件
function fixPaypalWebhook() {
  const filePath = path.join(process.cwd(), 'api', 'paypal-webhook.js');
  
  try {
    // 读取文件内容
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复计划配置对象的逗号缺失
    content = content.replace(/'P-5S785818YS7424947NCJBKQA': \{\s+name: 'Pro Plan'\s+credits: 1000\s+price: 9\.99\s+\}/g, 
                            '\'P-5S785818YS7424947NCJBKQA\': {\n        name: \'Pro Plan\',\n        credits: 1000,\n        price: 9.99\n    }');
    
    content = content.replace(/'P-3NJ78684DS796242VNCJBKQQ': \{\s+name: 'Max Plan'\s+credits: 5000\s+price: 29\.99\s+\}/g, 
                            '\'P-3NJ78684DS796242VNCJBKQQ\': {\n        name: \'Max Plan\',\n        credits: 5000,\n        price: 29.99\n    }');
    
    // 修复console.log参数的逗号缺失
    content = content.replace(/console\.log\('PayPal Webhook received:' req\.method\);/g, 
                            'console.log(\'PayPal Webhook received:\', req.method);');
    
    content = content.replace(/console\.log\('Event type:' event_type\);/g, 
                            'console.log(\'Event type:\', event_type);');
    
    content = content.replace(/console\.log\('Resource ID:' resource\?\.id\);/g, 
                            'console.log(\'Resource ID:\', resource?.id);');
    
    // 修复https.request参数的逗号缺失
    content = content.replace(/const req = https\.request\(options \(res\) =>/g, 
                            'const req = https.request(options, (res) =>');
    
    // 修复res.on参数的逗号缺失
    content = content.replace(/res\.on\('data' \(chunk\) =>/g, 
                            'res.on(\'data\', (chunk) =>');
    
    content = content.replace(/res\.on\('end' \(\) =>/g, 
                            'res.on(\'end\', () =>');
    
    // 修复req.on参数的逗号缺失
    content = content.replace(/req\.on\('error' \(error\) =>/g, 
                            'req.on(\'error\', (error) =>');
    
    // 修复console.warn和console.error参数的逗号缺失
    content = content.replace(/console\.warn\('Webhook事件日志记录失败:' result\.error\.message\);/g, 
                            'console.warn(\'Webhook事件日志记录失败:\', result.error.message);');
    
    content = content.replace(/console\.warn\('错误详情:' JSON\.stringify\(result\.error\)\);/g, 
                            'console.warn(\'错误详情:\', JSON.stringify(result.error));');
    
    content = content.replace(/console\.error\('日志记录异常:' error\);/g, 
                            'console.error(\'日志记录异常:\', error);');
    
    content = content.replace(/console\.log\('处理订阅激活:' resource\.id\);/g, 
                            'console.log(\'处理订阅激活:\', resource.id);');
    
    content = content.replace(/console\.error\('未知的计划ID:' planId\);/g, 
                            'console.error(\'未知的计划ID:\', planId);');
    
    content = content.replace(/console\.log\('计划详情:' planDetails\);/g, 
                            'console.log(\'计划详情:\', planDetails);');
    
    content = content.replace(/console\.log\('用户信息:' userInfo\);/g, 
                            'console.log(\'用户信息:\', userInfo);');
    
    content = content.replace(/console\.error\('无法解析custom_id:' customId\);/g, 
                            'console.error(\'无法解析custom_id:\', customId);');
    
    content = content.replace(/console\.log\('通过UUID找到用户:' user\.email\);/g, 
                            'console.log(\'通过UUID找到用户:\', user.email);');
    
    content = content.replace(/console\.log\('通过邮箱找到用户:' user\.email\);/g, 
                            'console.log(\'通过邮箱找到用户:\', user.email);');
    
    content = content.replace(/console\.error\('找不到用户:' userInfo\.email\);/g, 
                            'console.error(\'找不到用户:\', userInfo.email);');
    
    content = content.replace(/console\.error\('更新用户积分失败:' updateResult\.error\.message\);/g, 
                            'console.error(\'更新用户积分失败:\', updateResult.error.message);');
    
    content = content.replace(/console\.warn\('积分交易记录失败:' transError\.message\);/g, 
                            'console.warn(\'积分交易记录失败:\', transError.message);');
    
    content = content.replace(/console\.error\('处理订阅激活失败:' error\);/g, 
                            'console.error(\'处理订阅激活失败:\', error);');
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ paypal-webhook.js 文件已修复');
    
    return true;
  } catch (error) {
    console.error('❌ 修复paypal-webhook.js失败:', error);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔧 开始修复订阅API文件...');
  
  // 修复handle-subscription.js
  const handleSubscriptionFixed = fixHandleSubscription();
  
  // 修复paypal-webhook.js
  const paypalWebhookFixed = fixPaypalWebhook();
  
  if (handleSubscriptionFixed && paypalWebhookFixed) {
    console.log('✅ 所有API文件已成功修复');
    console.log('🚀 订阅功能应该可以正常工作了');
  } else {
    console.log('⚠️ 部分文件修复失败，请手动检查');
  }
}

// 执行主函数
main().catch(err => {
  console.error('执行出错:', err);
});