-- ============================================
-- 朋友圈数据库 - 最终优化版
-- ============================================

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT, -- 用户简介（可选，为未来扩展）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 朋友圈表
-- ============================================
CREATE TABLE IF NOT EXISTS moments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    image_urls TEXT[],
    display_time TEXT, -- 用于显示的时间字符串，如 "2025年12月2日 23:45"
    location TEXT, -- 位置信息（可选扩展）
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends')), -- 可见性设置
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 评论表
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 点赞表
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 关键：防止同一个用户对同一条朋友圈重复点赞
    UNIQUE(moment_id, user_id)
);

-- ============================================
-- 自动更新 updated_at 的触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加 updated_at 触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moments_updated_at BEFORE UPDATE ON moments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 索引优化 - 最大化查询性能
-- ============================================

-- 朋友圈：按创建时间倒序（首页列表最常用）
CREATE INDEX IF NOT EXISTS idx_moments_created_at ON moments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_author ON moments(author_id);

-- 评论：按朋友圈和时间
CREATE INDEX IF NOT EXISTS idx_comments_moment ON comments(moment_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- 点赞：复合索引（查询某条朋友圈的点赞 & 查询用户点赞过的内容）
CREATE INDEX IF NOT EXISTS idx_likes_moment_user ON likes(moment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- 用户：按昵称搜索（可选）
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- ============================================
-- 视图 - 简化常用查询
-- ============================================

-- 视图1：带作者信息的朋友圈列表
CREATE OR REPLACE VIEW moments_with_author AS
SELECT 
    m.*,
    u.nickname AS author_nickname,
    u.avatar_url AS author_avatar
FROM moments m
JOIN users u ON m.author_id = u.id;

-- 视图2：带用户信息的评论列表
CREATE OR REPLACE VIEW comments_with_user AS
SELECT 
    c.*,
    u.nickname AS user_nickname,
    u.avatar_url AS user_avatar
FROM comments c
JOIN users u ON c.user_id = u.id;

-- 视图3：带用户信息的点赞列表
CREATE OR REPLACE VIEW likes_with_user AS
SELECT 
    l.*,
    u.nickname AS user_nickname,
    u.avatar_url AS user_avatar
FROM likes l
JOIN users u ON l.user_id = u.id;

-- 视图4：朋友圈列表汇总（包含点赞数、评论数）
CREATE OR REPLACE VIEW moments_summary AS
SELECT 
    m.*,
    u.nickname AS author_nickname,
    u.avatar_url AS author_avatar,
    COALESCE(l.like_count, 0) AS like_count,
    COALESCE(c.comment_count, 0) AS comment_count
FROM moments m
JOIN users u ON m.author_id = u.id
LEFT JOIN (
    SELECT moment_id, COUNT(*) AS like_count 
    FROM likes 
    GROUP BY moment_id
) l ON m.id = l.moment_id
LEFT JOIN (
    SELECT moment_id, COUNT(*) AS comment_count 
    FROM comments 
    GROUP BY moment_id
) c ON m.id = c.moment_id;

-- ============================================
-- 行级安全 (RLS) - 数据安全
-- ============================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 策略：允许所有人读取（当前是公开朋友圈，未来可调整）
CREATE POLICY "允许所有人读取用户信息" ON users FOR SELECT USING (true);
CREATE POLICY "允许所有人读取朋友圈" ON moments FOR SELECT USING (true);
CREATE POLICY "允许所有人读取评论" ON comments FOR SELECT USING (true);
CREATE POLICY "允许所有人读取点赞" ON likes FOR SELECT USING (true);

-- 策略：允许所有人插入（演示用，实际项目需配合 auth）
CREATE POLICY "允许所有人创建用户" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "允许所有人发布朋友圈" ON moments FOR INSERT WITH CHECK (true);
CREATE POLICY "允许所有人评论" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "允许所有人点赞" ON likes FOR INSERT WITH CHECK (true);

-- 策略：允许更新和删除自己的数据
CREATE POLICY "允许用户更新自己的信息" ON users FOR UPDATE USING (true);
CREATE POLICY "允许作者更新自己的朋友圈" ON moments FOR UPDATE USING (true);
CREATE POLICY "允许作者删除自己的朋友圈" ON moments FOR DELETE USING (true);
CREATE POLICY "允许用户删除自己的评论" ON comments FOR DELETE USING (true);
CREATE POLICY "允许用户取消点赞" ON likes FOR DELETE USING (true);

-- ============================================
-- 完成！
-- ============================================
