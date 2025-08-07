// 修复pricing页面的用户状态同步和Choose Pro按钮问题
const fs = require('fs');
const path = require('path');

function fixPricingPageIssues() {
    console.log('🔧 修复pricing页面用户状态同步问题...');
    
    try {
        // 读取pricing.html文件
        const pricingPath = path.join(__dirname, 'pricing.html');
        let content = fs.readFileSync(pricingPath, 'utf8');
        
        console.log('📄 已读取pricing.html文件');
        
        // 1. 修复用户状态初始化逻辑
        const newInitScript = `
        // 全局变量
        let currentUser = null;
        let supabaseClient = null;
        let currentPlan = null;
        let paypalButtonRendered = false;
        
        // 初始化Supabase客户端
        const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
        
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase客户端初始化成功');
        } catch (error) {
            console.error('❌ Supabase客户端初始化失败:', error);
        }
        
        // 页面加载时立即初始化用户状态
        document.addEventListener('DOMContentLoaded', async function() {
            console.log('🚀 Pricing页面初始化...');
            
            try {
                // 1. 立即从localStorage恢复用户状态
                await restoreUserStateFromStorage();
                
                // 2. 检查Supabase会话状态
                await checkAndSyncUserState();
                
                // 3. 初始化积分显示
                await initializeCreditsDisplay();
                
                // 4. 更新UI显示
                updateNavigationDisplay();
                
                console.log('✅ Pricing页面初始化完成');
                
            } catch (error) {
                console.error('❌ Pricing页面初始化失败:', error);
            }
        });
        
        // 从localStorage恢复用户状态
        async function restoreUserStateFromStorage() {
            try {
                console.log('🔄 从localStorage恢复用户状态...');
                
                const userData = localStorage.getItem('flux_krea_user');
                if (userData) {
                    currentUser = JSON.parse(userData);
                    console.log('✅ 用户状态已恢复:', currentUser.email);
                    
                    // 立即更新UI
                    updateNavigationDisplay();
                    
                    return true;
                }
                
                console.log('⚠️ localStorage中没有用户数据');
                return false;
                
            } catch (error) {
                console.error('❌ 恢复用户状态失败:', error);
                return false;
            }
        }
        
        // 检查并同步用户状态
        async function checkAndSyncUserState() {
            try {
                console.log('🔍 检查Supabase会话状态...');
                
                if (!supabaseClient) {
                    console.warn('⚠️ Supabase客户端未初始化');
                    return false;
                }
                
                const { data: { session }, error } = await supabaseClient.auth.getSession();
                
                if (error) {
                    console.error('❌ 获取会话失败:', error);
                    return false;
                }
                
                if (session && session.user) {
                    console.log('✅ 找到有效会话:', session.user.email);
                    
                    // 如果localStorage中没有用户数据，从会话中恢复
                    if (!currentUser) {
                        await loadUserFromSession(session.user);
                    } else {
                        // 同步最新的积分数据
                        await syncUserCreditsFromDatabase();
                    }
                    
                    return true;
                } else {
                    console.log('⚠️ 没有有效会话');
                    currentUser = null;
                    localStorage.removeItem('flux_krea_user');
                    return false;
                }
                
            } catch (error) {
                console.error('❌ 检查用户状态失败:', error);
                return false;
            }
        }
        
        // 从会话中加载用户数据
        async function loadUserFromSession(authUser) {
            try {
                console.log('👤 从会话加载用户数据...');
                
                const { data: user, error } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('email', authUser.email)
                    .single();
                
                if (error) {
                    console.error('❌ 查询用户数据失败:', error);
                    return;
                }
                
                if (user) {
                    currentUser = {
                        ...user,
                        avatar_url: authUser.user_metadata?.avatar_url,
                        full_name: authUser.user_metadata?.full_name
                    };
                    
                    // 保存到localStorage
                    localStorage.setItem('flux_krea_user', JSON.stringify(currentUser));
                    
                    console.log('✅ 用户数据已加载:', currentUser.email);
                    console.log('💰 用户积分:', currentUser.credits);
                }
                
            } catch (error) {
                console.error('❌ 加载用户数据失败:', error);
            }
        }
        
        // 从数据库同步用户积分
        async function syncUserCreditsFromDatabase() {
            if (!currentUser || !currentUser.uuid || !supabaseClient) return;
            
            try {
                console.log('🔄 从数据库同步积分...');
                
                const { data, error } = await supabaseClient
                    .from('users')
                    .select('credits, subscription_status')
                    .eq('uuid', currentUser.uuid)
                    .single();
                
                if (error) {
                    console.error('❌ 同步积分失败:', error);
                    return;
                }
                
                if (data) {
                    const newCredits = data.credits || 0;
                    console.log(\`💰 积分同步: \${currentUser.credits || 0} → \${newCredits}\`);
                    
                    // 更新全局用户状态
                    currentUser.credits = newCredits;
                    currentUser.subscription_status = data.subscription_status;
                    
                    // 更新localStorage
                    localStorage.setItem('flux_krea_user', JSON.stringify(currentUser));
                    
                    // 使用统一积分同步系统
                    if (window.creditsSync) {
                        window.creditsSync.setCredits(newCredits);
                    }
                    
                    // 更新显示
                    updateCreditsDisplay();
                }
            } catch (error) {
                console.error('❌ 同步积分异常:', error);
            }
        }
        
        // 初始化积分显示
        async function initializeCreditsDisplay() {
            try {
                console.log('💰 初始化积分显示...');
                
                // 如果有用户数据，立即显示积分
                if (currentUser && currentUser.credits !== undefined) {
                    updateCreditsDisplay();
                    
                    // 使用统一积分同步系统
                    if (window.creditsSync) {
                        window.creditsSync.setCredits(currentUser.credits);
                    }
                }
                
                // 设置定期同步
                setInterval(async () => {
                    if (currentUser) {
                        await syncUserCreditsFromDatabase();
                    }
                }, 30000); // 每30秒同步一次
                
            } catch (error) {
                console.error('❌ 初始化积分显示失败:', error);
            }
        }
        
        // 更新积分显示
        function updateCreditsDisplay() {
            try {
                const credits = currentUser?.credits || 0;
                console.log('🔄 更新积分显示:', credits);
                
                // 更新所有积分显示元素
                const creditsElements = document.querySelectorAll('#creditsAmount, .credits-amount');
                creditsElements.forEach(element => {
                    if (element) {
                        element.textContent = credits;
                        
                        // 添加更新动画
                        element.style.transition = 'all 0.3s ease';
                        element.style.color = '#10b981';
                        setTimeout(() => {
                            element.style.color = '';
                        }, 500);
                    }
                });
                
                console.log('✅ 积分显示已更新:', credits);
                
            } catch (error) {
                console.error('❌ 更新积分显示失败:', error);
            }
        }
        
        // 检查用户认证状态（修复版本）
        async function checkSupabaseSession() {
            try {
                console.log('🔍 检查用户认证状态...');
                
                // 1. 首先检查内存中的用户状态
                if (currentUser && currentUser.email) {
                    console.log('✅ 内存中有用户状态:', currentUser.email);
                    return true;
                }
                
                // 2. 检查localStorage
                const userData = localStorage.getItem('flux_krea_user');
                if (userData) {
                    try {
                        currentUser = JSON.parse(userData);
                        console.log('✅ 从localStorage恢复用户状态:', currentUser.email);
                        return true;
                    } catch (e) {
                        console.error('❌ 解析localStorage用户数据失败:', e);
                    }
                }
                
                // 3. 检查Supabase会话
                if (supabaseClient) {
                    const { data: { session }, error } = await supabaseClient.auth.getSession();
                    
                    if (!error && session && session.user) {
                        console.log('✅ 找到Supabase会话:', session.user.email);
                        await loadUserFromSession(session.user);
                        return true;
                    }
                }
                
                console.log('❌ 用户未认证');
                return false;
                
            } catch (error) {
                console.error('❌ 检查认证状态失败:', error);
                return false;
            }
        }`;
        
        // 2. 替换现有的初始化脚本
        const scriptStartRegex = /\/\/ 全局变量[\s\S]*?(?=\/\/ 页面加载时检查URL参数和用户状态|document\.addEventListener\('DOMContentLoaded')/;
        if (scriptStartRegex.test(content)) {
            content = content.replace(scriptStartRegex, newInitScript.trim() + '\n        ');
            console.log('✅ 已替换用户状态初始化脚本');
        } else {
            // 如果没找到，在script标签后添加
            const scriptIndex = content.indexOf('<script>');
            if (scriptIndex !== -1) {
                const insertIndex = content.indexOf('\n', scriptIndex) + 1;
                content = content.slice(0, insertIndex) + 
                         newInitScript + '\n        ' + 
                         content.slice(insertIndex);
                console.log('✅ 已添加用户状态初始化脚本');
            }
        }
        
        // 写回文件
        fs.writeFileSync(pricingPath, content, 'utf8');
        console.log('✅ pricing.html文件更新完成');
        
        return true;
        
    } catch (error) {
        console.error('❌ 修复pricing页面问题失败:', error);
        return false;
    }
}

// 运行修复
if (fixPricingPageIssues()) {
    console.log('🎉 Pricing页面问题修复完成！');
    console.log('修复内容:');
    console.log('1. ✅ 修复了用户状态同步问题');
    console.log('2. ✅ 修复了积分显示同步问题');
    console.log('3. ✅ 修复了Choose Pro按钮认证检查');
    console.log('4. ✅ 添加了localStorage状态恢复');
    console.log('5. ✅ 添加了实时积分同步');
} else {
    console.log('❌ Pricing页面问题修复失败');
    process.exit(1);
}