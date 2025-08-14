/**
 * 图像生成API - 调用AI模型生成图像
 */
export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { prompt, user_id } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt' });
        }
        
        console.log('处理图像生成请求:', { prompt, user_id });
        
        // HuggingFace API配置
        const HF_API_TOKEN = process.env.HF_API_TOKEN || "hf_your_token_here";
        const HF_API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
        
        // 调用HuggingFace API
        const response = await fetch(HF_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    num_inference_steps: 4,
                    guidance_scale: 0.0,
                    width: 1024,
                    height: 1024
                }
            }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HuggingFace API错误:', errorText);
            
            // 检查是否是模型加载中的错误
            if (response.status === 503 || errorText.includes('loading')) {
                return res.status(503).json({
                    error: 'Model is loading',
                    message: '模型正在加载中，请稍后重试（约1-2分钟）',
                    retry_after: 60
                });
            }
            
            throw new Error(`HuggingFace API错误: ${response.status} - ${errorText}`);
        }
        
        // 获取图像数据
        const imageBlob = await response.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const imageUrl = `data:image/png;base64,${imageBase64}`;
        
        console.log('图像生成成功:', { 
            prompt: prompt.substring(0, 50) + '...', 
            user_id,
            imageSize: imageBuffer.byteLength 
        });
        
        return res.status(200).json({
            success: true,
            image_url: imageUrl,
            prompt: prompt,
            generated_at: new Date().toISOString(),
            message: '图像生成成功'
        });
        
    } catch (error) {
        console.error('图像生成失败:', error);
        
        return res.status(500).json({
            error: 'Generation failed',
            message: error.message,
            details: '图像生成失败，请检查提示词或稍后重试'
        });
    }
}