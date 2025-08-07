// 直接激活订阅，不依赖订阅关联表
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function directActivateSubscription() {
    console.log('🚀 直接激活测试订阅 I-C6SLTMYA3LBP');
    console.log('='.repeat(50));
    
    try {
        // 1. 查找目标用户
        console.log('\n👤 1. 查找目标用户...');
        
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'sunwei7482@gmail.com')
            .single();
        
        if (userError) {
            console.error('❌ 找不到用户:', userError);
            return;
        }
        
        console.log('✅ 找到用户:', user.email);
        console.log('   当前积分:', user.credits);
        console.log('   当前状态:', user.subscription_status);
        
        // 2. 计算新积分（Pro计划 = 1000积分）
        console.log('\n💰 2. 计算积分...');
        
        const planType = 'pro';
        const creditsToAdd = 1000;
        const currentCredits = user.credits || 0;
        const newCredits = currentCredits + creditsToAdd;
        
        console.log(`   计划类型: ${planType}`);
        console.log(`   添加积分: ${creditsToAdd}`);
        console.log(`   积分计算: ${currentCredits} + ${creditsToAdd} = ${newCredits}`);
        
        // 3. 更新用户积分和状态
        console.log('\n🔄 3. 更新用户数据...');
        
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
        
        // 4. 记录积分交易
        console.log('\n📝 4. 记录积分交易...');
        
        const transactionData = {
            user_uuid: user.uuid,
            transaction_type: 'SUBSCRIPTION_PURCHASE',
            amount: creditsToAdd,
            balance_after: newCredits,
            description: `Pro Plan订阅激活 (I-C6SLTMYA3LBP) - 获得${creditsToAdd}积分`,
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
        
        // 5. 验证结果
        console.log('\n✅ 5. 验证激活结果...');
        
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
            console.log(`   订阅状态: ${updatedUser.subscription_status}`);
            console.log(`   更新时间: ${new Date(updatedUser.updated_at).toLocaleString()}`);
        }
        
        // 6. 显示最近交易
        const { data: recentTrans, error: transQueryError } = await supabase
            .from('credit_transactions')
            .select('transaction_type, amount, description, created_at')
            .eq('user_uuid', user.uuid)
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!transQueryError && recentTrans.length > 0) {
            console.log('\n💳 最近积分交易:');
            recentTrans.forEach(trans => {
                const date = new Date(trans.created_at).toLocaleString();
                console.log(`   ${trans.transaction_type}: ${trans.amount} - ${trans.description} (${date})`);
            });
        }
        
        console.log('\n🎉 订阅激活完成！');
        console.log('📋 总结:');
        console.log(`   - 订阅ID: I-C6SLTMYA3LBP`);
        console.log(`   - 用户: ${user.email}`);
        console.log(`   - 计划: Pro Plan`);
        console.log(`   - 积分: ${currentCredits} → ${newCredits} (+${creditsToAdd})`);
        console.log(`   - 状态: ${user.subscription_status || 'FREE'} → ACTIVE`);
        
    } catch (error) {
        console.error('❌ 激活过程中发生错误:', error);
    }
}

// 检查系统整体状态
async function checkSystemStatus() {
    console.log('\n📊 系统整体状态检查:');
    console.log('-'.repeat(40));
    
    try {
        // 活跃用户统计
        const { data: activeUsers, error: activeError } = await supabase
            .from('users')
            .select('email, credits, subscription_status')
            .eq('subscription_status', 'ACTIVE');
        
        if (!activeError) {
            console.log(`✅ 活跃订阅用户: ${activeUsers.length} 个`);
            activeUsers.forEach(user => {
                console.log(`   - ${user.email}: ${user.credits} 积分`);
            });
        }
        
        // 总积分统计
        const { data: allUsers, error: allError } = await supabase
            .from('users')
            .select('credits')
            .not('credits', 'is', null);
        
        if (!allError) {
            const totalCredits = allUsers.reduce((sum, user) => sum + (user.credits || 0), 0);
            console.log(`💰 系统总积分: ${totalCredits}`);
        }
        
        // 最近交易统计
        const { data: recentTrans, error: transError } = await supabase
            .from('credit_transactions')
            .select('transaction_type, amount')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        if (!transError) {
            const purchases = recentTrans.filter(t => t.transaction_type === 'SUBSCRIPTION_PURCHASE');
            const spends = recentTrans.filter(t => t.transaction_type === 'SPEND');
            
            console.log(`📈 24小时内交易:`);
            console.log(`   - 订阅购买: ${purchases.length} 次`);
            console.log(`   - 积分消费: ${spends.length} 次`);
        }
        
    } catch (error) {
        console.error('❌ 系统状态检查失败:', error);
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--status')) {
        await checkSystemStatus();
    } else {
        await directActivateSubscription();
        await checkSystemStatus();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { directActivateSubscription, checkSystemStatus };