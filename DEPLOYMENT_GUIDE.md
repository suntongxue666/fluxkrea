# Flux Krea AI 部署指南

## 系统架构

简化版 Flux Krea AI 包含以下核心组件：

1. **前端**: `index.html` - 简洁的单页面应用
2. **后端API**: Vercel Serverless Functions
3. **数据库**: Supabase (PostgreSQL)
4. **认证**: Google Identity Services
5. **AI模型**: HuggingFace FLUX.1-schnell

## 核心功能

### 用户系统
- ✅ Google登录
- ✅ 首次登录获得20积分
- ✅ 用户状态管理

### 积分系统  
- ✅ 积分显示（默认显示20积分）
- ✅ 积分消费（每次生图10积分）
- ✅ 积分不足弹窗提示
- ✅ 生成失败积分退还

### AI图像生成
- ✅ 文本到图像生成
- ✅ 基于FLUX.1-schnell模型
- ✅ 1024x1024高质量输出

## 数据库表结构

### users 表
```sql
- uuid: 用户唯一标识
- google_id: Google用户ID  
- email: 邮箱
- name: 姓名
- avatar_url: 头像URL
- credits: 积分余额
- subscription_status: 订阅状态
- created_at: 创建时间
- updated_at: 更新时间
```

### credit_transactions 表
```sql
- user_uuid: 用户UUID
- transaction_type: 交易类型 (EARN/SPEND)
- amount: 积分数量
- balance_after: 交易后余额
- description: 交易描述
- source: 来源 (first_login_bonus/generation/refund)
- created_at: 创建时间
```

### user_subscriptions 表
```sql
- google_user_email: Google用户邮箱
- paypal_subscription_id: PayPal订阅ID
- plan_type: 订阅计划类型
- status: 订阅状态
- created_at: 创建时间
```

### webhook_events 表
```sql
- event_type: 事件类型
- resource_data: 事件数据
- status: 处理状态
- created_at: 创建时间
```

## API 端点

### 认证相关
- `POST /api/auth/google-login` - Google登录处理

### 用户相关
- `POST /api/user/spend-credits` - 消费积分
- `POST /api/user/refund-credits` - 退还积分

### 图像生成
- `POST /api/generate-image` - 生成AI图像

## 环境变量配置

需要在 Vercel 中设置以下环境变量：

```bash
# HuggingFace API Token
HF_API_TOKEN=hf_your_token_here

# Google OAuth Client ID  
GOOGLE_CLIENT_ID=your_google_client_id

# Supabase配置（已在代码中硬编码）
SUPABASE_URL=https://gdcjvqaqgvcxzufmessy.supabase.co
SUPABASE_ANON_KEY=your_supabase_key
```

## 部署步骤

### 1. 准备工作
- 确保数据库表已清理并只保留4个核心表
- 获取 HuggingFace API Token
- 配置 Google OAuth 客户端ID

### 2. 更新配置
在 `index.html` 中更新 Google Client ID：
```javascript
client_id: 'YOUR_ACTUAL_GOOGLE_CLIENT_ID'
```

### 3. 部署到 Vercel
```bash
# 推送代码到 GitHub
git add .
git commit -m "Deploy simplified Flux Krea AI"
git push

# Vercel 会自动部署
```

### 4. 验证部署
- 访问 `https://www.fluxkrea.me`
- 测试Google登录功能
- 测试积分系统
- 测试图像生成

## 测试流程

### 手动测试
1. 访问网站，应显示20积分
2. 点击"生成图像"，弹出登录弹窗
3. Google登录成功，获得20积分
4. 输入提示词，生成图像，消耗10积分
5. 积分不足时，弹出购买提示

### 自动化测试
```bash
node test-simple-system.js
```

## 故障排除

### 常见问题

1. **Google登录失败**
   - 检查 Google Client ID 配置
   - 确认域名已添加到 Google OAuth 配置

2. **积分系统异常**
   - 检查 Supabase 数据库连接
   - 查看浏览器控制台错误信息

3. **图像生成失败**
   - 检查 HuggingFace API Token
   - 确认模型是否可用（可能需要等待加载）

### 调试工具

浏览器控制台中可用的调试函数：
```javascript
// 查看当前用户状态
console.log('Current user:', currentUser);

// 查看积分余额
console.log('Credits:', userCredits);

// 测试登录弹窗
showModal('loginModal');

// 测试积分不足弹窗  
showModal('creditsModal');
```

## 下一步开发

### 优先级功能
1. **订阅系统** - PayPal 集成
2. **积分套餐** - 不同的积分购买选项
3. **图像历史** - 用户生成历史记录
4. **社交分享** - 图像分享功能

### 性能优化
1. **图像缓存** - CDN 存储生成的图像
2. **API 限流** - 防止滥用
3. **错误监控** - Sentry 集成

## 监控和维护

### 关键指标
- 用户注册数量
- 积分消费情况  
- 图像生成成功率
- API 响应时间

### 日志监控
- Vercel Functions 日志
- Supabase 数据库日志
- 前端错误日志

---

**部署完成后，系统将提供完整的Google登录、积分管理和AI图像生成功能！** 🎉