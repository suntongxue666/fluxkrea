/**
 * PayPal订阅API测试脚本
 * 
 * 这个脚本用于测试PayPal订阅API是否正常工作
 * 使用方法: node test-paypal-subscription.js
 */

// 测试参数
const TEST_PARAMS = {
  planType: 'pro',
  user_id: 'test-user-' + Date.now(),
  email: 'test@example.com'
};

// API端点
const API_ENDPOINT = 'http://localhost:3000/api/simple-paypal-subscription';

/**
 * 测试PayPal订阅API
 */
async function testPayPalSubscription() {
  console.log('🧪 开始测试PayPal订阅API...');
  console.log('📝 测试参数:', TEST_PARAMS);
  
  try {
    // 发送请求
    console.log(`🔄 发送POST请求到 ${API_ENDPOINT}...`);
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_PARAMS)
    });
    
    // 获取响应文本
    const responseText = await response.text();
    
    // 尝试解析为JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('📊 响应数据:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('📝 响应文本:', responseText);
    }
    
    // 检查响应状态
    if (response.ok) {
      console.log('✅ 测试成功! 状态码:', response.status);
      
      if (responseData && responseData.success && responseData.links) {
        // 找到批准链接
        const approveLink = responseData.links.find(link => link.rel === 'approve');
        if (approveLink) {
          console.log('🔗 PayPal批准链接:', approveLink.href);
          console.log('👉 您可以在浏览器中打开此链接来完成订阅流程');
        }
      }
    } else {
      console.error('❌ 测试失败! 状态码:', response.status);
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 执行测试
testPayPalSubscription();