-- 修复RLS策略 - 允许匿名用户操作

-- 1. 删除现有的限制性策略
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view own generations" ON image_generations;
DROP POLICY IF EXISTS "Users can update own generations" ON image_generations;

-- 2. 创建新的允许性策略

-- users表策略
CREATE POLICY "Allow anonymous and authenticated users" ON users
FOR ALL USING (true);

-- credit_transactions表策略
CREATE POLICY "Allow all operations on credit_transactions" ON credit_transactions
FOR ALL USING (true);

-- image_generations表策略
CREATE POLICY "Allow all operations on image_generations" ON image_generations
FOR ALL USING (true);

-- 3. 确保system_settings表对所有人可读
CREATE POLICY "Allow read access to system_settings" ON system_settings
FOR SELECT USING (is_public = true);

-- 4. 也可以临时禁用RLS进行测试（可选）
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE image_generations DISABLE ROW LEVEL SECURITY;