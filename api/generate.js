export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, width = 1024, height = 1024, steps = 4 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  console.log('Replicate Environment check:', {
    hasToken: !!REPLICATE_API_TOKEN,
    tokenLength: REPLICATE_API_TOKEN ? REPLICATE_API_TOKEN.length : 0,
    tokenPrefix: REPLICATE_API_TOKEN ? REPLICATE_API_TOKEN.substring(0, 10) + '...' : 'null'
  });

  if (!REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN not configured');
    return res.status(500).json({ 
      error: 'REPLICATE_API_TOKEN not configured',
      debug: {
        hasToken: !!REPLICATE_API_TOKEN
      }
    });
  }

  try {
    console.log('Starting FLUX-schnell generation with prompt:', prompt);
    
    // Replicate API 调用
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "bf53bdb93d739c9c915091cfa5f49ca662d11273a5eb30e7a2ec1939bcf27a00", // FLUX-schnell 最新工作版本
        input: {
          prompt: prompt,
          width: Math.min(width, 1024),
          height: Math.min(height, 1024),
          num_inference_steps: Math.min(steps, 50),
          guidance_scale: 0.0,
          num_outputs: 1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      
      return res.status(response.status).json({ 
        error: `Replicate API Error ${response.status}`,
        details: errorText,
        debug: {
          status: response.status,
          statusText: response.statusText
        }
      });
    }

    const prediction = await response.json();
    console.log('Prediction created:', prediction.id);

    // 轮询检查预测结果
    let finalPrediction = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 最多等待60秒

    while (finalPrediction.status !== 'succeeded' && finalPrediction.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        },
      });

      if (statusResponse.ok) {
        finalPrediction = await statusResponse.json();
        console.log(`Attempt ${attempts + 1}: Status = ${finalPrediction.status}`);
      }
      
      attempts++;
    }

    if (finalPrediction.status === 'succeeded') {
      console.log('FLUX-schnell generation successful');
      
      // Replicate 返回的是图片 URL，我们需要转换为 base64
      const imageUrl = finalPrediction.output[0];
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      res.status(200).json({
        success: true,
        image: `data:image/png;base64,${base64Image}`,
        model: "FLUX-schnell (Replicate)",
        provider: "Replicate", 
        cost: "$0.003 per image",
        prediction_id: prediction.id
      });
    } else if (finalPrediction.status === 'failed') {
      console.error('Prediction failed:', finalPrediction.error);
      res.status(500).json({ 
        error: 'Generation failed',
        details: finalPrediction.error || 'Unknown error',
        prediction_id: prediction.id
      });
    } else {
      console.error('Prediction timeout');
      res.status(500).json({ 
        error: 'Generation timeout',
        details: 'The prediction took too long to complete (>60s)',
        prediction_id: prediction.id
      });
    }

  } catch (error) {
    console.error('Replicate generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image with Replicate FLUX-schnell',
      details: error.message 
    });
  }
}