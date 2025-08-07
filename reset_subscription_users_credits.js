// 重置订阅用户积分到20，准备重新测试
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TARGET_USERS = [
    'tiktreeapp@gmail.com',
    'sunwei7482@gmail.com'
];

const RESET_CREDITS = 20;

async function resetSubscriptionUsersCredits() {
    console.log('🔄 重置订阅用户积分到20');
    console.log('='.repeat(50));
    console.log('目标用户:', TARGET_USERS.join(', '));
    console.log('重置积分:', RESET_CREDITS);
    console.log('='.repeat(50));
    
    try {
        for (const email of TARGET_USERS) {
            console.log(`\n👤 处理用户: ${email}`);
            
            // 1. 查找用户
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (userError) {
                console.error(`❌ 找不到用户 ${email}:`, userError.message);
                continue;
            }
            
            console.log(`✅ 找到用户: ${user.email}`);
            console.log(`   当前积分: ${user.credits}`);
            console.log(`   当前状态: ${user.subscription_status}`);
            
            // 2. 重置积分和状态
            console.log(`🔄 重置积分: ${user.credits} → ${RESET_CREDITS}`);
            
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    credits: RESET_CREDITS,
                    subscription_status: 'FREE', // 重置为FREE状态
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            
            if (updateError) {
                console.error(`❌ 更新用户失败:`, updateError);
                continue;
            }
            
            console.log(`✅ 用户数据已更新`);
            
            // 3. 记录重置交易
            console.log(`📝 记录重置交易...`);
            
            const transactionData = {
                user_uuid: user.uuid,
                transaction_type: 'SYSTEM_RESET',
                amount: RESET_CREDITS - (user.credits || 0),
                balance_after: RESET_CREDITS,
                description: `系统重置积分到${RESET_CREDITS}，准备重新测试订阅流程`,
                source: 'system_reset',
                created_at: new Date().toISOString()
            };
            
            const { error: transError } = await supabase
                .from('credit_transactions')
                .insert(transactionData);
            
            if (transError) {
                console.warn(`⚠️ 交易记录失败:`, transError.message);
            } else {
                console.log(`✅ 重置交易已记录`);
            }
            
            // 4. 清理旧的订阅关联（如果存在）
            console.log(`🧹 清理旧的订阅关联...`);
            
            const { error: cleanupError } = await supabase
                .from('user_subscriptions')
                .delete()
                .eq('google_user_id', user.uuid);
            
            if (cleanupError) {
                console.log(`⚠️ 清理订阅关联失败:`, cleanupError.message);
            } else {
                console.log(`✅ 旧订阅关联已清理`);
            }
            
            // 5. 验证重置结果
            const { data: updatedUser, error: verifyError } = await supabase
                .from('users')
                .select('email, credits, subscription_status, updated_at')
                .eq('id', user.id)
                .single();
            
            if (verifyError) {
                console.error(`❌ 验证失败:`, verifyError);
            } else {
                console.log(`📊 重置后状态:`);
                console.log(`   邮箱: ${updatedUser.email}`);
                console.log(`   积分: ${updatedUser.credits}`);
                console.log(`   状态: ${updatedUser.subscription_status}`);
                console.log(`   更新时间: ${new Date(updatedUser.updated_at).toLocaleString()}`);
            }
        }
        
        // 6. 显示系统整体状态
        console.log('\n📊 系统整体状态:');
        console.log('-'.repeat(30));
        
        const { data: allUsers, error: allError } = await supabase
            .from('users')
            .select('email, credits, subscription_status')
            .not('email', 'is', null)
            .order('credits', { ascending: false })
            .limit(10);
        
        if (!allError) {
            console.log('💰 用户积分排行:');
            allUsers.forEach(user => {
                const status = user.subscription_status || 'FREE';
                console.log(`   ${user.email}: ${user.credits} 积分 (${status})`);
            });
        }
        
        // 7. 检查订阅关联表状态
        const { data: subscriptions, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*');
        
        if (!subError) {
            console.log(`\n🔗 订阅关联表: ${subscriptions.length} 条记录`);
            if (subscriptions.length === 0) {
                console.log('✅ 订阅关联表已清空，准备接收新的订阅');
            }
        }
        
        console.log('\n🎯 重置完成！现在可以开始测试订阅流程了');
        console.log('='.repeat(50));
        console.log('📋 测试步骤:');
        console.log('1. 用户登录到系统');
        console.log('2. 进入定价页面购买订阅');
        console.log('3. 完成PayPal支付');
        console.log('4. 检查Webhook是否正确处理');
        console.log('5. 验证积分是否正确增加');
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ 重置过程中发生错误:', error);
    }
}

// 检查Webhook端点状态
async function checkWebhookEndpoint() {
    console.log('\n🔌 检查Webhook端点状态...');
    
    try {
        const webhookUrl = 'https://fluxkrea.me/api/paypal-webhook';
        
        console.log(`📡 测试URL: ${webhookUrl}`);
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_type: 'TEST.WEBHOOK.CONNECTIVITY',
                resource: { id: 'test-connectivity' }
            })
        });
        
        console.log(`📊 响应状态: ${response.status}`);
        
        if (response.ok) {
            const result = await response.text();
            console.log(`✅ Webhook端点可访问`);
            console.log(`📄 响应内容: ${result.substring(0, 200)}...`);
        } else {
            console.log(`❌ Webhook端点返回错误: ${response.status}`);
            const errorText = await response.text();
            console.log(`📄 错误内容: ${errorText.substring(0, 200)}...`);
        }
        
    } catch (error) {
        console.error('❌ Webhook端点测试失败:', error.message);
        console.log('💡 这可能是网络问题，不影响实际的PayPal Webhook调用');
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--webhook-test')) {
        await checkWebhookEndpoint();
    } else {
        await resetSubscriptionUsersCredits();
        await checkWebhookEndpoint();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { resetSubscriptionUsersCredits, checkWebhookEndpoint };