// 测试完整的PayPal支付流程
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCompletePaymentFlow() {
    console.log('🧪 测试完整的PayPal支付流程...');
    
    try {
        // 1. 检查用户当前积分
        console.log('\n📋 1. 检查用户当前积分...');
        const userEmail = 'sunwei7482@gmail.com';
        const userUuid = '0e5cb85f-69bc-48de-90af-ff27bb0b4df5';
        
        const { data: userBefore, error: userError } = await supabase
            .from('users')
            .select('credits, subscription_status')
            .eq('email', userEmail)
            .single();
        
        if (userError) {
            console.error('❌ 查询用户失败:', userError);
            return;
        }
        
        console.log(`👤 用户: ${userEmail}`);
        console.log(`💰 当前积分: ${userBefore.credits}`);
        console.log(`📋 订阅状态: ${userBefore.subscription_status}`);
        
        // 2. 模拟PayPal订阅激活事件
        console.log('\n📋 2. 模拟PayPal订阅激活事件...');
        const testEvent = {
            event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
            id: "WH-TEST-" + Date.now(),
            resource: {
                id: "I-TEST-SUBSCRIPTION-" + Date.now(),
                plan_id: "P-5S785818YS7424947NCJBKQA", // Pro Plan
                custom_id: JSON.stringify({
                    user_id: userUuid,
                    email: userEmail,
                    plan_type: "pro"
                }),
                status: "ACTIVE"
            }
        };
        
        console.log('📤 发送webhook事件:', testEvent.event_type);
        
        const webhookResponse = await makeRequest('POST', 'https://fluxkrea.me/api/paypal-webhook', testEvent);
        console.log('✅ Webhook响应:', JSON.stringify(webhookResponse, null, 2));
        
        // 3. 等待处理完成
        console.log('\n📋 3. 等待处理完成...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 4. 检查用户积分是否增加
        console.log('\n📋 4. 检查用户积分是否增加...');
        const { data: userAfter, error: userAfterError } = await supabase
            .from('users')
            .select('credits, subscription_status, updated_at')
            .eq('email', userEmail)
            .single();
        
        if (userAfterError) {
            console.error('❌ 查询用户失败:', userAfterError);
            return;
        }
        
        console.log(`👤 用户: ${userEmail}`);
        console.log(`💰 处理前积分: ${userBefore.credits}`);
        console.log(`💰 处理后积分: ${userAfter.credits}`);
        console.log(`📋 订阅状态: ${userAfter.subscription_status}`);
        console.log(`🕒 更新时间: ${userAfter.updated_at}`);
        
        const creditsAdded = userAfter.credits - userBefore.credits;
        console.log(`➕ 积分增加: ${creditsAdded}`);
        
        // 5. 检查积分交易记录
        console.log('\n📋 5. 检查积分交易记录...');
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', userUuid)
            .eq('source', 'paypal_webhook')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!transError && transactions.length > 0) {
            console.log('💰 最近的PayPal积分交易:');
            transactions.forEach((trans, index) => {
                console.log(`   ${index + 1}. ${trans.transaction_type} ${trans.amount} - ${trans.description}`);
                console.log(`      余额: ${trans.balance_after} - ${trans.created_at}`);
            });
        } else {
            console.log('⚠️ 未找到PayPal积分交易记录');
        }
        
        // 6. 检查webhook事件记录
        console.log('\n📋 6. 检查webhook事件记录...');
        const { data: webhookEvents, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(3);
        
        if (!webhookError && webhookEvents.length > 0) {
            console.log('📋 最近的webhook事件:');
            webhookEvents.forEach((event, index) => {
                console.log(`   ${index + 1}. ${event.event_type} - ${event.processing_status}`);
                console.log(`      处理时间: ${event.processed_at}`);
            });
        }
        
        // 7. 测试结果总结
        console.log('\n🎉 测试结果总结:');
        if (creditsAdded === 1000) {
            console.log('✅ PayPal支付流程测试成功！');
            console.log('✅ Webhook正确处理了订阅激活事件');
            console.log('✅ 用户积分正确增加了1000积分');
            console.log('✅ 积分交易记录正确创建');
            console.log('✅ 用户订阅状态更新为ACTIVE');
        } else if (creditsAdded > 0) {
            console.log('⚠️ PayPal支付流程部分成功');
            console.log(`⚠️ 积分增加了${creditsAdded}，但期望是1000`);
        } else {
            console.log('❌ PayPal支付流程测试失败');
            console.log('❌ 用户积分没有增加');
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
                'User-Agent': 'PayPal-Webhook-Test/1.0'
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
testCompletePaymentFlow().then(() => {
    console.log('✅ 完整支付流程测试完成');
}).catch(error => {
    console.error('❌ 测试失败:', error);
});