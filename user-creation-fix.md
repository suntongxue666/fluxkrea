# 用户创建问题修复指南

## 问题描述

当前系统存在以下问题：
1. 用户登录后数据库对应的表未增加任何数据
2. Google登录后不应再赠送20积分，但仍然自动赠送
3. 登录后pricing.html页面右上角有不希望使用的积分体系相关UI

## 已完成的修复

1. 已修改 `krea_professional.html` 中的 `default_credits` 值从20改为0，解决了Google登录后自动赠送积分的问题
2. 已确认 `vercel.json` 中已配置将根路径重定向到 `krea_professional.html`
3. 已修改 `public/js/modules/unified-state-sync.js` 文件，禁用了积分更新相关功能
4. 已创建新的 `pricing.html` 文件，移除了积分体系相关UI

## 用户创建问题的解决方案

我们已创建了一个原子化的用户创建函数，位于 `supabase/migrations/20250102200000_atomic_get_or_create_user.sql`。这个函数解决了用户创建延迟和数据库表未增加数据的问题。由于数据库中可能存在同名函数，我们使用了更明确的函数名称 `atomic_get_or_create_user` 以避免冲突。

### 如何修改 krea_professional.html 中的用户创建代码

在 `krea_professional.html` 文件中，需要修改 `UserManager` 类的 `handleAuthenticatedUser` 和 `createUserRecord` 方法，使其使用新的原子化用户创建函数。

#### 修改 handleAuthenticatedUser 方法

```javascript
async handleAuthenticatedUser(authUser) {
    console.log('🔐 开始处理Google登录用户:', {
        id: authUser.id,
        email: authUser.email
    });

    try {
        // 获取用户元数据
        const metadata = authUser.user_metadata || {};
        const name = metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'User';
        const avatarUrl = metadata.avatar_url || '';

        // 使用原子化函数获取或创建用户
        const { data, error } = await supabaseClient.rpc(
            'rpc_get_or_create_user',
            {
                p_google_id: authUser.id,
                p_email: authUser.email,
                p_name: name,
                p_avatar_url: avatarUrl,
                p_initial_credits: systemSettings.default_credits || 0
            }
        );

        if (error) {
            console.error('❌ 获取或创建用户失败:', error);
            throw error;
        }

        console.log('✅ 用户记录处理成功:', data);

        // 更新当前用户
        this.currentUser = data;
        
        // 返回用户数据
        return data;
    } catch (error) {
        console.error('❌ 处理Google登录用户失败:', error);
        throw error;
    }
}
```

#### 修改 createUserRecord 方法

```javascript
async createUserRecord(authUser, existingUuid = null) {
    console.log('🆕 开始创建用户记录:', { authUser, existingUuid });
    
    try {
        // 获取用户元数据
        const metadata = authUser.user_metadata || {};
        const name = metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'User';
        const avatarUrl = metadata.avatar_url || '';

        // 使用原子化函数获取或创建用户
        const { data, error } = await supabaseClient.rpc(
            'rpc_get_or_create_user',
            {
                p_google_id: authUser.id,
                p_email: authUser.email,
                p_name: name,
                p_avatar_url: avatarUrl,
                p_initial_credits: systemSettings.default_credits || 0
            }
        );

        if (error) {
            console.error('❌ 创建用户记录失败:', error);
            throw error;
        }

        console.log('✅ 用户记录创建成功:', data);
        return data;
    } catch (error) {
        console.error('❌ 创建用户记录失败:', error);
        throw error;
    }
}
```

> **注意**：我们修改了SQL函数的名称，但RPC端点的名称仍然保持为 `rpc_get_or_create_user`，因此前端代码不需要更改。

### 如何在Supabase中应用SQL迁移

1. 登录Supabase管理控制台
2. 进入SQL编辑器
3. 打开 `supabase/migrations/20250102200000_atomic_get_or_create_user.sql` 文件
4. 复制其内容并在SQL编辑器中执行
5. 验证函数是否创建成功

### 测试用户创建功能

1. 清除浏览器缓存和本地存储
2. 访问网站并使用Google登录
3. 检查浏览器控制台，确认用户创建成功
4. 在Supabase管理控制台中查询users表，确认用户记录已创建

## 其他注意事项

1. 确保Supabase客户端配置正确
2. 确保RLS策略允许用户创建和更新操作
3. 如果问题仍然存在，检查Supabase日志以获取更多信息