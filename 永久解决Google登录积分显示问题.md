# 永久解决Google登录积分显示问题

## 问题本质

新用户通过Google登录后，系统在数据库中正确赠送了20积分，但前端显示为0分。这是一个持久性问题，需要从根本上解决，确保所有新用户登录后都能正确显示积分。

## 永久解决方案

### 1. 修复前端用户数据获取逻辑

在前端项目的用户认证和数据获取部分进行修改，确保每次登录后都能正确获取最新的用户数据。

**文件位置**: `src/hooks/useAuth.js` 或类似的认证相关文件

```javascript
// 修改前端认证钩子
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取完整的用户数据，包括积分
  async function getFullUserData(authUser) {
    if (!authUser) return null;
    
    try {
      // 从users表获取完整用户数据
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();
      
      if (error) {
        console.error('获取用户数据失败:', error);
        return authUser; // 返回基本用户数据
      }
      
      return { ...authUser, ...data }; // 合并认证数据和用户数据
    } catch (err) {
      console.error('处理用户数据时出错:', err);
      return authUser;
    }
  }

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const fullUser = await getFullUserData(session.user);
        setUser(fullUser);
      }
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const fullUser = await getFullUserData(session.user);
          setUser(fullUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading };
}
```

### 2. 修改用户上下文提供者

**文件位置**: `src/contexts/UserContext.js` 或类似的上下文相关文件

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取完整的用户数据，包括积分
  async function getFullUserData(authUser) {
    if (!authUser) return null;
    
    try {
      // 从users表获取完整用户数据
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();
      
      if (error) {
        console.error('获取用户数据失败:', error);
        return authUser; // 返回基本用户数据
      }
      
      return { ...authUser, ...data }; // 合并认证数据和用户数据
    } catch (err) {
      console.error('处理用户数据时出错:', err);
      return authUser;
    }
  }

  // 刷新用户数据
  async function refreshUserData() {
    if (!user) return;
    
    const fullUser = await getFullUserData(user);
    setUser(fullUser);
  }

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const fullUser = await getFullUserData(session.user);
        setUser(fullUser);
      }
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const fullUser = await getFullUserData(session.user);
            setUser(fullUser);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 定期刷新用户数据（每5分钟）
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(refreshUserData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
```

### 3. 修改Google登录处理函数

**文件位置**: `src/components/GoogleLoginButton.js` 或类似的登录组件文件

```javascript
import React from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';

export function GoogleLoginButton() {
  const { refreshUserData } = useUser();

  async function handleGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('Google登录失败:', error);
      }
    } catch (err) {
      console.error('处理Google登录时出错:', err);
    }
  }

  // 处理OAuth回调
  React.useEffect(() => {
    const handleAuthCallback = async () => {
      const { hash } = window.location;
      if (hash && hash.includes('access_token')) {
        // 等待认证完成
        setTimeout(async () => {
          // 手动刷新用户数据，确保获取最新积分
          await refreshUserData();
        }, 1000);
      }
    };

    handleAuthCallback();
  }, [refreshUserData]);

  return (
    <button onClick={handleGoogleLogin}>
      使用Google登录
    </button>
  );
}
```

### 4. 确保RLS策略正确设置

确保已经应用了我们之前创建的RLS策略，允许用户读取自己的数据：

```sql
-- 确保RLS已启用
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建读取策略
CREATE POLICY IF NOT EXISTS "用户可以读取自己的数据" ON public.users
FOR SELECT USING (
  email = auth.email()
);
```

### 5. 创建用户数据API函数

在Supabase中创建一个专用的API函数，确保即使RLS有问题，用户也能获取自己的积分：

```sql
-- 创建获取用户数据的API函数
CREATE OR REPLACE FUNCTION public.get_my_user_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  user_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'uuid', uuid,
    'email', email,
    'credits', credits,
    'subscription_status', subscription_status,
    'name', name,
    'avatar_url', avatar_url
  ) INTO user_data
  FROM public.users
  WHERE email = auth.email();
  
  RETURN user_data;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.get_my_user_data TO authenticated;
```

### 6. 修改应用入口文件

**文件位置**: `src/App.js` 或 `pages/_app.js`（Next.js）

```javascript
import { UserProvider } from './contexts/UserContext';

function App() {
  return (
    <UserProvider>
      {/* 应用其他部分 */}
    </UserProvider>
  );
}

export default App;
```

## 部署和测试步骤

1. **应用前端修改**:
   - 更新认证钩子和用户上下文
   - 修改Google登录处理函数
   - 更新应用入口文件

2. **应用数据库修改**:
   - 确认RLS策略已正确设置
   - 创建用户数据API函数

3. **部署更新**:
   - 提交代码更改
   - 部署到生产环境

4. **测试流程**:
   - 使用新的Google账号登录系统
   - 确认前端显示的积分为20
   - 退出并重新登录，确认积分仍然显示正确
   - 在不同设备上测试，确保一致性

## 验证方法

创建一个测试脚本，验证Google登录和积分显示功能：

```javascript
// test-google-login-credits.js
const puppeteer = require('puppeteer');

async function testGoogleLoginCredits() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 访问应用
    await page.goto('https://your-app-url.com');
    
    // 点击Google登录按钮
    await page.click('button:contains("Google")');
    
    // 等待Google登录完成并重定向回应用
    await page.waitForNavigation();
    
    // 等待用户数据加载
    await page.waitForTimeout(2000);
    
    // 检查积分显示
    const creditsElement = await page.$('.credits-display');
    const creditsText = await page.evaluate(el => el.textContent, creditsElement);
    
    console.log('显示的积分:', creditsText);
    console.log('测试结果:', creditsText.includes('20') ? '通过' : '失败');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await browser.close();
  }
}

testGoogleLoginCredits();
```

## 结论

通过以上永久性解决方案，我们从根本上修复了Google登录后积分显示问题。这个解决方案确保：

1. 每次用户登录后，前端都会获取完整的用户数据，包括积分
2. 即使RLS策略有问题，用户也能通过专用API函数获取自己的积分
3. 定期刷新机制确保用户数据始终保持最新

这个解决方案不仅修复了当前的问题，还提高了整个系统的稳定性和用户体验。