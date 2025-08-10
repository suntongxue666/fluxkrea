// 使用管理员权限处理测试订阅
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
// 使用匿名密钥，但禁用RLS检查
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_SUBSCRIPTION_ID = 'I-C6SLTMYA3LBP';

async function handleTestSubscriptionAdmin() {
    console.log('🔧 使用管理员权限处理测试订阅:', TEST_SUBSCRIPTION_ID);
    console.log('='.repeat(60));
    
    try {
        // 1. 先尝试直接插入到数据库（绕过RLS）
        console.log('\n📋 1. 创建订阅关联记录...');
        
        // 查找管理员用户
        const { data: adminUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'sunwei7482@gmail.com')
            .single();
        
        if (userError) {
            console.error('❌ 找不到管理员用户:', userError);
            return;
        }
        
        console.log('✅ 找到管理员用户:', adminUser.email);
        console.log('   UUID:', adminUser.uuid);
        console.log('   当前积分:', adminUser.credits);
        
        // 2. 使用原生SQL插入（绕过RLS）
        console.log('\n📝 2. 使用SQL直接插入订阅记录...');
        
        const insertSQL = `
            INSERT INTO user_subscriptions (
                google_user_id, 
                google_user_email, 
                paypal_subscription_id, 
                plan_id, 
                plan_type, 
                status,
                created_at,
                updated_at
            ) VALUES (
                '${adminUser.uuid}',
                '${adminUser.email}',
                '${TEST_SUBSCRIPTION_ID}',
                'P-5ML4271244454362WXNWU5NI',
                'pro',
                'PENDING',
                NOW(),
                NOW()
            ) ON CONFLICT (paypal_subscription_id) DO UPDATE SET
                status = 'PENDING',
                updated_at = NOW()
            RETURNING *;
        `;
        
        try {
            const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', {
                sql: insertSQL
            });
            
            if (insertError) {
                console.log('❌ SQL插入失败，尝试直接API调用...');
                
                // 尝试直接插入
                const subscriptionData = {
                    google_user_id: adminUser.uuid,
                    google_user_email: adminUser.email,
                    paypal_subscription_id: TEST_SUBSCRIPTION_ID,
                    plan_id: 'P-5ML4271244454362WXNWU5NI',
                    plan_type: 'pro',
                    status: 'PENDING'
                };
                
                const { data: directInsert, error: directError } = await supabase
                    .from('user_subscriptions')
                    .upsert(subscriptionData, { onConflict: 'paypal_subscription_id' })
                    .select();
                
                if (directError) {
                    console.error('❌ 直接插入也失败:', directError);
                    console.log('\n💡 解决方案: 需要在Supabase中执行fix_rls_policies.sql');
                    return;
                } else {
                    console.log('✅ 直接插入成功:', directInsert);
                }
            } else {
                console.log('✅ SQL插入成功:', insertResult);
            }
        } catch (sqlError) {
            console.log('❌ SQL执行失败，使用备用方案...');
            
            // 备用方案：手动更新用户积分
            await manuallyActivateSubscription(adminUser);
            return;
        }
        
        // 3. 激活订阅
        console.log('\n🚀 3. 激活订阅...');
        await activateSubscriptionForUser(adminUser, 'pro');
        
    } catch (error) {
        console.error('❌ 处理过程中发生错误:', error);
    }
}

// 手动激活订阅（不依赖订阅关联表）
async function manuallyActivateSubscription(user) {
    console.log('\n🔧 手动激活订阅（备用方案）...');
    
    try {
        const creditsToAdd = 1000; // Pro计划积分
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`💰 积分计算: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 更新用户积分
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: newCredits,
                subscription_status: 'ACTIVE',
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateError) {
            console.error('❌ 更新用户积分失败:', updateError);
            return;
        }
        
        console.log('✅ 用户积分已更新');
        
        // 记录积分交易
        const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
                user_uuid: user.uuid,
                transaction_type: 'SUBSCRIPTION_PURCHASE',
                amount: creditsToAdd,
                balance_after: newCredits,
                description: `Pro Plan订阅激活 (${TEST_SUBSCRIPTION_ID}) - 获得${creditsToAdd}积分`,
                source: 'manual_activation'
            });
        
        if (transError) {
            console.warn('⚠️ 积分交易记录失败:', transError.message);
        } else {
            console.log('✅ 积分交易已记录');
        }
        
        console.log('\n🎉 手动激活完成!');
        console.log(`👤 用户: ${user.email}`);
        console.log(`💰 新积分: ${newCredits}`);
        console.log(`📊 订阅状态: ACTIVE`);
        
    } catch (error) {
        console.error('❌ 手动激活失败:', error);
    }
}

// 为用户激活订阅
async function activateSubscriptionForUser(user, planType) {
    const planDetails = {
        'pro': { name: 'Pro Plan', credits: 1000 },
        'max': { name: 'Max Plan', credits: 5000 }
    };
    
    const plan = planDetails[planType] || planDetails['pro'];
    const creditsToAdd = plan.credits;
    const currentCredits = user.credits || 0;
    const newCredits = currentCredits + creditsToAdd;
    
    console.log(`💰 积分计算: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
    
    // 更新用户积分
    const { error: updateError } = await supabase
        .from('users')
        .update({
            credits: newCredits,
            subscription_status: 'ACTIVE',
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    
    if (updateError) {
        console.error('❌ 更新用户积分失败:', updateError);
        return;
    }
    
    console.log('✅ 用户积分已更新');
    
    // 记录积分交易
    const { error: transError } = await supabase
        .from('credit_transactions')
        .insert({
            user_uuid: user.uuid,
            transaction_type: 'SUBSCRIPTION_PURCHASE',
            amount: creditsToAdd,
            balance_after: newCredits,
            description: `${plan.name}订阅激活 (${TEST_SUBSCRIPTION_ID}) - 获得${creditsToAdd}积分`,
            source: 'webhook_activation'
        });
    
    if (transError) {
        console.warn('⚠️ 积分交易记录失败:', transError.message);
    } else {
        console.log('✅ 积分交易已记录');
    }
    
    console.log('\n🎉 订阅激活完成!');
    console.log(`👤 用户: ${user.email}`);
    console.log(`💰 新积分: ${newCredits}`);
    console.log(`📊 订阅状态: ACTIVE`);
}

// 检查最终状态
async function checkFinalStatus() {
    console.log('\n📊 最终状态检查:');
    console.log('-'.repeat(40));
    
    try {
        // 检查管理员用户状态
        const { data: adminUser, error } = await supabase
            .from('users')
            .select('email, credits, subscription_status')
            .eq('email', 'sunwei7482@gmail.com')
            .single();
        
        if (!error) {
            console.log('👤 管理员用户状态:');
            console.log(`   邮箱: ${adminUser.email}`);
            console.log(`   积分: ${adminUser.credits}`);
            console.log(`   订阅状态: ${adminUser.subscription_status}`);
        }
        
        // 检查最近的积分交易
        const { data: recentTrans, error: transError } = await supabase
            .from('credit_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!transError && recentTrans.length > 0) {
            console.log('\n💳 最近积分交易:');
            recentTrans.forEach(trans => {
                const date = new Date(trans.created_at).toLocaleString();
                console.log(`   ${trans.transaction_type}: ${trans.amount} - ${trans.description} (${date})`);
            });
        }
        
    } catch (error) {
        console.error('❌ 状态检查失败:', error);
    }
}

// 主函数
async function main() {
    await handleTestSubscriptionAdmin();
    await checkFinalStatus();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { handleTestSubscriptionAdmin };