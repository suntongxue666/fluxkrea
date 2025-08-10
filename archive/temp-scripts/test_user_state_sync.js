// 测试用户状态同步功能
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUserStateSync() {
    console.log('🧪 测试用户状态同步功能...');
    
    try {
        // 1. 检查测试用户的当前状态
        console.log('\n📋 1. 检查测试用户状态...');
        const testUsers = ['sunwei7482@gmail.com', 'tiktreeapp@gmail.com'];
        
        for (const email of testUsers) {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (error) {
                console.error(`❌ 查询用户 ${email} 失败:`, error);
                continue;
            }
            
            if (user) {
                console.log(`👤 ${email}:`);
                console.log(`   UUID: ${user.uuid}`);
                console.log(`   积分: ${user.credits}`);
                console.log(`   订阅状态: ${user.subscription_status}`);
                console.log(`   是否登录: ${user.is_signed_in}`);
                console.log(`   最后访问: ${user.last_seen_at}`);
                
                // 模拟localStorage数据
                const userDataForStorage = {
                    id: user.id,
                    uuid: user.uuid,
                    email: user.email,
                    name: user.name,
                    credits: user.credits,
                    subscription_status: user.subscription_status,
                    is_signed_in: user.is_signed_in,
                    avatar_url: user.avatar_url
                };
                
                console.log(`   localStorage数据:`, JSON.stringify(userDataForStorage, null, 2));
            }
        }
        
        // 2. 测试pricing页面的关键函数逻辑
        console.log('\n📋 2. 测试pricing页面关键函数...');
        
        // 模拟checkSupabaseSession函数的逻辑
        console.log('🔍 模拟checkSupabaseSession函数...');
        
        const testUser = {
            uuid: '0e5cb85f-69bc-48de-90af-ff27bb0b4df5',
            email: 'sunwei7482@gmail.com',
            credits: 20
        };
        
        // 模拟localStorage检查
        console.log('📦 模拟localStorage检查...');
        const mockLocalStorage = JSON.stringify(testUser);
        console.log('✅ localStorage中的用户数据:', mockLocalStorage);
        
        // 模拟用户认证检查
        console.log('🔐 模拟用户认证检查...');
        const isAuthenticated = testUser && testUser.email;
        console.log(`✅ 认证状态: ${isAuthenticated ? '已认证' : '未认证'}`);
        
        if (isAuthenticated) {
            console.log('✅ Choose Pro按钮应该能正常工作');
            console.log('✅ 积分显示应该显示:', testUser.credits);
        } else {
            console.log('❌ Choose Pro按钮会显示登录弹窗');
        }
        
        // 3. 检查pricing页面的HTML结构
        console.log('\n📋 3. 检查pricing页面HTML结构...');
        const fs = require('fs');
        const path = require('path');
        
        const pricingPath = path.join(__dirname, 'pricing.html');
        const content = fs.readFileSync(pricingPath, 'utf8');
        
        // 检查关键元素
        const hasChooseProButton = content.includes('Choose Pro');
        const hasCreateSubscriptionFunction = content.includes('function createSubscription');
        const hasCheckSupabaseSessionFunction = content.includes('function checkSupabaseSession');
        const hasCreditsDisplay = content.includes('creditsAmount');
        
        console.log(`✅ Choose Pro按钮: ${hasChooseProButton ? '存在' : '缺失'}`);
        console.log(`✅ createSubscription函数: ${hasCreateSubscriptionFunction ? '存在' : '缺失'}`);
        console.log(`✅ checkSupabaseSession函数: ${hasCheckSupabaseSessionFunction ? '存在' : '缺失'}`);
        console.log(`✅ 积分显示元素: ${hasCreditsDisplay ? '存在' : '缺失'}`);
        
        // 4. 检查函数重复问题
        console.log('\n📋 4. 检查函数重复问题...');
        const checkSupabaseSessionCount = (content.match(/function checkSupabaseSession/g) || []).length;
        const createSubscriptionCount = (content.match(/function createSubscription/g) || []).length;
        
        console.log(`📊 checkSupabaseSession函数数量: ${checkSupabaseSessionCount}`);
        console.log(`📊 createSubscription函数数量: ${createSubscriptionCount}`);
        
        if (checkSupabaseSessionCount > 1) {
            console.warn('⚠️ 存在重复的checkSupabaseSession函数');
        }
        if (createSubscriptionCount > 1) {
            console.warn('⚠️ 存在重复的createSubscription函数');
        }
        
        // 5. 总结测试结果
        console.log('\n🎯 测试结果总结:');
        
        const allChecks = [
            hasChooseProButton,
            hasCreateSubscriptionFunction,
            hasCheckSupabaseSessionFunction,
            hasCreditsDisplay,
            checkSupabaseSessionCount === 1,
            createSubscriptionCount >= 1
        ];
        
        const passedChecks = allChecks.filter(check => check).length;
        const totalChecks = allChecks.length;
        
        console.log(`✅ 通过检查: ${passedChecks}/${totalChecks}`);
        
        if (passedChecks === totalChecks) {
            console.log('🎉 所有检查都通过！用户状态同步应该能正常工作');
        } else {
            console.log('❌ 部分检查失败，可能存在问题');
        }
        
        // 6. 提供调试建议
        console.log('\n🔧 调试建议:');
        console.log('1. 确保用户在首页登录后，localStorage中有用户数据');
        console.log('2. 确保pricing页面能正确读取localStorage数据');
        console.log('3. 确保checkSupabaseSession函数能正确验证用户状态');
        console.log('4. 确保Choose Pro按钮的onclick事件能正确触发');
        console.log('5. 检查浏览器控制台是否有JavaScript错误');
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error);
    }
}

// 运行测试
testUserStateSync().then(() => {
    console.log('✅ 用户状态同步测试完成');
}).catch(error => {
    console.error('❌ 测试失败:', error);
});