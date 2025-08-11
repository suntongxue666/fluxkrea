/**
 * 修复前端积分显示问题
 * 确保用户登录后积分显示准确
 */

// 导入必要的库
import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 获取最新的用户积分
 * @param {string} userId - 用户ID
 * @returns {Promise<number>} - 返回用户积分
 */
export async function fetchLatestUserCredits(userId) {
  try {
    // 直接从数据库获取最新积分
    const { data, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('获取用户积分失败:', error.message);
      return null;
    }
    
    return data?.credits || 0;
  } catch (error) {
    console.error('获取积分时出错:', error);
    return null;
  }
}

/**
 * 更新用户状态，确保积分显示准确
 * @param {object} user - 用户对象
 * @returns {Promise<object>} - 返回更新后的用户对象
 */
export async function refreshUserData(user) {
  if (!user || !user.id) {
    console.error('无效的用户对象');
    return null;
  }
  
  try {
    // 获取完整的用户数据
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('刷新用户数据失败:', error.message);
      return user;
    }
    
    // 返回更新后的用户数据
    return data || user;
  } catch (error) {
    console.error('刷新用户数据时出错:', error);
    return user;
  }
}

/**
 * 用户登录后刷新用户数据
 * 在登录成功后调用此函数
 * @param {object} session - 登录会话
 * @returns {Promise<object>} - 返回用户数据
 */
export async function refreshUserAfterLogin(session) {
  if (!session || !session.user) {
    console.error('无效的会话');
    return null;
  }
  
  try {
    // 获取用户ID
    const userId = session.user.id;
    
    // 获取完整的用户数据
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('登录后获取用户数据失败:', error.message);
      return null;
    }
    
    // 存储到本地状态
    if (typeof window !== 'undefined') {
      // 清除可能过期的缓存
      localStorage.removeItem('userData');
      // 存储新的用户数据
      localStorage.setItem('userData', JSON.stringify(data));
    }
    
    return data;
  } catch (error) {
    console.error('登录后刷新用户数据时出错:', error);
    return null;
  }
}

/**
 * 定期刷新用户数据
 * 可以在应用初始化时调用此函数
 * @param {function} updateUserState - 更新用户状态的函数
 * @param {number} interval - 刷新间隔(毫秒)，默认5分钟
 * @returns {function} - 返回清除定时器的函数
 */
export function setupPeriodicRefresh(updateUserState, interval = 5 * 60 * 1000) {
  // 初始刷新
  refreshCurrentUser(updateUserState);
  
  // 设置定期刷新
  const timerId = setInterval(() => {
    refreshCurrentUser(updateUserState);
  }, interval);
  
  // 返回清除函数
  return () => clearInterval(timerId);
}

/**
 * 刷新当前用户数据
 * @param {function} updateUserState - 更新用户状态的函数
 */
async function refreshCurrentUser(updateUserState) {
  try {
    // 获取当前会话
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('用户未登录');
      return;
    }
    
    // 刷新用户数据
    const userData = await refreshUserAfterLogin(session);
    
    if (userData && typeof updateUserState === 'function') {
      updateUserState(userData);
    }
  } catch (error) {
    console.error('刷新当前用户时出错:', error);
  }
}

/**
 * 监听认证状态变化
 * 在应用初始化时调用此函数
 * @param {function} updateUserState - 更新用户状态的函数
 * @returns {function} - 返回取消订阅的函数
 */
export function setupAuthListener(updateUserState) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // 用户登录，刷新用户数据
      const userData = await refreshUserAfterLogin(session);
      if (userData && typeof updateUserState === 'function') {
        updateUserState(userData);
      }
    } else if (event === 'SIGNED_OUT') {
      // 用户登出，清除状态
      if (typeof updateUserState === 'function') {
        updateUserState(null);
      }
      
      // 清除本地缓存
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userData');
      }
    }
  });
}