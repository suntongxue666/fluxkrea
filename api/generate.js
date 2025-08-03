export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, width = 1024, height = 1024, steps = 4 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const HF_API_TOKEN = process.env.HF_API_TOKEN;

  console.log('Environment check:', {
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
    // 先尝试 FLUX.1，如果 402 错误则自动降级到 Stable Diffusion
    let modelUrl = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
    let requestBody = {
      inputs: prompt,
      parameters: {
        num_inference_steps: steps,
        guidance_scale: 0.0,
        width: width,
        height: height
      }
    };

    let response = await fetch(modelUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    // 如果 FLUX 返回 402，自动切换到免费的 Stable Diffusion
    if (response.status === 402) {
      console.log('FLUX.1 requires payment, switching to Stable Diffusion...');
      modelUrl = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";
      requestBody = {
        inputs: prompt,
        parameters: {
          num_inference_steps: Math.min(steps, 50),
          guidance_scale: 7.5,
          width: Math.min(width, 512),
          height: Math.min(height, 512)
        }
      };

      response = await fetch(modelUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorBody: errorText,
        requestHeaders: {
          Authorization: `Bearer ${HF_API_TOKEN ? HF_API_TOKEN.substring(0, 10) + '...' : 'null'}`,
          ContentType: 'application/json'
        }
      });
      
      // 特别处理 402 错误
      if (response.status === 402) {
        try {
          const errorJson = JSON.parse(errorText);
          return res.status(402).json({ 
            error: `Payment Required (402)`,
            details: errorText,
            message: "FLUX.1 model may require paid subscription. Consider switching to free Stable Diffusion models.",
            debug: {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorJson
            }
          });
        } catch (e) {
          return res.status(402).json({ 
            error: `Payment Required (402)`,
            details: errorText,
            message: "FLUX.1 model may require paid subscription. Consider switching to free Stable Diffusion models.",
            debug: {
              status: response.status,
              statusText: response.statusText
            }
          });
        }
      }
      
      return res.status(response.status).json({ 
        error: `API Error ${response.status}`,
        details: errorText,
        debug: {
          status: response.status,
          statusText: response.statusText
        }
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    res.status(200).json({
      success: true,
      image: `data:image/png;base64,${base64Image}`
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
}