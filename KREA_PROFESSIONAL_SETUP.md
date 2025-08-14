# Krea Professional 设置指南

## 概述

`krea_professional.html` 是一个完整的AI图像生成应用，包含：
- ✅ Google OAuth 登录
- ✅ 积分管理系统
- ✅ 用户管理
- ✅ 订阅系统
- ✅ PayPal 集成
- ✅ AI图像生成

## 当前状态

前端代码已完整，直接使用 Supabase 进行：
- 数据库操作
- 用户认证 (Google OAuth)
- 实时数据同步

## 设置步骤

### 1. 数据库设置

在 Supabase SQL Editor 中执行 `supabase-setup.sql`：

```sql
-- 这将创建：
-- ✅ 必要的数据库函数
-- ✅ RLS (Row Level Security) 策略  
-- ✅ 用户上下文管理
-- ✅ 积分交易记录函数
-- ✅ 订阅状态管理函数
```

### 2. Google OAuth 配置

在 Supabase Dashboard > Authentication > Providers：

1. **启用 Google Provider**
2. **设置 Client ID 和 Client Secret**
3. **添加重定向URL**：
   - `https://www.fluxkrea.me`
   - `https://gdcjvqaqgvcxzufmessy.supabase.co/auth/v1/callback`

### 3. 验证配置

运行测试脚本：
```bash
node test-krea-professional.js
```

这将测试：
- ✅ 数据库函数
- ✅ 用户管理
- ✅ 积分系统
- ✅ 订阅功能
- ✅ Webhook 处理

## 核心功能流程

### 用户登录流程
1. **匿名访问** → 显示默认20积分
2. **点击生成** → 提示Google登录
3. **Google登录** → 创建用户记录，获得真实20积分
4. **登录成功** → 显示用户信息和真实积分

### 积分系统流程
1. **首次登录** → 自动获得20积分
2. **生成图像** → 消耗10积分
3. **积分不足** → 弹窗提示购买订阅
4. **生成失败** → 自动退还积分

### 订阅系统流程
1. **选择订阅** → 跳转PayPal支付
2. **支付成功** → PayPal webhook通知
3. **激活订阅** → 更新用户状态，增加积分
4. **订阅管理** → 查看订阅状态，取消订阅

## 前端核心组件

### UserManager 类
```javascript
// 负责用户认证和管理
- initialize() // 初始化用户状态
- handleAuthenticatedUser() // 处理已登录用户
- handleAnonymousUser() // 处理匿名用户
- signInWithGoogle() // Google登录
- signOut() // 退出登录
```

### CreditsManager 类
```javascript
// 负责积分管理
- initialize() // 初始化积分状态
- hasEnoughCredits() // 检查积分是否足够
- deductCredits() // 扣除积分
- addCredits() // 增加积分
- updateCreditsDisplay() // 更新积分显示
```

## 数据库表结构

### users 表
- `uuid` - 用户唯一标识
- `google_id` - Google用户ID
- `email` - 邮箱
- `credits` - 积分余额
- `subscription_status` - 订阅状态

### credit_transactions 表
- `user_uuid` - 用户UUID
- `transaction_type` - 交易类型 (EARN/SPEND)
- `amount` - 积分数量
- `source` - 来源 (first_login_bonus/generation/subscription)

### user_subscriptions 表
- `google_user_email` - 用户邮箱
- `paypal_subscription_id` - PayPal订阅ID
- `plan_type` - 订阅类型 (BASIC/PREMIUM)
- `status` - 订阅状态

### webhook_events 表
- `event_type` - 事件类型
- `resource_data` - 事件数据
- `status` - 处理状态

## 环境变量

前端已硬编码 Supabase 配置：
```javascript
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

## 调试工具

浏览器控制台中可用：
```javascript
// 查看当前用户
console.log(currentUser);

// 查看积分管理器
console.log(creditsManager);

// 重新初始化用户
debugFunctions.reinitializeUser();

// 设置积分为0（测试用）
debugFunctions.setCreditsToZero();
```

## 部署验证

访问 `https://www.fluxkrea.me` 应该看到：

1. **页面加载** ✅
2. **显示20积分** ✅
3. **Google登录按钮** ✅
4. **生成图像功能** ✅
5. **积分不足弹窗** ✅
6. **订阅跳转** ✅

## 故障排除

### 常见问题

1. **Google登录失败**
   - 检查 Supabase Google OAuth 配置
   - 确认域名白名单设置

2. **积分系统异常**
   - 检查数据库函数是否创建成功
   - 查看 RLS 策略是否正确

3. **数据库连接失败**
   - 验证 Supabase URL 和 Key
   - 检查网络连接

### 调试步骤

1. **打开浏览器开发者工具**
2. **查看 Console 错误信息**
3. **检查 Network 请求状态**
4. **验证 Supabase 连接**

---

**完成以上设置后，krea_professional.html 将拥有完整的用户管理、积分系统和订阅功能！** 🎉