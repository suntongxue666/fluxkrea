/**
 * 前端集成指南
 * 
 * 这个文件提供了在前端正确获取和显示用户积分的代码示例
 */

// 1. 在用户上下文提供者中添加以下代码
// 文件: UserProvider.js 或 AuthContext.js

import { createContext, useState, useEffect, useContext } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const supabase = useSupabaseClient();
  const authUser = useUser();
  const [userData, setUserData] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  // 获取用户数据的函数
  const fetchUserData = async () => {
    if (!authUser) {
      setUserData(null);
      setCredits(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // 方法1: 使用RPC调用获取用户数据（推荐）
      const { data: userData, error: userError } = await supabase.rpc('get_my_user_data');
      
      if (userError) {
        console.error('获取用户数据失败:', userError);
        
        // 方法2: 如果RPC调用失败，尝试直接查询
        const { data: directData, error: directError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
        
        if (!directError && directData) {
          setUserData(directData);
          setCredits(directData.credits || 0);
        } else {
          console.error('直接查询用户数据失败:', directError);
        }
      } else if (userData) {
        setUserData(userData);
        setCredits(userData.credits || 0);
      }
    } catch (error) {
      console.error('获取用户数据时出错:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取用户积分的函数
  const fetchCredits = async () => {
    if (!authUser) {
      setCredits(0);
      return;
    }
    
    try {
      // 方法1: 使用RPC调用获取积分（推荐）
      const { data: creditsData, error: creditsError } = await supabase.rpc('get_my_credits');
      
      if (creditsError) {
        console.error('获取积分失败:', creditsError);
        
        // 方法2: 如果RPC调用失败，尝试直接查询
        const { data: directData, error: directError } = await supabase
          .from('users')
          .select('credits')
          .eq('email', authUser.email)
          .single();
        
        if (!directError && directData) {
          setCredits(directData.credits || 0);
        } else {
          console.error('直接查询积分失败:', directError);
        }
      } else {
        setCredits(creditsData || 0);
      }
    } catch (error) {
      console.error('获取积分时出错:', error);
    }
  };

  // 刷新用户数据
  const refreshUserData = () => {
    fetchUserData();
  };

  // 当用户登录状态变化时获取数据
  useEffect(() => {
    fetchUserData();
    
    // 设置定期刷新（每5分钟）
    const intervalId = setInterval(fetchCredits, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [authUser]);

  // 监听认证状态变化
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // 用户登录后，等待一秒再获取数据，确保触发器有时间执行
        setTimeout(fetchUserData, 1000);
      } else if (event === 'SIGNED_OUT') {
        setUserData(null);
        setCredits(0);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const value = {
    userData,
    credits,
    loading,
    refreshUserData,
    fetchCredits
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUserData = () => useContext(UserContext);

// 2. 在应用入口文件中使用UserProvider
// 文件: _app.js 或 App.js

import { UserProvider } from './UserProvider';

function MyApp({ Component, pageProps }) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    </SessionContextProvider>
  );
}

// 3. 在组件中使用用户数据
// 文件: 任何需要显示积分的组件

import { useUserData } from './UserProvider';

function CreditsDisplay() {
  const { credits, loading, refreshUserData } = useUserData();

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <p>积分余额: {credits}</p>
      <button onClick={refreshUserData}>刷新</button>
    </div>
  );
}

// 4. 在登录成功后刷新用户数据
// 文件: 登录组件

import { useUserData } from './UserProvider';

function LoginButton() {
  const supabase = useSupabaseClient();
  const { refreshUserData } = useUserData();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      console.error('Google登录失败:', error);
    } else {
      // 登录成功后，等待2秒再刷新用户数据，确保触发器有时间执行
      setTimeout(refreshUserData, 2000);
    }
  };

  return <button onClick={handleGoogleLogin}>使用Google登录</button>;
}