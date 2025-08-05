# PayPal订阅系统完整指南

## 🎯 系统概述

这是一个完整的PayPal订阅系统，支持用户订阅Pro Plan和Max Plan，自动处理支付、积分发放和订阅管理。

### 核心功能
- 💳 PayPal订阅支付集成
- 🔄 自动积分发放和管理
- 📊 订阅状态跟踪
- 🔗 Webhook事件处理
- 📱 响应式订阅界面
- 🛡️ 安全的支付处理

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │   PayPal API    │    │   数据库        │
│  pricing.html   │◄──►│   订阅处理      │◄──►│   Supabase      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   成功页面      │    │   Webhook       │    │   用户积分      │
│subscription-    │    │   处理器        │    │   管理系统      │
│success.html     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 1. 一键设置
```bash
# 给脚本执行权限
chmod +x quick_start.sh

# 运行完整设置
./quick_start.sh setup
```

### 2. 手动设置
```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 运行测试
node test_paypal_integration.js

# 4. 检查配置
./quick_start.sh check
```

## 📋 配置信息

### PayPal配置
| 项目 | 沙盒环境 | 生产环境 |
|------|----------|----------|
| **产品** | | |
| Pro Plan | `PROD-7522488360648323A` | 待创建 |
| Max Plan | `PROD-26M203332H396061W` | 待创建 |
| **订阅计划** | | |
| Pro Plan | `P-5S785818YS7424947NCJBKQA` | 待创建 |
| Max Plan | `P-3NJ78684DS796242VNCJBKQQ` | 待创建 |
| **价格** | | |
| Pro Plan | $9.99/月 (1000积分) | $9.99/月 |
| Max Plan | $29.99/月 (5000积分) | $29.99/月 |

### 环境变量
```bash
# PayPal配置
PAYPAL_CLIENT_ID=AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8
PAYPAL_CLIENT_SECRET=ENlcBlade--RMAM6EWnp16tTsPaw_nDogYdriNgIfI4KSng-kY2YhqO7job-WRa6tDctYFGXAf9MWLzC
PAYPAL_WEBHOOK_ID=YOUR_WEBHOOK_ID
PAYPAL_ENVIRONMENT=sandbox

# 数据库配置
SUPABASE_URL=https://gdcjvqaqgvcxzufmessy.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🗂️ 文件结构

```
├── 📄 核心文件
│   ├── pricing.html                    # 订阅页面
│   ├── subscription-success.html       # 订阅成功页面
│   └── api/paypal-webhook.js           # Webhook处理器
│
├── 🛠️ 配置工具
│   ├── create_paypal_products.sh       # 创建PayPal产品
│   ├── create_subscription_plans.sh    # 创建订阅计划
│   └── quick_start.sh                  # 快速启动脚本
│
├── 🗄️ 数据库
│   ├── database_schema.sql             # 数据库表结构
│   └── init_database.js                # 数据库初始化脚本
│
├── 🧪 测试工具
│   ├── test_paypal_integration.js      # 集成测试脚本
│   └── test_subscription_flow.md       # 测试流程指南
│
├── 📚 文档
│   ├── PAYPAL_COMPLETE_CONFIG.md       # 完整配置文档
│   ├── deployment_checklist.md         # 部署检查清单
│   ├── production_deployment.md        # 生产环境部署
│   └── PAYPAL_README.md                # 本文档
│
└── 📊 配置文件
    ├── paypal_product_ids.json         # PayPal产品ID
    ├── paypal_subscription_plans.json  # 订阅计划配置
    └── test_report.json                # 测试报告
```

## 🔧 主要功能

### 1. 订阅页面 (pricing.html)
- 响应式设计，支持移动端
- PayPal SDK集成
- 实时计划选择
- 安全的支付处理

### 2. Webhook处理 (api/paypal-webhook.js)
- 订阅事件处理
- 签名验证
- 数据库更新
- 积分发放

### 3. 数据库管理
- 订阅记录管理
- 支付历史跟踪
- 用户积分系统
- 状态变更历史

## 🧪 测试指南

### 自动化测试
```bash
# 运行完整集成测试
node test_paypal_integration.js

# 查看测试报告
cat test_report.json
```

### 手动测试流程
1. 访问 https://fluxkrea.me/pricing.html
2. 选择订阅计划
3. 使用PayPal沙盒账户支付
4. 验证跳转到成功页面
5. 检查数据库记录更新
6. 确认用户积分增加

### 测试账户信息
```
PayPal沙盒买家账户: 需要在PayPal Developer Dashboard创建
测试信用卡: 4111111111111111 (Visa)
过期日期: 任意未来日期
CVV: 123
```

## 🚀 部署流程

### 1. 开发环境测试
```bash
# 完整测试流程
./quick_start.sh setup
```

### 2. 生产环境部署
```bash
# 1. 创建生产环境PayPal应用
# 2. 更新环境变量
# 3. 执行数据库迁移
# 4. 部署代码
# 5. 配置Webhook
```

详细步骤请参考 `production_deployment.md`

## 📊 监控和维护

### 关键指标
- 订阅转化率
- 支付成功率
- Webhook处理成功率
- 系统可用性

### 日志监控
- 支付事件日志
- Webhook处理日志
- 错误和异常日志
- 性能指标日志

## 🔒 安全考虑

### API安全
- PayPal Webhook签名验证
- HTTPS强制加密
- 环境变量保护
- 输入数据验证

### 数据安全
- 数据库RLS策略
- 敏感信息加密
- 访问权限控制
- 定期安全审计

## 🆘 故障排除

### 常见问题

#### 1. PayPal按钮不显示
```javascript
// 检查Client ID配置
console.log('PayPal Client ID:', PAYPAL_CLIENT_ID);

// 检查网络连接
curl -I https://www.paypal.com/sdk/js
```

#### 2. Webhook未接收
```bash
# 检查Webhook URL
curl -I https://fluxkrea.me/api/paypal-webhook

# 检查PayPal Dashboard配置
# 验证事件类型设置
```

#### 3. 数据库连接失败
```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('subscriptions', 'payments');

-- 检查RLS策略
SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
```

### 调试工具
```bash
# 查看详细日志
tail -f /var/log/paypal-webhook.log

# 运行诊断测试
node test_paypal_integration.js

# 检查系统状态
./quick_start.sh check
```

## 📞 支持联系

### 技术支持
- 开发文档: 查看 `docs/` 目录
- 测试工具: 运行 `test_paypal_integration.js`
- 配置检查: 运行 `./quick_start.sh check`

### PayPal支持
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Sandbox Testing](https://developer.paypal.com/developer/accounts/)
- [PayPal Webhook Guide](https://developer.paypal.com/docs/api/webhooks/)

## 🔄 版本更新

### 当前版本: v1.0.0
- ✅ 基础订阅功能
- ✅ PayPal集成
- ✅ Webhook处理
- ✅ 数据库管理
- ✅ 测试工具

### 计划更新
- 🔄 多币种支持
- 🔄 年付折扣
- 🔄 企业计划
- 🔄 高级分析

---

## 🎉 开始使用

现在您可以开始使用PayPal订阅系统了！

```bash
# 快速开始
./quick_start.sh

# 或者访问订阅页面
open https://fluxkrea.me/pricing.html
```

如有任何问题，请参考相关文档或运行诊断工具。祝您使用愉快！ 🚀