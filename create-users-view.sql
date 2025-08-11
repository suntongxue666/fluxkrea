-- 创建一个视图，按照新的列顺序显示users表的数据
CREATE OR REPLACE VIEW users_view AS
SELECT 
  id,
  google_id,
  email,
  name,
  credits,
  uuid,
  user_identifier,
  fingerprint,
  ip_address,
  user_agent,
  language,
  platform,
  timezone,
  screen_resolution,
  canvas_fingerprint,
  total_credits_earned,
  total_credits_used,
  is_signed_in,
  avatar_url,
  images_generated,
  last_generation_at,
  daily_generation_count,
  daily_reset_date,
  created_at,
  updated_at,
  last_seen_at,
  current_subscription_id,
  subscription_status,
  subscription_credits_remaining,
  subscription_renewal_date
FROM users;

-- 为视图设置权限
GRANT SELECT ON users_view TO authenticated;
GRANT SELECT ON users_view TO service_role;
GRANT SELECT ON users_view TO anon;

-- 验证视图是否创建成功
SELECT * FROM users_view LIMIT 5;