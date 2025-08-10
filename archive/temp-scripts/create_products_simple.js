// PayPal产品创建脚本 (Node.js)
// 使用方法: node create_products_simple.js

const https = require('https');

// 配置信息
const config = {
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    apiBase: 'https://api-m.sandbox.paypal.com', // 沙盒环境
    // apiBase: 'https://api-m.paypal.com', // 生产环境
};

// 产品配置
const products = [
    {
        name: "Pro Plan",
        description: "1000 credits per month and creating AI images service.",
        type: "SERVICE",
        category: "SOFTWARE",
        image_url: "https://ciwjjfcuhubjydajazkk.supabase.co/storage/v1/object/public/webstie-icon//FluxKrea%20log-120.png",
        home_url: "https://www.fluxkrea.me/"
    },
    {
        name: "Max Plan",
        description: "5000 credits per month and creating AI images service.",
        type: "SERVICE",
        category: "SOFTWARE",
        image_url: "https://ciwjjfcuhubjydajazkk.supabase.co/storage/v1/object/public/webstie-icon//FluxKrea%20log-120.png",
        home_url: "https://www.fluxkrea.me/"
    }
];

// 获取访问令牌
async function getAccessToken() {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
        
        const postData = 'grant_type=client_credentials';
        
        const options = {
            hostname: config.apiBase.replace('https://', ''),
            port: 443,
            path: '/v1/oauth2/token',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'en_US',
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.access_token) {
                        resolve(response.access_token);
                    } else {
                        reject(new Error('Failed to get access token: ' + data));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 创建产品
async function createProduct(accessToken, productData) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(productData);
        
        const options = {
            hostname: config.apiBase.replace('https://', ''),
            port: 443,
            path: '/v1/catalogs/products',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'PayPal-Request-Id': `FLUX-KREA-${Date.now()}`,
                'Content-Length': postData.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 主函数
async function main() {
    try {
        console.log('🔑 获取访问令牌...');
        const accessToken = await getAccessToken();
        console.log('✅ 访问令牌获取成功');

        const results = [];

        for (const product of products) {
            console.log(`\n📦 创建产品: ${product.name}`);
            try {
                const result = await createProduct(accessToken, product);
                console.log(`✅ ${product.name} 创建成功`);
                console.log(`   产品ID: ${result.id}`);
                results.push({
                    name: product.name,
                    id: result.id,
                    success: true
                });
            } catch (error) {
                console.error(`❌ ${product.name} 创建失败:`, error.message);
                results.push({
                    name: product.name,
                    error: error.message,
                    success: false
                });
            }
        }

        // 保存结果
        const fs = require('fs');
        fs.writeFileSync('paypal_products_result.json', JSON.stringify({
            results,
            created_at: new Date().toISOString(),
            environment: 'sandbox'
        }, null, 2));

        console.log('\n🎉 产品创建完成！');
        console.log('📄 结果已保存到 paypal_products_result.json');
        
    } catch (error) {
        console.error('❌ 创建失败:', error.message);
        process.exit(1);
    }
}

// 检查配置
if (config.clientId === 'YOUR_CLIENT_ID' || config.clientSecret === 'YOUR_CLIENT_SECRET') {
    console.error('❌ 请先配置您的PayPal Client ID和Client Secret');
    console.log('在文件顶部修改config对象中的clientId和clientSecret');
    process.exit(1);
}

main();