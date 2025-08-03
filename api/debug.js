export default async function handler(req, res) {
  // 测试环境变量和 Replicate 连接
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  
  console.log('Debug info:', {
    hasToken: !!REPLICATE_API_TOKEN,
    tokenLength: REPLICATE_API_TOKEN ? REPLICATE_API_TOKEN.length : 0,
    tokenPrefix: REPLICATE_API_TOKEN ? REPLICATE_API_TOKEN.substring(0, 15) + '...' : 'null'
  });
  
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ 
      error: 'REPLICATE_API_TOKEN not found',
      env: process.env.NODE_ENV,
      hasToken: false
    });
  }
  
  try {
    // 测试 Replicate API 连接
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "f2ab8a5569070ad6c9bf1806e65eb4b3c9e68c5c4d44b64306c7557e6ee5b375",
        input: {
          prompt: "test",
          width: 512,
          height: 512,
          num_inference_steps: 4,
          guidance_scale: 0.0,
          num_outputs: 1
        }
      })
    });
    
    const responseText = await response.text();
    
    res.status(200).json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.substring(0, 500),
      hasToken: !!REPLICATE_API_TOKEN,
      tokenPrefix: REPLICATE_API_TOKEN.substring(0, 15) + '...'
    });
    
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      hasToken: !!REPLICATE_API_TOKEN
    });
  }
}