# PayPal 凭证配置指南

本文档提供了如何配置 PayPal 凭证以启用订阅功能的详细说明。

## 前提条件

1. 拥有 PayPal 开发者账户
2. 已创建 PayPal 应用程序并获取凭证
3. 已设置 PayPal 沙盒环境用于测试

## 配置步骤

### 1. 创建环境变量文件

复制示例环境变量文件并创建实际使用的环境变量文件：

```bash
cp .env.example .env
```

### 2. 配置 PayPal 凭证

编辑 `.env` 文件，填入您的 PayPal 客户端 ID 和密钥：

```
# PayPal API
PAYPAL_CLIENT_ID=你的PayPal客户端ID
PAYPAL_CLIENT_SECRET=你的PayPal客户端密钥

# 本地测试模式
LOCAL_TEST=true
```

### 3. 创建 PayPal 订阅计划

在 PayPal 开发者控制台中创建订阅计划：

1. 登录 [PayPal 开发者控制台](https://developer.paypal.com/)
2. 导航至 "测试工具" > "订阅"
3. 点击 "创建计划"
4. 填写计划详情（名称、价格、周期等）
5. 保存计划并记录计划 ID

### 4. 更新计划 ID

编辑 `api/simple-paypal-subscription.js` 文件，更新 `PAYPAL_PLANS` 对象中的计划 ID：

```javascript
// PayPal沙盒计划ID
const PAYPAL_PLANS = {
    pro: '你的Pro计划ID',
    max: '你的Max计划ID'
};
```

## 测试配置

### 本地测试

1. 确保 `LOCAL_TEST=true` 设置在 `.env` 文件中
2. 运行本地测试服务器：

```bash
node local-test-server.js
```

3. 访问 `http://localhost:3000/subscription-debug.html` 进行测试

### 使用诊断工具

您可以使用订阅诊断工具来验证配置是否正确：

```bash
node diagnose-subscription.js
```

## 常见问题

### 无法获取 PayPal 访问令牌

- 检查 PayPal 客户端 ID 和密钥是否正确
- 确认网络连接正常
- 验证 PayPal API 服务是否可用

### 创建订阅失败

- 检查计划 ID 是否正确
- 确认用户信息格式正确
- 查看服务器日志获取详细错误信息

## 生产环境配置

在部署到生产环境前，请确保：

1. 将 `LOCAL_TEST` 设置为 `false`
2. 更新为生产环境的 PayPal 凭证
3. 使用生产环境的计划 ID
4. 设置适当的回调 URL

## 安全注意事项

- 永远不要在前端代码中暴露 PayPal 客户端密钥
- 确保 `.env` 文件已添加到 `.gitignore` 中
- 定期轮换 PayPal 凭证
- 使用环境变量而非硬编码凭证