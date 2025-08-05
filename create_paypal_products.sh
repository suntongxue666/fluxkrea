#!/bin/bash

# PayPal产品创建脚本
# 注意：需要先获取ACCESS_TOKEN

echo "🚀 开始创建PayPal订阅产品..."

# 设置变量（请替换为您的实际值）
PAYPAL_API_BASE="https://api-m.sandbox.paypal.com"  # 沙盒环境
# PAYPAL_API_BASE="https://api-m.paypal.com"        # 生产环境

# 请先获取ACCESS_TOKEN
# ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"

echo "⚠️  请先设置ACCESS_TOKEN环境变量"
echo "获取方法: curl -v POST https://api-m.sandbox.paypal.com/v1/oauth2/token \\"
echo "  -H 'Accept: application/json' \\"
echo "  -H 'Accept-Language: en_US' \\"
echo "  -u 'CLIENT_ID:CLIENT_SECRET' \\"
echo "  -d 'grant_type=client_credentials'"
echo ""

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ ACCESS_TOKEN未设置，请先获取访问令牌"
    exit 1
fi

# 1. 创建Pro Plan产品
echo "📦 创建Pro Plan产品..."
PRO_PRODUCT_RESPONSE=$(curl -s -X POST ${PAYPAL_API_BASE}/v1/catalogs/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "PayPal-Request-Id: FLUX-KREA-PRO-$(date +%s)" \
  -d '{
    "name": "Pro Plan",
    "description": "1000 credits per month and creating AI images service.",
    "type": "SERVICE",
    "category": "SOFTWARE",
    "image_url": "https://ciwjjfcuhubjydajazkk.supabase.co/storage/v1/object/public/webstie-icon//FluxKrea%20log-120.png",
    "home_url": "https://www.fluxkrea.me/"
  }')

echo "Pro Plan产品创建响应:"
echo $PRO_PRODUCT_RESPONSE | jq '.'

# 提取产品ID
PRO_PRODUCT_ID=$(echo $PRO_PRODUCT_RESPONSE | jq -r '.id')
echo "✅ Pro Plan产品ID: $PRO_PRODUCT_ID"

# 2. 创建Max Plan产品
echo ""
echo "📦 创建Max Plan产品..."
MAX_PRODUCT_RESPONSE=$(curl -s -X POST ${PAYPAL_API_BASE}/v1/catalogs/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "PayPal-Request-Id: FLUX-KREA-MAX-$(date +%s)" \
  -d '{
    "name": "Max Plan",
    "description": "5000 credits per month and creating AI images service.",
    "type": "SERVICE",
    "category": "SOFTWARE",
    "image_url": "https://ciwjjfcuhubjydajazkk.supabase.co/storage/v1/object/public/webstie-icon//FluxKrea%20log-120.png",
    "home_url": "https://www.fluxkrea.me/"
  }')

echo "Max Plan产品创建响应:"
echo $MAX_PRODUCT_RESPONSE | jq '.'

# 提取产品ID
MAX_PRODUCT_ID=$(echo $MAX_PRODUCT_RESPONSE | jq -r '.id')
echo "✅ Max Plan产品ID: $MAX_PRODUCT_ID"

# 3. 保存产品ID到配置文件
echo ""
echo "💾 保存产品ID到配置文件..."
cat > paypal_product_ids.json << EOF
{
  "pro_plan": {
    "product_id": "$PRO_PRODUCT_ID",
    "name": "Pro Plan",
    "credits": 1000,
    "price": 9.99
  },
  "max_plan": {
    "product_id": "$MAX_PRODUCT_ID",
    "name": "Max Plan", 
    "credits": 5000,
    "price": 29.99
  },
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "sandbox"
}
EOF

echo "✅ 产品ID已保存到 paypal_product_ids.json"
echo ""
echo "🎉 产品创建完成！"
echo "Pro Plan产品ID: $PRO_PRODUCT_ID"
echo "Max Plan产品ID: $MAX_PRODUCT_ID"
echo ""
echo "📋 下一步："
echo "1. 使用这些产品ID创建订阅计划"
echo "2. 更新代码中的产品ID"
echo "3. 配置Webhook"