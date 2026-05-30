# Supabase 数据库配置 v2.0

## 数据库设计

采用规范化的关系型数据库设计，包含以下表：

### 1. users（用户表）
- `id` - UUID 主键
- `nickname` - 用户昵称
- `avatar_url` - 头像链接
- `created_at` - 创建时间

### 2. moments（朋友圈表）
- `id` - UUID 主键
- `author_id` - 外键，关联 users 表
- `content` - 文字内容
- `image_urls` - 图片链接数组（text[]）
- `display_time` - 显示的时间字符串
- `created_at` - 创建时间

### 3. comments（评论表）
- `id` - UUID 主键
- `moment_id` - 外键，关联 moments 表
- `user_id` - 外键，关联 users 表
- `content` - 评论内容
- `created_at` - 创建时间

### 4. likes（点赞表）
- `id` - UUID 主键
- `moment_id` - 外键，关联 moments 表
- `user_id` - 外键，关联 users 表
- `created_at` - 创建时间
- **唯一约束**：(`moment_id`, `user_id`) - 防止重复点赞

## 快速开始

### 1. 创建表结构

1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query**
5. 打开 `supabase-setup-v2.sql` 文件，复制全部内容
6. 粘贴到 SQL Editor 中，点击 **Run** 执行

### 2. 导入本地数据

在项目根目录运行：

```bash
npm run migrate
```

这个脚本会：
- 创建默认用户（昵称：29）
- 导入所有本地朋友圈数据
- 导入点赞和评论数据
- 自动创建相关用户

### 3. 启动应用

```bash
npm run dev
```

## 主要优化点

1. **防止重复点赞**：通过数据库层面的唯一约束实现
2. **视图简化查询**：创建了 `moments_with_author`、`comments_with_user`、`likes_with_user` 三个视图
3. **索引优化**：为常用查询字段添加索引
4. **级联删除**：删除朋友圈时，相关评论和点赞也会自动删除

## 注意事项

- 如果需要重新导入数据，请先在 Supabase 控制台清空所有表
- 按顺序清空：likes → comments → moments → users
