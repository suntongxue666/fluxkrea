// 最简化的PayPal Webhook处理器 - 确保能正常运行
module.exports = async (req, res) => {
    // 设置响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        console.log('PayPal Webhook received:', req.method);
        
        // 处理OPTIONS请求
        if (req.method === 'OPTIONS') {
            return res.status(200).json({ message: 'CORS OK' });
        }
        
        // 处理GET请求（健康检查）
        if (req.method === 'GET') {
            return res.status(200).json({ 
                message: 'PayPal Webhook is running',
                timestamp: new Date().toISOString(),
                status: 'healthy'
            });
        }
        
        // 处理POST请求
        if (req.method === 'POST') {
            const eventData = req.body || {};
            const { event_type, resource } = eventData;
            
            console.log('Event type:', event_type);
            console.log('Resource ID:', resource?.id);
            
            // 简单处理订阅激活事件
            if (event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
                console.log('Processing subscription activation...');
                
                // 这里先不连接数据库，只记录日志
                const customId = resource?.custom_id;
                if (customId) {
                    try {
                        const userInfo = JSON.parse(customId);
                        console.log('User info:', userInfo);
                        
                        // TODO: 在这里添加数据库操作
                        console.log('Subscription activated for user:', userInfo.email);
                        
                    } catch (e) {
                        console.error('Failed to parse custom_id:', e);
                    }
                }
            }
            
            return res.status(200).json({
                message: 'Webhook processed',
                event_type: event_type,
                resource_id: resource?.id,
                timestamp: new Date().toISOString()
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Webhook error:', error);
        
        return res.status(200).json({
            message: 'Webhook received but processing failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};