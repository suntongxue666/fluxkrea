# PayPal Webhook部署指南

## 🚨 当前问题

Webhook端点 `https://fluxkrea.me/api/paypal-webhook` 返回500错误，说明部署的函数存在问题。

## 🛠️ 解决方案

### 方案1: 修复现有部署

1. **检查Vercel函数日志**
   ```bash
   vercel logs https://fluxkrea.me
   ```

2. **重新部署修复的Webhook**
   - 使用 `api/paypal-webhook.js` 文件
   - 确保依赖项正确安装
   - 检查环境变量配置

### 方案2: 使用简化版本

创建一个最简单的Webhook处理器：

```javascript
// api/paypal-webhook-simple.js
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'GET') {
        return res.status(200).json({ 
            message: 'PayPal Webhook is running',
            timestamp: new Date().toISOString()
        });
    }
    
    if (req.method === 'POST') {
        console.log('Webhook received:', req.body);
        return res.status(200).json({ 
            message: 'Webhook received',
            timestamp: new Date().toISOString()
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};
```

### 方案3: 本地测试环境

使用ngrok创建本地测试环境：

```bash
# 安装ngrok
npm install -g ngrok

# 启动本地服务器
node local_webhook_server.js

# 在另一个终端中暴露端口
ngrok http 3000
```

## 📋 测试步骤

### 1. 重置用户状态 ✅
- tiktreeapp@gmail.com: 20积分, FREE状态
- sunwei7482@gmail.com: 20积分, FREE状态

### 2. 修复Webhook部署
- 部署简化版本的Webhook处理器
- 验证端点可访问性

### 3. 测试订阅流程
- 用户登录系统
- 购买Pro计划订阅
- 验证PayPal Webhook调用
- 检查积分是否正确增加

## 🎯 预期结果

成功的订阅流程应该：
1. 用户积分从20增加到1020 (Pro计划+1000积分)
2. 用户状态从FREE变为ACTIVE
3. 创建订阅关联记录
4. 记录积分交易日志
5. 记录Webhook事件日志

## 📊 当前系统状态

```
用户状态: ✅ 已重置
数据库表: ✅ 结构完整
Webhook端点: ❌ 返回500错误
订阅关联表: ✅ 已清空，准备接收新数据
```

## 🚀 下一步行动

1. **立即**: 修复Webhook部署问题
2. **然后**: 进行端到端订阅测试
3. **最后**: 验证所有功能正常工作

## 💡 调试建议

如果Webhook仍然失败，可以：
1. 检查Vercel函数日志
2. 验证依赖项安装
3. 检查环境变量配置
4. 使用本地测试环境
5. 简化Webhook逻辑到最基本功能