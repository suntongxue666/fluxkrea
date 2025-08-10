// 测试webhook部署是否成功
const https = require('https');

async function testWebhookDeployment() {
    console.log('🧪 测试webhook部署状态...');
    
    try {
        // 1. 测试健康检查端点
        console.log('\n📋 1. 测试健康检查端点...');
        const healthResponse = await makeRequest('GET', 'https://fluxkrea.me/api/paypal-webhook');
        console.log('✅ 健康检查响应:', JSON.stringify(healthResponse, null, 2));
        
        // 2. 测试模拟订阅激活事件
        console.log('\n📋 2. 测试模拟订阅激活事件...');
        const testEvent = {
            event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
            id: "WH-TEST-" + Date.now(),
            resource: {
                id: "I-TEST-SUBSCRIPTION",
                plan_id: "P-5S785818YS7424947NCJBKQA",
                custom_id: JSON.stringify({
                    user_id: "0e5cb85f-69bc-48de-90af-ff27bb0b4df5",
                    email: "sunwei7482@gmail.com",
                    plan_type: "pro"
                }),
                status: "ACTIVE"
            }
        };
        
        const webhookResponse = await makeRequest('POST', 'https://fluxkrea.me/api/paypal-webhook', testEvent);
        console.log('✅ Webhook测试响应:', JSON.stringify(webhookResponse, null, 2));
        
        console.log('\n🎉 Webhook部署测试完成！');
        
        if (webhookResponse.status === 'success') {
            console.log('✅ Webhook正常工作，可以处理PayPal事件');
        } else {
            console.log('⚠️ Webhook可能存在问题，请检查日志');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error);
    }
}

function makeRequest(method, url, data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Webhook-Test/1.0'
            }
        };
        
        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve(parsedData);
                } catch (e) {
                    resolve({ raw: responseData, status_code: res.statusCode });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// 运行测试
testWebhookDeployment().then(() => {
    console.log('✅ 测试完成');
}).catch(error => {
    console.error('❌ 测试失败:', error);
});