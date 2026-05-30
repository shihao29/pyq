-- ============================================
-- Supabase 数据库设计 v2.0 - 规范化设计
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 朋友圈表
CREATE TABLE IF NOT EXISTS moments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    image_urls TEXT[],
    display_time TEXT,  -- 用于显示的时间字符串，如 "2025年12月2日 23:45"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 点赞表
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 关键：防止同一个用户对同一条朋友圈重复点赞
    UNIQUE(moment_id, user_id)
);

-- ============================================
-- 索引优化 - 提升查询性能
-- ============================================

-- moments 按创建时间倒序索引（首页列表用）
CREATE INDEX IF NOT EXISTS idx_moments_created_at ON moments(created_at DESC);

-- comments 按朋友圈和时间索引（加载评论用）
CREATE INDEX IF NOT EXISTS idx_comments_moment_created ON comments(moment_id, created_at ASC);

-- likes 按朋友圈索引（快速查某条朋友圈的点赞）
CREATE INDEX IF NOT EXISTS idx_likes_moment ON likes(moment_id);

-- likes 按用户索引（快速查用户点赞过哪些）
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- ============================================
-- 创建视图 - 简化常用查询（可选但推荐）
-- ============================================

-- 视图：带作者信息的朋友圈列表
CREATE OR REPLACE VIEW moments_with_author AS
SELECT 
    m.*,
    u.nickname AS author_nickname,
    u.avatar_url AS author_avatar
FROM moments m
JOIN users u ON m.author_id = u.id;

-- 视图：带用户信息的评论列表
CREATE OR REPLACE VIEW comments_with_user AS
SELECT 
    c.*,
    u.nickname AS user_nickname,
    u.avatar_url AS user_avatar
FROM comments c
JOIN users u ON c.user_id = u.id;

-- 视图：某条朋友圈的点赞用户列表
CREATE OR REPLACE VIEW likes_with_user AS
SELECT 
    l.*,
    u.nickname AS user_nickname,
    u.avatar_url AS user_avatar
FROM likes l
JOIN users u ON l.user_id = u.id;

-- ============================================
-- 可选：启用行级安全 (RLS)
-- ============================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
