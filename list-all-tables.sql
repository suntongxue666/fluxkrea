-- 查看数据库中所有的表
SELECT 
    table_name,
    table_type,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 查看每个表的记录数（需要逐个执行）
-- 复制下面的查询，替换 TABLE_NAME 为实际表名

/*
SELECT 'TABLE_NAME' as table_name, COUNT(*) as record_count FROM TABLE_NAME;
*/