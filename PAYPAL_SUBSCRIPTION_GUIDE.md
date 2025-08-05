# PayPal 订阅集成完整指南

## 🎯 概述
根据 PayPal 官方文档，我们已经为您的 Flux Krea AI 项目完成了完整的订阅系统集成。本指南将帮助您完成 PayPal 订阅产品和计划的创建配置。

## 📋 已完成的功能

### 1. 前端订阅集成 ✅
- ✅ 专业的订阅弹窗界面 (`pricing.html`)
- ✅ PayPal SDK 集成 (Client ID: `AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQ Sy78Uh3ekjxx14wZEsX-8`)
- ✅ 计划选择和支付流程
- ✅ 加载状态、错误处理和成功提示
- ✅ 响应式设计，移动端友好

### 2. 后端API集成 ✅
- ✅ Flask 订阅管理 API (`web_app.py`)
- ✅ 用户订阅状态跟踪
- ✅ 积分管理系统
- ✅ 订阅数据持久化

### 3. Webhook 处理器 ✅
- ✅ 完整的 PayPal webhook 处理器 (`/api/paypal-webhook.js`)
- ✅ Webhook 签名验证
- ✅ 所有重要事件处理：
  - 订阅创建/激活/取消
  - 支付完成/失败
  - 订单创建/取消
  - 退款/撤销处理

### 4. 用户界面 ✅
- ✅ 订阅成功页面 (`subscription-success.html`)
- ✅ 订阅状态显示
- ✅ 用户权益说明

## 🔧 需要配置的 PayPal 设置

### 步骤 1: 创建 PayPal 订阅产品 (Products)

1. **登录 PayPal Developer Dashboard**
   - 访问: https://developer.paypal.com/
   - 使用您的 PayPal 商家账户登录

2. **创建应用程序**
   - 选择 "Create App"
   - 应用名称: "Flux Krea AI Subscriptions"
   - 选择环境: Sandbox (测试) 或 Live (生产)

3. **创建订阅产品**
   
   **Pro 计划产品：**
   ```bash
   curl -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products \\
     -H "Content-Type: application/json" \\
     -H "Authorization: Bearer ACCESS_TOKEN" \\
     -d '{
       "name": "Flux Krea AI Pro Plan",
       "description": "Professional AI image generation with 1000 monthly credits",
       "type": "SERVICE",
       "category": "SOFTWARE",
       "home_url": "https://your-domain.com"
     }'
   ```

   **Max 计划产品：**
   ```bash
   curl -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products \\
     -H "Content-Type: application/json" \\
     -H "Authorization: Bearer ACCESS_TOKEN" \\
     -d '{
       "name": "Flux Krea AI Max Plan",
       "description": "Premium AI image generation with 5000 monthly credits",
       "type": "SERVICE",
       "category": "SOFTWARE",
       "home_url": "https://your-domain.com"
     }'
   ```

### 步骤 2: 创建订阅计划 (Plans)

**Pro 计划：**
```bash
curl -X POST https://api-m.sandbox.paypal.com/v1/billing/plans \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ACCESS_TOKEN" \\
  -d '{
    "product_id": "PROD-XXXXXXXXXXXX",
    "name": "Flux Krea AI Pro Monthly",
    "description": "Monthly subscription for Pro plan",
    "status": "ACTIVE",
    "billing_cycles": [
      {
        "frequency": {
          "interval_unit": "MONTH",
          "interval_count": 1
        },
        "tenure_type": "REGULAR",
        "sequence": 1,
        "total_cycles": 0,
        "pricing_scheme": {
          "fixed_price": {
            "value": "9.90",
            "currency_code": "USD"
          }
        }
      }
    ],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "setup_fee": {
        "value": "0",
        "currency_code": "USD"
      },
      "setup_fee_failure_action": "CONTINUE",
      "payment_failure_threshold": 3
    }
  }'
```

**Max 计划：**
```bash
curl -X POST https://api-m.sandbox.paypal.com/v1/billing/plans \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ACCESS_TOKEN" \\
  -d '{
    "product_id": "PROD-YYYYYYYYYYYY",
    "name": "Flux Krea AI Max Monthly",
    "description": "Monthly subscription for Max plan",
    "status": "ACTIVE",
    "billing_cycles": [
      {
        "frequency": {
          "interval_unit": "MONTH",
          "interval_count": 1
        },
        "tenure_type": "REGULAR", 
        "sequence": 1,
        "total_cycles": 0,
        "pricing_scheme": {
          "fixed_price": {
            "value": "29.90",
            "currency_code": "USD"
          }
        }
      }
    ],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "setup_fee": {
        "value": "0",
        "currency_code": "USD"
      },
      "setup_fee_failure_action": "CONTINUE",
      "payment_failure_threshold": 3
    }
  }'
```

### 步骤 3: 配置 Webhook

1. **在 PayPal Dashboard 中创建 Webhook**
   - URL: `https://your-domain.com/api/paypal-webhook`
   - 选择所有订阅相关事件

2. **获取 Webhook ID**
   - 复制生成的 Webhook ID

### 步骤 4: 更新代码中的配置

**更新 `pricing.html` 中的计划 ID：**
```javascript
const PAYPAL_PLANS = {
    pro: 'P-YOUR_ACTUAL_PRO_PLAN_ID',
    max: 'P-YOUR_ACTUAL_MAX_PLAN_ID'
};
```

**设置环境变量：**
```bash
# .env 文件
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret  
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_ENVIRONMENT=sandbox  # 或 live
```

## 🧪 测试流程

### 1. 沙盒测试
- 使用 PayPal 沙盒账户测试完整流程
- 验证订阅创建、支付和 webhook 事件

### 2. 生产部署检查清单
- [ ] 更新为生产环境的 Client ID
- [ ] 配置生产环境的 Webhook URL
- [ ] 更新所有计划 ID 为生产环境 ID
- [ ] 测试真实支付流程

## 📊 数据库集成建议

为了完整的生产环境，建议添加以下数据库表：

```sql
-- 用户表
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订阅表
CREATE TABLE subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id),
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    paypal_subscription_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户积分表
CREATE TABLE user_credits (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id),
    credits_remaining INTEGER DEFAULT 0,
    credits_total INTEGER DEFAULT 0,
    last_reset TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 支付记录表
CREATE TABLE payments (
    id VARCHAR(255) PRIMARY KEY,
    subscription_id VARCHAR(255) REFERENCES subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    paypal_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 安全最佳实践

1. **验证 Webhook 签名**
   - 已在代码中实现签名验证

2. **环境变量管理**
   - 所有敏感信息存储在环境变量中

3. **错误处理**
   - 完整的错误处理和日志记录

4. **用户验证**
   - 订阅前验证用户身份

## 🚀 部署建议

1. **Vercel 部署配置** (已包含 `vercel.json`)
2. **环境变量设置**
3. **数据库连接** (建议使用 Supabase 或 PostgreSQL)
4. **监控和日志** (建议使用 Sentry 或类似服务)

---

## ✅ 总结

您的 PayPal 订阅系统已经完整实现：

- ✅ 前端用户界面和交互
- ✅ 后端 API 和数据管理  
- ✅ Webhook 事件处理
- ✅ 订阅成功页面
- ✅ 错误处理和用户体验

只需要按照上述步骤配置 PayPal 产品和计划 ID，系统即可投入使用！