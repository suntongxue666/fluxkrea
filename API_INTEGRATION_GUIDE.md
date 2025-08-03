# 图像生成API集成解决方案

## 🚨 当前问题
由于浏览器CORS策略，前端无法直接调用Replicate API。目前已实现了智能检测和降级方案：

- **本地/开发环境**: 使用模拟生成
- **生产环境**: 需要后端API代理

## 🔧 解决方案选项

### 方案1: 后端API代理 (推荐)
创建一个后端服务作为API代理：

```javascript
// Node.js Express 示例
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, width, height, num_inference_steps } = req.body;
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Token r8_6FMB1e7cZVCgEbcgUJaehz2X8FWRwpT0ZTwl5',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "schnell模型版本ID",
        input: {
          prompt,
          width,
          height,
          num_inference_steps,
          guidance_scale: 7.5,
          num_outputs: 1
        }
      })
    });
    
    const prediction = await response.json();
    
    // 轮询结果
    let result = prediction;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': 'Token r8_6FMB1e7cZVCgEbcgUJaehz2X8FWRwpT0ZTwl5'
        }
      });
      
      result = await pollResponse.json();
    }
    
    res.json({
      imageUrl: result.output[0],
      generationTime: Date.now() - startTime
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 方案2: Vercel/Netlify Functions
使用Serverless函数：

```javascript
// Vercel Functions 示例 (api/generate-image.js)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // 同上面的逻辑
}
```

### 方案3: Cloudflare Workers
```javascript
// Cloudflare Workers 示例
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'POST' && new URL(request.url).pathname === '/api/generate') {
    // 代理逻辑
  }
}
```

### 方案4: 使用CORS代理服务
临时解决方案（不推荐生产使用）：

```javascript
// 修改API URL使用代理
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const response = await fetch(proxyUrl + 'https://api.replicate.com/v1/predictions', {
  // ... 其他配置
});
```

## 🎯 推荐实施步骤

1. **短期解决方案**:
   - 当前的模拟生成继续工作
   - 用户可以体验完整流程
   - 积分系统正常运作

2. **中期解决方案**:
   - 部署简单的Vercel/Netlify Functions
   - 代理Replicate API调用
   - 保持前端代码不变

3. **长期解决方案**:
   - 构建完整的后端服务
   - 支持多种AI模型
   - 实现队列管理和负载均衡

## 📝 更新前端代码
当后端API准备好后，只需要更新 `callImageGenerationAPI` 函数中的URL：

```javascript
// 将 URL 改为你的后端 API
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: prompt,
    width: parseInt(imageSize.split('x')[0]),
    height: parseInt(imageSize.split('x')[1]),
    num_inference_steps: steps
  })
});
```

## 🔗 相关资源
- [Replicate API 文档](https://replicate.com/docs/reference/http)
- [Vercel Functions](https://vercel.com/docs/concepts/functions)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Cloudflare Workers](https://workers.cloudflare.com/)

目前系统会自动检测环境并使用模拟生成，确保用户体验不受影响。