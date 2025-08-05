# PayPal产品创建指南

## 🚀 快速开始

### 方法1: 使用Shell脚本（推荐）

1. **设置访问令牌**：
```bash
# 获取访问令牌
export ACCESS_TOKEN=$(curl -s POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" \
  -d "grant_type=client_credentials" | jq -r '.access_token')

echo $ACCESS_TOKEN
```

2. **运行创建脚本**：
```bash
chmod +x create_paypal_products.sh
./create_paypal_products.sh
```

### 方法2: 使用Node.js脚本

1. **配置credentials**：
   - 编辑 `create_products_simple.js`
   - 替换 `YOUR_CLIENT_ID` 和 `YOUR_CLIENT_SECRET`

2. **运行脚本**：
```bash
node create_products_simple.js
```

### 方法3: 手动执行curl命令

参考 `paypal_create_commands.md` 文件中的命令

## 📋 产品配置详情

### Pro Plan
- **名称**: Pro Plan
- **描述**: 1000 credits per month for creating AI images service
- **类型**: SERVICE
- **分类**: SOFTWARE
- **价格**: $9.99/月（后续创建计划时设置）

### Max Plan
- **名称**: Max Plan
- **描述**: 5000 credits per month for creating AI images service
- **类型**: SERVICE
- **分类**: SOFTWARE
- **价格**: $29.99/月（后续创建计划时设置）

## 🔧 关于URL配置

### image_url (产品图标)
当前使用占位符图片，您可以替换为：
- 您的品牌图标
- 产品特定的图标
- 建议尺寸：200x200px

### home_url (主页链接)
- 指向您的网站主页
- 用户点击产品时会跳转到此URL
- 当前设置为：`https://flux-krea-ai.com`

## ✅ 创建成功后

1. **保存产品ID**：创建成功后会返回产品ID，格式如：`PROD-XXXXXXXXXXXX`
2. **更新代码**：将产品ID更新到您的前端代码中
3. **创建订阅计划**：使用产品ID创建具体的订阅计划
4. **测试集成**：在沙盒环境中测试完整流程

## 🔍 故障排除

### 常见错误

1. **401 Unauthorized**
   - 检查Client ID和Client Secret是否正确
   - 确认访问令牌是否有效

2. **400 Bad Request**
   - 检查JSON格式是否正确
   - 确认必填字段都已提供

3. **403 Forbidden**
   - 确认PayPal账户权限
   - 检查API访问权限设置

### 验证创建结果

```bash
# 查看创建的产品
curl -X GET https://api-m.sandbox.paypal.com/v1/catalogs/products/PRODUCT_ID \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误信息的完整输出
2. 使用的PayPal环境（沙盒/生产）
3. 产品配置信息

我会帮您解决具体问题！