/**
 * 修复Google登录用户重复问题
 * 
 * 这个文件包含了修复Google登录可能导致的用户重复问题的代码
 */

// 导入必要的库
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
 * 在用户登录时调用此函数，确保不会创建重复用户
 * @param {object} userInfo - 用户信息
 * @returns {Promise<object>} - 返回用户信息
 */
async function handleGoogleLogin(userInfo) {
  const { email, google_id } = userInfo;
  
  // 检查并修复可能的重复用户
  const user = await checkAndFixGoogleUser(email, google_id);
  
  // 如果用户不存在，创建新用户
  if (!user) {
    // 创建新用户的逻辑...
    return createNewUser(userInfo);
  }
  
  return user;
}

/**
 * 创建新用户
 * @param {object} userInfo - 用户信息
 * @returns {Promise<object>} - 返回创建的用户
 */
async function createNewUser(userInfo) {
  // 创建新用户的逻辑...
  // 这里应该包含实际的用户创建代码
  console.log('创建新用户:', userInfo.email);
  return { ...userInfo, isNew: true };
}

module.exports = {
  checkAndFixGoogleUser,
  handleGoogleLogin
};