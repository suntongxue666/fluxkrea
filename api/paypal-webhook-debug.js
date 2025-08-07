// 最简化的PayPal Webhook处理器 - 调试版本
module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 基础日志
    console.log('🔔 Webhook调试版本 - 收到请求');
    console.log('方法:', req.method);
    
    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS请求');
        return res.status(200).json({ message: 'CORS OK' });
    }
    
    if (req.method !== 'POST') {
        console.log('❌ 非POST请求');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        console.log('📝 请求体检查...');
        
        // 基础验证
        if (!req.body) {
            console.log('❌ 请求体为空');
            return res.status(400).json({ error: 'Request body required' });
        }
        
        const { event_type, resource } = req.body;
        console.log('事件类型:', event_type);
        console.log('资源ID:', resource?.id || '无');
        
        // 简单的响应，不做复杂的数据库操作
        const response = {
            message: 'Webhook received successfully',
            event_type: event_type,
            resource_id: resource?.id || 'N/A',
            timestamp: new Date().toISOString(),
            status: 'processed'
        };
        
        console.log('✅ 成功处理Webhook');
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('❌ Webhook处理异常:', error.message);
        console.error('❌ 错误堆栈:', error.stack);
        
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};