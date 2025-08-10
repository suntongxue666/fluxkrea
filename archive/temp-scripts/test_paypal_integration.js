// PayPal集成自动化测试脚本
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// 配置
const config = {
    paypal: {
        clientId: 'AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8',
        clientSecret: 'ENlcBlade--RMAM6EWnp16tTsPaw_nDogYdriNgIfI4KSng-kY2YhqO7job-WRa6tDctYFGXAf9MWLzC',
        apiBase: 'https://api-m.sandbox.paypal.com',
        plans: {
            pro: 'P-5S785818YS7424947NCJBKQA',
            max: 'P-3NJ78684DS796242VNCJBKQQ'
        }
    },
    supabase: {
        url: 'https://gdcjvqaqgvcxzufmessy.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI'
    },
    website: {
        baseUrl: 'https://fluxkrea.me',
        webhookUrl: 'https://fluxkrea.me/api/paypal-webhook'
    }
};

class PayPalTester {
    constructor() {
        this.accessToken = null;
        this.supabase = createClient(config.supabase.url, config.supabase.anonKey);
        this.testResults = [];
    }

    // 获取PayPal访问令牌
    async getAccessToken() {
        return new Promise((resolve, reject) => {
            const auth = Buffer.from(`${config.paypal.clientId}:${config.paypal.clientSecret}`).toString('base64');
            const postData = 'grant_type=client_credentials';
            
            const options = {
                hostname: config.paypal.apiBase.replace('https://', ''),
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
                            this.accessToken = response.access_token;
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

    // 测试PayPal API连接
    async testPayPalConnection() {
        console.log('🔑 测试PayPal API连接...');
        try {
            const token = await this.getAccessToken();
            this.addResult('PayPal API连接', true, `成功获取访问令牌: ${token.substring(0, 20)}...`);
            return true;
        } catch (error) {
            this.addResult('PayPal API连接', false, error.message);
            return false;
        }
    }

    // 测试订阅计划
    async testSubscriptionPlans() {
        console.log('📋 测试订阅计划...');
        
        for (const [planName, planId] of Object.entries(config.paypal.plans)) {
            try {
                const planDetails = await this.getSubscriptionPlan(planId);
                if (planDetails && planDetails.status === 'ACTIVE') {
                    this.addResult(`${planName.toUpperCase()} Plan`, true, `计划状态: ${planDetails.status}`);
                } else {
                    this.addResult(`${planName.toUpperCase()} Plan`, false, '计划未激活或不存在');
                }
            } catch (error) {
                this.addResult(`${planName.toUpperCase()} Plan`, false, error.message);
            }
        }
    }

    // 获取订阅计划详情
    async getSubscriptionPlan(planId) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: config.paypal.apiBase.replace('https://', ''),
                port: 443,
                path: `/v1/billing/plans/${planId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json'
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
            req.end();
        });
    }

    // 测试网站可访问性
    async testWebsiteAccess() {
        console.log('🌐 测试网站可访问性...');
        
        const urls = [
            { name: '主页', url: config.website.baseUrl },
            { name: '订阅页面', url: `${config.website.baseUrl}/pricing.html` },
            { name: '成功页面', url: `${config.website.baseUrl}/subscription-success.html` }
        ];

        for (const { name, url } of urls) {
            try {
                const accessible = await this.checkUrlAccessible(url);
                this.addResult(`网站访问 - ${name}`, accessible, accessible ? '页面可正常访问' : '页面无法访问');
            } catch (error) {
                this.addResult(`网站访问 - ${name}`, false, error.message);
            }
        }
    }

    // 检查URL可访问性
    async checkUrlAccessible(url) {
        return new Promise((resolve) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname,
                method: 'HEAD',
                timeout: 10000
            };

            const req = https.request(options, (res) => {
                resolve(res.statusCode >= 200 && res.statusCode < 400);
            });

            req.on('error', () => resolve(false));
            req.on('timeout', () => resolve(false));
            req.end();
        });
    }

    // 测试数据库连接
    async testDatabaseConnection() {
        console.log('🗄️ 测试数据库连接...');
        
        try {
            // 测试基本连接
            const { data, error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);

            if (error) {
                this.addResult('数据库连接', false, error.message);
                return false;
            }

            this.addResult('数据库连接', true, '数据库连接正常');

            // 测试订阅相关表
            const tables = ['subscriptions', 'payments', 'subscription_history'];
            for (const table of tables) {
                try {
                    const { error: tableError } = await this.supabase
                        .from(table)
                        .select('*')
                        .limit(1);

                    if (tableError) {
                        this.addResult(`数据表 - ${table}`, false, tableError.message);
                    } else {
                        this.addResult(`数据表 - ${table}`, true, '表结构正常');
                    }
                } catch (err) {
                    this.addResult(`数据表 - ${table}`, false, err.message);
                }
            }

            return true;
        } catch (error) {
            this.addResult('数据库连接', false, error.message);
            return false;
        }
    }

    // 测试Webhook端点
    async testWebhookEndpoint() {
        console.log('🔗 测试Webhook端点...');
        
        try {
            const accessible = await this.checkUrlAccessible(config.website.webhookUrl);
            this.addResult('Webhook端点', accessible, accessible ? 'Webhook端点可访问' : 'Webhook端点无法访问');
        } catch (error) {
            this.addResult('Webhook端点', false, error.message);
        }
    }

    // 添加测试结果
    addResult(testName, success, message) {
        this.testResults.push({
            test: testName,
            success: success,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    // 生成测试报告
    generateReport() {
        console.log('\n📊 测试报告');
        console.log('='.repeat(50));
        
        let passedTests = 0;
        let totalTests = this.testResults.length;

        this.testResults.forEach(result => {
            const status = result.success ? '✅ 通过' : '❌ 失败';
            console.log(`${status} ${result.test}: ${result.message}`);
            if (result.success) passedTests++;
        });

        console.log('='.repeat(50));
        console.log(`总计: ${passedTests}/${totalTests} 测试通过`);
        
        if (passedTests === totalTests) {
            console.log('🎉 所有测试通过！系统准备就绪。');
        } else {
            console.log('⚠️ 部分测试失败，请检查配置。');
        }

        return {
            total: totalTests,
            passed: passedTests,
            failed: totalTests - passedTests,
            results: this.testResults
        };
    }

    // 保存测试报告
    async saveReport(report) {
        const fs = require('fs');
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                total: report.total,
                passed: report.passed,
                failed: report.failed
            },
            results: report.results,
            config: {
                paypal_environment: 'sandbox',
                website_url: config.website.baseUrl,
                webhook_url: config.website.webhookUrl
            }
        };

        fs.writeFileSync('test_report.json', JSON.stringify(reportData, null, 2));
        console.log('\n📄 测试报告已保存到 test_report.json');
    }

    // 运行所有测试
    async runAllTests() {
        console.log('🚀 开始PayPal集成测试...\n');

        // 按顺序执行测试
        await this.testPayPalConnection();
        await this.testSubscriptionPlans();
        await this.testWebsiteAccess();
        await this.testDatabaseConnection();
        await this.testWebhookEndpoint();

        // 生成并保存报告
        const report = this.generateReport();
        await this.saveReport(report);

        return report;
    }
}

// 主函数
async function main() {
    const tester = new PayPalTester();
    
    try {
        const report = await tester.runAllTests();
        process.exit(report.failed === 0 ? 0 : 1);
    } catch (error) {
        console.error('❌ 测试执行失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = PayPalTester;