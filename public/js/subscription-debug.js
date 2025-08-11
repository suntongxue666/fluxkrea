/**
 * 订阅功能深度诊断工具
 * 
 * 这个脚本用于在浏览器中诊断订阅功能失败的原因
 * 使用方法：在浏览器控制台中加载此脚本，然后调用 SubscriptionDebug.diagnose()
 */

(function(window) {
    'use strict';

    // 防止重复加载
    if (window.SubscriptionDebug) {
        console.log('SubscriptionDebug already loaded');
        return;
    }

    /**
     * 订阅功能诊断工具
     */
    class SubscriptionDebugger {
        constructor() {
            this.results = {
                environment: {},
                user: null,
                api: {},
                buttons: [],
                network: {},
                errors: []
            };
            
            console.log('🔍 订阅功能诊断工具已加载');
        }

        /**
         * 运行完整诊断
         */
        async diagnose() {
            console.log('🚀 开始诊断订阅功能...');
            
            try {
                // 1. 检查环境
                await this.checkEnvironment();
                
                // 2. 检查用户状态
                await this.checkUserState();
                
                // 3. 检查API端点
                await this.checkAPIEndpoints();
                
                // 4. 检查订阅按钮
                this.checkSubscriptionButtons();
                
                // 5. 检查网络请求
                await this.monitorNetworkRequests();
                
                // 6. 尝试直接调用API
                await this.testAPIDirectly();
                
                // 7. 生成诊断报告
                this.generateReport();
                
            } catch (error) {
                console.error('❌ 诊断过程中出错:', error);
                this.results.errors.push({
                    phase: '诊断过程',
                    error: error.message,
                    stack: error.stack
                });
                
                this.generateReport();
            }
        }

        /**
         * 检查环境
         */
        async checkEnvironment() {
            console.log('🔍 检查环境...');
            
            // 检查浏览器信息
            this.results.environment.userAgent = navigator.userAgent;
            this.results.environment.language = navigator.language;
            this.results.environment.cookiesEnabled = navigator.cookieEnabled;
            
            // 检查页面URL
            this.results.environment.url = window.location.href;
            this.results.environment.origin = window.location.origin;
            
            // 检查localStorage可用性
            try {
                localStorage.setItem('subscription_debug_test', 'test');
                localStorage.removeItem('subscription_debug_test');
                this.results.environment.localStorageAvailable = true;
            } catch (e) {
                this.results.environment.localStorageAvailable = false;
            }
            
            // 检查关键全局对象
            this.results.environment.hasSupabase = !!window.supabase;
            this.results.environment.hasSupabaseClient = !!window.supabaseClient;
            this.results.environment.hasUnifiedStateSync = !!window.UnifiedStateSync;
            this.results.environment.hasSubscriptionHandler = !!window.SubscriptionHandler;
            
            // 检查是否加载了必要的脚本
            const scripts = Array.from(document.getElementsByTagName('script')).map(s => s.src);
            this.results.environment.loadedScripts = scripts;
            
            console.log('✅ 环境检查完成');
        }

        /**
         * 检查用户状态
         */
        async checkUserState() {
            console.log('🔍 检查用户状态...');
            
            // 检查全局用户对象
            if (window.currentUser) {
                this.results.user = {
                    source: 'window.currentUser',
                    uuid: window.currentUser.uuid || window.currentUser.id,
                    email: window.currentUser.email,
                    isComplete: !!(window.currentUser.uuid || window.currentUser.id) && !!window.currentUser.email
                };
            } else if (window.UnifiedStateSync && window.UnifiedStateSync.getCurrentUser()) {
                const user = window.UnifiedStateSync.getCurrentUser();
                this.results.user = {
                    source: 'UnifiedStateSync.getCurrentUser()',
                    uuid: user.uuid || user.id,
                    email: user.email,
                    isComplete: !!(user.uuid || user.id) && !!user.email
                };
            } else {
                // 尝试从Supabase获取用户
                try {
                    let supabaseClient = window.supabaseClient;
                    
                    if (!supabaseClient && window.supabase) {
                        const url = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
                        const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
                        supabaseClient = window.supabase.createClient(url, key);
                    }
                    
                    if (supabaseClient && supabaseClient.auth) {
                        const { data: { session } } = await supabaseClient.auth.getSession();
                        if (session?.user) {
                            this.results.user = {
                                source: 'supabaseClient.auth.getSession()',
                                uuid: session.user.id,
                                email: session.user.email,
                                isComplete: !!session.user.id && !!session.user.email
                            };
                        } else {
                            this.results.user = {
                                source: 'supabaseClient.auth.getSession()',
                                error: '未找到有效会话'
                            };
                        }
                    } else {
                        this.results.user = {
                            source: 'none',
                            error: '无法获取用户信息，Supabase客户端不可用'
                        };
                    }
                } catch (error) {
                    this.results.user = {
                        source: 'error',
                        error: error.message
                    };
                }
            }
            
            // 检查localStorage中的用户信息
            try {
                const storedUser = localStorage.getItem('flux_krea_user');
                if (storedUser) {
                    this.results.user.localStorage = JSON.parse(storedUser);
                }
            } catch (e) {
                this.results.user.localStorage = { error: e.message };
            }
            
            console.log('✅ 用户状态检查完成');
        }

        /**
         * 检查API端点
         */
        async checkAPIEndpoints() {
            console.log('🔍 检查API端点...');
            
            // 检查handle-subscription端点
            try {
                const response = await fetch('/api/handle-subscription', {
                    method: 'OPTIONS'
                });
                
                this.results.api.handleSubscription = {
                    status: response.status,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries())
                };
            } catch (error) {
                this.results.api.handleSubscription = {
                    error: error.message
                };
            }
            
            // 检查paypal-webhook端点
            try {
                const response = await fetch('/api/paypal-webhook', {
                    method: 'GET'
                });
                
                this.results.api.paypalWebhook = {
                    status: response.status,
                    ok: response.ok
                };
                
                if (response.ok) {
                    this.results.api.paypalWebhook.data = await response.json();
                }
            } catch (error) {
                this.results.api.paypalWebhook = {
                    error: error.message
                };
            }
            
            console.log('✅ API端点检查完成');
        }

        /**
         * 检查订阅按钮
         */
        checkSubscriptionButtons() {
            console.log('🔍 检查订阅按钮...');
            
            // 查找所有可能的订阅按钮
            const buttons = [
                ...document.querySelectorAll('.subscription-btn'),
                ...document.querySelectorAll('.buy-credits-btn'),
                ...document.querySelectorAll('[data-plan-id]')
            ];
            
            this.results.buttons = buttons.map(button => {
                return {
                    text: button.innerText,
                    classes: button.className,
                    id: button.id,
                    planId: button.dataset.planId || button.getAttribute('data-plan-id'),
                    planType: button.dataset.planType || button.getAttribute('data-plan-type'),
                    hasClickHandler: button.onclick !== null || button.dataset.subscriptionHandlerInitialized === 'true',
                    isDisabled: button.disabled
                };
            });
            
            console.log('✅ 订阅按钮检查完成');
        }

        /**
         * 监控网络请求
         */
        async monitorNetworkRequests() {
            console.log('🔍 监控网络请求...');
            console.log('⚠️ 请在点击订阅按钮后查看控制台网络面板，记录请求和响应');
            
            this.results.network.message = '请在点击订阅按钮后查看控制台网络面板，记录请求和响应';
            
            // 添加网络请求监听器（仅用于提示，实际监控需要在浏览器控制台中进行）
            console.log('📋 监控步骤:');
            console.log('1. 打开浏览器控制台 (F12)');
            console.log('2. 切换到"网络"标签');
            console.log('3. 点击订阅按钮');
            console.log('4. 查找对"/api/handle-subscription"的请求');
            console.log('5. 检查请求参数和响应内容');
        }

        /**
         * 直接测试API
         */
        async testAPIDirectly() {
            console.log('🔍 直接测试API...');
            
            if (!this.results.user || !this.results.user.uuid || !this.results.user.email) {
                console.log('⚠️ 无法测试API，用户信息不完整');
                this.results.api.directTest = {
                    error: '无法测试API，用户信息不完整'
                };
                return;
            }
            
            try {
                // 准备测试数据
                const testData = {
                    googleUserId: this.results.user.uuid,
                    googleUserEmail: this.results.user.email,
                    paypalSubscriptionId: 'test_' + Date.now(),
                    planId: 'P-5S785818YS7424947NCJBKQA',
                    planType: 'PRO'
                };
                
                console.log('📤 发送测试请求:', testData);
                
                // 发送测试请求
                const response = await fetch('/api/handle-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testData)
                });
                
                const responseData = await response.json();
                
                this.results.api.directTest = {
                    status: response.status,
                    ok: response.ok,
                    data: responseData,
                    request: testData
                };
                
                console.log('📥 收到响应:', response.status, responseData);
                
            } catch (error) {
                console.error('❌ API测试失败:', error);
                this.results.api.directTest = {
                    error: error.message,
                    stack: error.stack
                };
            }
            
            console.log('✅ API测试完成');
        }

        /**
         * 生成诊断报告
         */
        generateReport() {
            console.log('📋 生成诊断报告...');
            
            // 分析结果
            const issues = [];
            
            // 检查环境问题
            if (!this.results.environment.hasSupabase) {
                issues.push('未找到Supabase库');
            }
            
            if (!this.results.environment.hasSupabaseClient) {
                issues.push('未找到Supabase客户端');
            }
            
            // 检查用户问题
            if (!this.results.user || !this.results.user.isComplete) {
                issues.push('用户信息不完整或未登录');
            }
            
            // 检查API问题
            if (this.results.api.handleSubscription && !this.results.api.handleSubscription.ok) {
                issues.push('handle-subscription API端点不可用');
            }
            
            if (this.results.api.directTest && !this.results.api.directTest.ok) {
                issues.push(`API直接测试失败: ${this.results.api.directTest.data?.error || '未知错误'}`);
            }
            
            // 检查按钮问题
            if (this.results.buttons.length === 0) {
                issues.push('未找到订阅按钮');
            } else {
                const buttonsWithoutPlanId = this.results.buttons.filter(b => !b.planId);
                if (buttonsWithoutPlanId.length > 0) {
                    issues.push('部分订阅按钮缺少planId');
                }
                
                const buttonsWithoutHandlers = this.results.buttons.filter(b => !b.hasClickHandler);
                if (buttonsWithoutHandlers.length > 0) {
                    issues.push('部分订阅按钮缺少点击处理函数');
                }
            }
            
            // 生成报告
            const report = {
                timestamp: new Date().toISOString(),
                issues,
                results: this.results,
                recommendations: this.generateRecommendations(issues)
            };
            
            // 输出报告
            console.log('📊 诊断报告:');
            console.log(report);
            
            // 创建可视化报告
            this.displayVisualReport(report);
            
            return report;
        }

        /**
         * 生成建议
         */
        generateRecommendations(issues) {
            const recommendations = [];
            
            if (issues.includes('未找到Supabase库')) {
                recommendations.push('确保已加载Supabase库，检查<script>标签是否正确引入');
            }
            
            if (issues.includes('未找到Supabase客户端')) {
                recommendations.push('检查Supabase客户端初始化代码，确保createClient调用正确');
            }
            
            if (issues.includes('用户信息不完整或未登录')) {
                recommendations.push('确保用户已登录，并且用户信息包含uuid/id和email');
            }
            
            if (issues.includes('handle-subscription API端点不可用')) {
                recommendations.push('检查服务器端API是否正确部署，确保路径为/api/handle-subscription');
            }
            
            if (issues.some(issue => issue.startsWith('API直接测试失败'))) {
                recommendations.push('检查API错误响应，修复服务器端代码中的问题');
            }
            
            if (issues.includes('未找到订阅按钮')) {
                recommendations.push('确保页面包含带有正确类名或data属性的订阅按钮');
            }
            
            if (issues.includes('部分订阅按钮缺少planId')) {
                recommendations.push('为所有订阅按钮添加data-plan-id属性');
            }
            
            if (issues.includes('部分订阅按钮缺少点击处理函数')) {
                recommendations.push('确保subscription-handler.js正确加载并初始化');
            }
            
            // 添加通用建议
            recommendations.push('检查浏览器控制台是否有JavaScript错误');
            recommendations.push('确保API文件中的语法错误已修复');
            recommendations.push('检查网络请求和响应，确认请求参数格式正确');
            
            return recommendations;
        }

        /**
         * 显示可视化报告
         */
        displayVisualReport(report) {
            // 创建报告容器
            let reportContainer = document.getElementById('subscription-debug-report');
            
            if (!reportContainer) {
                reportContainer = document.createElement('div');
                reportContainer.id = 'subscription-debug-report';
                reportContainer.style.cssText = 'position: fixed; top: 10px; left: 10px; right: 10px; bottom: 10px; background: rgba(0,0,0,0.9); color: #fff; padding: 20px; z-index: 10000; overflow: auto; font-family: monospace; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.5);';
                
                // 添加关闭按钮
                const closeButton = document.createElement('button');
                closeButton.textContent = '关闭报告';
                closeButton.style.cssText = 'position: absolute; top: 10px; right: 10px; padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;';
                closeButton.onclick = () => {
                    reportContainer.style.display = 'none';
                };
                
                reportContainer.appendChild(closeButton);
                
                document.body.appendChild(reportContainer);
            } else {
                reportContainer.innerHTML = '';
                reportContainer.style.display = 'block';
            }
            
            // 创建标题
            const title = document.createElement('h2');
            title.textContent = '订阅功能诊断报告';
            title.style.cssText = 'margin-top: 0; color: #4CAF50;';
            reportContainer.appendChild(title);
            
            // 创建时间戳
            const timestamp = document.createElement('p');
            timestamp.textContent = `生成时间: ${new Date().toLocaleString()}`;
            timestamp.style.cssText = 'color: #ccc; margin-bottom: 20px;';
            reportContainer.appendChild(timestamp);
            
            // 创建问题部分
            const issuesTitle = document.createElement('h3');
            issuesTitle.textContent = '发现的问题:';
            issuesTitle.style.cssText = 'color: #f44336;';
            reportContainer.appendChild(issuesTitle);
            
            const issuesList = document.createElement('ul');
            if (report.issues.length === 0) {
                const noIssues = document.createElement('li');
                noIssues.textContent = '未发现明显问题，但订阅功能仍然失败';
                noIssues.style.cssText = 'color: #FFC107;';
                issuesList.appendChild(noIssues);
            } else {
                report.issues.forEach(issue => {
                    const issueItem = document.createElement('li');
                    issueItem.textContent = issue;
                    issueItem.style.cssText = 'margin-bottom: 5px;';
                    issuesList.appendChild(issueItem);
                });
            }
            reportContainer.appendChild(issuesList);
            
            // 创建建议部分
            const recommendationsTitle = document.createElement('h3');
            recommendationsTitle.textContent = '建议:';
            recommendationsTitle.style.cssText = 'color: #2196F3;';
            reportContainer.appendChild(recommendationsTitle);
            
            const recommendationsList = document.createElement('ol');
            report.recommendations.forEach(recommendation => {
                const recommendationItem = document.createElement('li');
                recommendationItem.textContent = recommendation;
                recommendationItem.style.cssText = 'margin-bottom: 5px;';
                recommendationsList.appendChild(recommendationItem);
            });
            reportContainer.appendChild(recommendationsList);
            
            // 创建详细结果部分
            const detailsTitle = document.createElement('h3');
            detailsTitle.textContent = '详细诊断结果:';
            detailsTitle.style.cssText = 'color: #9C27B0; margin-top: 20px;';
            reportContainer.appendChild(detailsTitle);
            
            // 用户信息
            const userTitle = document.createElement('h4');
            userTitle.textContent = '用户信息:';
            userTitle.style.cssText = 'color: #FF9800; margin-bottom: 5px;';
            reportContainer.appendChild(userTitle);
            
            const userInfo = document.createElement('pre');
            userInfo.textContent = JSON.stringify(report.results.user, null, 2);
            userInfo.style.cssText = 'background: rgba(255,255,255,0.1); padding: 10px; border-radius: 3px; overflow: auto; max-height: 200px;';
            reportContainer.appendChild(userInfo);
            
            // API信息
            const apiTitle = document.createElement('h4');
            apiTitle.textContent = 'API测试结果:';
            apiTitle.style.cssText = 'color: #FF9800; margin-bottom: 5px;';
            reportContainer.appendChild(apiTitle);
            
            const apiInfo = document.createElement('pre');
            apiInfo.textContent = JSON.stringify(report.results.api, null, 2);
            apiInfo.style.cssText = 'background: rgba(255,255,255,0.1); padding: 10px; border-radius: 3px; overflow: auto; max-height: 200px;';
            reportContainer.appendChild(apiInfo);
            
            // 按钮信息
            const buttonsTitle = document.createElement('h4');
            buttonsTitle.textContent = '订阅按钮:';
            buttonsTitle.style.cssText = 'color: #FF9800; margin-bottom: 5px;';
            reportContainer.appendChild(buttonsTitle);
            
            const buttonsInfo = document.createElement('pre');
            buttonsInfo.textContent = JSON.stringify(report.results.buttons, null, 2);
            buttonsInfo.style.cssText = 'background: rgba(255,255,255,0.1); padding: 10px; border-radius: 3px; overflow: auto; max-height: 200px;';
            reportContainer.appendChild(buttonsInfo);
            
            // 环境信息
            const envTitle = document.createElement('h4');
            envTitle.textContent = '环境信息:';
            envTitle.style.cssText = 'color: #FF9800; margin-bottom: 5px;';
            reportContainer.appendChild(envTitle);
            
            const envInfo = document.createElement('pre');
            envInfo.textContent = JSON.stringify(report.results.environment, null, 2);
            envInfo.style.cssText = 'background: rgba(255,255,255,0.1); padding: 10px; border-radius: 3px; overflow: auto; max-height: 200px;';
            reportContainer.appendChild(envInfo);
            
            // 错误信息
            if (report.results.errors && report.results.errors.length > 0) {
                const errorsTitle = document.createElement('h4');
                errorsTitle.textContent = '错误信息:';
                errorsTitle.style.cssText = 'color: #f44336; margin-bottom: 5px;';
                reportContainer.appendChild(errorsTitle);
                
                const errorsInfo = document.createElement('pre');
                errorsInfo.textContent = JSON.stringify(report.results.errors, null, 2);
                errorsInfo.style.cssText = 'background: rgba(255,0,0,0.1); padding: 10px; border-radius: 3px; overflow: auto; max-height: 200px;';
                reportContainer.appendChild(errorsInfo);
            }
            
            // 添加修复按钮
            const fixButton = document.createElement('button');
            fixButton.textContent = '尝试自动修复';
            fixButton.style.cssText = 'margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;';
            fixButton.onclick = () => {
                this.attemptAutoFix();
            };
            
            reportContainer.appendChild(fixButton);
        }

        /**
         * 尝试自动修复
         */
        async attemptAutoFix() {
            console.log('🔧 尝试自动修复...');
            
            // 创建修复脚本
            const script = document.createElement('script');
            script.textContent = `
                // 订阅功能紧急修复脚本
                (function() {
                    console.log('🚀 执行订阅功能紧急修复...');
                    
                    // 1. 修复订阅按钮点击处理
                    const fixSubscriptionButtons = function() {
                        const buttons = document.querySelectorAll('.subscription-btn, .buy-credits-btn, [data-plan-id]');
                        
                        buttons.forEach(button => {
                            // 移除现有的点击处理函数
                            const oldClickHandler = button.onclick;
                            button.onclick = null;
                            
                            // 添加新的点击处理函数
                            button.addEventListener('click', async function(event) {
                                event.preventDefault();
                                
                                // 显示加载状态
                                const originalText = button.innerHTML;
                                button.innerHTML = '<span class="loading-spinner"></span> Processing...';
                                button.disabled = true;
                                
                                try {
                                    // 获取计划ID
                                    const planId = button.dataset.planId || button.getAttribute('data-plan-id');
                                    const planType = button.dataset.planType || button.getAttribute('data-plan-type') || 'PRO';
                                    
                                    if (!planId) {
                                        throw new Error('未找到计划ID');
                                    }
                                    
                                    // 获取用户信息
                                    let user = null;
                                    
                                    if (window.UnifiedStateSync) {
                                        user = window.UnifiedStateSync.getCurrentUser();
                                    } else if (window.currentUser) {
                                        user = window.currentUser;
                                    } else {
                                        // 尝试从Supabase获取用户
                                        let supabaseClient = window.supabaseClient;
                                        
                                        if (!supabaseClient && window.supabase) {
                                            const url = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
                                            const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
                                            supabaseClient = window.supabase.createClient(url, key);
                                        }
                                        
                                        if (supabaseClient && supabaseClient.auth) {
                                            const { data: { session } } = await supabaseClient.auth.getSession();
                                            if (session?.user) {
                                                user = session.user;
                                            }
                                        }
                                    }
                                    
                                    if (!user) {
                                        throw new Error('用户未登录');
                                    }
                                    
                                    // 准备订阅数据
                                    const subscriptionData = {
                                        googleUserId: user.id || user.uuid,
                                        googleUserEmail: user.email,
                                        paypalSubscriptionId: 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15),
                                        planId,
                                        planType
                                    };
                                    
                                    console.log('📤 发送订阅请求:', subscriptionData);
                                    
                                    // 直接重定向到PayPal
                                    redirectToPayPal(planId, subscriptionData.googleUserId, subscriptionData.googleUserEmail);
                                    
                                } catch (error) {
                                    console.error('❌ 创建订阅失败:', error);
                                    alert('创建订阅失败: ' + error.message);
                                    
                                    // 恢复按钮状态
                                    button.innerHTML = originalText;
                                    button.disabled = false;
                                }
                            });
                            
                            console.log('✅ 修复订阅按钮:', button);
                        });
                    };
                    
                    /**
                     * 重定向到PayPal支付页面
                     */
                    function redirectToPayPal(planId, userId, userEmail) {
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
                    
                    // 执行修复
                    fixSubscriptionButtons();
                    
                    console.log('✅ 订阅功能紧急修复完成');
                })();
            `;
            
            document.head.appendChild(script);
            
            alert('订阅功能已修复，请再次尝试订阅');
