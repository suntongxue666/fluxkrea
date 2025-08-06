// 统一的积分同步系统
class CreditsSync {
    constructor() {
        this.storageKey = 'flux_krea_credits';
        this.userKey = 'flux_krea_user';
        this.lastSyncKey = 'flux_krea_last_sync';
        this.syncInterval = 30000; // 30秒同步一次
        this.listeners = [];
        
        // 启动同步
        this.startSync();
        
        // 监听storage变化
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.notifyListeners();
            }
        });
    }
    
    // 获取当前用户标识
    getCurrentUserIdentifier() {
        try {
            const userData = localStorage.getItem(this.userKey);
            if (userData) {
                const user = JSON.parse(userData);
                return user.email || user.id || 'anonymous';
            }
            return 'anonymous';
        } catch (error) {
            console.error('获取用户标识失败:', error);
            return 'anonymous';
        }
    }
    
    // 获取积分
    getCredits() {
        try {
            const userIdentifier = this.getCurrentUserIdentifier();
            const creditsData = localStorage.getItem(this.storageKey);
            
            if (creditsData) {
                const credits = JSON.parse(creditsData);
                return credits[userIdentifier] || 0;
            }
            
            return 0;
        } catch (error) {
            console.error('获取积分失败:', error);
            return 0;
        }
    }
    
    // 设置积分
    setCredits(amount) {
        try {
            const userIdentifier = this.getCurrentUserIdentifier();
            let creditsData = {};
            
            const existingData = localStorage.getItem(this.storageKey);
            if (existingData) {
                creditsData = JSON.parse(existingData);
            }
            
            creditsData[userIdentifier] = Math.max(0, amount);
            localStorage.setItem(this.storageKey, JSON.stringify(creditsData));
            localStorage.setItem(this.lastSyncKey, Date.now().toString());
            
            this.notifyListeners();
            
            console.log(`积分已更新: ${amount} (用户: ${userIdentifier})`);
            return true;
        } catch (error) {
            console.error('设置积分失败:', error);
            return false;
        }
    }
    
    // 添加积分
    addCredits(amount) {
        const currentCredits = this.getCredits();
        return this.setCredits(currentCredits + amount);
    }
    
    // 扣除积分
    deductCredits(amount) {
        const currentCredits = this.getCredits();
        if (currentCredits >= amount) {
            return this.setCredits(currentCredits - amount);
        }
        return false;
    }
    
    // 从服务器同步积分
    async syncFromServer() {
        try {
            const userIdentifier = this.getCurrentUserIdentifier();
            
            if (userIdentifier === 'anonymous') {
                // 匿名用户使用本地存储
                return this.getCredits();
            }
            
            // 已登录用户从服务器获取
            const response = await fetch('/api/get-user-credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userIdentifier: userIdentifier
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.setCredits(data.credits);
                    return data.credits;
                }
            }
            
            // 服务器同步失败，使用本地数据
            return this.getCredits();
            
        } catch (error) {
            console.error('服务器同步失败:', error);
            return this.getCredits();
        }
    }
    
    // 启动定期同步
    startSync() {
        // 立即同步一次
        this.syncFromServer();
        
        // 定期同步
        setInterval(() => {
            this.syncFromServer();
        }, this.syncInterval);
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
    notifyListeners() {
        const credits = this.getCredits();
        this.listeners.forEach(callback => {
            try {
                callback(credits);
            } catch (error) {
                console.error('监听器回调失败:', error);
            }
        });
    }
    
    // 更新页面显示
    updateDisplay() {
        const credits = this.getCredits();
        const creditsElements = document.querySelectorAll('#creditsAmount, .credits-amount');
        
        creditsElements.forEach(element => {
            if (element) {
                element.textContent = credits;
            }
        });
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('creditsUpdated', {
            detail: { credits }
        }));
    }
}

// 创建全局实例
window.creditsSync = new CreditsSync();

// 添加显示更新监听器
window.creditsSync.addListener((credits) => {
    window.creditsSync.updateDisplay();
});

// 页面加载完成后立即更新显示
document.addEventListener('DOMContentLoaded', () => {
    window.creditsSync.updateDisplay();
});

// 导出给其他脚本使用
window.CreditsSync = CreditsSync;