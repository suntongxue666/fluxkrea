// 跨页面用户状态同步系统
class UserStateSync {
    constructor() {
        this.userKey = 'flux_krea_user';
        this.listeners = [];
        
        // 监听storage变化
        window.addEventListener('storage', (e) => {
            if (e.key === this.userKey) {
                this.handleUserStateChange();
            }
        });
        
        // 监听自定义事件
        window.addEventListener('userStateUpdated', (e) => {
            this.handleUserStateChange(e.detail);
        });
    }
    
    // 获取当前用户
    getCurrentUser() {
        try {
            // 1. 优先从全局变量获取
            if (window.currentUser) {
                return window.currentUser;
            }
            
            // 2. 从localStorage获取
            const userData = localStorage.getItem(this.userKey);
            if (userData) {
                const user = JSON.parse(userData);
                // 同步到全局变量
                window.currentUser = user;
                return user;
            }
            
            return null;
        } catch (error) {
            console.error('获取用户数据失败:', error);
            return null;
        }
    }
    
    // 设置用户数据
    setCurrentUser(user) {
        try {
            if (user) {
                localStorage.setItem(this.userKey, JSON.stringify(user));
                
                // 更新全局变量
                if (window.currentUser) {
                    Object.assign(window.currentUser, user);
                } else {
                    window.currentUser = user;
                }
            } else {
                localStorage.removeItem(this.userKey);
                window.currentUser = null;
            }
            
            this.notifyListeners(user);
            return true;
        } catch (error) {
            console.error('设置用户数据失败:', error);
            return false;
        }
    }
    
    // 更新用户积分
    updateUserCredits(credits) {
        const user = this.getCurrentUser();
        if (user) {
            user.credits = credits;
            this.setCurrentUser(user);
        }
    }
    
    // 处理用户状态变化
    handleUserStateChange(detail = null) {
        const user = detail ? detail.user : this.getCurrentUser();
        
        if (user) {
            // 更新全局变量
            if (window.currentUser) {
                Object.assign(window.currentUser, user);
            } else {
                window.currentUser = user;
            }
            
            // 更新积分同步系统
            if (window.creditsSync && user.credits !== undefined) {
                window.creditsSync.setCredits(user.credits);
            }
            
            // 更新导航栏显示
            this.updateNavigationDisplay(user);
        }
        
        this.notifyListeners(user);
    }
    
    // 更新导航栏显示
    updateNavigationDisplay(user) {
        const signinBtn = document.querySelector('.signin-btn');
        const creditsDisplay = document.getElementById('creditsDisplay');
        
        if (user && user.email) {
            // 已登录状态
            if (signinBtn) {
                signinBtn.innerHTML = `
                    <img src="${user.avatar_url || 'https://via.placeholder.com/18'}" 
                         style="width: 18px; height: 18px; border-radius: 50%;" alt="Avatar">
                    <span>${user.email.split('@')[0]}</span>
                `;
            }
            
            if (creditsDisplay) {
                creditsDisplay.style.display = 'flex';
            }
        } else {
            // 未登录状态
            if (signinBtn) {
                signinBtn.innerHTML = `
                    <div class="google-icon"></div>
                    <span>Sign in</span>
                `;
            }
            
            if (creditsDisplay) {
                creditsDisplay.style.display = 'flex';
            }
        }
    }
    
    // 添加监听器
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    // 移除监听器
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    // 通知所有监听器
    notifyListeners(user) {
        this.listeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('用户状态监听器回调失败:', error);
            }
        });
    }
    
    // 初始化
    initialize() {
        // 立即处理当前状态
        this.handleUserStateChange();
        
        console.log('✅ 用户状态同步系统已初始化');
    }
}

// 创建全局实例
window.userStateSync = new UserStateSync();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.userStateSync.initialize();
});

// 导出给其他脚本使用
window.UserStateSync = UserStateSync;