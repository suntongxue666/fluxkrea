// 检查特定Google用户是否存在于数据库中
const { createClient } = require('@supabase/supabase-js');

// 初始化Supabase客户端
const supabaseUrl = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificGoogleUser() {
  const email = 'sunwei7482@gmail.com';
  
  console.log(`正在检查用户: ${email}`);
  
  try {
    // 从auth.users表中查询
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (authError) {
      console.error('查询auth.users表出错:', authError);
    } else {
      console.log('auth.users表中的匹配记录:');
      console.log(authUsers);
    }
    
    // 从public.profiles表中查询
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);
    
    if (profilesError) {
      console.error('查询public.profiles表出错:', profilesError);
    } else {
      console.log('public.profiles表中的匹配记录:');
      console.log(profiles);
    }
    
    // 从auth.identities表中查询（如果存在）
    try {
      const { data: identities, error: identitiesError } = await supabase
        .from('identities')
        .select('*')
        .ilike('identity_data->email', `%${email}%`);
      
      if (identitiesError) {
        console.error('查询auth.identities表出错:', identitiesError);
      } else {
        console.log('auth.identities表中的匹配记录:');
        console.log(identities);
      }
    } catch (e) {
      console.log('无法访问identities表或表不存在');
    }
    
    // 直接执行SQL查询以获取更详细的信息
    const { data: sqlData, error: sqlError } = await supabase.rpc('check_user_by_email', { 
      email_param: email 
    });
    
    if (sqlError) {
      console.error('执行SQL查询出错:', sqlError);
    } else {
      console.log('SQL查询结果:');
      console.log(sqlData);
    }
    
  } catch (error) {
    console.error('检查用户时出错:', error);
  }
}

// 执行检查
checkSpecificGoogleUser()
  .then(() => console.log('检查完成'))
  .catch(err => console.error('执行过程中出错:', err));