/**
 * 订阅功能调试工具
 * 
 * 这个脚本提供了一组工具函数，用于调试和诊断订阅功能问题
 */

// 初始化订阅调试工具
(function(window) {
    'use strict';

    // 防止重复加载
    if (window.SubscriptionDebug) {
        console.log('SubscriptionDebug already loaded');
        return;
    }

    /**
     * 订阅调试工具类
     */
    class SubscriptionDebug {
        constructor() {
            // 基本配置
            this.config = {
                supabaseUrl: 'https://gdcjvqaqgvcxzufmessy.supabase.co',
                supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI',
                paypalApiBase: 'https://api-m.sandbox.paypal.com',
                debugElementId: 'subscription-debug-output'
            };

            // Supabase客户端
            this.supabaseClient = null;

            // 调试输出元素
            this.debugElement = null;

            console.log('🔄 SubscriptionDebug initialized');
        }

        /**
         * 初始化调试工具
         */
        async initialize() {
            try {
                console.log('🚀 初始化订阅调试工具...');

                // 初始化Supabase客户端
                await this._initSupabase();

                // 创建调试输出元素
                this._createDebugElement();

                console.log('✅ 订阅调试工具初始化完成');
                this.log('✅ 订阅调试工具初始化完成');

                return true;
            } catch (error) {
                console.error('❌ 订阅调试工具初始化失败:', error);
                this.log('❌ 订阅调试工具初始化失败: ' + error.message, 'error');
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
         * 创建调试输出元素
         */
        _createDebugElement() {
            // 检查是否已存在调试输出元素
            this.debugElement = document.getElementById(this.config.debugElementId);

            if (!this.debugElement) {
                // 创建调试输出元素
                this.debugElement = document.createElement('div');
                this.debugElement.id = this.config.debugElementId;
                this.debugElement.style.cssText = 'background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin: 20px 0; font-family: monospace; white-space: pre-wrap; max-height: 500px; overflow-y: auto;';
                
                // 添加标题
                const title = document.createElement('h3');
                title.textContent = '订阅调试输出';
                title.style.cssText = 'margin-top: 0; margin-bottom: 10px; color: #343a40;';
                this.debugElement.appendChild(title);
                
                // 添加清除按钮
                const clearButton = document.createElement('button');
                clearButton.textContent = '清除输出';
                clearButton.style.cssText = 'background-color: #6c757d; color: white; border: none; border-radius: 4px; padding: 5px 10px; margin-bottom: 10px; cursor: pointer;';
                clearButton.onclick = () => this.clearLog();
                this.debugElement.appendChild(clearButton);
                
                // 添加输出容器
                const outputContainer = document.createElement('div');
                outputContainer.id = this.config.debugElementId + '-content';
                this.debugElement.appendChild(outputContainer);
                
                // 添加到文档
                document.body.appendChild(this.debugElement);
            }
        }

        /**
         * 记录调试信息
         */
        log(message, type = 'info') {
            // 确保调试元素存在
            if (!this.debugElement) {
                this._createDebugElement();
            }

            // 获取输出容器
            const outputContainer = document.getElementById(this.config.debugElementId + '-content');
            
            // 创建日志条目
            const logEntry = document.createElement('div');
            logEntry.style.cssText = 'margin-bottom: 5px; padding: 5px; border-left: 4px solid #6c757d;';
            
            // 设置不同类型的样式
            switch (type) {
                case 'error':
                    logEntry.style.borderColor = '#dc3545';
                    logEntry.style.backgroundColor = '#f8d7da';
                    break;
                case 'success':
                    logEntry.style.borderColor = '#28a745';
                    logEntry.style.backgroundColor = '#d4edda';
                    break;
                case 'warning':
                    logEntry.style.borderColor = '#ffc107';
                    logEntry.style.backgroundColor = '#fff3cd';
                    break;
                default:
                    logEntry.style.borderColor = '#17a2b8';
                    logEntry.style.backgroundColor = '#d1ecf1';
            }
            
            // 添加时间戳
            const timestamp = new Date().toLocaleTimeString();
            logEntry.innerHTML = `<span style="color: #6c757d; font-size: 0.8em;">[${timestamp}]</span> ${message}`;
            
            // 添加到输出容器
            outputContainer.appendChild(logEntry);
            
            // 滚动到底部
            this.debugElement.scrollTop = this.debugElement.scrollHeight;
        }

        /**
         * 清除调试日志
         */
        clearLog() {
            const outputContainer = document.getElementById(this.config.debugElementId + '-content');
            if (outputContainer) {
                outputContainer.innerHTML = '';
            }
        }

        /**
         * 检查用户认证状态
         */
        async checkAuthStatus() {
            try {
                this.log('🔄 检查用户认证状态...');
                
                // 获取当前会话
                const { data: { session }, error } = await this.supabaseClient.auth.getSession();
                
                if (error) {
                    this.log('❌ 获取会话失败: ' + error.message, 'error');
                    throw error;
                }
                
                if (session) {
                    this.log('✅ 用户已认证', 'success');
                    this.log(`📝 用户ID: ${session.user.id}`);
                    this.log(`📝 用户邮箱: ${session.user.email}`);
                    return session.user;
                } else {
                    this.log('⚠️ 用户未认证', 'warning');
                    return null;
                }
            } catch (error) {
                console.error('❌ 检查认证状态失败:', error);
                this.log('❌ 检查认证状态失败: ' + error.message, 'error');
                throw error;
            }
        }

        /**
         * 检查用户积分
         */
        async checkUserCredits(userId) {
            try {
                this.log('🔄 检查用户积分...');
                
                if (!userId) {
                    const user = await this.checkAuthStatus();
                    if (!user) {
                        this.log('⚠️ 无法检查积分: 用户未认证', 'warning');
                        return null;
                    }
                    userId = user.id;
                }
                
                // 查询用户积分
                const { data, error } = await this.supabaseClient
                    .from('users')
                    .select('id, credits, email')
                    .eq('google_user_id', userId)
                    .maybeSingle();
                
                if (error) {
                    this.log('❌ 查询用户积分失败: ' + error.message, 'error');
                    throw error;
                }
                
                if (data) {
                    this.log(`✅ 用户积分: ${data.credits}`, 'success');
                    this.log(`📝 用户ID: ${data.id}`);
                    this.log(`📝 用户邮箱: ${data.email}`);
                    return data;
                } else {
                    this.log('⚠️ 未找到用户记录', 'warning');
                    return null;
                }
            } catch (error) {
                console.error('❌ 检查用户积分失败:', error);
                this.log('❌ 检查用户积分失败: ' + error.message, 'error');
                throw error;
            }
        }

        /**
         * 检查用户订阅
         */
        async checkUserSubscription(userId) {
            try {
                this.log('🔄 检查用户订阅...');
                
                if (!userId) {
                    const user = await this.checkAuthStatus();
                    if (!user) {
                        this.log('⚠️ 无法检查订阅: 用户未认证', 'warning');
                        return null;
                    }
                    userId = user.id;
                }
                
                // 查询用户订阅
                const { data, error } = await this.supabaseClient
                    .from('users')
                    .select(`
                        id,
                        email,
                        subscriptions (
                            id,
                            paypal_subscription_id,
                            plan_type,
                            status,
                            created_at,
                            updated_at
                        )
                    `)
                    .eq('google_user_id', userId)
                    .maybeSingle();
                
                if (error) {
                    this.log('❌ 查询用户订阅失败: ' + error.message, 'error');
                    throw error;
                }
                
                if (data) {
                    if (data.subscriptions && data.subscriptions.length > 0) {
                        this.log(`✅ 找到${data.subscriptions.length}个订阅记录`, 'success');
                        
                        data.subscriptions.forEach((sub, index) => {
                            this.log(`📝 订阅 #${index + 1}:`);
                            this.log(`  - ID: ${sub.id}`);
                            this.log(`  - PayPal订阅ID: ${sub.paypal_subscription_id}`);
                            this.log(`  - 计划类型: ${sub.plan_type}`);
                            this.log(`  - 状态: ${sub.status}`);
                            this.log(`  - 创建时间: ${new Date(sub.created_at).toLocaleString()}`);
                            if (sub.updated_at) {
                                this.log(`  - 更新时间: ${new Date(sub.updated_at).toLocaleString()}`);
                            }
                        });
                        
                        return data;
                    } else {
                        this.log('⚠️ 未找到订阅记录', 'warning');
                        return data;
                    }
                } else {
                    this.log('⚠️ 未找到用户记录', 'warning');
                    return null;
                }
            } catch (error) {
                console.error('❌ 检查用户订阅失败:', error);
                this.log('❌ 检查用户订阅失败: ' + error.message, 'error');
                throw error;
            }
        }

        /**
         * 测试PayPal API连接
         */
        async testPayPalConnection() {
            try {
                this.log('🔄 测试PayPal API连接...');
                
                // 获取PayPal访问令牌
                const accessToken = await this._getPayPalAccessToken();
                
                if (accessToken) {
                    this.log('✅ PayPal API连接成功', 'success');
                    return true;
                } else {
                    this.log('❌ 无法获取PayPal访问令牌', 'error');
                    return false;
                }
            } catch (error) {
                console.error('❌ 测试PayPal连接失败:', error);
                this.log('❌ 测试PayPal连接失败: ' + error.message, 'error');
                return false;
            }
        }

        /**
         * 获取PayPal访问令牌
         */
        async _getPayPalAccessToken() {
            try {
                // 从环境变量或配置中获取PayPal凭证
                const clientId = process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID';
                const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'YOUR_PAYPAL_CLIENT_SECRET';
                
                // 使用Base64编码凭证
                const auth = btoa(`${clientId}:${clientSecret}`);
                
                // 发送请求获取访问令牌
                const response = await fetch(`${this.config.paypalApiBase}/v1/oauth2/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${auth}`
                    },
                    body: 'grant_type=client_credentials'
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    this.log(`❌ 获取PayPal访问令牌失败: ${response.status} - ${errorText}`, 'error');
                    return null;
                }
                
                const data = await response.json();
                this.log('✅ 成功获取PayPal访问令牌', 'success');
                return data.access_token;
            } catch (error) {
                console.error('❌ 获取PayPal访问令牌异常:', error);
                this.log('❌ 获取PayPal访问令牌异常: ' + error.message, 'error');
                return null;
            }
        }

        /**
         * 运行完整诊断
         */
        async runFullDiagnostic() {
            try {
                this.log('🚀 开始运行完整诊断...');
                
                // 检查认证状态
                const user = await this.checkAuthStatus();
                
                if (!user) {
                    this.log('⚠️ 无法继续诊断: 用户未认证', 'warning');
                    return;
                }
                
                // 检查用户积分
                await this.checkUserCredits(user.id);
                
                // 检查用户订阅
                await this.checkUserSubscription(user.id);
                
                // 测试PayPal连接
                await this.testPayPalConnection();
                
                this.log('✅ 完整诊断完成', 'success');
            } catch (error) {
                console.error('❌ 运行完整诊断失败:', error);
                this.log('❌ 运行完整诊断失败: ' + error.message, 'error');
            }
        }

        /**
         * 修复常见问题
         */
        async fixCommonIssues() {
            try {
                this.log('🔄 尝试修复常见问题...');
                
                // 检查认证状态
                const user = await this.checkAuthStatus();
                
                if (!user) {
                    this.log('⚠️ 无法继续修复: 用户未认证', 'warning');
                    return;
                }
                
                // 检查用户记录是否存在
                const { data: userData, error: userError } = await this.supabaseClient
                    .from('users')
                    .select('id')
                    .eq('google_user_id', user.id)
                    .maybeSingle();
                
                if (userError) {
                    this.log('❌ 查询用户记录失败: ' + userError.message, 'error');
                    throw userError;
                }
                
                if (!userData) {
                    this.log('🔄 用户记录不存在，尝试创建...');
                    
                    // 创建用户记录
                    const { data: newUser, error: createError } = await this.supabaseClient
                        .from('users')
                        .insert({
                            google_user_id: user.id,
                            email: user.email,
                            created_at: new Date().toISOString(),
                            credits: 20 // 新用户赠送20积分
                        })
                        .select()
                        .single();
                    
                    if (createError) {
                        this.log('❌ 创建用户记录失败: ' + createError.message, 'error');
                        throw createError;
                    }
                    
                    this.log('✅ 成功创建用户记录', 'success');
                    this.log(`📝 用户ID: ${newUser.id}`);
                    this.log(`📝 初始积分: ${newUser.credits}`);
                } else {
                    this.log('✅ 用户记录已存在', 'success');
                }
                
                this.log('✅ 常见问题修复完成', 'success');
            } catch (error) {
                console.error('❌ 修复常见问题失败:', error);
                this.log('❌ 修复常见问题失败: ' + error.message, 'error');
            }
        }
    }

    // 创建全局单例实例
    window.SubscriptionDebug = new SubscriptionDebug();

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SubscriptionDebug.initialize().catch(err => {
                console.error('自动初始化SubscriptionDebug失败:', err);
            });
        });
    } else {
        // 延迟初始化，确保其他脚本加载完成
        setTimeout(() => {
            window.SubscriptionDebug.initialize().catch(err => {
                console.error('自动初始化SubscriptionDebug失败:', err);
            });
        }, 100);
    }

    console.log('✅ SubscriptionDebug 模块已加载');

})(window);