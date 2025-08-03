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
    console.log('Testing Stable Diffusion with prompt:', prompt);
    
    const response = await fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SD API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorBody: errorText
      });
      
      return res.status(response.status).json({ 
        error: `SD API Error ${response.status}`,
        details: errorText,
        debug: {
          status: response.status,
          statusText: response.statusText,
          model: "stable-diffusion-v1-5"
        }
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    console.log('SD Test successful, image generated');
    
    res.status(200).json({
      success: true,
      image: `data:image/png;base64,${base64Image}`,
      model: "stable-diffusion-v1-5",
      message: "Generated with Stable Diffusion v1.5 (free model)"
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