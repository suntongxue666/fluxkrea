/**
 * 诊断购买积分同步问题
 * 检查订阅流程、webhook处理和积分同步的各个环节
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSubscriptionCreditsIssue() {
    console.log('🔍 诊断购买积分同步问题\n');
    
    try {
        // 1. 检查最近的webhook事件
        console.log('📋 1. 检查最近的webhook事件...');
        const { data: webhookEvents, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(10);
        
        if (webhookError) {
            console.log('❌ 无法查询webhook事件:', webhookError.message);
        } else if (webhookEvents && webhookEvents.length > 0) {
            console.log(`✅ 找到 ${webhookEvents.length} 个最近的webhook事件:`);
            webhookEvents.forEach((event, index) => {
                console.log(`  ${index + 1}. ${event.event_type} - ${event.processed_at}`);
                console.log(`     Resource ID: ${event.resource_id}`);
                console.log(`     Status: ${event.status || 'N/A'}`);
            });
        } else {
            console.log('⚠️ 没有找到webhook事件记录');
        }
        
        // 2. 检查最近的订阅记录
        console.log('\n📋 2. 检查最近的订阅记录...');
        const { data: subscriptions, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (subError) {
            console.log('❌ 无法查询订阅记录:', subError.message);
        } else if (subscriptions && subscriptions.length > 0) {
            console.log(`✅ 找到 ${subscriptions.length} 个最近的订阅记录:`);
            subscriptions.forEach((sub, index) => {
                console.log(`  ${index + 1}. ${sub.google_user_email}`);
                console.log(`     PayPal订阅ID: ${sub.paypal_subscription_id}`);
                console.log(`     计划: ${sub.plan_type}`);
                console.log(`     状态: ${sub.status || 'N/A'}`);
                console.log(`     创建时间: ${sub.created_at}`);
            });
        } else {
            console.log('⚠️ 没有找到订阅记录');
        }
        
        // 3. 检查最近的积分交易记录
        console.log('\n📋 3. 检查最近的积分交易记录...');
        const { data: transactions, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (transError) {
            console.log('❌ 无法查询积分交易记录:', transError.message);
        } else if (transactions && transactions.length > 0) {
            console.log(`✅ 找到 ${transactions.length} 个最近的积分交易:`);
            transactions.forEach((trans, index) => {
                console.log(`  ${index + 1}. ${trans.transaction_type} ${trans.amount} 积分`);
                console.log(`     用户UUID: ${trans.user_uuid}`);
                console.log(`     描述: ${trans.description}`);
                console.log(`     来源: ${trans.source || 'N/A'}`);
                console.log(`     时间: ${trans.created_at}`);
            });
        } else {
            console.log('⚠️ 没有找到积分交易记录');
        }
        
        // 4. 检查用户积分状态
        console.log('\n📋 4. 检查最近更新的用户积分...');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('email, credits, subscription_status, updated_at')
            .order('updated_at', { ascending: false })
            .limit(5);
        
        if (userError) {
            console.log('❌ 无法查询用户记录:', userError.message);
        } else if (users && users.length > 0) {
            console.log(`✅ 找到 ${users.length} 个最近更新的用户:`);
            users.forEach((user, index) => {
                console.log(`  ${index + 1}. ${user.email}`);
                console.log(`     积分: ${user.credits}`);
                console.log(`     订阅状态: ${user.subscription_status || 'N/A'}`);
                console.log(`     更新时间: ${user.updated_at}`);
            });
        } else {
            console.log('⚠️ 没有找到用户记录');
        }
        
        // 5. 检查订阅激活事件是否正确处理
        console.log('\n📋 5. 检查订阅激活事件处理...');
        const { data: activationEvents, error: activationError } = await supabase
            .from('webhook_events')
            .select('*')
            .eq('event_type', 'BILLING.SUBSCRIPTION.ACTIVATED')
            .order('processed_at', { ascending: false })
            .limit(5);
        
        if (activationError) {
            console.log('❌ 无法查询激活事件:', activationError.message);
        } else if (activationEvents && activationEvents.length > 0) {
            console.log(`✅ 找到 ${activationEvents.length} 个订阅激活事件:`);
            
            for (const event of activationEvents) {
                console.log(`\n  事件时间: ${event.processed_at}`);
                console.log(`  Resource ID: ${event.resource_id}`);
                
                // 检查这个激活事件是否有对应的积分交易
                const { data: relatedTransactions, error: relatedError } = await supabase
                    .from('credit_transactions')
                    .select('*')
                    .eq('source', 'paypal_webhook')
                    .gte('created_at', event.processed_at)
                    .lte('created_at', new Date(new Date(event.processed_at).getTime() + 5 * 60 * 1000).toISOString());
                
                if (!relatedError && relatedTransactions && relatedTransactions.length > 0) {
                    console.log(`  ✅ 找到对应的积分交易: ${relatedTransactions[0].amount} 积分`);
                } else {
                    console.log(`  ❌ 没有找到对应的积分交易`);
                }
            }
        } else {
            console.log('⚠️ 没有找到订阅激活事件');
        }
        
        // 6. 检查webhook端点状态
        console.log('\n📋 6. 检查webhook端点状态...');
        try {
            const webhookUrl = process.env.VERCEL_URL ? 
                `https://${process.env.VERCEL_URL}/api/paypal-webhook` : 
                'http://localhost:3000/api/paypal-webhook';
            
            console.log(`测试webhook端点: ${webhookUrl}`);
            
            const response = await fetch(webhookUrl, { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Webhook端点正常运行');
                console.log(`   状态: ${data.status}`);
                console.log(`   时间: ${data.timestamp}`);
            } else {
                console.log(`❌ Webhook端点响应异常: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ 无法访问webhook端点: ${error.message}`);
        }
        
        // 7. 分析问题并提供建议
        console.log('\n📊 问题分析和建议:');
        
        // 检查是否有订阅但没有积分交易的情况
        if (subscriptions && subscriptions.length > 0 && (!transactions || transactions.length === 0)) {
            console.log('⚠️ 发现问题: 有订阅记录但没有积分交易记录');
            console.log('   可能原因: webhook处理失败或积分交易记录失败');
            console.log('   建议: 检查webhook处理逻辑和数据库权限');
        }
        
        // 检查是否有激活事件但没有对应积分交易
        if (activationEvents && activationEvents.length > 0) {
            let missingTransactions = 0;
            for (const event of activationEvents) {
                const { data: relatedTransactions } = await supabase
                    .from('credit_transactions')
                    .select('*')
                    .eq('source', 'paypal_webhook')
                    .gte('created_at', event.processed_at)
                    .lte('created_at', new Date(new Date(event.processed_at).getTime() + 5 * 60 * 1000).toISOString());
                
                if (!relatedTransactions || relatedTransactions.length === 0) {
                    missingTransactions++;
                }
            }
            
            if (missingTransactions > 0) {
                console.log(`⚠️ 发现问题: ${missingTransactions} 个激活事件没有对应的积分交易`);
                console.log('   可能原因: webhook处理中的积分更新逻辑失败');
                console.log('   建议: 检查handleSubscriptionActivated函数');
            }
        }
        
        // 检查最近是否有webhook事件
        const recentTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentWebhooks = webhookEvents?.filter(event => event.processed_at > recentTime) || [];
        
        if (recentWebhooks.length === 0) {
            console.log('⚠️ 发现问题: 最近24小时内没有webhook事件');
            console.log('   可能原因: PayPal webhook配置问题或端点无法访问');
            console.log('   建议: 检查PayPal开发者控制台的webhook配置');
        }
        
        console.log('\n🔧 修复建议:');
        console.log('1. 如果有订阅但没有积分，可以手动触发积分同步');
        console.log('2. 检查PayPal webhook配置是否正确');
        console.log('3. 检查Supabase数据库权限和RLS策略');
        console.log('4. 查看服务器日志了解详细错误信息');
        
    } catch (error) {
        console.error('❌ 诊断过程中发生错误:', error);
    }
}

// 执行诊断
diagnoseSubscriptionCreditsIssue().catch(error => {
    console.error('❌ 诊断失败:', error);
    process.exit(1);
});