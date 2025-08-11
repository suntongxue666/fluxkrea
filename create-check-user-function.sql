-- 创建一个函数来检查特定邮箱的用户信息
CREATE OR REPLACE FUNCTION check_user_by_email(email_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH user_data AS (
    SELECT 
      id,
      email,
      created_at,
      last_sign_in_at,
      raw_user_meta_data
    FROM auth.users
    WHERE email = email_param
  ),
  profile_data AS (
    SELECT 
      id,
      email,
      credits,
      created_at,
      updated_at
    FROM public.profiles
    WHERE email = email_param
  )
  SELECT 
    jsonb_build_object(
      'auth_user', COALESCE(jsonb_agg(u.*), '[]'::jsonb),
      'profile', COALESCE(jsonb_agg(p.*), '[]'::jsonb)
    ) INTO result
  FROM user_data u
  FULL OUTER JOIN profile_data p ON u.id = p.id;
  
  RETURN result;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION check_user_by_email TO service_role;
GRANT EXECUTE ON FUNCTION check_user_by_email TO anon;
GRANT EXECUTE ON FUNCTION check_user_by_email TO authenticated;