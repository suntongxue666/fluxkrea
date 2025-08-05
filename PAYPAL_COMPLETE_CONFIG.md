# PayPal订阅系统完整配置

## 🎯 创建完成的资源

### 📦 产品 (Products)
| 计划 | 产品ID | 名称 | 描述 |
|------|--------|------|------|
| Pro Plan | `PROD-7522488360648323A` | Pro Plan | 1000 credits per month and creating AI images service. |
| Max Plan | `PROD-26M203332H396061W` | Max Plan | 5000 credits per month and creating AI images service. |

### 💰 订阅计划 (Subscription Plans)
| 计划 | 计划ID | 价格 | 积分 | 状态 |
|------|--------|------|------|------|
| Pro Plan | `P-5S785818YS7424947NCJBKQA` | $9.99/月 | 1000积分 | ACTIVE |
| Max Plan | `P-3NJ78684DS796242VNCJBKQQ` | $29.99/月 | 5000积分 | ACTIVE |

## 🔧 前端配置

### pricing.html 中的配置
```javascript
const PAYPAL_PLANS = {
    pro: 'P-5S785818YS7424947NCJBKQA', // Pro Plan ID
    max: 'P-3NJ78684DS796242VNCJBKQQ'  // Max Plan ID
};
```

### PayPal SDK配置
```javascript
const PAYPAL_CLIENT_ID = 'AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8';
```

## 🔗 API端点

### 沙盒环境
- **Base URL**: `https://api-m.sandbox.paypal.com`
- **产品管理**: `/v1/catalogs/products`
- **订阅计划**: `/v1/billing/plans`
- **订阅管理**: `/v1/billing/subscriptions`

### 生产环境（待配置）
- **Base URL**: `https://api-m.paypal.com`

## 📋 Webhook配置

### 需要监听的事件
- `BILLING.SUBSCRIPTION.CREATED`
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- `PAYMENT.SALE.COMPLETED`

### Webhook URL
- **开发环境**: `https://your-domain.com/api/paypal-webhook`
- **生产环境**: `https://www.fluxkrea.me/api/paypal-webhook`

## 🧪 测试流程

### 1. 沙盒测试账户
- 需要创建PayPal沙盒买家账户
- 使用测试信用卡信息

### 2. 测试步骤
1. 访问 `pricing.html`
2. 选择订阅计划
3. 完成PayPal支付流程
4. 验证Webhook接收
5. 检查用户积分更新

## 🔒 安全配置

### 环境变量
```bash
PAYPAL_CLIENT_ID=AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8
PAYPAL_CLIENT_SECRET=ENlcBlade--RMAM6EWnp16tTsPaw_nDogYdriNgIfI4KSng-kY2YhqO7job-WRa6tDctYFGXAf9MWLzC
PAYPAL_WEBHOOK_ID=YOUR_WEBHOOK_ID
```

### Webhook签名验证
- 使用PayPal提供的Webhook ID验证请求真实性
- 验证请求头中的签名信息

## 📊 数据库设计

### 订阅表 (subscriptions)
```sql
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    paypal_subscription_id VARCHAR(50) UNIQUE,
    plan_id VARCHAR(50),
    status VARCHAR(20),
    credits_per_month INTEGER,
    price DECIMAL(10,2),
    currency VARCHAR(3),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 支付记录表 (payments)
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(id),
    paypal_payment_id VARCHAR(50),
    amount DECIMAL(10,2),
    currency VARCHAR(3),
    status VARCHAR(20),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 部署清单

### ✅ 已完成
- [x] PayPal产品创建
- [x] 订阅计划创建
- [x] 前端计划ID配置
- [x] 基础Webhook处理器

### 📋 待完成
- [ ] Webhook URL配置
- [ ] 数据库表创建
- [ ] 用户积分同步逻辑
- [ ] 订阅状态管理
- [ ] 生产环境配置
- [ ] 完整测试流程

## 📞 支持信息

如果遇到问题，请检查：
1. PayPal Developer Dashboard中的应用配置
2. Webhook事件接收状态
3. 数据库连接和表结构
4. 环境变量配置

所有配置信息已保存在相应的JSON文件中，可以随时查阅和更新。