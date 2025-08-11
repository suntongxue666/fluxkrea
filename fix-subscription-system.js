/**
 * 修复订阅系统问题
 * 
 * 这个脚本提供了修复订阅系统问题的方法
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 检查并修复用户订阅状态
 * @param {string} email - 用户邮箱
 * @returns {Promise<object>} - 返回用户信息
 */
async function checkAndFixSubscription(email) {
  console.log(`检查用户订阅状态: ${email}`);
  
  try {
    // 1. 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('获取用户信息失败:', userError.message);
      return null;
    }
    
    // 2. 检查订阅状态与积分是否匹配
    const hasSubscription = user.subscription_status === 'ACTIVE';
    const hasEnoughCredits = user.credits >= 1000;
    
    if (hasSubscription && !hasEnoughCredits) {
      console.log('⚠️ 用户有订阅但积分不足1000，添加积分...');
      
      // 添加积分
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          credits: 1000,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('更新积分失败:', updateError.message);
        return user;
      }
      
      // 记录交易
      await supabase
        .from('credit_transactions')
        .insert({
          user_uuid: user.uuid,
          transaction_type: 'EARN',
          amount: 1000 - user.credits,
          balance_after: 1000,
          description: '订阅积分修复',
          source: 'subscription_fix'
        });
      
      console.log('✅ 已添加积分到1000');
      
    } else if (!hasSubscription && hasEnoughCredits) {
      console.log('⚠️ 用户有足够积分但没有订阅状态，更新订阅状态...');
      
      // 更新订阅状态
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          subscription_status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('更新订阅状态失败:', updateError.message);
        return user;
      }
      
      console.log('✅ 已更新订阅状态为ACTIVE');
    }
    
    // 3. 重新获取更新后的用户信息
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    return updatedUser;
    
  } catch (error) {
    console.error('修复订阅状态时出错:', error);
    return null;
  }
}

/**
 * 全面检查并修复所有用户的订阅问题
 * 
 * 注意：这需要管理员权限
 */
async function fixAllSubscriptions() {
  console.log('全面检查并修复所有用户的订阅问题...');
  
  try {
    // 1. 获取所有用户
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('获取用户列表失败:', usersError.message);
      return;
    }
    
    console.log(`找到 ${allUsers.length} 个用户`);
    
    // 2. 检查并修复每个用户
    let fixedCount = 0;
    
    for (const user of allUsers) {
      // 检查订阅状态与积分是否匹配
      const hasSubscription = user.subscription_status === 'ACTIVE';
      const hasEnoughCredits = user.credits >= 1000;
      
      if (hasSubscription && !hasEnoughCredits) {
        console.log(`修复用户 ${user.email || user.uuid}: 有订阅但积分不足`);
        
        // 添加积分
        await supabase
          .from('users')
          .update({ 
            credits: 1000,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        // 记录交易
        await supabase
          .from('credit_transactions')
          .insert({
            user_uuid: user.uuid,
            transaction_type: 'EARN',
            amount: 1000 - user.credits,
            balance_after: 1000,
            description: '订阅积分修复',
            source: 'subscription_fix'
          });
        
        fixedCount++;
        
      } else if (!hasSubscription && hasEnoughCredits) {
        console.log(`修复用户 ${user.email || user.uuid}: 有足够积分但没有订阅状态`);
        
        // 更新订阅状态
        await supabase
          .from('users')
          .update({ 
            subscription_status: 'ACTIVE',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        fixedCount++;
      }
    }
    
    console.log(`✅ 修复完成，共修复 ${fixedCount} 个用户`);
    
  } catch (error) {
    console.error('修复所有订阅时出错:', error);
  }
}

// 导出函数
module.exports = {
  checkAndFixSubscription,
  fixAllSubscriptions
};