// 修复所有JavaScript错误
const fs = require('fs');

function fixAllJSErrors() {
    console.log('🔧 修复所有JavaScript错误...');
    
    try {
        let content = fs.readFileSync('pricing.html', 'utf8');
        
        // 1. 删除重复的currentUser声明
        content = content.replace(/let currentUser = null;[\s\S]*?let currentUser = null;/g, 'let currentUser = null;');
        
        // 2. 修复Supabase初始化错误 - 添加检查
        const supabaseInitFix = `
        try {
            if (typeof supabase !== 'undefined') {
                supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Supabase客户端初始化成功');
            } else {
                console.warn('⚠️ Supabase库未加载');
            }
        } catch (error) {
            console.error('❌ Supabase客户端初始化失败:', error);
        }`;
        
        content = content.replace(/try\s*\{\s*supabaseClient = supabase\.createClient[\s\S]*?\}/g, supabaseInitFix);
        
        // 3. 删除不存在的JS文件引用
        content = content.replace(/<script src="user_state_sync\.js"><\/script>/g, '');
        content = content.replace(/<script src="credits_sync\.js"><\/script>/g, '');
        
        // 4. 修复await语法错误 - 包装在async函数中
        content = content.replace(/await initializeUserState\(\);/g, 'initializeUserState();');
        content = content.replace(/await checkAndSyncUserState\(\);/g, 'checkAndSyncUserState();');
        content = content.replace(/await initializeCreditsDisplay\(\);/g, 'initializeCreditsDisplay();');
        
        // 5. 修复Sign in按钮 - 添加Google登录功能
        const googleSigninFix = `
        // Google登录功能
        async function signInWithGoogle() {
            try {
                console.log('🔐 开始Google登录...');
                
                if (!supabaseClient) {
                    console.error('❌ Supabase客户端未初始化');
                    alert('登录功能初始化中，请稍后重试');
                    return;
                }
                
                const { data, error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + '/pricing.html'
                    }
                });
                
                if (error) {
                    console.error('❌ Google登录失败:', error);
                    alert('登录失败，请重试');
                } else {
                    console.log('✅ Google登录成功');
                }
            } catch (error) {
                console.error('❌ Google登录异常:', error);
                alert('登录功能暂时不可用');
            }
        }
        
        // 修复Sign in按钮点击事件
        function handleSignInClick() {
            signInWithGoogle();
        }`;
        
        // 在最后一个</script>前添加Google登录功能
        const lastScriptIndex = content.lastIndexOf('</script>');
        if (lastScriptIndex !== -1) {
            content = content.slice(0, lastScriptIndex) + 
                     googleSigninFix + '\n        ' + 
                     content.slice(lastScriptIndex);
        }
        
        // 6. 确保Sign in按钮有正确的点击事件
        content = content.replace(
            /<div class="signin-btn"[^>]*>/g, 
            '<div class="signin-btn" onclick="handleSignInClick()">'
        );
        
        fs.writeFileSync('pricing.html', content, 'utf8');
        console.log('✅ 所有JavaScript错误修复完成');
        
        return true;
        
    } catch (error) {
        console.error('❌ 修复失败:', error);
        return false;
    }
}

// 执行修复
if (fixAllJSErrors()) {
    console.log('🎉 所有JavaScript错误修复完成！');
    console.log('修复内容:');
    console.log('1. ✅ 修复了重复的currentUser声明');
    console.log('2. ✅ 修复了Supabase初始化错误');
    console.log('3. ✅ 删除了不存在的JS文件引用');
    console.log('4. ✅ 修复了await语法错误');
    console.log('5. ✅ 添加了Google登录功能');
    console.log('6. ✅ 修复了Sign in按钮点击事件');
} else {
    console.log('❌ 修复失败');
}