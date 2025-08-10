#!/usr/bin/env node

/**
 * API调用诊断脚本
 * 测试图片生成API的各个方面
 */

const http = require('http');

console.log('🔍 开始诊断图片生成API...\n');

// 测试API配置
function testAPIConfig() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({});
        
        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/test-config',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('请求超时')));
        req.end();
    });
}

// 测试生成API端点
function testGenerateAPI() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            prompt: "test prompt for API diagnosis",
            width: 1024,
            height: 1024,
            steps: 4
        });
        
        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(30000, () => reject(new Error('请求超时')));
        req.write(postData);
        req.end();
    });
}

// 检查API配置
async function checkAPIConfiguration() {
    console.log('🔧 检查API配置...');
    
    try {
        const result = await testAPIConfig();
        
        if (result.status === 200 && result.data) {
            console.log('✅ API配置端点可访问');
            console.log(`Replicate Token: ${result.data.hasReplicateToken ? '✅ 已配置' : '❌ 未配置'}`);
            console.log(`Token长度: ${result.data.tokenLength || 0}`);
            console.log(`环境: ${result.data.environment || 'unknown'}`);
            
            return result.data.hasReplicateToken;
        } else {
            console.log('❌ API配置端点不可访问');
            console.log(`状态码: ${result.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ API配置检查失败:', error.message);
        return false;
    }
}

// 检查生成API
async function checkGenerateAPI() {
    console.log('\n🎨 检查生成API...');
    
    try {
        const result = await testGenerateAPI();
        
        console.log(`API响应状态: ${result.status}`);
        
        if (result.status === 200) {
            if (result.data.success && result.data.image) {
                console.log('✅ API调用成功，图片生成完成');
                console.log(`模型: ${result.data.model || 'unknown'}`);
                console.log(`提供商: ${result.data.provider || 'unknown'}`);
                console.log(`预测ID: ${result.data.prediction_id || 'unknown'}`);
                return true;
            } else {
                console.log('❌ API调用成功但生成失败');
                console.log('响应数据:', JSON.stringify(result.data, null, 2));
                return false;
            }
        } else if (result.status === 500) {
            console.log('❌ 服务器内部错误');
            if (result.data.error) {
                console.log(`错误信息: ${result.data.error}`);
                console.log(`详细信息: ${result.data.details || 'N/A'}`);
            }
            return false;
        } else {
            console.log(`❌ API调用失败，状态码: ${result.status}`);
            console.log('响应数据:', result.data);
            return false;
        }
    } catch (error) {
        console.log('❌ 生成API检查失败:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 建议: 确保服务器正在运行 (vercel dev)');
        } else if (error.message.includes('请求超时')) {
            console.log('💡 建议: API调用超时，可能是网络问题或Replicate服务响应慢');
        }
        
        return false;
    }
}

// 检查API错误处理
async function checkAPIErrorHandling() {
    console.log('\n🛡️ 检查API错误处理...');
    
    const testCases = [
        {
            name: '空提示词',
            data: { prompt: '', width: 1024, height: 1024, steps: 4 },
            expectedStatus: 400
        },
        {
            name: '缺少提示词',
            data: { width: 1024, height: 1024, steps: 4 },
            expectedStatus: 400
        },
        {
            name: '无效方法',
            method: 'GET',
            expectedStatus: 405
        }
    ];
    
    let passedTests = 0;
    
    for (const testCase of testCases) {
        try {
            const postData = JSON.stringify(testCase.data || {});
            
            const result = await new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/generate',
                    method: testCase.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            resolve({ status: res.statusCode, data: result });
                        } catch (e) {
                            resolve({ status: res.statusCode, data: data });
                        }
                    });
                });
                
                req.on('error', reject);
                req.setTimeout(5000, () => reject(new Error('请求超时')));
                req.write(postData);
                req.end();
            });
            
            if (result.status === testCase.expectedStatus) {
                console.log(`✅ ${testCase.name}: 正确返回 ${result.status}`);
                passedTests++;
            } else {
                console.log(`❌ ${testCase.name}: 期望 ${testCase.expectedStatus}，实际 ${result.status}`);
            }
            
        } catch (error) {
            console.log(`❌ ${testCase.name}: 测试失败 - ${error.message}`);
        }
    }
    
    return passedTests === testCases.length;
}

// 主诊断函数
async function runDiagnosis() {
    try {
        console.log('🚀 开始API诊断...\n');
        
        // 1. 检查API配置
        const hasValidConfig = await checkAPIConfiguration();
        
        // 2. 检查生成API（只有配置正确时才测试）
        let apiWorking = false;
        if (hasValidConfig) {
            apiWorking = await checkGenerateAPI();
        } else {
            console.log('\n⚠️ 跳过生成API测试（配置不完整）');
        }
        
        // 3. 检查错误处理
        const errorHandlingWorking = await checkAPIErrorHandling();
        
        // 总结
        console.log('\n' + '='.repeat(50));
        console.log('📊 API诊断结果总结:');
        console.log('='.repeat(50));
        
        console.log(`API配置: ${hasValidConfig ? '✅ 正常' : '❌ 异常'}`);
        console.log(`生成功能: ${apiWorking ? '✅ 正常' : hasValidConfig ? '❌ 异常' : '⚠️ 未测试'}`);
        console.log(`错误处理: ${errorHandlingWorking ? '✅ 正常' : '❌ 异常'}`);
        
        if (hasValidConfig && apiWorking && errorHandlingWorking) {
            console.log('\n🎉 API功能完全正常！');
            console.log('\n📝 建议:');
            console.log('  - API调用逻辑无需修复');
            console.log('  - 可以专注于前端集成优化');
        } else {
            console.log('\n🔧 需要修复的问题:');
            if (!hasValidConfig) {
                console.log('  - 配置REPLICATE_API_TOKEN环境变量');
            }
            if (hasValidConfig && !apiWorking) {
                console.log('  - 检查Replicate API调用逻辑');
                console.log('  - 验证网络连接和API密钥权限');
            }
            if (!errorHandlingWorking) {
                console.log('  - 改进API错误处理逻辑');
            }
        }
        
        return hasValidConfig && apiWorking && errorHandlingWorking;
        
    } catch (error) {
        console.error('❌ 诊断执行失败:', error.message);
        return false;
    }
}

// 运行诊断
runDiagnosis().then(success => {
    process.exit(success ? 0 : 1);
});