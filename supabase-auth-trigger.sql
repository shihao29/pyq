-- ============================================
-- Supabase Auth 用户自动同步触发器
-- ============================================

-- ============================================
-- 1. 创建或更新 public.users 表
-- ============================================

-- 先删除旧表（如果存在，注意：这会删除现有数据！）
DROP TABLE IF EXISTS public.users CASCADE;

-- 创建关联 auth.users 的表
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nickname TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 创建自动更新 updated_at 的触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 users 表添加 updated_at 触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. 创建 auth.users 变更的处理函数
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER  -- 关键：以表创建者（管理员）权限执行
SET search_path = public  -- 显式设置搜索路径，确保安全
AS $$
BEGIN
    INSERT INTO public.users (id, email, nickname, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'nickname',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)  -- 默认用邮箱前缀作为昵称
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'avatar',
            NEW.raw_user_meta_data->>'picture'
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. 创建触发器监听 auth.users 的 INSERT 事件
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. 创建视图（包含 user_id）
-- ============================================

-- 视图1：带作者信息的朋友圈列表
CREATE OR REPLACE VIEW public.moments_with_author AS
SELECT 
    m.*,
    u.nickname AS author_nickname,
    u.avatar_url AS author_avatar
FROM public.moments m
JOIN public.users u ON m.author_id = u.id;

-- 视图2：带用户信息的评论列表
CREATE OR REPLACE VIEW public.comments_with_user AS
SELECT 
    c.*,
    u.nickname AS user_nickname,
    u.avatar_url AS user_avatar
FROM public.comments c
JOIN public.users u ON c.user_id = u.id;

-- 视图3：带用户信息的点赞列表（包含 user_id）
CREATE OR REPLACE VIEW public.likes_with_user AS
SELECT 
    l.*,
    u.nickname AS user_nickname,
    u.avatar_url AS user_avatar
FROM public.likes l
JOIN public.users u ON l.user_id = u.id;

-- 视图4：朋友圈列表汇总
CREATE OR REPLACE VIEW public.moments_summary AS
SELECT 
    m.*,
    u.nickname AS author_nickname,
    u.avatar_url AS author_avatar,
    COALESCE(l.like_count, 0) AS like_count,
    COALESCE(c.comment_count, 0) AS comment_count
FROM public.moments m
JOIN public.users u ON m.author_id = u.id
LEFT JOIN (
    SELECT moment_id, COUNT(*) AS like_count 
    FROM public.likes 
    GROUP BY moment_id
) l ON m.id = l.moment_id
LEFT JOIN (
    SELECT moment_id, COUNT(*) AS comment_count 
    FROM public.comments 
    GROUP BY moment_id
) c ON m.id = c.moment_id;

-- ============================================
-- 6. 行级安全策略（RLS）- 安全版
-- ============================================
-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "允许所有人读取用户信息" ON public.users;
DROP POLICY IF EXISTS "允许所有人读取朋友圈" ON public.moments;
DROP POLICY IF EXISTS "允许所有人读取评论" ON public.comments;
DROP POLICY IF EXISTS "允许所有人读取点赞" ON public.likes;
DROP POLICY IF EXISTS "允许用户更新自己的信息" ON public.users;
DROP POLICY IF EXISTS "允许作者更新自己的朋友圈" ON public.moments;
DROP POLICY IF EXISTS "允许作者删除自己的朋友圈" ON public.moments;
DROP POLICY IF EXISTS "允许用户删除自己的评论" ON public.comments;
DROP POLICY IF EXISTS "允许用户取消点赞" ON public.likes;

-- 用户表策略
CREATE POLICY "允许所有人读取用户信息" ON public.users FOR SELECT USING (true);
CREATE POLICY "允许用户更新自己的信息" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 朋友圈策略
CREATE POLICY "允许所有人读取朋友圈" ON public.moments FOR SELECT USING (true);
CREATE POLICY "允许已登录用户发布朋友圈" ON public.moments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "允许作者更新自己的朋友圈" ON public.moments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "允许作者删除自己的朋友圈" ON public.moments FOR DELETE USING (auth.uid() = author_id);

-- 评论策略
CREATE POLICY "允许所有人读取评论" ON public.comments FOR SELECT USING (true);
CREATE POLICY "允许已登录用户评论" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "允许用户删除自己的评论" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 点赞策略
CREATE POLICY "允许所有人读取点赞" ON public.likes FOR SELECT USING (true);
CREATE POLICY "允许已登录用户点赞" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "允许用户取消点赞" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 完成！
-- ============================================
