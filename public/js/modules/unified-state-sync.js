/**
 * 统一状态同步模块
 * 
 * 这个模块负责在前端应用中同步用户状态、积分和订阅信息
 * 它提供了一个统一的接口来处理用户认证、积分查询和状态更新
 */

// 初始化统一状态同步模块
(function(window) {
    'use strict';

    // 防止重复加载
    if (window.UnifiedStateSync) {
        console.log('UnifiedStateSync already loaded');
        return;
    }

    /**
     * 统一状态同步类
     */
    class UnifiedStateSync {
        constructor() {
            // 基本配置
            this.config = {
                supabaseUrl: 'https://gdcjvqaqgvcxzufmessy.supabase.co',
                supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI',
                creditsUpdateInterval: 30000, // 30秒更新一次积分
                debugMode: false // 调试模式
            };

            // 状态变量
            this.state = {
                isInitialized: false,
                isAuthenticated: false,
                isLoading: false,
                user: null,
                credits: 0,
                subscription: null,
                lastUpdated: null
            };

            // 事件监听器
            this.eventListeners = {
                'auth-state-change': [],
                'credits-update': [],
                'subscription-update': [],
                'error': []
            };

            // Supabase客户端
            this.supabaseClient = null;

            // 定时器
            this.creditsUpdateTimer = null;

            console.log('🔄 UnifiedStateSync created');
        }

        /**
         * 初始化模块
         */
        async initialize() {
            if (this.state.isInitialized) {
                console.log('UnifiedStateSync already initialized');
                return this.state;
            }

            try {
                console.log('🚀 初始化UnifiedStateSync...');
                this.state.isLoading = true;

                // 初始化Supabase客户端
                await this._initSupabase();

                // 设置认证状态监听
                this._setupAuthListener();

                // 获取初始用户状态
                await this._fetchInitialState();

                // 设置定时更新
                this._setupPeriodicUpdates();

                this.state.isInitialized = true;
                this.state.isLoading = false;
                console.log('✅ UnifiedStateSync初始化完成');

                return this.state;
            } catch (error) {
                console.error('❌ UnifiedStateSync初始化失败:', error);
                this.state.isLoading = false;
                this._triggerEvent('error', { message: '初始化失败', error });
                throw error;
            }
        }

        /**
         * 初始化Supabase客户端
         */
        async _initSupabase() {
            try {
                // 检查是否已经有全局Supabase客户端
                if (window.supabaseClient) {
                    this.supabaseClient = window.supabaseClient;
                    console.log('✅ 使用现有的Supabase客户端');
                    return;
                }

                // 检查是否有Supabase库
                if (!window.supabase) {
                    console.log('⚠️ Supabase库未加载，尝试动态加载...');
                    
                    // 动态加载Supabase库
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                        script.onload = resolve;
                        script.onerror = () => reject(new Error('无法加载Supabase库'));
                        document.head.appendChild(script);
                    });
                    
                    console.log('✅ Supabase库加载成功');
                }

                // 创建Supabase客户端
                this.supabaseClient = window.supabase.createClient(
                    this.config.supabaseUrl,
                    this.config.supabaseKey
                );

                // 设置全局Supabase客户端
                window.supabaseClient = this.supabaseClient;
                console.log('✅ Supabase客户端初始化成功');
            } catch (error) {
                console.error('❌ 初始化Supabase客户端失败:', error);
                throw error;
            }
        }

        /**
         * 设置认证状态监听
         */
        _setupAuthListener() {
            this.supabaseClient.auth.onAuthStateChange(async (event, session) => {
                console.log('🔄 认证状态变化:', event);
                
                const previousAuthState = this.state.isAuthenticated;
                this.state.isAuthenticated = !!session;
                this.state.user = session?.user || null;

                // 触发认证状态变化事件
                this._triggerEvent('auth-state-change', {
                    event,
                    isAuthenticated: this.state.isAuthenticated,
                    user: this.state.user
                });

                // 如果用户登录或会话恢复，获取用户积分和订阅信息
                if (this.state.isAuthenticated && (!previousAuthState || event === 'SIGNED_IN')) {
                    await this._fetchUserCredits();
                    await this._fetchUserSubscription();
                }

                // 如果用户登出，重置状态
                if (event === 'SIGNED_OUT') {
                    this.state.credits = 0;
                    this.state.subscription = null;
                    this._triggerEvent('credits-update', { credits: 0 });
                    this._triggerEvent('subscription-update', { subscription: null });
                }
            });
        }

        /**
         * 获取初始用户状态
         */
        async _fetchInitialState() {
            try {
                // 获取当前会话
                const { data: { session } } = await this.supabaseClient.auth.getSession();
                
                this.state.isAuthenticated = !!session;
                this.state.user = session?.user || null;

                // 如果已认证，只获取用户订阅信息，不再获取积分信息
                if (this.state.isAuthenticated) {
                    // 不再获取用户积分
                    // await this._fetchUserCredits();
                    await this._fetchUserSubscription();
                }
            } catch (error) {
                console.error('❌ 获取初始用户状态失败:', error);
                throw error;
            }
        }

        /**
         * 设置定时更新
         */
        _setupPeriodicUpdates() {
            // 清除现有定时器
            if (this.creditsUpdateTimer) {
                clearInterval(this.creditsUpdateTimer);
            }

            // 不再设置积分更新定时器
            // this.creditsUpdateTimer = setInterval(async () => {
            //     if (this.state.isAuthenticated) {
            //         try {
            //             await this._fetchUserCredits();
            //         } catch (error) {
            //             console.error('❌ 定时更新积分失败:', error);
            //         }
            //     }
            // }, this.config.creditsUpdateInterval);
        }

        /**
         * 获取用户积分
         */
        async _fetchUserCredits() {
            if (!this.state.isAuthenticated || !this.state.user) {
                console.warn('⚠️ 尝试获取积分但用户未认证');
                return;
            }

            try {
                console.log('🔄 获取用户积分...');
                
                // 获取用户ID
                const userId = this.state.user.id;
                
                // 查询用户积分
                const { data, error } = await this.supabaseClient
                    .from('users')
                    .select('credits')
                    .eq('google_user_id', userId)
                    .maybeSingle();

                if (error) {
                    console.error('❌ 获取用户积分失败:', error);
                    throw error;
                }

                // 更新积分状态
                const previousCredits = this.state.credits;
                this.state.credits = data?.credits || 0;
                this.state.lastUpdated = new Date();

                // 如果积分发生变化，触发事件
                if (previousCredits !== this.state.credits) {
                    console.log('✅ 用户积分已更新:', this.state.credits);
                    this._triggerEvent('credits-update', { credits: this.state.credits });
                }

                return this.state.credits;
            } catch (error) {
                console.error('❌ 获取用户积分异常:', error);
                this._triggerEvent('error', { message: '获取积分失败', error });
                throw error;
            }
        }

        /**
         * 获取用户订阅信息
         */
        async _fetchUserSubscription() {
            if (!this.state.isAuthenticated || !this.state.user) {
                console.warn('⚠️ 尝试获取订阅信息但用户未认证');
                return;
            }

            try {
                console.log('🔄 获取用户订阅信息...');
                
                // 获取用户ID
                const userId = this.state.user.id;
                
                // 查询用户订阅
                const { data, error } = await this.supabaseClient
                    .from('users')
                    .select(`
                        id,
                        subscriptions (
                            id,
                            plan_type,
                            status,
                            created_at,
                            updated_at
                        )
                    `)
                    .eq('google_user_id', userId)
                    .maybeSingle();

                if (error) {
                    console.error('❌ 获取用户订阅信息失败:', error);
                    throw error;
                }

                // 更新订阅状态
                const activeSubscription = data?.subscriptions?.find(sub => 
                    sub.status === 'ACTIVE' || sub.status === 'APPROVED'
                );
                
                this.state.subscription = activeSubscription || null;

                // 触发订阅更新事件
                console.log('✅ 用户订阅信息已更新:', this.state.subscription);
                this._triggerEvent('subscription-update', { subscription: this.state.subscription });

                return this.state.subscription;
            } catch (error) {
                console.error('❌ 获取用户订阅信息异常:', error);
                this._triggerEvent('error', { message: '获取订阅信息失败', error });
                throw error;
            }
        }

        /**
         * 使用积分
         */
        async useCredits(amount) {
            if (!this.state.isAuthenticated) {
                console.error('❌ 用户未认证，无法使用积分');
                throw new Error('用户未认证，请先登录');
            }

            if (this.state.credits < amount) {
                console.error('❌ 积分不足');
                throw new Error('积分不足，请充值');
            }

            try {
                console.log(`🔄 使用${amount}积分...`);
                
                // 获取用户ID
                const userId = this.state.user.id;
                
                // 调用RPC函数使用积分
                const { data, error } = await this.supabaseClient
                    .rpc('use_credits', { 
                        user_google_id: userId,
                        amount: amount
                    });

                if (error) {
                    console.error('❌ 使用积分失败:', error);
                    throw error;
                }

                // 更新本地积分状态
                this.state.credits -= amount;
                this._triggerEvent('credits-update', { credits: this.state.credits });

                console.log('✅ 积分使用成功，剩余:', this.state.credits);
                return this.state.credits;
            } catch (error) {
                console.error('❌ 使用积分异常:', error);
                this._triggerEvent('error', { message: '使用积分失败', error });
                throw error;
            }
        }

        /**
         * 添加积分
         */
        async addCredits(amount) {
            if (!this.state.isAuthenticated) {
                console.error('❌ 用户未认证，无法添加积分');
                throw new Error('用户未认证，请先登录');
            }

            try {
                console.log(`🔄 添加${amount}积分...`);
                
                // 获取用户ID
                const userId = this.state.user.id;
                
                // 调用RPC函数添加积分
                const { data, error } = await this.supabaseClient
                    .rpc('add_credits', { 
                        user_google_id: userId,
                        amount: amount
                    });

                if (error) {
                    console.error('❌ 添加积分失败:', error);
                    throw error;
                }

                // 更新本地积分状态
                this.state.credits += amount;
                this._triggerEvent('credits-update', { credits: this.state.credits });

                console.log('✅ 积分添加成功，现有:', this.state.credits);
                return this.state.credits;
            } catch (error) {
                console.error('❌ 添加积分异常:', error);
                this._triggerEvent('error', { message: '添加积分失败', error });
                throw error;
            }
        }

        /**
         * 登录
         */
        async signIn() {
            try {
                console.log('🔄 开始登录流程...');
                
                const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + window.location.pathname,
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent'
                        }
                    }
                });

                if (error) {
                    console.error('❌ 登录失败:', error);
                    throw error;
                }

                console.log('✅ 登录流程已启动');
                return data;
            } catch (error) {
                console.error('❌ 登录异常:', error);
                this._triggerEvent('error', { message: '登录失败', error });
                throw error;
            }
        }

        /**
         * 登出
         */
        async signOut() {
            try {
                console.log('🔄 开始登出流程...');
                
                const { error } = await this.supabaseClient.auth.signOut();

                if (error) {
                    console.error('❌ 登出失败:', error);
                    throw error;
                }

                console.log('✅ 登出成功');
                return true;
            } catch (error) {
                console.error('❌ 登出异常:', error);
                this._triggerEvent('error', { message: '登出失败', error });
                throw error;
            }
        }

        /**
         * 获取当前状态
         */
        getState() {
            return { ...this.state };
        }

        /**
         * 添加事件监听器
         */
        addEventListener(event, callback) {
            if (!this.eventListeners[event]) {
                this.eventListeners[event] = [];
            }
            this.eventListeners[event].push(callback);
            return () => this.removeEventListener(event, callback);
        }

        /**
         * 移除事件监听器
         */
        removeEventListener(event, callback) {
            if (!this.eventListeners[event]) return;
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }

        /**
         * 触发事件
         */
        _triggerEvent(event, data) {
            if (!this.eventListeners[event]) return;
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ 事件监听器错误 (${event}):`, error);
                }
            });
        }

        /**
         * 设置调试模式
         */
        setDebugMode(enabled) {
            this.config.debugMode = enabled;
            console.log(`🔧 调试模式: ${enabled ? '开启' : '关闭'}`);
        }
    }

    // 创建全局单例实例
    window.UnifiedStateSync = new UnifiedStateSync();

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.UnifiedStateSync.initialize().catch(err => {
                console.error('自动初始化UnifiedStateSync失败:', err);
            });
        });
    } else {
        // 延迟初始化，确保其他脚本加载完成
        setTimeout(() => {
            window.UnifiedStateSync.initialize().catch(err => {
                console.error('自动初始化UnifiedStateSync失败:', err);
            });
        }, 100);
    }

    console.log('✅ UnifiedStateSync 模块已加载');

})(window);