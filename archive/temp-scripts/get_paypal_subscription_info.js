// 通过PayPal API获取订阅的真实购买者信息
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getPayPalSubscriptionInfo() {
    const subscriptionId = 'I-4V957XAPPN06';
    
    try {
        console.log(`🔍 查询PayPal订阅信息: ${subscriptionId}`);
        
        // 1. 获取PayPal访问令牌
        console.log('🔑 获取PayPal访问令牌...');
        
        const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'en_US',
                'Authorization': 'Basic ' + Buffer.from('AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8:EBbVan6rYdBhJj0GJXGGaUd_9QfAJFNpKmBgCUjBfJCzOHoidGVUmPOL_-8KJE7u-Nt-K8bEcHGGmhmi').toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        
        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
            console.error('❌ 获取PayPal访问令牌失败:', tokenData);
            return;
        }
        
        console.log('✅ PayPal访问令牌获取成功');
        
        // 2. 获取订阅详情
        console.log('📋 获取订阅详情...');
        
        const subscriptionResponse = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json'
            }
        });
        
        const subscriptionData = await subscriptionResponse.json();
        
        if (subscriptionResponse.status !== 200) {
            console.error('❌ 获取订阅详情失败:', subscriptionData);
            return;
        }
        
        console.log('✅ 订阅详情获取成功');
        
        // 3. 解析订阅信息
        console.log('\\n📋 订阅基本信息:');
        console.log('订阅ID:', subscriptionData.id);
        console.log('状态:', subscriptionData.status);
        console.log('计划ID:', subscriptionData.plan_id);
        console.log('创建时间:', subscriptionData.create_time);
        console.log('开始时间:', subscriptionData.start_time);
        
        // 4. 获取订阅者信息
        if (subscriptionData.subscriber) {
            console.log('\\n👤 订阅者信息:');
            console.log('邮箱地址:', subscriptionData.subscriber.email_address);
            console.log('PayPal用户ID:', subscriptionData.subscriber.payer_id);
            
            if (subscriptionData.subscriber.name) {
                console.log('姓名:', subscriptionData.subscriber.name.given_name, subscriptionData.subscriber.name.surname);
            }
            
            if (subscriptionData.subscriber.shipping_address) {
                console.log('地址信息:', subscriptionData.subscriber.shipping_address);
            }
            
            // 5. 解析custom_id中的用户信息
            if (subscriptionData.custom_id) {
                console.log('\\n🔍 Custom ID信息:');
                console.log('Custom ID:', subscriptionData.custom_id);
                
                try {
                    const customData = JSON.parse(subscriptionData.custom_id);
                    console.log('解析的用户信息:', customData);
                } catch (e) {
                    console.log('Custom ID不是JSON格式，原始值:', subscriptionData.custom_id);
                }
            }
            
            // 6. 获取计划详情
            if (subscriptionData.plan_id) {
                console.log('\\n📋 计划详情:');
                const planDetails = {
                    'P-5ML4271244454362WXNWU5NI': { name: 'Pro Plan', credits: 1000, price: 9.99 },
                    'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000, price: 29.99 }
                };
                
                const plan = planDetails[subscriptionData.plan_id];
                if (plan) {
                    console.log('计划名称:', plan.name);
                    console.log('积分数量:', plan.credits);
                    console.log('价格:', plan.price);
                } else {
                    console.log('未知计划ID:', subscriptionData.plan_id);
                }
            }
            
            // 7. 返回关键信息
            const purchaserInfo = {
                email: subscriptionData.subscriber.email_address,
                paypalUserId: subscriptionData.subscriber.payer_id,
                subscriptionId: subscriptionData.id,
                planId: subscriptionData.plan_id,
                status: subscriptionData.status,
                customId: subscriptionData.custom_id
            };
            
            console.log('\\n🎯 购买者关键信息:');
            console.log(JSON.stringify(purchaserInfo, null, 2));
            
            return purchaserInfo;
            
        } else {
            console.error('❌ 订阅数据中没有订阅者信息');
            return null;
        }
        
    } catch (error) {
        console.error('❌ 查询PayPal订阅信息失败:', error);
        return null;
    }
}

// 运行查询
console.log('🎯 PayPal订阅信息查询工具');
console.log('这将直接从PayPal API获取订阅的真实购买者信息\\n');

getPayPalSubscriptionInfo().then(purchaserInfo => {
    if (purchaserInfo) {
        console.log('\\n✅ 成功获取购买者信息！');
        console.log('现在可以为正确的用户激活订阅了。');
    } else {
        console.log('\\n❌ 无法获取购买者信息');
    }
});