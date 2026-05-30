# 朋友圈项目文档

## 📋 项目概述

这是一个基于 React + TypeScript + Vite 构建的类似微信朋友圈的单页应用，使用 Supabase 作为后端数据库和用户认证服务。

---

## 📁 项目结构

```
pyq/
├── src/
│   ├── components/
│   │   ├── MomentCard.tsx        # 朋友圈卡片组件
│   │   ├── Avatar.tsx            # 头像组件
│   │   └── ImageGrid.tsx         # 图片网格组件
│   ├── data/
│   │   ├── momentsData.ts        # 本地假数据（历史遗留）
│   │   └── archiveMomentsData.ts # 完整的存档数据（包含所有朋友圈）
│   ├── lib/
│   │   └── supabase.ts           # Supabase 客户端配置
│   ├── Auth.tsx                  # 登录/注册组件
│   ├── ProtectedRoute.tsx        # 路由保护组件
│   ├── moments.tsx               # 主页面组件
│   ├── App.tsx                   # 应用入口
│   └── main.tsx                  # React 渲染入口
├── public/
│   ├── images/
│   │   ├── 头像.jpg             # 用户头像图片
│   │   └── 朋友圈背景.jpg       # 朋友圈背景图片
│   └── photos/
│       └── *.webp                # 所有朋友圈图片（2025-12-02_ori_01.webp 等）
├── dist/                         # 构建产物（不要手动编辑）
├── supabase-auth-trigger.sql     # 数据库初始化和触发器脚本
├── supabase-setup.sql            # 旧版数据库脚本（已废弃）
├── supabase-setup-v2.sql         # 旧版数据库脚本（已废弃）
├── package.json                  # 项目依赖配置
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 构建配置
├── .env                          # 环境变量（不提交到 Git）
└── PROJECT_DOCUMENTATION.md      # 本文档
```

---

## 📊 数据存储位置详解

### 1. 用户"29"的数据存储

#### 本地存档数据
- **位置**: `src/data/archiveMomentsData.ts`
- **内容**: 包含所有30条朋友圈记录，包括：
  - 作者：29（或"我"）
  - 头像：/images/头像.jpg
  - 所有内容、时间、点赞、评论
  - 图片引用路径

#### 朋友圈图片存储
- **位置**: `public/photos/`
- **格式**: `.webp`
- **命名规则**: `YYYY-MM-DD_ori_NN.webp`
  - 例如：`2025-12-02_ori_01.webp`
  - `NN` 是序号，从 01 开始
- **图片列表**（共43张）：
  - 2025-12-02: 1张
  - 2025-12-05: 1张
  - 2025-12-07: 2张
  - 2025-12-10: 1张
  - 2025-12-12: 1张
  - 2025-12-26: 1张
  - 2025-12-29: 3张
  - 2026-01-02: 1张
  - 2026-01-03: 1张
  - 2026-01-06: 1张
  - 2026-01-07: 1张
  - 2026-01-13: 4张
  - 2026-01-18: 1张
  - 2026-01-23: 1张
  - 2026-01-28: 1张
  - 2026-02-03: 1张
  - 2026-02-09: 3张
  - 2026-02-10: 1张
  - 2026-02-13: 1张
  - 2026-02-15: 2张
  - 2026-02-17: 2张
  - 2026-02-22: 1张
  - 2026-03-12: 3张
  - 2026-03-20: 4张
  - 2026-04-02: 1张

#### 其他静态图片
- **位置**: `public/images/`
- **内容**:
  - `头像.jpg` - 用户头像
  - `朋友圈背景.jpg` - 朋友圈顶部背景图

#### 数据库迁移注意事项
如果要把存档数据迁移到 Supabase：
1. 需要把 `public/photos/` 下的所有图片上传到 Supabase Storage
2. 更新图片 URL 引用
3. 创建用户"29"（`public.users` 表）
4. 把所有朋友圈导入到 `public.moments` 表
5. 导入所有评论和点赞

---

## 🗄️ 数据库设计

### 核心表结构

#### 1. `auth.users` (Supabase 官方用户表)
- **位置**: Supabase 内置认证系统，不在 public schema 中
- **用途**: 存储用户认证信息（邮箱、密码哈希等）
- **关联**: 通过 `id` 关联到 `public.users`

#### 2. `public.users` (用户属性表)
- **位置**: 数据库 public schema
- **用途**: 存储用户详细资料
- **字段**:
  ```sql
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  ```

#### 3. `public.moments` (朋友圈内容表)
- **位置**: 数据库 public schema
- **用途**: 存储朋友圈动态
- **字段**:
  ```sql
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  image_urls TEXT[],
  display_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  ```

#### 4. `public.comments` (评论表)
- **位置**: 数据库 public schema
- **用途**: 存储朋友圈评论
- **字段**:
  ```sql
  id UUID PRIMARY KEY,
  moment_id UUID REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  ```

#### 5. `public.likes` (点赞表)
- **位置**: 数据库 public schema
- **用途**: 存储点赞记录
- **字段**:
  ```sql
  id UUID PRIMARY KEY,
  moment_id UUID REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  ```
- **注意**: 有唯一约束 `UNIQUE(moment_id, user_id)` 防止重复点赞

### 数据库视图

为了简化查询，创建了以下视图（都在 `public` schema）：

1. `moments_with_author` - 朋友圈 + 作者信息
2. `comments_with_user` - 评论 + 用户信息
3. `likes_with_user` - 点赞 + 用户信息
4. `moments_summary` - 朋友圈汇总（包含点赞数、评论数）

### 数据库触发器

- `on_auth_user_created` - 在 `auth.users` 新增记录后自动创建对应的 `public.users` 记录
- `update_users_updated_at` - 自动更新 `public.users` 的 `updated_at` 字段

---

## 📄 关键文件详解

### 1. `src/lib/supabase.ts`
- **位置**: `src/lib/supabase.ts`
- **用途**: Supabase 客户端初始化和数据访问函数
- **关键函数**:
  - `getMoments()` - 获取所有朋友圈数据（包含关联信息）
  - `toggleLike()` - 切换点赞状态
  - `addComment()` - 添加评论
- **类型定义**: 包含所有表和视图的 TypeScript 类型

### 2. `src/Auth.tsx`
- **位置**: `src/Auth.tsx`
- **用途**: 登录和注册页面组件
- **功能**:
  - 邮箱/密码登录
  - 新用户注册（会传递 `nickname` 到 user_metadata）
  - 成功后跳转到首页
- **注意**: 注册时必须传昵称，因为触发器会从 `raw_user_meta_data->>'nickname'` 读取

### 3. `src/ProtectedRoute.tsx`
- **位置**: `src/ProtectedRoute.tsx`
- **用途**: 路由保护组件
- **功能**: 检查用户登录状态，未登录则跳转到 `/login`

### 4. `src/moments.tsx`
- **位置**: `src/moments.tsx`
- **用途**: 主页面组件（朋友圈列表）
- **关键流程**:
  1. 从 `supabase.auth.getUser()` 获取 auth 用户
  2. 查找或等待 `public.users` 记录同步（最多重试 3 次）
  3. 加载朋友圈数据
- **状态管理**:
  - `isSyncing` - 用户信息同步中
  - `isLoading` - 加载数据中
  - `error` - 错误信息

### 5. `src/App.tsx`
- **位置**: `src/App.tsx`
- **用途**: 路由配置
- **路由表**:
  - `/login` - 登录/注册页
  - `/` - 首页（需登录）

### 6. `supabase-auth-trigger.sql`
- **位置**: 项目根目录
- **用途**: 完整的数据库初始化脚本
- **重要性**: ⚠️ **这是当前正在使用的唯一 SQL 脚本，其他都是旧版本**
- **包含内容**:
  - 创建所有表
  - 创建触发器函数（带有 `SECURITY DEFINER`）
  - 创建视图
  - 配置 RLS 策略

### 7. `.env`
- **位置**: 项目根目录
- **用途**: 环境变量（不提交到 Git）
- **内容**:
  ```
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

---

## 🚀 部署和数据迁移指南

### 初始化新数据库

**步骤 1：创建 Supabase 项目**
- 访问 https://supabase.com/ 并创建新项目
- 记录项目 URL 和 Anon Key

**步骤 2：执行数据库脚本**
1. 在新 Supabase 项目中打开 SQL Editor
2. 复制 `supabase-auth-trigger.sql` 的全部内容
3. 粘贴并执行
4. 确认没有错误

**步骤 3：更新环境变量**
- 修改本地 `.env` 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

### 从旧系统迁移数据

#### 导出旧数据
```sql
-- 在旧数据库中执行，导出各个表的数据
COPY public.users TO '/tmp/users.csv' WITH (FORMAT csv, HEADER);
COPY public.moments TO '/tmp/moments.csv' WITH (FORMAT csv, HEADER);
COPY public.comments TO '/tmp/comments.csv' WITH (FORMAT csv, HEADER);
COPY public.likes TO '/tmp/likes.csv' WITH (FORMAT csv, HEADER);
```

#### 导入新数据
注意：导入顺序很重要，因为有外键约束！
1. `public.users` - 先导入用户
2. `public.moments` - 然后是朋友圈
3. `public.likes` 和 `public.comments` - 最后是评论和点赞

或者通过 Supabase Dashboard 的 Table Editor 逐个导入 CSV。

---

## 🔐 安全配置

### RLS 策略总结

所有表都启用了 RLS，策略包括：
- **users 表**: 所有人可读取，用户可更新自己的资料
- **moments 表**: 所有人可读取，已登录用户可发布，作者可更新/删除
- **comments 表**: 所有人可读取，已登录用户可评论，用户可删除自己的评论
- **likes 表**: 所有人可读取，已登录用户可点赞/取消

### 触发器安全

`handle_new_user` 函数使用了：
- `SECURITY DEFINER` - 以表创建者权限执行，绕过 RLS
- `SET search_path = public` - 防止路径遍历攻击

---

## 📚 常见问题

### Q: 为什么有多个 SQL 文件？
- `supabase-auth-trigger.sql` - **当前在用的唯一版本**
- 其他都是旧版本，保留只是为了参考，**不要使用**

### Q: 用户注册后多久能同步到 public.users？
- 理论上是立即的（数据库触发器执行）
- 但有时候可能有延迟，前端有重试机制，最多 3 次

### Q: 如何禁用 RLS 快速测试？
在 SQL Editor 中执行：
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.moments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
```
（测试完记得重新启用）

---

## 📞 技术栈

- **前端**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS
- **路由**: React Router DOM
- **后端**: Supabase (PostgreSQL + Auth)
- **图片预览**: react-photo-view

---

## 📝 维护记录

- **2024-05-13**: 添加详细数据存储位置说明，更新项目文档
- **2024-05-13**: 修复触发器权限问题，添加 SECURITY DEFINER
- **2024-05-13**: 增强前端鲁棒性，添加用户同步等待和重试
- **2024-05-12**: 初始版本，连接 Supabase 并创建基础表结构

---

## 📌 重要提醒

1. **永远只使用 `supabase-auth-trigger.sql`**，其他都是旧版本
2. 在生产环境启用 RLS！
3. `.env` 文件不要提交到 Git！
4. 进行数据迁移前，务必备份旧数据！

---

**文档版本**: 1.0  
**最后更新**: 2024-05-13
