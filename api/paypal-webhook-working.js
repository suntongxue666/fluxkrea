// PayPal Webhook处理器 - 工作版本
module.exports = async (req, res) => {
    // 基础CORS设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log('🔔 PayPal Webhook - 收到请求');
    console.log('方法:', req.method);
    console.log('URL:', req.url);
    
    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS请求处理');
        return res.status(200).json({ message: 'CORS preflight OK' });
    }
    
    if (req.method !== 'POST') {
        console.log('❌ 非POST请求:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        console.log('📝 处理POST请求...');
        
        // 检查请求体
        if (!req.body) {
            console.log('❌ 请求体为空');
            return res.status(400).json({ error: 'Request body is required' });
        }
        
        console.log('📋 请求体内容:', JSON.stringify(req.body, null, 2));
        
        const { event_type, resource } = req.body;
        
        if (!event_type) {
            console.log('❌ 缺少event_type字段');
            return res.status(400).json({ error: 'event_type is required' });
        }
        
        if (!resource) {
            console.log('❌ 缺少resource字段');
            return res.status(400).json({ error: 'resource is required' });
        }
        
        console.log(`🎯 处理事件: ${event_type}`);
        console.log(`📋 资源ID: ${resource.id || 'N/A'}`);
        
        // 基础事件处理逻辑
        let processedMessage = '';
        
        switch (event_type) {
            case 'BILLING.SUBSCRIPTION.CREATED':
                processedMessage = `订阅创建事件已处理: ${resource.id}`;
                console.log('🆕 订阅创建事件');
                break;
                
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                processedMessage = `订阅激活事件已处理: ${resource.id}`;
                console.log('🚀 订阅激活事件 - 这里应该添加积分');
                // 这里后续可以添加积分处理逻辑
                break;
                
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                processedMessage = `订阅取消事件已处理: ${resource.id}`;
                console.log('❌ 订阅取消事件');
                break;
                
            case 'TEST_EVENT':
                processedMessage = `测试事件已处理: ${resource.id}`;
                console.log('🧪 测试事件');
                break;
                
            default:
                processedMessage = `未知事件类型已记录: ${event_type}`;
                console.log('⚠️ 未知事件类型:', event_type);
        }
        
        // 构建响应
        const response = {
            success: true,
            message: 'Webhook processed successfully',
            event_type: event_type,
            resource_id: resource.id || 'N/A',
            processed_message: processedMessage,
            timestamp: new Date().toISOString(),
            webhook_version: '1.0-working'
        };
        
        console.log('✅ Webhook处理成功');
        console.log('📤 发送响应:', JSON.stringify(response, null, 2));
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('❌ Webhook处理异常:');
        console.error('   错误信息:', error.message);
        console.error('   错误堆栈:', error.stack);
        
        const errorResponse = {
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString(),
            webhook_version: '1.0-working'
        };
        
        return res.status(500).json(errorResponse);
    }
};