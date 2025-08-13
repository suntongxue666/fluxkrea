/**
 * 这个脚本用于诊断PayPal订阅API的问题
 * 使用方法: node diagnose-subscription.js
 */

// 测试参数
const TEST_PARAMS = {
  planType: 'pro',
  user_id: 'test-user-' + Date.now(),
  email: 'test@example.com'
};

// API端点
const API_ENDPOINTS = [
  'http://localhost:3000/api/simple-paypal-subscription',
  '/api/simple-paypal-subscription',
  'https://www.fluxkrea.me/api/simple-paypal-subscription'
];

/**
 * 测试PayPal访问令牌获取
 */
async function testPayPalAuth() {
  console.log('🧪 测试PayPal认证...');

  try {
    // 使用环境变量中的PayPal凭证
    const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8';
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'ENlcBlade--RMAM6EWnp16tTsPaw_nDogYdriNgIfI4KSng-kY2YhqO7job-WRa6tDctYFGXAf9MWLzC';

    // 安全的Base64编码函数
    function safeBase64Encode(str) {
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64');
      } else if (typeof btoa === 'function') {
        return btoa(str);
      } else {
        throw new Error('无法执行Base64编码，环境不支持');
      }
    }

    console.log('🔄 正在获取PayPal访问令牌...');

    const auth = safeBase64Encode(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: 'grant_type=client_credentials'
    });

    console.log('📊 PayPal认证响应状态:', response.status);

    const responseText = await response.text();
    console.log('📝 PayPal认证响应文本:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ PayPal认证成功! 访问令牌:', data.access_token ? '已获取' : '未获取');
        return data.access_token;
      } catch (e) {
        console.error('❌ 解析PayPal认证响应失败:', e);
      }
    } else {
      console.error('❌ PayPal认证失败! 状态码:', response.status);
    }
  } catch (error) {
    console.error('❌ PayPal认证测试过程中发生错误:', error);
  }

  return null;
}

/**
 * 测试PayPal订阅API
 */
async function testPayPalSubscription() {
  console.log('\n🧪 开始测试PayPal订阅API...');
  console.log('📝 测试参数:', TEST_PARAMS);

  // 先测试认证
  const accessToken = await testPayPalAuth();

  if (!accessToken) {
    console.error('❌ 无法继续测试，因为PayPal认证失败');
    return;
  }

  // 测试每个API端点
  for (const endpoint of API_ENDPOINTS) {
    console.log(`\n🧪 测试API端点: ${endpoint}`);

    try {
      // 发送请求
      console.log(`🔄 发送POST请求到 ${endpoint}...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_PARAMS)
      });

      // 获取响应文本
      const responseText = await response.text();
      console.log('📝 响应状态:', response.status);
      console.log('📝 响应文本:', responseText);

      // 尝试解析为JSON
      try {
        const responseData = JSON.parse(responseText);
        console.log('📊 响应数据:', JSON.stringify(responseData, null, 2));

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
      } catch (e) {
        console.error('❌ 解析响应JSON失败:', e);
      }
    } catch (error) {
      console.error(`❌ 测试 ${endpoint} 过程中发生错误:`, error);
    }
  }
}

/**
 * 测试环境变量
 */
function testEnvironment() {
  console.log('\n🧪 测试环境变量...');

  console.log('📝 Node.js版本:', process.version);
  console.log('📝 操作系统:', process.platform);
  console.log('📝 环境变量:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - LOCAL_TEST:', process.env.LOCAL_TEST);

  // 设置测试环境变量
  process.env.LOCAL_TEST = 'true';
  console.log('📝 已设置 LOCAL_TEST=true');
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始诊断PayPal订阅功能...');

  // 测试环境变量
  testEnvironment();

  // 测试PayPal订阅API
  await testPayPalSubscription();

  console.log('\n✅ 诊断完成');
}

// 执行主函数
main().catch(error => {
  console.error('❌ 诊断过程中发生错误:', error);
});