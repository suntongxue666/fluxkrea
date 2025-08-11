/**
 * 测试积分API
 * 用于排查前端显示积分为0的问题
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreditsAPI() {
  try {
    // 1. 获取当前会话
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('未登录，请先登录');
      return;
    }
    
    console.log('当前用户:', session.user.email);
    
    // 2. 测试直接查询
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits, email, id, uuid')
      .eq('email', session.user.email)
      .single();
    
    if (userError) {
      console.error('查询用户数据失败:', userError.message);
      
      // 尝试使用uuid查询
      const { data: uuidData, error: uuidError } = await supabase
        .from('users')
        .select('credits, email, id, uuid')
        .eq('uuid', session.user.id)
        .single();
      
      if (uuidError) {
        console.error('使用uuid查询也失败:', uuidError.message);
      } else {
        console.log('通过uuid查询的用户数据:', uuidData);
      }
    } else {
      console.log('用户数据:', userData);
    }
    
    // 3. 测试RPC函数调用
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_credits', {
        user_email: session.user.email
      });
      
      if (rpcError) {
        console.error('RPC调用失败:', rpcError.message);
      } else {
        console.log('RPC返回的积分:', rpcData);
      }
    } catch (e) {
      console.log('RPC函数可能不存在:', e.message);
      
      // 创建RPC函数
      console.log('尝试创建RPC函数...');
      
      const createRpcSql = `
      CREATE OR REPLACE FUNCTION public.get_user_credits(user_email TEXT)
      RETURNS INTEGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        user_credits INTEGER;
      BEGIN
        SELECT credits INTO user_credits
        FROM public.users
        WHERE email = user_email;
        
        RETURN COALESCE(user_credits, 0);
      END;
      $$;

      GRANT EXECUTE ON FUNCTION public.get_user_credits TO authenticated;
      GRANT EXECUTE ON FUNCTION public.get_user_credits TO anon;
      `;
      
      try {
        await supabase.rpc('exec_sql', { sql: createRpcSql });
        console.log('RPC函数创建成功，请重新运行测试');
      } catch (createError) {
        console.error('创建RPC函数失败:', createError.message);
      }
    }
    
    // 4. 检查RLS策略
    try {
      const { data: policies, error: policiesError } = await supabase.rpc('get_table_policies', {
        table_name: 'users'
      });
      
      if (policiesError) {
        console.error('获取策略失败:', policiesError.message);
      } else {
        console.log('表策略:', policies);
      }
    } catch (e) {
      console.log('无法获取策略信息:', e.message);
    }
    
    // 5. 检查用户表中的所有email字段
    const { data: allEmails, error: emailsError } = await supabase
      .from('users')
      .select('email')
      .order('created_at', { ascending: false });
    
    if (emailsError) {
      console.error('获取所有email失败:', emailsError.message);
    } else {
      console.log('所有email (最近10个):', allEmails.slice(0, 10));
      
      // 检查当前用户email是否在列表中
      const found = allEmails.some(item => item.email === session.user.email);
      console.log('当前用户email在列表中:', found);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 执行测试
testCreditsAPI().catch(error => {
  console.error('执行出错:', error);
});