# PayPal订阅系统生产环境部署指南

## 🎯 生产环境准备

### 1. PayPal生产应用配置

#### 创建生产应用
1. 登录 [PayPal Developer Dashboard](https://developer.paypal.com/)
2. 切换到 "Live" 环境
3. 创建新的应用或升级现有应用
4. 获取生产环境的Client ID和Client Secret

#### 生产环境产品和计划创建
```bash
# 使用生产环境API端点
PAYPAL_API_BASE="https://api-m.paypal.com"

# 重新创建产品和计划（使用生产credentials）
./create_paypal_products.sh
./create_subscription_plans.sh
```

### 2. 环境变量配置

#### 生产环境变量
```bash
# .env.production
PAYPAL_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PRODUCTION_CLIENT_SECRET
PAYPAL_WEBHOOK_ID=YOUR_PRODUCTION_WEBHOOK_ID
PAYPAL_ENVIRONMENT=live

# 数据库配置
DATABASE_URL=your_production_database_url
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_key

# 其他配置
NODE_ENV=production
DOMAIN=https://www.fluxkrea.me
```

#### Vercel环境变量设置
1. 登录Vercel Dashboard
2. 进入项目设置
3. 添加环境变量：
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_WEBHOOK_ID`
   - `PAYPAL_ENVIRONMENT=live`

### 3. 数据库迁移

#### 生产数据库设置
```sql
-- 1. 在生产数据库中执行schema
\i database_schema.sql

-- 2. 验证表结构
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('subscriptions', 'payments', 'subscription_history')
ORDER BY table_name, ordinal_position;

-- 3. 设置生产环境的RLS策略
-- (已包含在schema中)
```

### 4. Webhook配置

#### 生产Webhook设置
1. **PayPal Developer Dashboard配置**
   - URL: `https://www.fluxkrea.me/api/paypal-webhook`
   - 事件类型：
     - `BILLING.SUBSCRIPTION.CREATED`
     - `BILLING.SUBSCRIPTION.ACTIVATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `BILLING.SUBSCRIPTION.SUSPENDED`
     - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
     - `PAYMENT.SALE.COMPLETED`

2. **SSL证书验证**
   ```bash
   # 验证SSL证书有效性
   curl -I https://www.fluxkrea.me/api/paypal-webhook
   ```

### 5. 前端配置更新

#### 更新生产计划ID
```javascript
// pricing.html 中的配置需要更新为生产环境的计划ID
const PAYPAL_PLANS = {
    pro: 'P-PRODUCTION_PRO_PLAN_ID',
    max: 'P-PRODUCTION_MAX_PLAN_ID'
};

const PAYPAL_CLIENT_ID = 'YOUR_PRODUCTION_CLIENT_ID';
```

## 🔒 安全配置

### 1. API安全
```javascript
// api/paypal-webhook.js 安全增强
const crypto = require('crypto');

function verifyWebhookSignature(headers, body, webhookId) {
    const expectedSignature = headers['paypal-transmission-sig'];
    const certId = headers['paypal-cert-id'];
    const timestamp = headers['paypal-transmission-time'];
    
    // 实现PayPal签名验证逻辑
    // 详见PayPal官方文档
}
```

### 2. 环境变量安全
- 使用强密码和复杂的Secret
- 定期轮换API密钥
- 限制API访问权限

### 3. 数据库安全
- 启用SSL连接
- 配置防火墙规则
- 定期备份数据

## 📊 监控和日志

### 1. 应用监控
```javascript
// 添加监控和错误追踪
const Sentry = require('@sentry/node');

Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: 'production'
});
```

### 2. 日志配置
```javascript
// 生产环境日志配置
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

### 3. 性能监控
- 设置数据库查询监控
- 配置API响应时间监控
- 监控Webhook处理性能

## 🧪 生产环境测试

### 1. 小额测试
```bash
# 使用最小金额进行真实测试
# 建议先测试$0.01的订阅
```

### 2. 功能验证清单
- [ ] 真实支付流程正常
- [ ] Webhook正确接收和处理
- [ ] 用户积分正确更新
- [ ] 订阅状态正确管理
- [ ] 取消和暂停功能正常
- [ ] 错误处理机制有效

### 3. 压力测试
- 模拟高并发订阅
- 测试Webhook处理能力
- 验证数据库性能

## 📋 部署检查清单

### 🔧 配置检查
- [ ] 生产PayPal应用已创建
- [ ] 生产环境变量已设置
- [ ] 数据库schema已部署
- [ ] Webhook URL已配置
- [ ] SSL证书有效
- [ ] 域名解析正确

### 🧪 功能检查
- [ ] 订阅页面正常访问
- [ ] PayPal支付流程正常
- [ ] Webhook接收正常
- [ ] 数据库更新正常
- [ ] 用户积分同步正常
- [ ] 错误处理正常

### 📊 监控检查
- [ ] 日志系统正常
- [ ] 错误追踪配置
- [ ] 性能监控启用
- [ ] 备份策略实施

## 🚀 上线流程

### 1. 预发布
1. 在staging环境完整测试
2. 验证所有功能正常
3. 进行安全审查

### 2. 发布
1. 更新生产环境代码
2. 执行数据库迁移
3. 更新环境变量
4. 重启应用服务

### 3. 发布后验证
1. 执行冒烟测试
2. 监控系统指标
3. 检查错误日志
4. 验证关键功能

## 📞 支持和维护

### 1. 监控告警
- 设置关键指标告警
- 配置错误率阈值
- 监控支付成功率

### 2. 定期维护
- 定期检查日志
- 更新依赖包
- 备份数据库
- 审查安全配置

### 3. 故障处理
- 建立故障响应流程
- 准备回滚方案
- 维护联系人列表

记住：生产环境部署需要谨慎，建议先在staging环境完整测试所有功能！