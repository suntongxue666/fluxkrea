# PayPal产品创建命令

## 🔑 首先获取访问令牌

```bash
# 沙盒环境
curl -v POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

## 📦 1. 创建Pro Plan产品

```bash
curl -v -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "PayPal-Request-Id: FLUX-KREA-PRO-$(date +%s)" \
  -d '{
    "name": "Pro Plan",
    "description": "1000 credits per month and creating AI images service.",
    "type": "SERVICE",
    "category": "SOFTWARE",
    "image_url": "https://ciwjjfcuhubjydajazkk.supabase.co/storage/v1/object/public/webstie-icon//FluxKrea%20log-120.png",
    "home_url": "https://www.fluxkrea.me/"
  }'
```

## 📦 2. 创建Max Plan产品

```bash
curl -v -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "PayPal-Request-Id: FLUX-KREA-MAX-$(date +%s)" \
  -d '{
    "name": "Max Plan",
    "description": "5000 credits per month and creating AI images service.",
    "type": "SERVICE",
    "category": "SOFTWARE",
    "image_url": "https://ciwjjfcuhubjydajazkk.supabase.co/storage/v1/object/public/webstie-icon//FluxKrea%20log-120.png",
    "home_url": "https://www.fluxkrea.me/"
  }'
```

## 📋 响应示例

成功创建后，您会收到类似这样的响应：

```json
{
  "id": "PROD-XXXXXXXXXXXX",
  "name": "Pro Plan",
  "description": "1000 credits per month for creating AI images service...",
  "type": "SERVICE",
  "category": "SOFTWARE",
  "image_url": "https://flux-krea-ai.com/assets/pro-plan-icon.png",
  "home_url": "https://flux-krea-ai.com",
  "create_time": "2024-01-XX",
  "update_time": "2024-01-XX",
  "links": [...]
}
```

## 🔧 关于URL说明

- **image_url**: 产品图标URL，建议使用您网站的图标
- **home_url**: 您的网站主页URL

如果您还没有这些图片，可以暂时使用：
- `image_url`: `"https://via.placeholder.com/200x200/6366f1/ffffff?text=Pro"`
- `home_url`: `"https://your-domain.com"`

## ⚠️ 重要提醒

1. 保存返回的产品ID，创建订阅计划时需要用到
2. 沙盒环境用于测试，生产环境需要更换API端点
3. 确保CLIENT_ID和CLIENT_SECRET正确配置