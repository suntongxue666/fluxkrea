-- 创建获取用户积分的API函数

-- 创建函数
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

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.get_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_credits TO anon;

-- 创建一个API端点函数，用于前端直接调用
CREATE OR REPLACE FUNCTION public.get_my_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  user_credits INTEGER;
BEGIN
  SELECT credits INTO user_credits
  FROM public.users
  WHERE email = auth.email();
  
  RETURN COALESCE(user_credits, 0);
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.get_my_credits TO authenticated;