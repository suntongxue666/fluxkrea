export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, width = 512, height = 512, steps = 20 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const HF_API_TOKEN = process.env.HF_API_TOKEN;

  console.log('SD Test - Environment check:', {
    hasToken: !!HF_API_TOKEN,
    tokenLength: HF_API_TOKEN ? HF_API_TOKEN.length : 0,
    tokenPrefix: HF_API_TOKEN ? HF_API_TOKEN.substring(0, 10) + '...' : 'null'
  });

  if (!HF_API_TOKEN || HF_API_TOKEN === 'your-huggingface-token-here') {
    console.error('HF_API_TOKEN not configured properly');
    return res.status(500).json({ 
      error: 'HF_API_TOKEN not configured',
      debug: {
        hasToken: !!HF_API_TOKEN,
        tokenLength: HF_API_TOKEN ? HF_API_TOKEN.length : 0
      }
    });
  }

  try {
    console.log('Testing multiple free models with prompt:', prompt);
    
    // 尝试多个确定免费的模型
    const freeModels = [
      "stabilityai/stable-diffusion-2-1",
      "CompVis/stable-diffusion-v1-4", 
      "runwayml/stable-diffusion-v1-5"
    ];
    
    let lastError = null;
    
    for (const model of freeModels) {
      console.log(`Trying model: ${model}`);
      
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: Math.min(steps, 50),
            guidance_scale: 7.5,
            width: Math.min(width, 512),
            height: Math.min(height, 512)
          }
        })
      });

      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        
        console.log(`Success with model: ${model}`);
        
        return res.status(200).json({
          success: true,
          image: `data:image/png;base64,${base64Image}`,
          model: model,
          message: `Generated with ${model} (free model)`
        });
      } else {
        const errorText = await response.text();
        lastError = {
          model,
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        };
        console.error(`Model ${model} failed:`, lastError);
        
        // 如果不是 402 错误，继续尝试下一个模型
        if (response.status !== 402) {
          continue;
        }
      }
    }
    
    // 所有模型都失败了
    console.error('All models failed, last error:', lastError);
    
    return res.status(lastError?.status || 500).json({ 
      error: `All free models failed. Last error: ${lastError?.status}`,
      details: lastError?.errorBody || 'No models available',
      debug: {
        attemptedModels: freeModels,
        lastError: lastError
      }
    });

  } catch (error) {
    console.error('SD Test error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image with Stable Diffusion',
      details: error.message,
      model: "stable-diffusion-v1-5"
    });
  }
}