# 订阅系统修复设计文档

## 概述

本设计文档描述了修复Google登录 + PayPal订阅系统的技术方案。系统采用前端状态同步、后端API处理和webhook事件驱动的架构，确保用户登录状态、订阅关联和积分分配的正确性。

## 架构

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   首页 (index)   │    │  定价页 (pricing) │    │  成功页 (success) │
│                 │    │                 │    │                 │
│ Google 登录     │────│ 订阅购买        │────│ 订阅确认        │
│ 用户状态同步    │    │ PayPal 集成     │    │ 积分显示        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   状态同步系统   │
                    │                 │
                    │ user_state_sync │
                    │ credits_sync    │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   后端 API      │    │   数据库        │    │  PayPal Webhook │
│                 │    │                 │    │                 │
│ handle-subscription │ │ users          │    │ webhook-complete│
│ get-user-credits│    │ user_subscriptions│  │ 事件处理        │
└─────────────────┘    │ paypal_orders   │    └─────────────────┘
                       │ webhook_events  │
                       └─────────────────┘
```

### 数据流

1. **用户登录流程**:
   ```
   用户点击登录 → Google OAuth → Supabase Auth → 用户信息存储 → 状态同步
   ```

2. **订阅购买流程**:
   ```
   选择计划 → PayPal SDK → 订阅创建 → 用户关联API → 数据库存储
   ```

3. **订阅激活流程**:
   ```
   PayPal Webhook → 事件处理 → 用户查找 → 积分分配 → 状态更新
   ```

## 组件和接口

### 前端组件

#### 1. 用户状态同步系统 (user_state_sync.js)

**职责**: 管理跨页面的用户登录状态同步

**接口**:
```javascript
class UserStateSync {
    getCurrentUser()           // 获取当前用户
    setCurrentUser(user)       // 设置用户数据
    updateUserCredits(credits) // 更新用户积分
    addListener(callback)      // 添加状态变化监听器
}
```

**关键方法**:
- `handleUserStateChange()`: 处理用户状态变化
- `updateNavigationDisplay()`: 更新导航栏显示

#### 2. 积分同步系统 (credits_sync.js)

**职责**: 管理用户积分的跨页面同步和服务器同步

**接口**:
```javascript
class CreditsSync {
    getCredits()                    // 获取当前积分
    setCredits(amount)              // 设置积分
    addCredits(amount)              // 添加积分
    deductCredits(amount)           // 扣除积分
    syncFromServer()                // 从服务器同步
    getCurrentUserIdentifier()      // 获取用户标识符
}
```

**关键特性**:
- 支持多种用户标识符 (UUID, 邮箱)
- 自动服务器同步 (30秒间隔)
- 本地存储备份

### 后端API

#### 1. 订阅关联API (/api/handle-subscription.js)

**职责**: 处理Google用户ID与PayPal订阅ID的关联

**输入**:
```json
{
    "googleUserId": "user_uuid",
    "googleUserEmail": "user@example.com", 
    "paypalSubscriptionId": "I-SUBSCRIPTION123",
    "planId": "P-PLAN123",
    "planType": "pro"
}
```

**输出**:
```json
{
    "message": "Subscription saved successfully",
    "user_id": "user_uuid",
    "subscription_id": "I-SUBSCRIPTION123"
}
```

**处理逻辑**:
1. 查找或创建用户记录
2. 保存到 user_subscriptions 表
3. 更新 subscriptions 表
4. 返回关联结果

#### 2. 用户积分API (/api/get-user-credits.js)

**职责**: 获取用户当前积分，支持跨页面同步

**输入**:
```json
{
    "userIdentifier": "user_uuid_or_email"
}
```

**输出**:
```json
{
    "success": true,
    "credits": 1000,
    "user_type": "registered",
    "user_info": {
        "uuid": "user_uuid",
        "email": "user@example.com",
        "subscription_status": "ACTIVE"
    }
}
```

#### 3. PayPal Webhook处理器 (/api/paypal-webhook-complete.js)

**职责**: 处理PayPal订阅事件，自动激活订阅和分配积分

**支持的事件**:
- `BILLING.SUBSCRIPTION.CREATED`: 订阅创建
- `BILLING.SUBSCRIPTION.ACTIVATED`: 订阅激活 (核心)
- `BILLING.SUBSCRIPTION.CANCELLED`: 订阅取消
- `BILLING.SUBSCRIPTION.SUSPENDED`: 订阅暂停

**激活处理逻辑**:
1. 解析webhook事件
2. 查找用户 (支持UUID和邮箱)
3. 计算积分 (Pro: 1000, Max: 5000)
4. 更新用户积分和状态
5. 记录交易日志

## 数据模型

### 用户表 (users)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE,      -- 用户唯一标识
    google_id VARCHAR(255),        -- Google用户ID
    email VARCHAR(255) UNIQUE,     -- 邮箱
    name VARCHAR(255),             -- 姓名
    credits INTEGER DEFAULT 0,     -- 积分
    subscription_status VARCHAR(20) DEFAULT 'FREE',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 用户订阅关联表 (user_subscriptions)
```sql
CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    google_user_id VARCHAR(255) NOT NULL,      -- Google用户ID
    google_user_email VARCHAR(255) NOT NULL,   -- Google用户邮箱
    paypal_subscription_id VARCHAR(50) UNIQUE, -- PayPal订阅ID
    plan_id VARCHAR(50) NOT NULL,              -- PayPal计划ID
    plan_type VARCHAR(20) NOT NULL,            -- 计划类型 (pro/max)
    status VARCHAR(20) DEFAULT 'PENDING',      -- 状态
    created_at TIMESTAMP DEFAULT NOW()
);
```

### PayPal订单追踪表 (paypal_orders)
```sql
CREATE TABLE paypal_orders (
    id SERIAL PRIMARY KEY,
    subscription_id VARCHAR(50) NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    plan_id VARCHAR(50) NOT NULL,
    plan_type VARCHAR(20) NOT NULL,
    order_status VARCHAR(20) DEFAULT 'CREATED',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Webhook事件日志表 (webhook_events)
```sql
CREATE TABLE webhook_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    resource_data JSONB NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    processing_status VARCHAR(20) DEFAULT 'SUCCESS'
);
```

## 错误处理

### 用户查找策略
1. **优先级查找**: UUID → 邮箱 → 创建新用户
2. **数据一致性**: 自动修复UUID和邮箱不匹配
3. **错误记录**: 详细记录查找失败的情况

### Webhook处理错误
1. **事件记录**: 所有webhook事件都记录到日志表
2. **重试机制**: 处理失败时支持手动重试
3. **错误通知**: 关键错误发送通知

### 积分同步错误
1. **本地备份**: 本地存储作为备份
2. **服务器同步**: 定期从服务器同步最新数据
3. **冲突解决**: 服务器数据优先

## 测试策略

### 单元测试
- 用户状态同步功能测试
- 积分计算和同步测试
- API接口功能测试

### 集成测试
- 完整订阅流程测试
- 跨页面状态同步测试
- Webhook事件处理测试

### 端到端测试
- 用户登录到订阅完成的完整流程
- 多页面状态一致性测试
- 错误恢复场景测试

### 测试工具
- `test_subscription_fix.html`: 综合测试页面
- `fix_subscription_system.js`: 数据修复脚本
- `check_actual_tables.js`: 数据库结构检查

## 部署和监控

### 部署步骤
1. 执行数据库表创建脚本
2. 修复现有用户数据不一致
3. 部署更新的API和前端代码
4. 验证webhook端点配置

### 监控指标
- 订阅创建成功率
- Webhook处理成功率
- 用户积分同步准确性
- 跨页面状态同步延迟

### 错误恢复
- 自动数据修复脚本
- 手动订阅激活工具
- 积分查询和修复工具
- 系统健康检查工具