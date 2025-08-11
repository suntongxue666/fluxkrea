/**
 * 统一的跨页面状态同步模块
 * 解决首页和Pricing页面用户登录信息和积分不同步问题
 * 
 * 功能特性：
 * - 统一的用户状态管理
 * - 跨页面实时状态同步
 * - 积分状态统一管理
 * - Supabase认证状态监听
 * - localStorage事件广播
 */

(function(window) {
    'use strict';

    // 防止重复加载
    if (window.UnifiedStateSync) {
        console.log('UnifiedStateSync already loaded');
        return;
    }

    /**
     * 统一状态同步器
     */
    class UnifiedStateSync {
        constructor() {
            this.currentUser = null;
            this.credits = 0;
            this.isInitialized = false;
            this.listeners = [];
            this.supabaseClient = null;
            
            // 状态同步配置
            this.storageKeys = {
                user: 'flux_krea_user',
                credits: 'flux_krea_credits', 
                stateChange: 'flux_krea_state_change'
            };

            console.log('🔄 UnifiedStateSync initialized');
        }

        /**
         * 初始化状态同步器
         */
        async initialize() {
            if (this.isInitialized) return;
            
            try {
                console.log('🚀 初始化统一状态同步器...');
                
                // 1. 初始化 Supabase 客户端
                await this.initializeSupabaseClient();
                
                // 2. 恢复本地存储的用户状态
                this.restoreUserStateFromStorage();
                
                // 3. 设置 Supabase 认证监听器
                this.setupSupabaseAuthListener();
                
                // 4. 设置跨页面事件监听器
                this.setupCrossPageSync();
                
                // 5. 检查当前认证状态
                await this.checkCurrentAuthState();
                
                this.isInitialized = true;
                console.log('✅ 统一状态同步器初始化完成');
                
                // 触发初始化完成事件
                this.notifyListeners('initialized', { user: this.currentUser, credits: this.credits });
                
            } catch (error) {
                console.error('❌ 统一状态同步器初始化失败:', error);
            }
        }

        /**
         * 初始化 Supabase 客户端
         */
        async initializeSupabaseClient() {
            // 优先使用全局 supabaseClient
            if (window.supabaseClient && window.supabaseClient.auth) {
                this.supabaseClient = window.supabaseClient;
                console.log('✅ 使用全局 supabaseClient');
                return;
            }

            // 尝试从全局配置创建
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                const url = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
                const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
                
                try {
                    this.supabaseClient = window.supabase.createClient(url, key);
                    window.supabaseClient = this.supabaseClient; // 设置全局引用
                    console.log('✅ 创建新的 supabaseClient');
                } catch (error) {
                    console.error('❌ 创建 supabaseClient 失败:', error);
                }
            }
        }

        /**
         * 从 localStorage 恢复用户状态
         */
        restoreUserStateFromStorage() {
            try {
                const savedUser = localStorage.getItem(this.storageKeys.user);
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    
                    // 先保存当前积分，避免被覆盖
                    const currentCredits = this.credits;
                    
                    // 恢复用户数据，但不重置积分
                    this.currentUser = user;
                    
                    // 优先使用用户数据中的积分，但如果当前积分更新，则保持当前积分
                    if (user.credits !== undefined && (currentCredits === 0 || user.credits > currentCredits)) {
                        this.credits = user.credits;
                    } else if (currentCredits > 0) {
                        // 保持当前积分，并更新用户对象
                        this.currentUser.credits = currentCredits;
                        user.credits = currentCredits;
                    }
                    
                    // 更新全局变量
                    window.currentUser = this.currentUser;
                    
                    console.log('✅ 从 localStorage 恢复用户状态:', user.email, '积分:', this.credits);
                }
            } catch (error) {
                console.error('❌ 恢复用户状态失败:', error);
                localStorage.removeItem(this.storageKeys.user);
            }
        }

        /**
         * 设置 Supabase 认证状态监听器
         */
        setupSupabaseAuthListener() {
            if (!this.supabaseClient || !this.supabaseClient.auth) return;

            this.supabaseClient.auth.onAuthStateChange(async (event, session) => {
                console.log('🔐 Supabase认证状态变化:', event, session?.user?.email);

                if (event === 'SIGNED_IN' && session?.user) {
                    const user = this.formatUserFromSession(session);
                    await this.setUser(user, true);
                    await this.syncCreditsFromAPI();
                    
                } else if (event === 'SIGNED_OUT') {
                    await this.setUser(null, true);
                }
            });
        }

        /**
         * 设置跨页面同步监听器
         */
        setupCrossPageSync() {
            // 监听 localStorage 变化 (其他页面的变更)
            window.addEventListener('storage', (event) => {
                if (event.key === this.storageKeys.user) {
                    console.log('📡 收到其他页面的用户状态变更');
                    // 避免循环更新，只在数据真正改变时同步
                    try {
                        const newUser = event.newValue ? JSON.parse(event.newValue) : null;
                        
                        if (newUser) {
                            // 比较用户基本信息，但积分需要特殊处理
                            const shouldUpdate = !this.currentUser || 
                                               this.currentUser.email !== newUser.email ||
                                               this.currentUser.uuid !== newUser.uuid;
                            
                            if (shouldUpdate) {
                                this.currentUser = newUser;
                                console.log('✅ 已同步用户基本信息:', newUser.email);
                            }
                            
                            // 积分同步：只在新积分更高时更新，防止意外重置
                            if (newUser.credits !== undefined) {
                                if (newUser.credits > this.credits || this.credits === 0) {
                                    this.credits = newUser.credits;
                                    console.log('✅ 已同步积分更新:', this.credits);
                                } else if (newUser.credits < this.credits) {
                                    // 如果新值更小，可能是旧数据，更新localStorage中的积分
                                    newUser.credits = this.credits;
                                    this.currentUser.credits = this.credits;
                                    localStorage.setItem(this.storageKeys.user, JSON.stringify(this.currentUser));
                                    console.log('💰 保持较高积分值:', this.credits);
                                }
                            }
                            
                            this.updateUI();
                        } else if (!newUser && this.currentUser) {
                            // 用户已登出
                            this.currentUser = null;
                            this.credits = 0;
                            this.updateUI();
                            console.log('✅ 已同步登出状态');
                        }
                    } catch (error) {
                        console.error('❌ 同步用户状态失败:', error);
                    }
                } else if (event.key === this.storageKeys.stateChange) {
                    console.log('📡 收到状态变更广播');
                    // 延迟同步，避免频繁更新
                    setTimeout(() => {
                        this.restoreUserStateFromStorage();
                        this.updateUI();
                    }, 50);
                }
            });

            // 监听页面可见性变化
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    console.log('👁️ 页面重新可见，检查状态同步...');
                    setTimeout(() => {
                        this.restoreUserStateFromStorage();
                        this.syncCreditsFromAPI();
                    }, 200);
                }
            });
        }

        /**
         * 检查当前认证状态
         */
        async checkCurrentAuthState() {
            if (!this.supabaseClient || !this.supabaseClient.auth) return;

            try {
                const { data: { session }, error } = await this.supabaseClient.auth.getSession();
                
                if (error) {
                    console.warn('⚠️ 获取会话状态失败:', error);
                    return;
                }

                if (session?.user && !this.currentUser) {
                    const user = this.formatUserFromSession(session);
                    await this.setUser(user, false);
                    await this.syncCreditsFromAPI();
                }
            } catch (error) {
                console.error('❌ 检查认证状态失败:', error);
            }
        }

        /**
         * 格式化 Supabase 会话中的用户数据
         */
        formatUserFromSession(session) {
            const user = session.user;
            return {
                uuid: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || 'https://via.placeholder.com/32',
                credits: this.credits || 0, // 保持当前积分
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                is_signed_in: true
            };
        }

        /**
         * 设置用户状态
         */
        async setUser(user, broadcast = true) {
            const oldUser = this.currentUser;
            this.currentUser = user;

            // 保存到 localStorage
            if (user) {
                // 确保用户对象包含最新积分
                user.credits = this.credits;
                localStorage.setItem(this.storageKeys.user, JSON.stringify(user));
            } else {
                localStorage.removeItem(this.storageKeys.user);
                this.credits = 0; // 清空积分
            }

            // 更新全局变量（兼容现有代码）
            window.currentUser = user;

            // 广播变更
            if (broadcast) {
                this.broadcastStateChange();
            }

            // 更新UI
            this.updateUI();

            // 通知监听器
            this.notifyListeners('userChanged', { 
                oldUser, 
                newUser: user, 
                credits: this.credits 
            });

            console.log(user ? `✅ 用户已登录: ${user.email}, 积分: ${this.credits}` : '✅ 用户已登出');
        }

        /**
         * 设置积分
         */
        setCredits(credits, broadcast = true) {
            const oldCredits = this.credits;
            const newCredits = Math.max(0, Number(credits) || 0);
            
            // 只要积分值不同就更新（移除之前的逻辑限制）
            if (newCredits !== this.credits) {
                this.credits = newCredits;

                // 更新用户对象中的积分
                if (this.currentUser) {
                    this.currentUser.credits = this.credits;
                    localStorage.setItem(this.storageKeys.user, JSON.stringify(this.currentUser));
                }

                // 更新全局变量
                if (window.currentUser) {
                    window.currentUser.credits = this.credits;
                }

                // 广播变更
                if (broadcast) {
                    this.broadcastStateChange();
                }

                // 更新UI
                this.updateCreditsDisplay();

                // 通知监听器
                this.notifyListeners('creditsChanged', { 
                    oldCredits, 
                    newCredits: this.credits 
                });

                console.log(`💰 积分更新: ${oldCredits} → ${this.credits}`);
            }
        }

        /**
         * 从API同步积分
         */
        async syncCreditsFromAPI() {
            if (!this.currentUser) return;

            try {
                console.log('🔄 从API同步积分...');
                
                // 获取访问令牌
                let token = this.currentUser.access_token;
                if (!token && this.supabaseClient?.auth) {
                    const { data: { session } } = await this.supabaseClient.auth.getSession();
                    token = session?.access_token;
                }

                const headers = {
                    'Content-Type': 'application/json'
                };
                
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch('/api/get-user-credits', {
                    method: 'GET',
                    headers
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.credits !== undefined) {
                        this.setCredits(data.credits, true);
                        console.log('✅ 积分同步成功:', data.credits);
                        return data.credits;
                    }
                }
            } catch (error) {
                console.error('❌ 积分同步失败:', error);
            }
            return null;
        }

        /**
         * 广播状态变更到其他页面
         */
        broadcastStateChange() {
            // 使用时间戳触发 storage 事件
            localStorage.setItem(this.storageKeys.stateChange, Date.now().toString());
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('unifiedStateChanged', {
                detail: { 
                    user: this.currentUser, 
                    credits: this.credits 
                }
            }));
        }

        /**
         * 更新UI显示
         */
        updateUI() {
            this.updateUserDisplay();
            this.updateCreditsDisplay();
        }

        /**
         * 更新用户显示 - 优化版本
         */
        updateUserDisplay() {
            const signinBtn = document.querySelector('.signin-btn');
            
            if (signinBtn) {
                // 保存原有的onclick属性
                const originalOnclick = signinBtn.getAttribute('onclick');
                
                if (this.currentUser) {
                    // 检查是否在Pricing页面
                    const isPricingPage = window.location.pathname.includes('pricing.html');
                    
                    // 已登录状态 - 根据页面显示不同样式
                    const newHTML = `
                        <div class="user-avatar" style="${isPricingPage ? 'border: none; padding: 0; background: none;' : ''}">
                            <img src="${this.currentUser.avatar_url || 'https://via.placeholder.com/32'}" 
                                 alt="User Avatar" style="${isPricingPage ? 'border: none;' : ''}">
                        </div>
                    `;
                    
                    // 只有内容不同时才更新，避免不必要的DOM操作
                    if (signinBtn.innerHTML.trim() !== newHTML.trim()) {
                        signinBtn.innerHTML = newHTML;
                        signinBtn.classList.add('logged-in');
                        
                        // Pricing页面特殊样式处理
                        if (isPricingPage) {
                            signinBtn.style.border = 'none';
                            signinBtn.style.padding = '4px';
                            signinBtn.style.background = 'none';
                        }
                        
                        // 检查是否为移动端，如果是则不改变点击事件
                        const isMobile = window.innerWidth <= 768;
                        if (!isMobile && window.toggleUserDropdown) {
                            // 桌面端：更改点击事件为显示下拉菜单
                            signinBtn.onclick = window.toggleUserDropdown;
                        } else {
                            // 移动端：保持原有的onclick属性
                            if (originalOnclick) {
                                signinBtn.setAttribute('onclick', originalOnclick);
                            }
                        }
                    }
                } else {
                    // 未登录状态
                    const newHTML = `
                        <div class="google-icon"></div>
                        <span>Sign in</span>
                    `;
                    
                    // 只有内容不同时才更新
                    if (signinBtn.innerHTML.trim() !== newHTML.trim()) {
                        signinBtn.innerHTML = newHTML;
                        signinBtn.classList.remove('logged-in');
                        
                        // 恢复原有的onclick属性
                        if (originalOnclick) {
                            signinBtn.setAttribute('onclick', originalOnclick);
                        }
                    }
                }
            }
        }

        /**
         * 更新积分显示
         */
        updateCreditsDisplay() {
            // 更新所有可能的积分显示元素
            const creditsElements = [
                document.getElementById('creditsAmount'),
                document.querySelector('[data-auth-credits]'),
                document.querySelector('.credits-amount')
            ].filter(Boolean);

            creditsElements.forEach(el => {
                if (el) {
                    el.textContent = this.credits;
                    
                    // 添加更新动画效果
                    el.style.transition = 'all 0.3s ease';
                    el.style.color = '#10b981';
                    setTimeout(() => {
                        el.style.color = '';
                    }, 500);
                }
            });

            // 确保积分显示区域可见
            const creditsDisplay = document.getElementById('creditsDisplay');
            if (creditsDisplay) {
                creditsDisplay.style.display = 'flex';
            }
        }

        /**
         * 添加状态变更监听器
         */
        addListener(callback) {
            this.listeners.push(callback);
        }

        /**
         * 移除状态变更监听器
         */
        removeListener(callback) {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        }

        /**
         * 通知所有监听器
         */
        notifyListeners(event, data) {
            this.listeners.forEach(callback => {
                try {
                    callback(event, data);
                } catch (error) {
                    console.error('❌ 监听器执行失败:', error);
                }
            });
        }

        /**
         * 登录
         */
        async signIn() {
            if (!this.supabaseClient?.auth) {
                throw new Error('Supabase client not available');
            }

            const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + window.location.pathname,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) {
                throw error;
            }

            return data;
        }

        /**
         * 登出
         */
        async signOut() {
            if (this.supabaseClient?.auth) {
                await this.supabaseClient.auth.signOut();
            }
            await this.setUser(null, true);
        }

        /**
         * 获取当前用户
         */
        getCurrentUser() {
            return this.currentUser;
        }

        /**
         * 获取当前积分
         */
        getCredits() {
            return this.credits;
        }

        /**
         * 扣除积分
         */
        async deductCredits(amount) {
            if (!this.currentUser) {
                console.error('❌ 用户未登录，无法扣除积分');
                return false;
            }

            if (this.credits < amount) {
                console.error('❌ 积分不足，无法扣除');
                return false;
            }

            const oldCredits = this.credits;

            try {
                // 先本地扣除
                this.setCredits(this.credits - amount, true);

                // 调用API更新数据库
                await this.updateCreditsInDatabase(this.credits, amount, 'SPEND', '图像生成消费');

                console.log(`✅ 积分扣除成功: ${oldCredits} → ${this.credits} (-${amount})`);
                return true;

            } catch (error) {
                console.error('❌ 积分扣除失败，回滚本地积分:', error);
                
                // 回滚本地积分
                this.setCredits(oldCredits, true);
                return false;
            }
        }

        /**
         * 更新数据库中的积分
         */
        async updateCreditsInDatabase(newCredits, amount, type, description) {
            if (!this.currentUser || !this.supabaseClient) {
                throw new Error('用户未登录或Supabase客户端不可用');
            }

            // 获取访问令牌
            let token = this.currentUser.access_token;
            if (!token && this.supabaseClient?.auth) {
                const { data: { session } } = await this.supabaseClient.auth.getSession();
                token = session?.access_token;
            }

            if (!token) {
                throw new Error('无法获取访问令牌');
            }

            // 更新用户积分
            const { error: updateError } = await this.supabaseClient
                .from('users')
                .update({
                    credits: newCredits,
                    total_credits_used: (this.currentUser.total_credits_used || 0) + (type === 'SPEND' ? amount : 0),
                    total_credits_earned: (this.currentUser.total_credits_earned || 0) + (type === 'EARN' ? amount : 0)
                })
                .eq('uuid', this.currentUser.uuid);

            if (updateError) {
                throw new Error(`更新用户积分失败: ${updateError.message}`);
            }

            // 记录积分交易
            const { error: transactionError } = await this.supabaseClient
                .from('credit_transactions')
                .insert({
                    user_id: this.currentUser.id,
                    user_uuid: this.currentUser.uuid,
                    type: type,
                    amount: amount,
                    description: description,
                    transaction_type: type === 'SPEND' ? 'generation' : 'purchase'
                });

            if (transactionError) {
                console.warn('⚠️ 记录积分交易失败:', transactionError.message);
                // 不抛出错误，因为主要操作（更新积分）已成功
            }

            // 更新本地用户对象
            if (type === 'SPEND') {
                this.currentUser.total_credits_used = (this.currentUser.total_credits_used || 0) + amount;
            } else {
                this.currentUser.total_credits_earned = (this.currentUser.total_credits_earned || 0) + amount;
            }
        }

        /**
         * 增加积分
         */
        async addCredits(amount, description = '积分充值') {
            if (!this.currentUser) {
                console.error('❌ 用户未登录，无法增加积分');
                return false;
            }

            if (amount <= 0) {
                console.error('❌ 积分数量必须大于0');
                return false;
            }

            const oldCredits = this.credits;

            try {
                // 先本地增加
                this.setCredits(this.credits + amount, true);

                // 调用API更新数据库
                await this.updateCreditsInDatabase(this.credits, amount, 'EARN', description);

                console.log(`✅ 积分增加成功: ${oldCredits} → ${this.credits} (+${amount})`);
                return true;

            } catch (error) {
                console.error('❌ 积分增加失败，回滚本地积分:', error);
                
                // 回滚本地积分
                this.setCredits(oldCredits, true);
                return false;
            }
        }
    }

    // 创建全局单例实例
    window.UnifiedStateSync = new UnifiedStateSync();
    
    // 兼容性别名
    window.userStateSync = window.UnifiedStateSync;
    window.creditsSync = window.UnifiedStateSync;

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.UnifiedStateSync.initialize();
        });
    } else {
        // 延迟初始化，确保其他脚本加载完成
        setTimeout(() => {
            window.UnifiedStateSync.initialize();
        }, 100);
    }

    console.log('✅ UnifiedStateSync 模块已加载');

})(window);