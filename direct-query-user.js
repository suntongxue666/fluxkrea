
// 直接查询用户的Node.js脚本
// 使用项目中已有的配置
const fs = require('fs');
const path = require('path');

// 查找配置文件
function findConfig() {
  const configFiles = [
    '.env',
    '.env.local',
    '.env.development',
    'src/lib/supabase.js',
    'lib/supabase.js',
    'src/utils/supabase.js',
    'utils/supabase.js'
  ];
  
  for (const file of configFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`找到配置文件: ${filePath}`);
      return filePath;
    }
  }
  
  return null;
}

// 从配置文件中提取Supabase配置
function extractConfig(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (filePath.endsWith('.env') || filePath.endsWith('.local') || filePath.endsWith('.development')) {
    // 从.env文件提取
    const lines = content.split('\n');
    let url = '';
    let key = '';
    
    for (const line of lines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        url = line.split('=')[1].trim();
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        key = line.split('=')[1].trim();
      }
      if (line.startsWith('SUPABASE_SERVICE_KEY=')) {
        key = line.split('=')[1].trim();
      }
    }
    
    return { url, key };
  } else {
    // 从JS文件提取
    const urlMatch = content.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
    const keyMatch = content.match(/supabaseKey\s*=\s*['"]([^'"]+)['"]/);
    
    return {
      url: urlMatch ? urlMatch[1] : '',
      key: keyMatch ? keyMatch[1] : ''
    };
  }
}

// 主函数
async function main() {
  try {
    // 查找配置
    const configFile = findConfig();
    if (!configFile) {
      console.error('未找到配置文件');
      return;
    }
    
    // 提取配置
    const { url, key } = extractConfig(configFile);
    if (!url || !key) {
      console.error('未找到Supabase配置');
      return;
    }
    
    console.log(`使用Supabase URL: ${url}`);
    
    // 动态导入Supabase客户端
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(url, key);
    
    // 查询用户
    console.log('查询用户: tiktreeapp@gmail.com...');
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tiktreeapp@gmail.com')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('查询失败:', error.message);
      return;
    }
    
    if (!user) {
      console.log('未找到用户');
      
      // 查询最近的用户
      console.log('查询最近的用户...');
      const { data: recentUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentUsers && recentUsers.length > 0) {
        console.log(`找到 ${recentUsers.length} 个最近的用户:`);
        recentUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email || '无邮箱'} - 创建于 ${new Date(user.created_at).toLocaleString()}`);
        });
      }
      
      return;
    }
    
    console.log('找到用户:');
    console.log(`ID: ${user.id}`);
    console.log(`UUID: ${user.uuid}`);
    console.log(`邮箱: ${user.email}`);
    console.log(`积分: ${user.credits}`);
    console.log(`创建时间: ${new Date(user.created_at).toLocaleString()}`);
    
    // 查询积分交易记录
    console.log('\n查询积分交易记录...');
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_uuid', user.uuid)
      .order('created_at', { ascending: false });
    
    if (transactions && transactions.length > 0) {
      console.log(`找到 ${transactions.length} 条交易记录:`);
      transactions.forEach((trans, index) => {
        console.log(`${index + 1}. ${trans.transaction_type} ${trans.amount} - ${trans.description}`);
      });
    } else {
      console.log('未找到积分交易记录');
    }
    
  } catch (err) {
    console.error('执行出错:', err);
  }
}

// 执行主函数
main();
