// 手动激活订阅 I-9DUE4SRSUGL2
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// PayPal Event数据
const SUBSCRIPTION_ID = 'I-9DUE4SRSUGL2';
const USER_UUID = '94f37245-a5ba-4c0a-be1c-7d21421c6b2d';
const USER_EMAIL = 'tiktreeapp@gmail.com';
const PLAN_ID = 'P-5S785818YS7424947NCJBKQA';
const PLAN_TYPE = 'pro';
const CREDITS_TO_ADD = 1000; // Pro计划积分

async function activateSubscription() {
    console.log('🚀 手动激活订阅 I-9DUE4SRSUGL2');
    console.log('='.repeat(50));
    console.log('订阅信息:');
    console.log(`  订阅ID: ${SUBSCRIPTION_ID}`);
    console.log(`  用户UUID: ${USER_UUID}`);
    console.log(`  用户邮箱: ${USER_EMAIL}`);
    console.log(`  计划ID: ${PLAN_ID}`);
    console.log(`  计划类型: ${PLAN_TYPE}`);
    console.log(`  积分: ${CREDITS_TO_ADD}`);
    console.log('='.repeat(50));
    
    try {
        // 1. 查找用户
        console.log('\n👤 1. 查找用户...');
        
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('uuid', USER_UUID)
            .single();
        
        if (userError) {
            // 尝试通过邮箱查找
            const { data: emailUser, error: emailError } = await supabase
                .from('users')
                .select('*')
                .eq('email', USER_EMAIL)
                .single();
            
            if (emailError) {
                console.error('❌ 找不到用户:', emailError);
                return;
            }
            
            user = emailUser;
            console.log('✅ 通过邮箱找到用户:', user.email);
        } else {
            console.log('✅ 通过UUID找到用户:', user.email);
        }
        
        console.log(`   当前积分: ${user.credits}`);
        console.log(`   当前状态: ${user.subscription_status}`);
        
        // 2. 创建订阅关联记录
        console.log('\n🔗 2. 创建订阅关联记录...');
        
        const subscriptionData = {
            google_user_id: user.uuid,
            google_user_email: user.email,
            paypal_subscription_id: SUBSCRIPTION_ID,
            plan_id: PLAN_ID,
            plan_type: PLAN_TYPE,
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { error: subInsertError } = await supabase
            .from('user_subscriptions')
            .upsert(subscriptionData, { onConflict: 'paypal_subscription_id' });
        
        if (subInsertError) {
            console.error('❌ 创建订阅关联失败:', subInsertError);
            // 继续执行，不因为这个失败而停止
        } else {
            console.log('✅ 订阅关联记录已创建');
        }
        
        // 3. 计算新积分
        console.log('\n💰 3. 计算新积分...');
        
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + CREDITS_TO_ADD;
        
        console.log(`   当前积分: ${currentCredits}`);
        console.log(`   添加积分: ${CREDITS_TO_ADD}`);
        console.log(`   新积分: ${newCredits}`);
        
        // 4. 更新用户积分和状态
        console.log('\n🔄 4. 更新用户数据...');
        
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateError) {
            console.error('❌ 更新用户数据失败:', updateError);
            return;
        }
        
        console.log('✅ 用户数据已更新');
        
        // 5. 记录积分交易
        console.log('\n📝 5. 记录积分交易...');
        
        const transactionData = {
            user_uuid: user.uuid,
            transaction_type: 'EARN',
            amount: CREDITS_TO_ADD,
            balance_after: newCredits,
            description: `Pro Plan订阅激活 (${SUBSCRIPTION_ID})`,
            source: 'paypal_webhook',
            created_at: new Date().toISOString()
        };
        
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert(transactionData);
        
        if (transError) {
            console.warn('⚠️ 积分交易记录失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        // 6. 记录Webhook事件
        console.log('\n📋 6. 记录Webhook事件...');
        
        const webhookData = {
            event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
            resource_data: {
                id: SUBSCRIPTION_ID,
                plan_id: PLAN_ID,
                status: 'ACTIVE',
                custom_id: JSON.stringify({
                    user_id: user.uuid,
                    email: user.email,
                    plan_type: PLAN_TYPE
                }),
                manual_activation: true
            },
            processing_status: 'SUCCESS',
            processed_at: new Date().toISOString()
        };
        
        const { error: webhookError } = await supabase
            .from('webhook_events')
            .insert(webhookData);
        
        if (webhookError) {
            console.warn('⚠️ Webhook事件记录失败:', webhookError.message);
        } else {
            console.log('✅ Webhook事件已记录');
        }
        
        // 7. 验证结果
        console.log('\n✅ 7. 验证激活结果...');
        
        const { data: updatedUser, error: verifyError } = await supabase
            .from('users')
            .select('email, credits, subscription_status, updated_at')
            .eq('id', user.id)
            .single();
        
        if (verifyError) {
            console.error('❌ 验证失败:', verifyError);
        } else {
            console.log('📊 激活后用户状态:');
            console.log(`   邮箱: ${updatedUser.email}`);
            console.log(`   积分: ${updatedUser.credits}`);
            console.log(`   状态: ${updatedUser.subscription_status}`);
            console.log(`   更新时间: ${new Date(updatedUser.updated_at).toLocaleString()}`);
        }
        
        console.log('\n🎉 订阅激活完成！');
        console.log('='.repeat(50));
        console.log('📋 激活总结:');
        console.log(`✅ 订阅ID: ${SUBSCRIPTION_ID}`);
        console.log(`✅ 用户: ${user.email}`);
        console.log(`✅ 计划: Pro Plan`);
        console.log(`✅ 积分: ${currentCredits} → ${newCredits} (+${CREDITS_TO_ADD})`);
        console.log(`✅ 状态: ${user.subscription_status || 'FREE'} → ACTIVE`);
        console.log('='.repeat(50));
        
        console.log('\n💡 用户现在可以刷新页面查看新的积分余额！');
        
    } catch (error) {
        console.error('❌ 激活过程中发生错误:', error);
    }
}

// 主函数
async function main() {
    await activateSubscription();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { activateSubscription };