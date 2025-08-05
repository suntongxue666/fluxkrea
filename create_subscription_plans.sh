#!/bin/bash

# PayPal订阅计划创建脚本
echo "🚀 开始创建PayPal订阅计划..."

# 使用之前获取的访问令牌
ACCESS_TOKEN="A21AAIeWWO-vGScxO1UexBvOA9Vf51mUU6NPdjbblb2nx6nqgtQ_AWJSYVQaesDjhj8qVfpFg3t71Va9TKpTYzQ_f3EVLjCTw"
PAYPAL_API_BASE="https://api-m.sandbox.paypal.com"

# 产品ID（从之前创建的产品中获取）
PRO_PRODUCT_ID="PROD-7522488360648323A"
MAX_PRODUCT_ID="PROD-26M203332H396061W"

echo "📦 使用产品ID:"
echo "Pro Plan: $PRO_PRODUCT_ID"
echo "Max Plan: $MAX_PRODUCT_ID"
echo ""

# 1. 创建Pro Plan订阅计划 ($9.99/月)
echo "💰 创建Pro Plan订阅计划 (\$9.99/月)..."
PRO_PLAN_RESPONSE=$(curl -s -X POST ${PAYPAL_API_BASE}/v1/billing/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "PayPal-Request-Id: FLUX-KREA-PRO-PLAN-$(date +%s)" \
  -d '{
    "product_id": "'$PRO_PRODUCT_ID'",
    "name": "Pro Plan - Monthly Subscription",
    "description": "Monthly subscription for 1000 AI image generation credits",
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
            "value": "9.99",
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
    },
    "taxes": {
      "percentage": "0",
      "inclusive": false
    }
  }')

echo "Pro Plan订阅计划创建响应:"
echo $PRO_PLAN_RESPONSE | jq '.'

# 提取计划ID
PRO_PLAN_ID=$(echo $PRO_PLAN_RESPONSE | jq -r '.id')
echo "✅ Pro Plan订阅计划ID: $PRO_PLAN_ID"

# 2. 创建Max Plan订阅计划 ($29.99/月)
echo ""
echo "💰 创建Max Plan订阅计划 (\$29.99/月)..."
MAX_PLAN_RESPONSE=$(curl -s -X POST ${PAYPAL_API_BASE}/v1/billing/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "PayPal-Request-Id: FLUX-KREA-MAX-PLAN-$(date +%s)" \
  -d '{
    "product_id": "'$MAX_PRODUCT_ID'",
    "name": "Max Plan - Monthly Subscription",
    "description": "Monthly subscription for 5000 AI image generation credits",
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
            "value": "29.99",
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
    },
    "taxes": {
      "percentage": "0",
      "inclusive": false
    }
  }')

echo "Max Plan订阅计划创建响应:"
echo $MAX_PLAN_RESPONSE | jq '.'

# 提取计划ID
MAX_PLAN_ID=$(echo $MAX_PLAN_RESPONSE | jq -r '.id')
echo "✅ Max Plan订阅计划ID: $MAX_PLAN_ID"

# 3. 保存计划ID到配置文件
echo ""
echo "💾 保存计划ID到配置文件..."
cat > paypal_subscription_plans.json << EOF
{
  "pro_plan": {
    "product_id": "$PRO_PRODUCT_ID",
    "plan_id": "$PRO_PLAN_ID",
    "name": "Pro Plan",
    "description": "Monthly subscription for 1000 AI image generation credits",
    "price": 9.99,
    "currency": "USD",
    "credits": 1000,
    "billing_cycle": "monthly"
  },
  "max_plan": {
    "product_id": "$MAX_PRODUCT_ID",
    "plan_id": "$MAX_PLAN_ID",
    "name": "Max Plan",
    "description": "Monthly subscription for 5000 AI image generation credits",
    "price": 29.99,
    "currency": "USD",
    "credits": 5000,
    "billing_cycle": "monthly"
  },
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "sandbox",
  "status": "active"
}
EOF

echo "✅ 订阅计划ID已保存到 paypal_subscription_plans.json"
echo ""
echo "🎉 订阅计划创建完成！"
echo "Pro Plan ID: $PRO_PLAN_ID"
echo "Max Plan ID: $MAX_PLAN_ID"
echo ""
echo "📋 下一步："
echo "1. 更新前端代码中的计划ID"
echo "2. 配置PayPal Webhook"
echo "3. 测试订阅流程"