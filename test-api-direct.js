// 直接测试API配置
console.log('🔧 测试API配置...');

// 检查环境变量
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

console.log('📋 环境变量检查:');
console.log('- REPLICATE_API_TOKEN:', REPLICATE_API_TOKEN ? '✅ 已配置' : '❌ 未配置');
console.log('- Token长度:', REPLICATE_API_TOKEN ? REPLICATE_API_TOKEN.length : 0);
console.log('- Token前缀:', REPLICATE_API_TOKEN ? REPLICATE_API_TOKEN.substring(0, 8) + '...' : 'null');
console.log('- 环境:', process.env.NODE_ENV || 'development');

// 如果没有配置token，给出提示
if (!REPLICATE_API_TOKEN) {
  console.log('\n❌ 问题诊断:');
  console.log('REPLICATE_API_TOKEN 环境变量未配置');
  console.log('\n🔧 解决方案:');
  console.log('1. 检查 .env 文件是否存在');
  console.log('2. 确保 .env 文件中有: REPLICATE_API_TOKEN=your_token_here');
  console.log('3. 重新启动服务器');
} else {
  console.log('\n✅ API配置看起来正常！');
}

// 测试简单的API调用
async function testAPICall() {
  try {
    console.log('\n🚀 测试API调用...');
    
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "bf53bdb93d739c9c915091cfa5f49ca662d11273a5eb30e7a2ec1939bcf27a00",
        input: {
          prompt: "test prompt",
          width: 512,
          height: 512,
          num_inference_steps: 4,
          guidance_scale: 0.0,
          num_outputs: 1
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API调用成功！');
      console.log('预测ID:', result.id);
      console.log('状态:', result.status);
    } else {
      const error = await response.text();
      console.log('❌ API调用失败:', response.status, response.statusText);
      console.log('错误详情:', error);
    }
  } catch (error) {
    console.log('❌ API测试失败:', error.message);
  }
}

if (REPLICATE_API_TOKEN) {
  testAPICall();
}