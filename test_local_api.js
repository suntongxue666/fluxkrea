// 本地API测试脚本
const fetch = require('node-fetch');

async function testAPI() {
    console.log('🧪 开始测试本地API...');
    
    try {
        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: 'a simple test image',
                width: 512,
                height: 512,
                steps: 4
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ API测试成功:', {
                status: response.status,
                hasImage: !!data.image,
                model: data.model,
                provider: data.provider
            });
        } else {
            console.error('❌ API测试失败:', {
                status: response.status,
                error: data.error,
                details: data.details
            });
        }
    } catch (error) {
        console.error('❌ 连接失败:', error.message);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testAPI();
}

module.exports = { testAPI };