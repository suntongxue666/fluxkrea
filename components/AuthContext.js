/**
 * 认证上下文 - 管理用户登录状态和积分
 * 单一数据源，状态提升到顶层
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(20); // 默认显示20积分
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 检查是否有存储的用户信息
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLoggedIn(true);
        await fetchUserCredits(userData.google_id);
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
  };

  const fetchUserCredits = async (googleId) => {
    try {
      // 从数据库获取用户真实积分
      const response = await fetch('/api/user/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_id: googleId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('获取积分失败:', error);
    }
  };

  const handleGoogleLogin = async (googleUser) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_id: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          avatar_url: googleUser.picture
        })
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setCredits(userData.credits);
        setIsLoggedIn(true);
        
        // 存储用户信息
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true, user: userData };
      } else {
        throw new Error('登录失败');
      }
    } catch (error) {
      console.error('Google登录失败:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const spendCredits = async (amount) => {
    if (!isLoggedIn) {
      throw new Error('请先登录');
    }

    if (credits < amount) {
      throw new Error('积分不足');
    }

    try {
      const response = await fetch('/api/user/spend-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_id: user.google_id,
          amount: amount,
          description: 'AI图片生成'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.newBalance);
        return { success: true, newBalance: data.newBalance };
      } else {
        throw new Error('积分消费失败');
      }
    } catch (error) {
      console.error('积分消费失败:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setCredits(20); // 重置为默认显示
    setIsLoggedIn(false);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    credits,
    isLoggedIn,
    isLoading,
    handleGoogleLogin,
    spendCredits,
    logout,
    fetchUserCredits
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};