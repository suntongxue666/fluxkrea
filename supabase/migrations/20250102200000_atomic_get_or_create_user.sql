-- 创建一个原子操作函数，用于获取或创建用户，以彻底解决竞态条件问题。
-- 这个函数会先尝试查找用户，如果找不到，则尝试插入。
-- 它内置了重试和异常处理逻辑，以应对在分布式系统中可能发生的并发写入冲突。

CREATE OR REPLACE FUNCTION public.get_or_create_user(
    user_uuid uuid,
    user_email text
)
RETURNS users -- 返回整行用户数据
LANGUAGE plpgsql
SECURITY DEFINER -- 使用定义者的权限执行，确保有权限写入 public.users
SET search_path = public -- 确保在函数内部能直接访问 public schema 下的表
AS $$
DECLARE
  found_user users;
  display_name text;
BEGIN
  -- 步骤 1: 首先尝试通过 UUID 高效地查找用户
  SELECT * INTO found_user FROM users WHERE uuid = user_uuid;

  IF found_user IS NOT NULL THEN
    -- 如果找到，立即返回，这是最常见和最高效的路径
    RETURN found_user;
  END IF;

  -- 步骤 2: 如果用户不存在，准备插入新用户所需的数据
  display_name := split_part(user_email, '@', 1);

  -- 步骤 3: 使用带异常处理的循环来优雅地处理并发冲突（竞态条件）
  -- 这是比 "ON CONFLICT" 更稳健的模式
  FOR i IN 1..3 LOOP
    BEGIN
      -- 尝试插入新用户，并使用 RETURNING 子句立即取回创建的记录
      INSERT INTO users (uuid, email, name, credits, subscription_status)
      VALUES (user_uuid, user_email, display_name, 0, 'PENDING')
      RETURNING * INTO found_user;

      -- 如果插入成功，直接返回新创建的用户
      RETURN found_user;
    EXCEPTION WHEN unique_violation THEN
      -- 如果发生唯一性冲突，说明在 SELECT 和 INSERT 之间，
      -- 另一个进程（如数据库触发器）已经创建了该用户。
      -- 我们将短暂等待，然后在下一次循环中重新查询。
      PERFORM pg_sleep(0.1); -- 等待 100 毫秒
    END;

    -- 再次尝试查找用户，因为现在它很可能已经存在了
    SELECT * INTO found_user FROM users WHERE uuid = user_uuid;
    IF found_user IS NOT NULL THEN
      -- 如果在重试期间找到了用户，就返回它
      RETURN found_user;
    END IF;

  END LOOP;

  -- 步骤 4: 如果经过多次重试仍然无法获取或创建用户，则抛出异常
  RAISE EXCEPTION '经过多次尝试后，仍无法为 UUID % 获取或创建用户', user_uuid;
END;
$$;