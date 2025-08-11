/**
 * 订阅处理函数
 * 
 * 这个文件处理订阅流程，确保用户能够成功创建订阅
 */

// 初始化订阅处理器
(function(window) {
    'use strict';

    // 防止重复加载
    if (window.SubscriptionHandler) {
        console.log('SubscriptionHandler already loaded');
        return;
    }

    /**
     * 订阅处理器
     */
    class SubscriptionHandler {
        constructor() {
            this.isInitialized = false;
            this.supabaseClient = null;
            this.currentUser = null;
            
            console.log('🔄 SubscriptionHandler initialized');
        }

        /**
         * 初始化订阅处理器
         */
        async initialize() {
            if (this.isInitialized) return;

            try {
                console.log('🚀 初始化订阅处理器...');

                // 获取Supabase客户端
                this.supabaseClient = window.supabaseClient;
                
                // 如果没有找到客户端，尝试从UnifiedStateSync获取
                if (!this.supabaseClient && window.UnifiedStateSync) {
                    await window.UnifiedStateSync.initialize();
                    this.supabaseClient = window.supabaseClient;
                }
                
                // 如果仍然没有找到，尝试创建新的客户端
                if (!this.supabaseClient && window.supabase) {
                    const url = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
                    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
                    this.supabaseClient = window.supabase.createClient(url, key);
                    window.supabaseClient = this.supabaseClient;
                }
                
                if (!this.supabaseClient) {
                    throw new Error('无法获取Supabase客户端');
                }
                
                // 获取当前用户
                if (window.UnifiedStateSync) {
                    this.currentUser = window.UnifiedStateSync.getCurrentUser();
                } else if (window.currentUser) {
                    this.currentUser = window.currentUser;
                } else {
                    const { data: { session } } = await this.supabaseClient.auth.getSession();
                    if (session?.user) {
                        this.currentUser = session.user;
                    }
                }
                
                // 添加订阅按钮事件监听器
                this.setupSubscriptionButtons();
                
                this.isInitialized = true;
                console.log('✅ 订阅处理器初始化完成');
                
            } catch (error) {
                console.error('❌ 订阅处理器初始化失败:', error);
            }
        }
        
        /**
         * 设置订阅按钮事件监听器
         */
        setupSubscriptionButtons() {
            // 查找所有订阅按钮
            const subscriptionButtons = document.querySelectorAll('.subscription-btn, .buy-credits-btn, [data-plan-id]');
            
            subscriptionButtons.forEach(button => {
                // 避免重复添加事件监听器
                if (button.dataset.subscriptionHandlerInitialized) return;
                
                button.dataset.subscriptionHandlerInitialized = 'true';
                
                button.addEventListener('click', async (event) => {
                    event.preventDefault();
                    
                    // 获取计划ID
                    const planId = button.dataset.planId || button.getAttribute('data-plan-id');
                    const planType = button.dataset.planType || button.getAttribute('data-plan-type') || 'PRO';
                    
                    if (!planId) {
                        console.error('❌ 未找到计划ID');
                        this.showError('订阅计划配置错误，请联系客服');
                        return;
                    }
                    
                    try {
                        // 显示加载状态
                        this.showLoading(button);
                        
                        // 创建订阅
                        await this.createSubscription(planId, planType, button);
                        
                    } catch (error) {
                        console.error('❌ 创建订阅失败:', error);
                        this.showError('创建订阅失败，请重试或联系客服');
                        
                        // 恢复按钮状态
                        this.hideLoading(button);
                    }
                });
            });
        }
        
        /**
         * 创建订阅
         */
        async createSubscription(planId, planType, buttonElement) {
            if (!this.currentUser) {
                // 如果用户未登录，先触发登录
                await this.handleLogin();
                return;
            }
            
            try {
                console.log('🔄 创建订阅...', planId, planType);
                
                // 获取用户信息
                const googleUserId = this.currentUser.id || this.currentUser.uuid;
                const googleUserEmail = this.currentUser.email;
                
                if (!googleUserId || !googleUserEmail) {
                    throw new Error('用户信息不完整');
                }
                
                // 生成临时订阅ID
                const tempSubscriptionId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
                
                // 准备订阅数据
                const subscriptionData = {
                    googleUserId,
                    googleUserEmail,
                    paypalSubscriptionId: tempSubscriptionId,
                    planId,
                    planType
                };
                
                // 调用API创建订阅
                const response = await fetch('/api/handle-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(subscriptionData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '创建订阅失败');
                }
                
                const data = await response.json();
                console.log('✅ 订阅创建成功:', data);
                
                // 重定向到PayPal支付页面
                this.redirectToPayPal(planId, googleUserId, googleUserEmail);
                
            } catch (error) {
                console.error('❌ 创建订阅失败:', error);
                this.showError('Failed to create subscription. Please try again or contact support.');
                throw error;
            }
        }
        
        /**
         * 重定向到PayPal支付页面
         */
        redirectToPayPal(planId, userId, userEmail) {
            // 构建PayPal支付URL
            const baseUrl = 'https://www.paypal.com/cgi-bin/webscr';
            
            // 确定商品ID和价格
            let itemName, itemAmount;
            
            if (planId === 'P-5S785818YS7424947NCJBKQA') {
                itemName = 'Pro Plan - 1000 Credits';
                itemAmount = '9.99';
            } else if (planId === 'P-3NJ78684DS796242VNCJBKQQ') {
                itemName = 'Max Plan - 5000 Credits';
                itemAmount = '29.99';
            } else {
                itemName = 'Subscription Plan';
                itemAmount = '9.99';
            }
            
            // 创建用户数据JSON
            const customData = JSON.stringify({
                user_id: userId,
                email: userEmail,
                plan_id: planId
            });
            
            // 构建查询参数
            const params = new URLSearchParams({
                cmd: '_xclick-subscriptions',
                business: 'sb-43wjqz28357913@business.example.com', // 测试账号
                item_name: itemName,
                custom: customData,
                currency_code: 'USD',
                a3: itemAmount,
                p3: 1,
                t3: 'M', // 月度订阅
                src: 1, // 重复付款
                no_note: 1,
                return: window.location.origin + '/account?success=true',
                cancel_return: window.location.origin + '/pricing?canceled=true',
                notify_url: window.location.origin + '/api/paypal-webhook'
            });
            
            // 重定向到PayPal
            const paypalUrl = baseUrl + '?' + params.toString();
            console.log('🔄 重定向到PayPal:', paypalUrl);
            
            window.location.href = paypalUrl;
        }
        
        /**
         * 处理登录
         */
        async handleLogin() {
            try {
                // 如果有UnifiedStateSync，使用它的登录方法
                if (window.UnifiedStateSync) {
                    await window.UnifiedStateSync.signIn();
                    return;
                }
                
                // 否则使用Supabase直接登录
                if (this.supabaseClient?.auth) {
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
                        throw error;
                    }
                    
                    return data;
                }
                
                throw new Error('无法执行登录');
                
            } catch (error) {
                console.error('❌ 登录失败:', error);
                this.showError('登录失败，请重试');
                throw error;
            }
        }
        
        /**
         * 显示加载状态
         */
        showLoading(button) {
            // 保存原始文本
            button.dataset.originalText = button.innerHTML;
            
            // 显示加载状态
            button.innerHTML = '<span class="loading-spinner"></span> Processing...';
            button.disabled = true;
        }
        
        /**
         * 隐藏加载状态
         */
        hideLoading(button) {
            // 恢复原始文本
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
            button.disabled = false;
        }
        
        /**
         * 显示错误消息
         */
        showError(message) {
            // 检查是否已存在错误消息元素
            let errorElement = document.getElementById('subscription-error');
            
            if (!errorElement) {
                // 创建错误消息元素
                errorElement = document.createElement('div');
                errorElement.id = 'subscription-error';
                errorElement.style.cssText = 'position: fixed; top: 20px; right: 20px; background-color: #f44336; color: white; padding: 15px; border-radius: 4px; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
                document.body.appendChild(errorElement);
            }
            
            // 设置错误消息
            errorElement.textContent = message;
            
            // 显示错误消息
            errorElement.style.display = 'block';
            
            // 3秒后自动隐藏
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 3000);
        }
    }
    
    // 创建全局单例实例
    window.SubscriptionHandler = new SubscriptionHandler();
    
    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SubscriptionHandler.initialize();
        });
    } else {
        // 延迟初始化，确保其他脚本加载完成
        setTimeout(() => {
            window.SubscriptionHandler.initialize();
        }, 100);
    }
    
    console.log('✅ SubscriptionHandler 模块已加载');
    
})(window);
