// 使用真实PayPal数据测试Webhook处理器
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 真实的PayPal Event数据
const REAL_PAYPAL_EVENT = {
    "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
    "resource": {
        "id": "I-9DUE4SRSUGL2",
        "plan_id": "P-5S785818YS7424947NCJBKQA",
        "status": "ACTIVE",
        "custom_id": "{\"user_id\":\"94f37245-a5ba-4c0a-be1c-7d21421c6b2d\",\"email\":\"tiktreeapp@gmail.com\",\"plan_type\":\"pro\"}",
        "subscriber": {
            "email_address": "435093136-buyer@qq.com",
            "payer_id": "7ZAPM2VBBJX78"
        },
        "billing_info": {
            "last_payment": {
                "amount": {
                    "currency_code": "USD",
                    "value": "9.99"
                },
                "time": "2025-08-07T10:43:45Z"
            },
            "next_billing_time": "2025-09-07T10:00:00Z"
        }
    }
};

async function testWebhookWithRealData() {
    console.log('🧪 使用真实PayPal数据测试Webhook处理器');
    console.log('='.repeat(60));
    
    try {
        // 1. 检查用户当前状态
        console.log('\n👤 1. 检查用户当前状态...');
        
        const userUuid = '94f37245-a5ba-4c0a-be1c-7d21421c6b2d';
        const userEmail = 'tiktreeapp@gmail.com';
        
        const { data: beforeUser, error: beforeError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userUuid)
            .single();
        
        if (beforeError) {
            console.error('❌ 找不到用户:', beforeError);
            return;
        }
        
        console.log('✅ 找到用户:', beforeUser.email);
        console.log(`   当前积分: ${beforeUser.credits}`);
        console.log(`   当前状态: ${beforeUser.subscription_status}`);
        
        // 2. 模拟Webhook处理
        console.log('\n🔄 2. 模拟Webhook处理...');
        
        // 导入修复的Webhook处理器
        const webhookHandler = require('./api/paypal-webhook-fixed.js');
        
        // 创建模拟的请求和响应对象
        const mockReq = {
            method: 'POST',
            body: REAL_PAYPAL_EVENT
        };
        
        const mockRes = {
            statusCode: 200,
            headers: {},
            setHeader: function(name, value) {
                this.headers[name] = value;
            },
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.responseData = data;
                return this;
            }
        };
        
        console.log('📡 调用Webhook处理器...');
        
        await webhookHandler(mockReq, mockRes);
        
        console.log(`📊 响应状态: ${mockRes.statusCode}`);
        console.log(`📄 响应数据:`, mockRes.responseData);
        
        // 3. 检查处理结果
        console.log('\n✅ 3. 检查处理结果...');
        
        // 等待一下确保数据库操作完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: afterUser, error: afterError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', userUuid)
            .single();
        
        if (afterError) {
            console.error('❌ 查询处理后用户状态失败:', afterError);
        } else {
            console.log('👤 处理后用户状态:');
            console.log(`   邮箱: ${afterUser.email}`);
            console.log(`   积分: ${beforeUser.credits} → ${afterUser.credits} (${afterUser.credits > beforeUser.credits ? '✅ 增加了' + (afterUser.credits - beforeUser.credits) : '❌ 未变化'})`);
            console.log(`   状态: ${beforeUser.subscription_status} → ${afterUser.subscription_status} (${afterUser.subscription_status === 'ACTIVE' ? '✅ 已激活' : '❌ 未激活'})`);
            console.log(`   更新时间: ${new Date(afterUser.updated_at).toLocaleString()}`);
        }
        
        // 4. 检查订阅关联记录
        console.log('\n🔗 4. 检查订阅关联记录...');
        
        const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('paypal_subscription_id', 'I-9DUE4SRSUGL2')
            .single();
        
        if (subError) {
            console.log('❌ 订阅关联记录查询失败:', subError.message);
        } else {
            console.log('✅ 订阅关联记录:');
            console.log(`   订阅ID: ${subscription.paypal_subscription_id}`);
            console.log(`   用户邮箱: ${subscription.google_user_email}`);
            console.log(`   计划类型: ${subscription.plan_type}`);
            console.log(`   状态: ${subscription.status}`);
        }
        
        // 5. 检查积分交易记录
        console.log('\n💳 5. 检查积分交易记录...');
        
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_uuid', userUuid)
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (transError) {
            console.log('❌ 积分交易记录查询失败:', transError.message);
        } else {
            console.log('✅ 最近积分交易:');
            transactions.forEach((trans, index) => {
                const date = new Date(trans.created_at).toLocaleString();
                console.log(`   ${index + 1}. ${trans.transaction_type}: ${trans.amount > 0 ? '+' : ''}${trans.amount} (${trans.source}) - ${date}`);
                console.log(`      描述: ${trans.description}`);
            });
        }
        
        // 6. 检查Webhook事件日志
        console.log('\n📝 6. 检查Webhook事件日志...');
        
        const { data: webhookEvents, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(3);
        
        if (webhookError) {
            console.log('❌ Webhook事件日志查询失败:', webhookError.message);
        } else {
            console.log('✅ 最近Webhook事件:');
            webhookEvents.forEach((event, index) => {
                const date = new Date(event.processed_at).toLocaleString();
                console.log(`   ${index + 1}. ${event.event_type} (${event.processing_status}) - ${date}`);
            });
        }
        
        // 7. 测试结果总结
        console.log('\n📊 测试结果总结:');
        console.log('-'.repeat(40));
        
        const success = 
            mockRes.statusCode === 200 &&
            afterUser && 
            afterUser.credits > beforeUser.credits && 
            afterUser.subscription_status === 'ACTIVE';
        
        if (success) {
            console.log('🎉 测试成功！Webhook处理器工作正常');
            console.log('✅ 响应状态正确 (200)');
            console.log('✅ 用户积分已增加');
            console.log('✅ 订阅状态已激活');
            console.log('✅ 数据库记录完整');
            
            console.log('\n💡 现在可以部署修复的Webhook处理器:');
            console.log('1. 将 api/paypal-webhook-fixed.js 重命名为 api/paypal-webhook.js');
            console.log('2. 部署到 Vercel');
            console.log('3. 测试真实的PayPal订阅流程');
            
        } else {
            console.log('❌ 测试失败！需要进一步调试');
            console.log(`   响应状态: ${mockRes.statusCode} (期望: 200)`);
            console.log(`   积分变化: ${afterUser ? afterUser.credits - beforeUser.credits : 'N/A'} (期望: >0)`);
            console.log(`   订阅状态: ${afterUser ? afterUser.subscription_status : 'N/A'} (期望: ACTIVE)`);
        }
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
}

// 主函数
async function main() {
    await testWebhookWithRealData();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testWebhookWithRealData };