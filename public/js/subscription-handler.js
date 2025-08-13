/**
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
                this.updateButtonsState(false, '正在验证身份...'); // 初始化时禁用按钮

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

                // 监听认证状态变化，动态更新UI
                this.supabaseClient.auth.onAuthStateChange((event, session) => {
                    console.log('Supabase auth state changed:', event);
                    this.currentUser = session?.user || null;
                    this.updateButtonsState(!!this.currentUser);
                });

                // 检查初始会话状态
                const { data: { session } } = await this.supabaseClient.auth.getSession();
                this.currentUser = session?.user || null;
                this.updateButtonsState(!!this.currentUser);

                // 添加订阅按钮事件监听器
                this.setupSubscriptionButtons();

                this.isInitialized = true;
                console.log('✅ 订阅处理器初始化完成');

            } catch (error) {
                console.error('❌ 订阅处理器初始化失败:', error);
                this.updateButtonsState(false, '初始化失败');
            }
        }

        /**
         * 更新所有订阅按钮的状态
         */
        updateButtonsState(enabled, message = '请先登录') {
            const subscriptionButtons = document.querySelectorAll('.subscription-btn, .buy-credits-btn, [data-plan-id]');
            subscriptionButtons.forEach(button => {
                if (enabled) {
                    button.disabled = false;
                    // 恢复按钮原始文本
                    if (button.dataset.originalText) {
                        button.innerHTML = button.dataset.originalText;
                    }
                } else {
                    // 保存按钮原始文本（如果尚未保存）
                    if (!button.dataset.originalText) {
                        button.dataset.originalText = button.innerHTML;
                    }
                    button.innerHTML = message;
                    button.disabled = true;
                }
            });
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
                        this.showError(error.message || '创建订阅失败，请重试或联系客服');

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
            // 按钮状态已确保用户登录，但作为安全保障，再次检查
            if (!this.currentUser) {
                console.error('❌ 创建订阅错误: 用户未认证。按钮本应被禁用。');
                this.showError('请先登录后再试。');
                await this.handleLogin(); // 再次尝试触发登录
                return;
            }

            try {
                console.log('🔄 创建订阅...', planId, planType);

                // 关键步骤: 从已认证的 this.currentUser 对象中安全地获取 Google 用户 ID 和邮箱。
                // 这是整个订阅流程的核心身份标识，确保了订阅与正确的用户关联。
                const googleUserId = this.currentUser.id || this.currentUser.uuid;
                const googleUserEmail = this.currentUser.email;

                if (!googleUserId || !googleUserEmail) {
                    // 这个错误理论上不应该发生，因为按钮在用户认证前是禁用的。
                    // 但作为一道额外的保险，我们在这里进行检查。
                    throw new Error('用户信息不完整，无法创建订阅');
                }

                // 获取当前环境的API路径
                const apiPath = window.location.hostname === 'localhost' ?
                    'http://localhost:3000/api/simple-paypal-subscription' :
                    '/api/simple-paypal-subscription';

                console.log(`🔄 使用API路径: ${apiPath}`);

                try {
                    const paypalResponse = await fetch(apiPath, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            planType: planType.toLowerCase(), // PayPal API 需要小写的计划类型
                            user_id: googleUserId,
                            email: googleUserEmail
                        })
                    });

                    console.log('🔄 PayPal API 响应状态:', paypalResponse.status);

                    // 获取响应文本以便调试
                    const responseText = await paypalResponse.text();
                    console.log('🔄 PayPal API 响应文本:', responseText);

                    // 尝试解析为JSON
                    let paypalData;
                    try {
                        paypalData = JSON.parse(responseText);
                        console.log('🔄 PayPal API 响应数据:', paypalData);
                    } catch (e) {
                        console.error('❌ 解析PayPal响应失败:', e);
                        throw new Error('无法解析PayPal响应: ' + responseText.substring(0, 100));
                    }

                    if (!paypalResponse.ok) {
                        let errorMessage = '创建订阅失败';
                        if (paypalData) {
                            console.error('PayPal API 错误:', paypalData);
                            errorMessage = paypalData.error || paypalData.message ||
                                          (paypalData.details && paypalData.details.message) ||
                                          '创建订阅失败 (错误码: ' + paypalResponse.status + ')';
                        }
                        throw new Error(errorMessage);
                    }
                } catch (fetchError) {
                    console.error('❌ PayPal API 请求失败:', fetchError);
                    throw new Error('连接PayPal服务失败: ' + fetchError.message);
                }

                // 重新获取响应以确保我们有正确的数据
                const paypalResponse = await fetch(apiPath, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        planType: planType.toLowerCase(),
                        user_id: googleUserId,
                        email: googleUserEmail
                    })
                });

                if (!paypalResponse.ok) {
                    throw new Error('创建订阅失败，请稍后再试');
                }

                let paypalData;
                try {
                    paypalData = await paypalResponse.json();
                    console.log('✅ PayPal订阅创建成功:', paypalData);

                    if (!paypalData.success) {
                        throw new Error('PayPal 返回了失败状态');
                    }

                    if (!paypalData.links) {
                        console.error('❌ PayPal 返回数据缺少links字段:', paypalData);
                        throw new Error('PayPal 返回的数据格式不正确 (缺少links)');
                    }
                } catch (jsonError) {
                    console.error('❌ 解析PayPal成功响应失败:', jsonError);
                    throw new Error('处理PayPal响应时出错: ' + jsonError.message);
                }

                // 查找PayPal批准链接
                const approveLink = paypalData.links.find(link => link.rel === 'approve');
                if (!approveLink || !approveLink.href) {
                    throw new Error('未找到PayPal批准链接');
                }

                // 保存订阅关联
                const subscriptionAssociation = {
                    googleUserId,
                    googleUserEmail,
                    paypalSubscriptionId: paypalData.subscriptionID,
                    planId,
                    planType
                };

                // 调用API保存订阅关联
                const response = await fetch('/api/handle-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(subscriptionAssociation)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.warn('保存订阅关联失败，但继续PayPal流程:', errorData);
                } else {
                    const data = await response.json();
                    console.log('✅ 订阅关联保存成功:', data);
                }

                // 重定向到PayPal批准页面
                console.log('🔄 重定向到PayPal批准页面:', approveLink.href);
                window.location.href = approveLink.href;

            } catch (error) {
                console.error('❌ 创建订阅失败:', error);
                this.showError(error.message || 'Failed to create subscription. Please try again or contact support.');
                throw error;
            }
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
            console.error('❌ 显示错误:', message);

            // 检查是否已存在错误消息元素
            let errorElement = document.getElementById('subscription-error');

            if (!errorElement) {
                // 创建错误消息元素
                errorElement = document.createElement('div');
                errorElement.id = 'subscription-error';
                errorElement.style.cssText = 'position: fixed; top: 20px; right: 20px; background-color: #f44336; color: white; padding: 15px; border-radius: 4px; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2); max-width: 80%; word-wrap: break-word;';
                document.body.appendChild(errorElement);
            }

            // 设置错误消息
            errorElement.textContent = message;

            // 显示错误消息
            errorElement.style.display = 'block';

            // 添加关闭按钮
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.style.cssText = 'position: absolute; top: 5px; right: 10px; cursor: pointer; font-size: 18px;';
            closeButton.onclick = function() {
                errorElement.style.display = 'none';
            };
            errorElement.appendChild(closeButton);

            // 10秒后自动隐藏
            setTimeout(() => {
                if (errorElement.style.display !== 'none') {
                    errorElement.style.display = 'none';
                }
            }, 10000);
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