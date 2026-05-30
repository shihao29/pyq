-- 创建 moments 表
CREATE TABLE IF NOT EXISTS moments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author TEXT NOT NULL,
    avatar TEXT,
    content TEXT,
    images TEXT[],
    time TEXT,
    likes TEXT[],
    comments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_moments_created_at ON moments(created_at DESC);

-- 启用行级安全 (RLS) - 可选
-- ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

-- 创建策略允许所有人读取 - 根据你的需求调整
-- CREATE POLICY "允许所有人读取" ON moments FOR SELECT USING (true);
-- CREATE POLICY "允许所有人插入" ON moments FOR INSERT WITH CHECK (true);
