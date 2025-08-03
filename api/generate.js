export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, width = 1024, height = 1024, steps = 4 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const HF_API_TOKEN = process.env.HF_API_TOKEN;

  if (!HF_API_TOKEN || HF_API_TOKEN === 'your-huggingface-token-here') {
    return res.status(500).json({ error: 'HF_API_TOKEN not configured' });
  }

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: steps,
          guidance_scale: 0.0,
          width: width,
          height: height
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `API Error ${response.status}`,
        details: errorText
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