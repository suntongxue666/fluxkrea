# PayPal Webhook事件处理流程

## 🔄 完整的订阅生命周期

### 1. 正常订阅流程

```
用户点击订阅 → BILLING.SUBSCRIPTION.CREATED → PAYMENT.ORDER.CREATED → PAYMENT.SALE.COMPLETED → BILLING.SUBSCRIPTION.ACTIVATED
```

| 事件 | 状态 | 操作 | 积分发放 |
|------|------|------|----------|
| `BILLING.SUBSCRIPTION.CREATED` | PENDING | 保存订阅记录 | ❌ 不发放 |
| `PAYMENT.ORDER.CREATED` | PENDING | 记录支付订单 | ❌ 不发放 |
| `PAYMENT.SALE.COMPLETED` | PENDING | 记录支付完成 | ❌ 不发放 |
| `BILLING.SUBSCRIPTION.ACTIVATED` | ACTIVE | **发放积分** | ✅ 发放积分 |

### 2. 订阅取消流程

```
用户取消订阅 → BILLING.SUBSCRIPTION.CANCELLED
```

| 事件 | 状态 | 操作 |
|------|------|------|
| `BILLING.SUBSCRIPTION.CANCELLED` | CANCELLED | 更新订阅状态，保留当前积分 |

### 3. 支付问题处理

#### 退款流程
```
管理员处理退款 → PAYMENT.SALE.REFUND
```

| 事件 | 状态 | 操作 |
|------|------|------|
| `PAYMENT.SALE.REFUND` | REFUNDED | 扣除对应积分，更新订阅状态 |

#### 撤销流程
```
银行/PayPal撤销支付 → PAYMENT.SALE.REVERSED
```

| 事件 | 状态 | 操作 |
|------|------|------|
| `PAYMENT.SALE.REVERSED` | REVERSED | 扣除对应积分，更新订阅状态 |

## 📊 数据库状态变化

### 订阅表 (subscriptions)
- `PENDING` → `ACTIVE` → `CANCELLED/REFUNDED/REVERSED`

### 用户表 (users)
- `subscription_status`: `FREE` → `ACTIVE` → `CANCELLED/REFUNDED/REVERSED`
- `credits`: 根据事件增加或扣除

### 积分交易表 (credit_transactions)
- `SUBSCRIPTION_PURCHASE`: 订阅激活时增加积分
- `REFUND`: 退款时扣除积分
- `REVERSAL`: 撤销时扣除积分

## 🔧 事件处理器功能

### handleSubscriptionCreated()
- ✅ 保存订阅记录（状态：PENDING）
- ❌ 不发放积分
- 📝 等待激活事件

### handleSubscriptionActivated()
- ✅ 更新订阅状态为ACTIVE
- ✅ 发放对应积分
- ✅ 更新用户订阅状态
- ✅ 记录积分交易

### handlePaymentSaleCompleted()
- ✅ 记录支付完成
- ❌ 不发放积分（等待订阅激活）

### handleSubscriptionCancelled()
- ✅ 更新订阅状态为CANCELLED
- ✅ 更新用户订阅状态
- ❌ 不扣除积分（用户保留当前积分）

### handlePaymentSaleRefund()
- ✅ 记录退款
- ✅ 扣除对应积分
- ✅ 更新订阅状态为REFUNDED
- ✅ 记录积分扣除交易

### handlePaymentSaleReversed()
- ✅ 记录撤销
- ✅ 扣除对应积分
- ✅ 更新订阅状态为REVERSED
- ✅ 记录积分扣除交易

## 🚨 重要原则

1. **只在ACTIVATED时发放积分** - 确保支付真正完成
2. **退款/撤销时扣除积分** - 保护业务利益
3. **积分不能为负数** - 用户积分最低为0
4. **记录所有交易** - 便于审计和客服
5. **状态严格管理** - 每个状态都有明确含义

## 📝 配置Webhook

在PayPal开发者控制台配置以下事件：

```
✅ BILLING.SUBSCRIPTION.CREATED
✅ BILLING.SUBSCRIPTION.ACTIVATED  
✅ BILLING.SUBSCRIPTION.CANCELLED
✅ PAYMENT.ORDER.CREATED
✅ PAYMENT.ORDER.CANCELLED
✅ PAYMENT.SALE.COMPLETED
✅ PAYMENT.SALE.REFUND
✅ PAYMENT.SALE.REVERSED
```

Webhook URL: `https://your-domain.com/api/paypal-webhook`

## 🧪 测试场景

1. **正常订阅** - 验证积分正确发放
2. **订阅取消** - 验证状态更新，积分保留
3. **支付退款** - 验证积分正确扣除
4. **支付撤销** - 验证积分正确扣除
5. **重复事件** - 验证幂等性处理