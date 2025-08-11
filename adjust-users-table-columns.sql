-- 调整users表中的列顺序
-- 将Google_id、email、name和credits列移动到id列的右侧

-- 创建一个临时表，按照新的列顺序定义
CREATE TABLE users_temp (
  id BIGINT PRIMARY KEY,
  google_id TEXT,
  email TEXT,
  name TEXT,
  credits INTEGER DEFAULT 0,
  -- 其他列按照原来的顺序
  uuid TEXT,
  user_identifier TEXT,
  fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  language TEXT,
  platform TEXT,
  timezone TEXT,
  screen_resolution TEXT,
  canvas_fingerprint TEXT,
  total_credits_earned INTEGER DEFAULT 0,
  total_credits_used INTEGER DEFAULT 0,
  is_signed_in BOOLEAN DEFAULT false,
  avatar_url TEXT,
  images_generated INTEGER DEFAULT 0,
  last_generation_at TIMESTAMP WITH TIME ZONE,
  daily_generation_count INTEGER DEFAULT 0,
  daily_reset_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  current_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'FREE',
  subscription_credits_remaining INTEGER DEFAULT 0,
  subscription_renewal_date TIMESTAMP WITH TIME ZONE
);

-- 复制数据到临时表，按照新的列顺序
INSERT INTO users_temp
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

-- 备份原表（可选）
ALTER TABLE users RENAME TO users_backup;

-- 将临时表重命名为正式表
ALTER TABLE users_temp RENAME TO users;

-- 重新创建索引和约束（根据原表的索引和约束）
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_uuid_idx ON users (uuid);
CREATE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id);

-- 重新设置序列（如果有）
-- 假设id列使用序列生成
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);

-- 恢复表权限（根据需要调整）
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO service_role;
GRANT SELECT ON users TO anon;

-- 验证
SELECT column_name, ordinal_position
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 如果一切正常，可以删除备份表（谨慎操作）
-- DROP TABLE users_backup;