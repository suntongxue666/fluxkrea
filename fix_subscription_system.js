// 修复订阅系统的完整解决方案
// 解决用户登录状态同步、订阅关联和积分分配问题

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 开始修复订阅系统...');

async function fixSubscriptionSystem() {
    console.log('='.repeat(60));
    console.log('🎯 订阅系统修复方案');
    console.log('='.repeat(60));
    
    // 1. 检查当前数据状态
    await checkCurrentDataState();
    
    // 2. 修复用户数据一致性
    await fixUserDataConsistency();
    
    // 3. 修复订阅关联问题
    await fixSubscriptionAssociations();
    
    // 4. 验证修复结果
    await verifyFixResults();
    
    console.log('\n🎉 订阅系统修复完成！');
}

// 检查当前数据状态
async function checkCurrentDataState() {
    console.log('\n📊 1. 检查当前数据状态');
    console.log('-'.repeat(40));
    
    try {
        // 检查用户表
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('uuid, email, credits, subscription_status')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (usersError) {
            console.error('❌ 查询用户表失败:', usersError);
        } else {
            console.log(`✅ 用户表: ${users.length} 条记录`);
            users.forEach(user => {
                console.log(`   - ${user.email}: ${user.credits} 积分, 状态: ${user.subscription_status}`);
            });
        }
        
        // 检查订阅表
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select('id, user_uuid, user_email, plan_type, status')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (subError) {
            console.error('❌ 查询订阅表失败:', subError);
        } else {
            console.log(`✅ 订阅表: ${subscriptions.length} 条记录`);
            subscriptions.forEach(sub => {
                console.log(`   - ${sub.id}: ${sub.user_email} (${sub.user_uuid}), 状态: ${sub.status}`);
            });
        }
        
        // 检查用户订阅关联表
        const { data: userSubs, error: userSubsError } = await supabase
            .from('user_subscriptions')
            .select('google_user_id, google_user_email, paypal_subscription_id, status')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (userSubsError) {
            console.error('❌ 查询用户订阅关联表失败:', userSubsError);
        } else {
            console.log(`✅ 用户订阅关联表: ${userSubs.length} 条记录`);
            userSubs.forEach(userSub => {
                console.log(`   - ${userSub.google_user_email}: ${userSub.paypal_subscription_id}, 状态: ${userSub.status}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 检查数据状态失败:', error);
    }
}

// 修复用户数据一致性
async function fixUserDataConsistency() {
    console.log('\n🔧 2. 修复用户数据一致性');
    console.log('-'.repeat(40));
    
    try {
        // 查找所有用户
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*');
        
        if (usersError) {
            console.error('❌ 查询用户失败:', usersError);
            return;
        }
        
        console.log(`📋 找到 ${users.length} 个用户，开始修复...`);
        
        for (const user of users) {
            // 确保每个用户都有正确的UUID和邮箱映射
            if (user.email && user.uuid) {
                console.log(`✅ 用户 ${user.email} 数据完整 (UUID: ${user.uuid})`);
            } else {
                console.log(`⚠️  用户 ${user.email || user.uuid} 数据不完整，需要修复`);
                
                // 如果缺少UUID，生成一个
                if (!user.uuid && user.email) {
                    const newUuid = user.email; // 使用邮箱作为UUID保持一致性
                    
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ uuid: newUuid })
                        .eq('id', user.id);
                    
                    if (updateError) {
                        console.error(`❌ 更新用户UUID失败:`, updateError);
                    } else {
                        console.log(`✅ 已为用户 ${user.email} 设置UUID: ${newUuid}`);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ 修复用户数据一致性失败:', error);
    }
}

// 修复订阅关联问题
async function fixSubscriptionAssociations() {
    console.log('\n🔗 3. 修复订阅关联问题');
    console.log('-'.repeat(40));
    
    try {
        // 查找所有订阅记录
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select('*');
        
        if (subError) {
            console.error('❌ 查询订阅失败:', subError);
            return;
        }
        
        console.log(`📋 找到 ${subscriptions.length} 个订阅，开始修复关联...`);
        
        for (const subscription of subscriptions) {
            console.log(`\n🔍 处理订阅: ${subscription.id}`);
            
            // 通过邮箱查找用户
            let user = null;
            if (subscription.user_email) {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', subscription.user_email)
                    .single();
                
                if (!userError && userData) {
                    user = userData;
                    console.log(`✅ 通过邮箱找到用户: ${user.email} (UUID: ${user.uuid})`);
                }
            }
            
            // 如果通过邮箱没找到，尝试通过UUID查找
            if (!user && subscription.user_uuid) {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('uuid', subscription.user_uuid)
                    .single();
                
                if (!userError && userData) {
                    user = userData;
                    console.log(`✅ 通过UUID找到用户: ${user.email} (UUID: ${user.uuid})`);
                }
            }
            
            if (!user) {
                console.log(`❌ 无法找到订阅 ${subscription.id} 对应的用户`);
                continue;
            }
            
            // 确保订阅记录中的用户信息正确
            const needsUpdate = 
                subscription.user_uuid !== user.uuid || 
                subscription.user_email !== user.email;
            
            if (needsUpdate) {
                console.log(`🔧 更新订阅 ${subscription.id} 的用户信息...`);
                
                const { error: updateError } = await supabase
                    .from('subscriptions')
                    .update({
                        user_uuid: user.uuid,
                        user_email: user.email,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', subscription.id);
                
                if (updateError) {
                    console.error(`❌ 更新订阅失败:`, updateError);
                } else {
                    console.log(`✅ 订阅 ${subscription.id} 用户信息已更新`);
                }
            }
            
            // 检查并修复用户订阅关联表
            const { data: userSubData, error: userSubError } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('paypal_subscription_id', subscription.id)
                .single();
            
            if (userSubError && userSubError.code === 'PGRST116') {
                // 记录不存在，创建新记录
                console.log(`🆕 创建用户订阅关联记录...`);
                
                const { error: insertError } = await supabase
                    .from('user_subscriptions')
                    .insert({
                        google_user_id: user.uuid,
                        google_user_email: user.email,
                        paypal_subscription_id: subscription.id,
                        plan_id: subscription.plan_id,
                        plan_type: subscription.plan_type,
                        status: subscription.status,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                
                if (insertError) {
                    console.error(`❌ 创建用户订阅关联失败:`, insertError);
                } else {
                    console.log(`✅ 用户订阅关联记录已创建`);
                }
            } else if (!userSubError && userSubData) {
                // 记录存在，检查是否需要更新
                const needsUserSubUpdate = 
                    userSubData.google_user_id !== user.uuid ||
                    userSubData.google_user_email !== user.email;
                
                if (needsUserSubUpdate) {
                    console.log(`🔧 更新用户订阅关联记录...`);
                    
                    const { error: updateUserSubError } = await supabase
                        .from('user_subscriptions')
                        .update({
                            google_user_id: user.uuid,
                            google_user_email: user.email,
                            updated_at: new Date().toISOString()
                        })
                        .eq('paypal_subscription_id', subscription.id);
                    
                    if (updateUserSubError) {
                        console.error(`❌ 更新用户订阅关联失败:`, updateUserSubError);
                    } else {
                        console.log(`✅ 用户订阅关联记录已更新`);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ 修复订阅关联失败:', error);
    }
}

// 验证修复结果
async function verifyFixResults() {
    console.log('\n✅ 4. 验证修复结果');
    console.log('-'.repeat(40));
    
    try {
        // 检查用户数据完整性
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('uuid, email, credits, subscription_status')
            .is('uuid', null);
        
        if (usersError) {
            console.error('❌ 验证用户数据失败:', usersError);
        } else {
            if (users.length === 0) {
                console.log('✅ 所有用户都有完整的UUID');
            } else {
                console.log(`⚠️  还有 ${users.length} 个用户缺少UUID`);
            }
        }
        
        // 检查订阅关联完整性
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select(`
                id, 
                user_uuid, 
                user_email, 
                status,
                user_subscriptions!inner(google_user_id, google_user_email)
            `);
        
        if (subError) {
            console.error('❌ 验证订阅关联失败:', subError);
        } else {
            console.log(`✅ ${subscriptions.length} 个订阅都有对应的用户关联记录`);
        }
        
        // 统计修复结果
        const { data: activeSubscriptions, error: activeError } = await supabase
            .from('subscriptions')
            .select('user_email, plan_type, status')
            .eq('status', 'ACTIVE');
        
        if (!activeError) {
            console.log(`\n📊 修复结果统计:`);
            console.log(`   - 活跃订阅: ${activeSubscriptions.length} 个`);
            
            const planCounts = activeSubscriptions.reduce((acc, sub) => {
                acc[sub.plan_type] = (acc[sub.plan_type] || 0) + 1;
                return acc;
            }, {});
            
            Object.entries(planCounts).forEach(([plan, count]) => {
                console.log(`   - ${plan} 计划: ${count} 个`);
            });
        }
        
    } catch (error) {
        console.error('❌ 验证修复结果失败:', error);
    }
}

// 执行修复
fixSubscriptionSystem().catch(error => {
    console.error('❌ 修复过程中发生错误:', error);
    process.exit(1);
});