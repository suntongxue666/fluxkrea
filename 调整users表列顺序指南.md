# 调整users表列顺序指南

## 需求
将users表中的以下4列移动到id列的右侧：
- Google_id
- email
- name
- credits

## 解决方案

我们创建了一个SQL脚本`adjust-users-table-columns.sql`来实现这个需求。这个脚本的工作原理是：

1. 创建一个临时表，按照新的列顺序定义表结构
2. 将数据从原表复制到临时表，按照新的列顺序排列
3. 备份原表（重命名为users_backup）
4. 将临时表重命名为正式表名
5. 重新创建索引和约束
6. 重新设置序列（如果有）
7. 恢复表权限

## 执行步骤

### 方法1：使用Supabase SQL编辑器

1. 登录Supabase管理界面
2. 点击左侧菜单的"SQL编辑器"
3. 创建一个新的查询
4. 复制`adjust-users-table-columns.sql`中的内容到编辑器
5. 点击"运行"按钮执行SQL

### 方法2：使用psql命令行工具

如果你有数据库的直接访问权限，可以使用psql执行：

```bash
psql -h <数据库主机> -U <用户名> -d <数据库名> -f adjust-users-table-columns.sql
```

## 注意事项

1. **备份数据**：在执行此操作前，请确保已经备份了数据库
2. **测试环境**：建议先在测试环境中执行此脚本
3. **停机时间**：此操作可能需要一定的停机时间，特别是当表中数据量较大时
4. **验证**：执行后，请验证表结构和数据是否正确
5. **保留备份**：脚本默认不会删除备份表，如果确认一切正常，可以手动删除

## 验证方法

执行以下SQL查询来验证列顺序是否已经调整：

```sql
SELECT column_name, ordinal_position
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

确认google_id、email、name和credits列现在位于id列之后，ordinal_position值应该是2、3、4和5。