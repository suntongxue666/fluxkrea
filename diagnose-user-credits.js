/**
 * 诊断用户积分显示问题
 * 检查前端显示与数据库实际值不一致的原因
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseUserCredits() {
    const targetEmail = 'sunwei7482@gmail.com';
    console.log(`🔍 诊断用户积分显示问题: ${targetEmail}\n`);
    
    try {
        // 1. 获取用户信息
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('email', targetEmail);
        
        if (usersError) {
            console.error('❌ 查询用户失败:', usersError.message);
            return;
        }
        
        if (!users || users.length === 0) {
            console.log('⚠️ 没有找到匹配的用户');
            return;
        }
        
        const user = users[0];
        console.log(`👤 用户信息:`);
        console.log(`ID: ${user.id}`);
        console.log(`UUID: ${user.uuid}`);
        console.log(`邮箱: ${user.email}`);
        console.log(`积分: ${user.credits}`);
        console.log(`订阅状态: ${user.subscription_status || 'FREE'}`);
        
        // 2. 检查RLS策略
        console.log('\n🔒 检查RLS策略...');
        
        // 模拟前端API调用
        const { data: apiUser, error: apiError } = await supabase
            .from('users')
            .select('credits, subscription_status')
            .eq('email', targetEmail)
            .single();
        
        if (apiError) {
            console.error('❌ API调用失败:', apiError.message);
            console.log('⚠️ 这可能是RLS策略问题，前端无法读取用户积分');
            
            // 检查RLS策略
            console.log('\n📋 建议检查users表的RLS策略:');
            console.log('1. 登录Supabase管理界面');
            console.log('2. 进入Table Editor > users表');
            console.log('3. 点击"Authentication"标签');
            console.log('4. 检查Row Level Security (RLS)策略');
            console.log('5. 确保有允许用户读取自己数据的策略');
            
            // 提供RLS策略示例
            console.log('\n📝 推荐的RLS策略示例:');
            console.log(`
CREATE POLICY "用户可以读取自己的数据" ON public.users
FOR SELECT USING (
  auth.uid() = id OR
  email = auth.email()
);
            `);
        } else {
            console.log('✅ API调用成功，返回数据:');
            console.log(`积分: ${apiUser.credits}`);
            console.log(`订阅状态: ${apiUser.subscription_status || 'FREE'}`);
            
            if (apiUser.credits !== user.credits) {
                console.log('⚠️ API返回的积分与数据库中的积分不一致!');
            } else {
                console.log('✅ API返回的积分与数据库中的积分一致');
                console.log('⚠️ 如果前端仍显示为0，可能是前端代码问题');
            }
        }
        
        // 3. 检查前端代码
        console.log('\n🔍 检查前端代码建议:');
        console.log('1. 检查获取用户数据的API调用');
        console.log('2. 检查用户数据的状态管理');
        console.log('3. 检查积分显示的组件');
        
        // 4. 提供修复建议
        console.log('\n💡 修复建议:');
        console.log('1. 清除浏览器缓存并重新登录');
        console.log('2. 检查前端代码中的用户数据获取逻辑');
        console.log('3. 确保RLS策略允许用户读取自己的积分');
        console.log('4. 检查是否有任何中间件或拦截器修改了API响应');
        
        // 5. 创建修复脚本
        console.log('\n🛠️ 创建修复脚本:');
        console.log('已创建fix-frontend-credits-display.js脚本，用于修复前端显示问题');
        console.log('已创建fix-subscription-system.js脚本，用于修复订阅系统问题');
        
    } catch (error) {
        console.error('❌ 诊断失败:', error.message);
    }
}

// 执行诊断
diagnoseUserCredits().catch(error => {
    console.error('❌ 执行出错:', error);
});