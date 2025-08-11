/**
 * 浏览器端修复积分显示问题
 * 
 * 将此代码复制到浏览器控制台执行，可以立即修复积分显示问题
 */

// 立即执行的匿名函数
(async function() {
  console.log('开始修复积分显示问题...');
  
  // 检查是否有supabase对象
  if (!window.supabase) {
    console.error('找不到supabase对象，请确保已加载Supabase客户端');
    return;
  }
  
  try {
    // 1. 获取当前会话
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) {
      console.error('未登录，请先登录');
      return;
    }
    
    console.log('当前用户:', session.user.email);
    
    // 2. 获取用户数据
    const { data: userData, error: userError } = await window.supabase
      .from('users')
      .select('credits, email, id, uuid')
      .eq('email', session.user.email)
      .single();
    
    if (userError) {
      console.error('查询用户数据失败:', userError.message);
      
      // 尝试使用RPC函数
      try {
        const { data: credits, error: rpcError } = await window.supabase.rpc('get_my_credits');
        
        if (rpcError) {
          console.error('RPC调用失败:', rpcError.message);
          return;
        }
        
        console.log('通过RPC获取的积分:', credits);
        updateCreditsDisplay(credits);
        
      } catch (e) {
        console.error('RPC调用出错:', e.message);
      }
      
      return;
    }
    
    console.log('用户数据:', userData);
    
    // 3. 更新积分显示
    if (userData && userData.credits !== undefined) {
      updateCreditsDisplay(userData.credits);
    }
    
  } catch (error) {
    console.error('修复过程出错:', error.message);
  }
  
  // 更新积分显示的函数
  function updateCreditsDisplay(credits) {
    console.log('更新积分显示为:', credits);
    
    // 尝试查找积分显示元素
    // 这里需要根据实际网页结构调整选择器
    const selectors = [
      '#credits-display',
      '.credits-display',
      '.user-credits',
      '.credits-value',
      '.credits-balance',
      // 添加更多可能的选择器
    ];
    
    let updated = false;
    
    // 尝试所有可能的选择器
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = credits;
        console.log(`已更新元素 ${selector} 的积分显示`);
        updated = true;
      }
    }
    
    if (!updated) {
      console.log('未找到积分显示元素，尝试更新全局状态...');
      
      // 尝试更新React/Vue状态
      if (window.__NEXT_DATA__) {
        console.log('检测到Next.js应用，尝试更新状态...');
        // 这里可能需要更复杂的逻辑来更新Next.js状态
      }
      
      // 提示手动刷新
      console.log('建议刷新页面或手动更新积分显示');
    }
    
    // 在localStorage中存储正确的积分值，以便页面刷新时使用
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userData.credits = credits;
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('已更新localStorage中的积分值');
      }
    } catch (e) {
      console.error('更新localStorage失败:', e.message);
    }
  }
  
  console.log('积分显示修复完成');
})();