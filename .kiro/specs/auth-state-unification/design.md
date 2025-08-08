# 用户认证状态统一重构设计文档

## 概述

本设计文档基于需求分析，提供首页核心功能修复和跨页面状态同步的技术实现方案。重点解决首页Google登录、Generate功能和积分显示问题，同时建立统一的状态管理机制。

## 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    前端页面层                                │
├─────────────────────┬───────────────────────────────────────┤
│     index.html      │         pricing.html                  │
│   (首页 - 重点修复)  │      (已部分修复)                      │
├─────────────────────┴───────────────────────────────────────┤
│                  统一状态管理层                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   UserManager   │  │  CreditsSync    │                   │
│  │   (用户管理)     │  │  (积分同步)      │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│                    API接口层                                │
│  /api/generate.js  │  /api/get-user-credits.js             │
├─────────────────────────────────────────────────────────────┤
│                   数据存储层                                │
│  Supabase (用户/积分) │ localStorage (状态缓存)              │
└─────────────────────────────────────────────────────────────┘
```

## 组件设计

### 1. 首页UserManager修复设计

#### 问题分析
- UserManager类初始化失败或事件绑定丢失
- Google登录回调处理异常
- Supabase会话监听器未正确设置

#### 解决方案

```javascript
class UserManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.supabaseClient = null;
    }
    
    async initialize() {
        try {
            // 1. 初始化Supabase客户端
            this.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // 2. 检查现有会话
            const { data: { session } } = await this.supabaseClient.auth.getSession();
            
            // 3. 设置认证状态监听器
            this.supabaseClient.auth.onAuthStateChange((event, session) => {
                this.handleAuthStateChange(event, session);
            });
            
            // 4. 处理现有会话
            if (session) {
                await this.handleAuthenticatedUser(session.user);
            } else {
                await this.handleAnonymousUser();
            }
            
            // 5. 绑定UI事件
            this.bindUIEvents();
            
            this.isInitialized = true;
            console.log('✅ UserManager初始化完成');
            
        } catch (error) {
            console.error('❌ UserManager初始化失败:', error);
            this.handleLocalMode(); // 降级到本地模式
        }
    }
    
    bindUIEvents() {
        // 绑定登录按钮事件
        const signinBtn = document.querySelector('.signin-btn');
        if (signinBtn) {
            signinBtn.onclick = () => this.signInWithGoogle();
        }
    }
    
    async signInWithGoogle() {
        try {
            console.log('🔐 开始Google登录...');
            
            const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + window.location.pathname
                }
            });
            
            if (error) throw error;
            
        } catch (error) {
            console.error('❌ Google登录失败:', error);
            this.showErrorMessage('登录失败，请重试');
        }
    }
}
```

### 2. Generate功能修复设计

#### 问题分析
- Generate按钮事件监听器未正确绑定
- 图片生成API调用失败
- 积分扣除逻辑异常

#### 解决方案

```javascript
class ImageGenerator {
    constructor(userManager, creditsManager) {
        this.userManager = userManager;
        this.creditsManager = creditsManager;
        this.isGenerating = false;
    }
    
    initialize() {
        this.bindGenerateButton();
        this.bindPromptInput();
    }
    
    bindGenerateButton() {
        const generateBtn = document.querySelector('.generate-btn');
        if (generateBtn) {
            generateBtn.onclick = () => this.handleGenerate();
        }
    }
    
    async handleGenerate() {
        if (this.isGenerating) return;
        
        try {
            // 1. 验证输入
            const prompt = this.getPromptText();
            if (!prompt.trim()) {
                this.showError('请输入提示词');
                return;
            }
            
            // 2. 检查积分
            const currentCredits = this.creditsManager.getCredits();
            const requiredCredits = 10; // 每次生成需要10积分
            
            if (currentCredits < requiredCredits) {
                this.showInsufficientCreditsModal();
                return;
            }
            
            // 3. 开始生成
            this.setGeneratingState(true);
            
            // 4. 调用生成API
            const result = await this.callGenerateAPI(prompt);
            
            // 5. 扣除积分
            await this.creditsManager.deductCredits(requiredCredits);
            
            // 6. 显示结果
            this.displayResult(result);
            
        } catch (error) {
            console.error('❌ 图片生成失败:', error);
            this.showError('生成失败，请重试');
        } finally {
            this.setGeneratingState(false);
        }
    }
    
    async callGenerateAPI(prompt) {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                width: 1024,
                height: 1024,
                steps: 4
            })
        });
        
        if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
        }
        
        return await response.json();
    }
}
```

### 3. 积分同步机制设计

#### 问题分析
- 积分显示不更新
- 跨页面积分不同步
- localStorage与数据库数据不一致

#### 解决方案

```javascript
class CreditsManager {
    constructor() {
        this.currentCredits = 0;
        this.listeners = [];
        this.syncInterval = 30000; // 30秒同步一次
    }
    
    async initialize(user) {
        try {
            // 1. 从数据库获取最新积分
            if (user && user.uuid) {
                await this.syncFromDatabase(user.uuid);
            } else {
                // 匿名用户使用本地存储
                this.currentCredits = this.getLocalCredits();
            }
            
            // 2. 更新UI显示
            this.updateDisplay();
            
            // 3. 启动定期同步
            this.startPeriodicSync(user);
            
            // 4. 监听storage事件（跨页面同步）
            this.listenStorageChanges();
            
            console.log('✅ CreditsManager初始化完成，当前积分:', this.currentCredits);
            
        } catch (error) {
            console.error('❌ CreditsManager初始化失败:', error);
        }
    }
    
    async syncFromDatabase(userUuid) {
        try {
            const response = await fetch('/api/get-user-credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userIdentifier: userUuid
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.setCredits(data.credits);
                }
            }
        } catch (error) {
            console.error('❌ 积分同步失败:', error);
        }
    }
    
    setCredits(amount) {
        const oldCredits = this.currentCredits;
        this.currentCredits = Math.max(0, amount);
        
        // 保存到localStorage
        this.saveLocalCredits();
        
        // 通知监听器
        this.notifyListeners(oldCredits, this.currentCredits);
        
        // 更新UI
        this.updateDisplay();
        
        // 触发跨页面同步事件
        this.triggerCrossPageSync();
    }
    
    updateDisplay() {
        const creditsElements = document.querySelectorAll('#creditsAmount, .credits-amount');
        creditsElements.forEach(element => {
            if (element) {
                element.textContent = this.currentCredits;
                
                // 添加更新动画
                element.style.transition = 'all 0.3s ease';
                element.style.color = '#10b981';
                setTimeout(() => {
                    element.style.color = '';
                }, 500);
            }
        });
    }
    
    triggerCrossPageSync() {
        // 触发storage事件，通知其他页面
        localStorage.setItem('credits_sync_trigger', Date.now().toString());
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('creditsUpdated', {
            detail: { credits: this.currentCredits }
        }));
    }
}
```

### 4. 跨页面状态同步设计

#### 统一状态管理接口

```javascript
// 统一的状态管理接口
class StateManager {
    static instance = null;
    
    static getInstance() {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }
    
    constructor() {
        this.userManager = null;
        this.creditsManager = null;
        this.isInitialized = false;
    }
    
    async initialize() {
        try {
            // 1. 初始化用户管理器
            this.userManager = new UserManager();
            await this.userManager.initialize();
            
            // 2. 初始化积分管理器
            this.creditsManager = new CreditsManager();
            await this.creditsManager.initialize(this.userManager.currentUser);
            
            // 3. 设置跨页面同步
            this.setupCrossPageSync();
            
            this.isInitialized = true;
            console.log('✅ StateManager初始化完成');
            
        } catch (error) {
            console.error('❌ StateManager初始化失败:', error);
        }
    }
    
    setupCrossPageSync() {
        // 监听storage变化
        window.addEventListener('storage', (e) => {
            if (e.key === 'flux_krea_user') {
                this.handleUserStateChange(e.newValue);
            } else if (e.key === 'credits_sync_trigger') {
                this.handleCreditsSync();
            }
        });
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.syncStateFromStorage();
            }
        });
    }
}
```

## 数据模型

### 用户状态数据结构

```javascript
const UserState = {
    uuid: "string",           // 用户唯一标识
    email: "string",          // 用户邮箱
    name: "string",           // 用户姓名
    avatar_url: "string",     // 头像URL
    credits: "number",        // 当前积分
    subscription_status: "string", // 订阅状态
    is_signed_in: "boolean",  // 登录状态
    last_sync: "timestamp"    // 最后同步时间
};
```

### localStorage存储键值

```javascript
const StorageKeys = {
    USER_DATA: 'flux_krea_user',
    CREDITS_DATA: 'flux_krea_credits', 
    LAST_SYNC: 'flux_krea_last_sync',
    SYNC_TRIGGER: 'credits_sync_trigger'
};
```

## 错误处理

### 错误分类和处理策略

1. **网络错误**
   - 自动重试机制（最多3次）
   - 降级到本地缓存数据
   - 显示友好的错误提示

2. **认证错误**
   - 清除本地状态
   - 引导用户重新登录
   - 保存用户操作上下文

3. **积分不足错误**
   - 显示积分不足弹窗
   - 引导用户到定价页面
   - 提供充值选项

4. **API调用错误**
   - 记录错误日志
   - 显示具体错误信息
   - 提供重试选项

## 测试策略

### 单元测试

1. **UserManager测试**
   - 初始化流程测试
   - Google登录流程测试
   - 会话状态变化测试

2. **CreditsManager测试**
   - 积分同步测试
   - 积分扣除测试
   - 跨页面同步测试

3. **ImageGenerator测试**
   - 生成流程测试
   - 错误处理测试
   - 积分验证测试

### 集成测试

1. **登录流程测试**
   - 完整登录到积分显示流程
   - 跨页面状态同步测试

2. **生成流程测试**
   - 从输入到结果显示的完整流程
   - 积分扣除和更新测试

### 用户验收测试

1. **首页功能测试**
   - Google登录按钮点击测试
   - Generate功能完整流程测试
   - 积分显示和更新测试

2. **跨页面同步测试**
   - 首页登录后切换到Pricing页面
   - 积分变化在两个页面的同步

## 性能优化

### 加载性能

1. **延迟初始化**
   - 非关键组件延迟加载
   - 按需初始化第三方库

2. **缓存策略**
   - localStorage缓存用户状态
   - 合理的缓存过期时间

### 运行时性能

1. **事件防抖**
   - Generate按钮防重复点击
   - 积分同步请求防抖

2. **内存管理**
   - 及时清理事件监听器
   - 避免内存泄漏

## 部署考虑

### 静态文件结构

```
public/
├── index.html          # 首页（修复后）
├── pricing.html        # 定价页面
├── subscription-success.html
├── js/
│   ├── state-manager.js    # 统一状态管理
│   ├── user-manager.js     # 用户管理
│   ├── credits-manager.js  # 积分管理
│   └── image-generator.js  # 图片生成
└── css/
    └── styles.css
```

### 环境配置

- 确保Supabase配置正确
- 验证Google OAuth配置
- 检查API端点可用性

## 监控和日志

### 关键指标监控

1. **用户体验指标**
   - 登录成功率
   - Generate功能成功率
   - 页面加载时间

2. **技术指标**
   - API响应时间
   - 错误率
   - 状态同步延迟

### 日志记录

1. **用户操作日志**
   - 登录/登出操作
   - Generate操作
   - 积分变化

2. **系统错误日志**
   - API调用失败
   - 状态同步失败
   - 初始化错误

这个设计方案重点解决首页的核心功能问题，同时建立了统一的状态管理机制，为后续的系统优化奠定基础。