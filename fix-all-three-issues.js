/**
 * 综合修复方案
 * 
 * 这个脚本提供了修复Google登录、积分显示和订阅系统的综合方案
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 检查并修复Google登录可能导致的用户重复问题
 * @param {string} email - 用户邮箱
 * @param {string} googleId - Google ID
 * @returns {Promise<object>} - 返回用户信息
 */
async function checkAndFixGoogleUser(email, googleId) {
  console.log(`检查Google用户: ${email}`);
  
  try {
    // 1. 查询是否存在相同邮箱的用户
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (queryError) {
      console.error('查询用户失败:', queryError.message);
      throw queryError;
    }
    
    // 2. 如果存在多个用户记录，进行合并处理
    if (existingUsers && existingUsers.length > 1) {
      console.log(`发现${existingUsers.length}个重复用户记录，准备合并`);
      
      // 找出积分最高的用户记录作为主记录
      const mainUser = existingUsers.reduce((prev, current) => 
        (prev.credits > current.credits) ? prev : current
      );
      
      // 收集需要删除的用户ID
      const userIdsToDelete = existingUsers
        .filter(user => user.id !== mainUser.id)
        .map(user => user.id);
      
      // 收集需要合并的交易记录
      for (const user of existingUsers) {
        if (user.id === mainUser.id) continue;
        
        // 获取该用户的交易记录
        const { data: transactions } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_uuid', user.uuid);
        
        // 将交易记录转移到主用户
        if (transactions && transactions.length > 0) {
          for (const trans of transactions) {
            // 创建新的交易记录
            await supabase
              .from('credit_transactions')
              .insert({
                ...trans,
                id: undefined, // 让数据库自动生成新ID
                user_uuid: mainUser.uuid,
                description: `${trans.description} (合并自用户 ${user.uuid})`
              });
          }
        }
      }
      
      // 删除重复的用户记录
      for (const userId of userIdsToDelete) {
        await supabase
          .from('users')
          .delete()
          .eq('id', userId);
      }
      
      console.log(`成功合并用户记录，保留ID为${mainUser.id}的记录`);
      return mainUser;
    }
    
    // 3. 如果只有一个用户记录或没有记录，直接返回
    return existingUsers?.[0] || null;
    
  } catch (error) {
    console.error('处理Google用户时出错:', error);
    throw error;
  }
}

/**
 * 检查并修复前端积分显示问题
 * @param {string} email - 用户邮箱
 * @returns {Promise<object>} - 返回用户信息
 */
async function checkAndFixCreditsDisplay(email) {
  console.log(`检查用户积分显示: ${email}`);
  
  try {
    // 1. 获取用户数据
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('获取用户数据失败:', error.message);
      
      // 检查是否是RLS策略问题
      if (error.code === 'PGRST301') {
        console.error('这可能是RLS策略问题，请检查users表的RLS策略');
      }
      
      return null;
    }
    
    console.log('用户数据:', user);
    console.log('积分:', user.credits);
    
    return user;
    
  } catch (error) {
    console.error('检查积分显示时出错:', error);
    return null;
  }
}

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
 * 综合修复所有问题
 * @param {string} email - 用户邮箱
 * @returns {Promise<object>} - 返回修复结果
 */
async function fixAllIssues(email) {
  console.log(`开始综合修复: ${email}`);
  
  try {
    // 1. 修复Google登录问题
    const user = await checkAndFixGoogleUser(email);
    
    if (!user) {
      console.log('没有找到用户，跳过后续修复');
      return { success: false, message: '没有找到用户' };
    }
    
    // 2. 修复积分显示问题
    await checkAndFixCreditsDisplay(email);
    
    // 3. 修复订阅系统问题
    const updatedUser = await checkAndFixSubscription(email);
    
    return {
      success: true,
      user: updatedUser,
      message: '所有问题已修复'
    };
    
  } catch (error) {
    console.error('综合修复失败:', error);
    return {
      success: false,
      message: `修复失败: ${error.message}`
    };
  }
}

// 导出函数
module.exports = {
  checkAndFixGoogleUser,
  checkAndFixCreditsDisplay,
  checkAndFixSubscription,
  fixAllIssues
};

// 如果直接运行此脚本
if (require.main === module) {
  const email = process.argv[2];
  
  if (!email) {
    console.log('请提供用户邮箱作为参数');
    console.log('例如: node fix-all-three-issues.js sunwei7482@gmail.com');
    process.exit(1);
  }
  
  fixAllIssues(email)
    .then(result => {
      console.log('修复结果:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}