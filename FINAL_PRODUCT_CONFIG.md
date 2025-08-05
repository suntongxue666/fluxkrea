# PayPal产品配置总结

## 📦 Pro Plan 配置
```json
{
  "name": "Pro Plan",
  "description": "1000 credits per month and creating AI images service.",
  "type": "SERVICE",
  "category": "SOFTWARE",
  "image_url": "https://ciwjjfcuhubjydajazkk.supabase.co/storage/v1/object/public/webstie-icon//FluxKrea%20log-120.png",
  "home_url": "https://www.fluxkrea.me/"
}
```

## 📦 Max Plan 配置
```json
{
  "name": "Max Plan",
  "description": "5000 credits per month and creating AI images service.",
  "type": "SERVICE",
  "category": "SOFTWARE",
  "image_url": "https://ciwjjfcuhubjydajazkk.supabase.co/storage/v1/object/public/webstie-icon//FluxKrea%20log-120.png",
  "home_url": "https://www.fluxkrea.me/"
}
```

## 🚀 创建方法

### 方法1: 使用Shell脚本（推荐）
```bash
# 1. 设置访问令牌
export ACCESS_TOKEN="your_access_token_here"

# 2. 运行脚本
chmod +x create_paypal_products.sh
./create_paypal_products.sh
```

### 方法2: 使用Node.js脚本
```bash
# 1. 编辑create_products_simple.js，设置CLIENT_ID和CLIENT_SECRET
# 2. 运行脚本
node create_products_simple.js
```

### 方法3: 手动curl命令
参考 `paypal_create_commands.md` 中的具体命令

## ✅ 预期结果

创建成功后，您将获得两个产品ID：
- Pro Plan: `PROD-XXXXXXXXXXXX`
- Max Plan: `PROD-YYYYYYYYYYYY`

## 📋 下一步

1. **保存产品ID** - 创建订阅计划时需要
2. **创建订阅计划** - 设置具体的价格和计费周期
3. **集成到前端** - 更新代码中的产品ID
4. **测试流程** - 在沙盒环境中完整测试

## 🔧 配置验证

- ✅ 图标URL: 使用您的网站图标
- ✅ 主页URL: https://www.fluxkrea.me/
- ✅ 描述: 简洁明了的服务说明
- ✅ 分类: SERVICE/SOFTWARE

所有配置已更新完成，可以开始创建产品了！