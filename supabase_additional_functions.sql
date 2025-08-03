-- 添加到Supabase SQL Editor的补充函数

-- 设置用户上下文的函数（用于RLS）
CREATE OR REPLACE FUNCTION set_user_context(user_uuid text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_uuid', user_uuid, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取当前用户上下文的函数
CREATE OR REPLACE FUNCTION get_current_user_uuid()
RETURNS text AS $$
BEGIN
    RETURN current_setting('app.current_user_uuid', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重置每日积分的函数（可以通过定时任务调用）
CREATE OR REPLACE FUNCTION grant_daily_credits()
RETURNS void AS $$
DECLARE
    default_daily_credits INTEGER;
BEGIN
    -- 获取每日免费积分配置
    SELECT value::INTEGER INTO default_daily_credits 
    FROM system_settings 
    WHERE key = 'daily_free_credits';
    
    IF default_daily_credits IS NULL THEN
        default_daily_credits := 5;
    END IF;
    
    -- 为所有活跃用户添加每日积分（最近7天内有活动的用户）
    INSERT INTO credit_transactions (user_id, user_uuid, transaction_type, amount, balance_after, description, source)
    SELECT 
        u.id,
        u.uuid,
        'DAILY_GRANT',
        default_daily_credits,
        u.credits + default_daily_credits,
        '每日免费积分',
        'daily_bonus'
    FROM users u
    WHERE u.last_seen_at >= NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
        SELECT 1 FROM credit_transactions ct 
        WHERE ct.user_id = u.id 
        AND ct.transaction_type = 'DAILY_GRANT' 
        AND ct.created_at >= CURRENT_DATE
    );
    
    -- 更新用户积分余额
    UPDATE users SET 
        credits = credits + default_daily_credits,
        total_credits_earned = total_credits_earned + default_daily_credits
    WHERE id IN (
        SELECT user_id FROM credit_transactions 
        WHERE transaction_type = 'DAILY_GRANT' 
        AND created_at >= CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- 清理过期数据的函数
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- 删除30天前的积分交易记录（保留关键数据）
    DELETE FROM credit_transactions 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND transaction_type NOT IN ('EARN', 'SPEND');
    
    -- 删除90天前失败的图像生成记录
    DELETE FROM image_generations 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND status = 'failed';
    
    -- 删除30天前的每日统计数据（可选）
    -- DELETE FROM daily_stats WHERE date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 获取用户统计信息的函数
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid_param text)
RETURNS TABLE(
    total_generations BIGINT,
    successful_generations BIGINT,
    total_credits_earned BIGINT,
    total_credits_spent BIGINT,
    current_credits INTEGER,
    today_generations BIGINT,
    this_month_generations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ig.id) as total_generations,
        COUNT(CASE WHEN ig.status = 'completed' THEN 1 END) as successful_generations,
        COALESCE(SUM(CASE WHEN ct.transaction_type = 'EARN' THEN ct.amount ELSE 0 END), 0) as total_credits_earned,
        COALESCE(SUM(CASE WHEN ct.transaction_type = 'SPEND' THEN ABS(ct.amount) ELSE 0 END), 0) as total_credits_spent,
        u.credits as current_credits,
        COUNT(CASE WHEN ig.created_at >= CURRENT_DATE THEN 1 END) as today_generations,
        COUNT(CASE WHEN ig.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_generations
    FROM users u
    LEFT JOIN image_generations ig ON u.id = ig.user_id
    LEFT JOIN credit_transactions ct ON u.id = ct.user_id
    WHERE u.uuid = user_uuid_param
    GROUP BY u.id, u.credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;