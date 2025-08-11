/**
 * 修复用户创建延迟问题
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwapwgmgzxnzbvgmhep.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserCreationDelay() {
  console.log('🔧 开始修复用户创建延迟问题...');
  
  try {
    // 1. 检查是否有未同步的用户
    console.log('📊 检查未同步的用户...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    
    if (authError) {
      console.error('❌ 获取auth用户失败:', authError.message);
      return;
    }
    
    // 获取public.users表中的所有邮箱
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('email');
    
    if (publicError) {
      console.error('❌ 获取public用户失败:', publicError.message);
      return;
    }
    
    // 找出在auth.users中但不在public.users中的用户
    const publicEmails = publicUsers.map(user => user.email);
    const missingUsers = authUsers.users.filter(user => 
      user.email && !publicEmails.includes(user.email)
    );
    
    console.log(`找到 ${missingUsers.length} 个未同步的用户`);
    
    // 2. 为未同步的用户创建记录
    if (missingUsers.length > 0) {
      console.log('🔧 开始创建缺失的用户记录...');
      
      for (const user of missingUsers) {
        console.log(`处理用户: ${user.email}`);
        
        // 创建用户记录
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: user.email,
            uuid: user.id,
            name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            google_id: user.identities?.find(i => i.provider === 'google')?.id || '',
            credits: 20, // 默认赠送20积分
            subscription_status: 'FREE',
            is_signed_in: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error(`❌ 创建用户 ${user.email} 失败:`, createError.message);
        } else {
          console.log(`✅ 成功创建用户: ${user.email}`);
          
          // 创建积分交易记录
          const { error: transError } = await supabase
            .from('credit_transactions')
            .insert({
              user_uuid: newUser.uuid,
              transaction_type: 'EARN',
              amount: 20,
              balance_after: 20,
              description: '首次登录奖励',
              source: 'first_login_bonus'
            });
          
          if (transError) {
            console.error(`❌ 创建积分交易记录失败:`, transError.message);
          } else {
            console.log(`✅ 成功创建积分交易记录`);
          }
        }
      }
    }
    
    // 3. 创建或修复用户创建触发器
    console.log('\n🔧 检查并修复用户创建触发器...');
    
    const createTriggerSQL = `
    -- 创建从auth.users到public.users的触发器函数
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.users (uuid, email, name, avatar_url, credits, subscription_status, is_signed_in, created_at, updated_at)
      VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        20, -- 默认赠送20积分
        'FREE',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
      
      -- 为新用户创建积分交易记录
      INSERT INTO public.credit_transactions (user_uuid, transaction_type, amount, balance_after, description, source)
      VALUES (
        NEW.id,
        'EARN',
        20,
        20,
        '首次登录奖励',
        'first_login_bonus'
      )
      ON CONFLICT DO NOTHING;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 删除可能存在的旧触发器
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    -- 创建新触发器
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    // 执行SQL创建触发器
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: createTriggerSQL
    });
    
    if (triggerError) {
      console.error('❌ 创建触发器失败:', triggerError.message);
    } else {
      console.log('✅ 成功创建或更新用户创建触发器');
    }
    
    // 4. 验证修复结果
    console.log('\n📊 验证修复结果...');
    
    // 再次检查未同步的用户
    const { data: finalAuthUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    
    const { data: finalPublicUsers } = await supabase
      .from('users')
      .select('email');
    
    const finalPublicEmails = finalPublicUsers.map(user => user.email);
    const finalMissingUsers = finalAuthUsers.users.filter(user => 
      user.email && !finalPublicEmails.includes(user.email)
    );
    
    console.log(`修复后仍有 ${finalMissingUsers.length} 个未同步的用户`);
    
    if (finalMissingUsers.length > 0) {
      console.log('⚠️ 以下用户仍未同步:');
      finalMissingUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
    } else {
      console.log('✅ 所有用户已成功同步');
    }
    
    console.log('\n💡 修复总结:');
    console.log(`1. 处理了 ${missingUsers.length} 个未同步的用户`);
    console.log('2. 创建或更新了用户创建触发器');
    console.log('3. 确保新用户登录时会自动创建记录并赠送积分');
    console.log('\n⏱️ 正常情况下，新用户登录后应该在几秒内出现在数据库中');
    console.log('如果仍然有延迟，请检查数据库日志或联系Supabase支持');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

// 执行修复
fixUserCreationDelay().catch(err => {
  console.error('执行修复时出错:', err);
});