/**
 * 修复前端积分显示问题
 * 
 * 这个脚本提供了修复前端积分显示问题的方法
 */

// 前端显示问题可能的原因：
// 1. 前端缓存未更新
// 2. API调用失败
// 3. 前端代码bug
// 4. RLS策略问题

/**
 * 检查并修复前端积分显示问题
 * @param {string} email - 用户邮箱
 * @returns {Promise<object>} - 返回用户信息
 */
async function checkAndFixCreditsDisplay(email) {
  console.log(`检查用户积分显示: ${email}`);
  
  try {
    // 1. 清除本地缓存
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // 2. 重新获取用户数据
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('未登录，请先登录');
      return null;
    }
    
    // 3. 获取最新用户数据
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
    
    // 4. 更新前端状态
    if (typeof updateUserState === 'function') {
      updateUserState(user);
    }
    
    // 5. 强制刷新组件
    if (typeof forceRefreshUserComponents === 'function') {
      forceRefreshUserComponents();
    }
    
    console.log('用户数据已更新:', user);
    return user;
    
  } catch (error) {
    console.error('修复积分显示时出错:', error);
    return null;
  }
}

/**
 * 修复RLS策略问题
 * 
 * 注意：这需要管理员权限，普通用户无法执行
 * 请联系管理员执行此操作
 */
async function fixRLSPolicies() {
  console.log('修复RLS策略...');
  console.log('这需要管理员权限，请按照以下步骤操作:');
  console.log('1. 登录Supabase管理界面');
  console.log('2. 进入Table Editor > users表');
  console.log('3. 点击"Authentication"标签');
  console.log('4. 检查Row Level Security (RLS)策略');
  console.log('5. 添加以下策略:');
  
  console.log(`
CREATE POLICY "用户可以读取自己的数据" ON public.users
FOR SELECT USING (
  auth.uid() = id OR
  email = auth.email()
);
  `);
}

/**
 * 在页面加载时调用此函数，确保正确显示用户积分
 */
function ensureCorrectCreditsDisplay() {
  // 获取当前登录用户
  const currentUser = getCurrentUser(); // 假设这个函数存在
  
  if (currentUser && currentUser.email) {
    // 检查并修复积分显示
    checkAndFixCreditsDisplay(currentUser.email)
      .then(updatedUser => {
        if (updatedUser) {
          console.log('积分显示已修复:', updatedUser.credits);
          // 更新UI显示
          document.getElementById('user-credits').textContent = updatedUser.credits;
        }
      })
      .catch(err => console.error('修复积分显示失败:', err));
  }
}

// 导出函数
module.exports = {
  checkAndFixCreditsDisplay,
  fixRLSPolicies,
  ensureCorrectCreditsDisplay
};