/**
 * 检查登录延迟和用户创建问题
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwapwgmgzxnzbvgmhep.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLoginDelay() {
  console.log('🔍 检查登录延迟和用户创建问题...');
  
  try {
    // 1. 检查auth.users表中的最新用户
    console.log('📊 检查auth.users表中的最新用户...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 5
    });
    
    if (authError) {
      console.error('❌ 查询auth.users失败:', authError.message);
    } else {
      console.log('✅ 最新的auth用户:');
      authUsers.users.forEach((user, index) => {
        console.log(`  用户 #${index + 1}:`);
        console.log(`    ID: ${user.id}`);
        console.log(`    邮箱: ${user.email}`);
        console.log(`    创建时间: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`    最后登录: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '从未'}`);
      });
    }
    
    // 2. 检查public.users表中的最新用户
    console.log('\n📊 检查public.users表中的最新用户...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (publicError) {
      console.error('❌ 查询public.users失败:', publicError.message);
    } else {
      console.log('✅ 最新的public用户:');
      publicUsers.forEach((user, index) => {
        console.log(`  用户 #${index + 1}:`);
        console.log(`    ID: ${user.id}`);
        console.log(`    UUID: ${user.uuid}`);
        console.log(`    邮箱: ${user.email}`);
        console.log(`    积分: ${user.credits}`);
        console.log(`    创建时间: ${new Date(user.created_at).toLocaleString()}`);
      });
    }
    
    // 3. 检查用户创建触发器
    console.log('\n📊 检查用户创建触发器...');
    const { data: triggers, error: triggerError } = await supabase.rpc('check_user_triggers');
    
    if (triggerError) {
      console.error('❌ 查询触发器失败:', triggerError.message);
      console.log('尝试手动查询触发器...');
      
      const { data: manualTriggers, error: manualError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            trigger_name, 
            event_manipulation, 
            action_statement
          FROM 
            information_schema.triggers
          WHERE 
            event_object_table = 'users'
          ORDER BY 
            trigger_name;
        `
      });
      
      if (manualError) {
        console.error('❌ 手动查询触发器也失败:', manualError.message);
      } else {
        console.log('✅ 用户表触发器:');
        console.log(manualTriggers);
      }
    } else {
      console.log('✅ 用户表触发器:');
      console.log(triggers);
    }
    
    // 4. 检查auth.users和public.users的同步情况
    console.log('\n📊 检查用户同步情况...');
    const { data: syncData, error: syncError } = await supabase.rpc('check_user_sync');
    
    if (syncError) {
      console.error('❌ 查询用户同步情况失败:', syncError.message);
      console.log('尝试手动查询同步情况...');
      
      const { data: manualSync, error: manualSyncError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            COUNT(*) as total_auth_users
          FROM 
            auth.users
          WHERE 
            deleted_at IS NULL;
        `
      });
      
      if (manualSyncError) {
        console.error('❌ 手动查询同步情况也失败:', manualSyncError.message);
      } else {
        console.log('✅ auth.users总数:', manualSync[0].total_auth_users);
        
        const { data: publicCount } = await supabase
          .from('users')
          .select('count');
        
        console.log('✅ public.users总数:', publicCount[0].count);
        
        if (manualSync[0].total_auth_users > publicCount[0].count) {
          console.log('⚠️ 警告: auth.users表中的用户数量多于public.users表，可能有用户未正确同步');
        }
      }
    } else {
      console.log('✅ 用户同步情况:');
      console.log(syncData);
    }
    
    // 5. 检查最近的登录事件
    console.log('\n📊 检查最近的登录事件...');
    const { data: loginEvents, error: loginError } = await supabase
      .from('auth_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (loginError) {
      console.error('❌ 查询登录事件失败:', loginError.message);
      console.log('auth_events表可能不存在，尝试检查其他相关表...');
      
      // 尝试检查audit_log表
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (auditError) {
        console.error('❌ 查询audit_log也失败:', auditError.message);
      } else if (auditLogs.length > 0) {
        console.log('✅ 最近的审计日志:');
        console.log(auditLogs);
      } else {
        console.log('⚠️ 没有找到登录事件记录表');
      }
    } else {
      console.log('✅ 最近的登录事件:');
      console.log(loginEvents);
    }
    
    // 6. 提供解决建议
    console.log('\n💡 问题分析和解决建议:');
    console.log('1. 正常延迟: Supabase用户创建通常在几秒内完成，最长不超过1分钟');
    console.log('2. 如果延迟超过1分钟，可能是以下原因:');
    console.log('   - 用户创建触发器失败');
    console.log('   - auth.users和public.users之间的同步机制问题');
    console.log('   - 数据库负载过高导致延迟');
    console.log('   - 网络连接问题');
    console.log('3. 建议检查:');
    console.log('   - 确认auth.users表中是否有新用户记录');
    console.log('   - 检查是否有从auth.users到public.users的触发器或函数');
    console.log('   - 查看数据库日志中是否有错误');
    console.log('   - 尝试手动触发用户创建流程');
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

// 执行检查
checkLoginDelay().catch(err => {
  console.error('执行检查时出错:', err);
});