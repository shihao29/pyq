import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const DEFAULT_AVATAR = 'https://aupotkiczutqapppmaff.supabase.co/storage/v1/object/public/avatars/avatars/29.jpg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 类型定义
export interface User {
  id: string;
  nickname: string;
  avatar_url: string;
  created_at: string;
}

export interface Moment {
  id: string;
  author_id: string;
  content: string;
  image_urls: string[];
  display_time: string;
  created_at: string;
}

export interface Comment {
  id: string;
  moment_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Like {
  id: string;
  moment_id: string;
  user_id: string;
  created_at: string;
}

// 带关联数据的类型
export interface MomentWithDetails extends Moment {
  author_nickname: string;
  author_avatar: string;
  likes: { user_id: string; user_nickname: string; user_avatar: string }[];
  comments: { user_id: string; user_nickname: string; user_avatar: string; content: string }[];
}

// 获取朋友圈列表（带作者、点赞、评论信息
export async function getMoments(): Promise<MomentWithDetails[]> {
  // 1. 获取带作者信息的朋友圈
  const { data: moments, error: momentsError } = await supabase
    .from('moments_with_author')
    .select('*')
    .order('created_at', { ascending: false });

  if (momentsError) throw momentsError;
  if (!moments) return [];

  // 2. 批量获取点赞和评论
  const momentIds = moments.map(m => m.id);

  // 获取点赞（包含 user_id）
  const { data: likes, error: likesError } = await supabase
    .from('likes_with_user')
    .select('moment_id, user_id, user_nickname, user_avatar')
    .in('moment_id', momentIds);

  if (likesError) throw likesError;

  // 获取评论（包含 user_id）
  const { data: comments, error: commentsError } = await supabase
    .from('comments_with_user')
    .select('moment_id, user_id, user_nickname, user_avatar, content, created_at')
    .in('moment_id', momentIds)
    .order('created_at', { ascending: true });

  if (commentsError) throw commentsError;

  // 3. 组装数据
  return moments.map(moment => ({
    ...moment,
    likes: likes?.filter(l => l.moment_id === moment.id) || [],
    comments: comments?.filter(c => c.moment_id === moment.id) || []
  }));
}

// 切换点赞状态
export async function toggleLike(momentId: string, userId: string) {
  // 先检查是否已点赞
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('moment_id', momentId)
    .eq('user_id', userId)
    .single();

  if (existingLike) {
    // 取消点赞
    await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);
    return false; // 返回 false 表示已取消
  } else {
    // 点赞
    await supabase
      .from('likes')
      .insert({ moment_id: momentId, user_id: userId });
    return true; // 返回 true 表示已点赞
  }
}

// 添加评论
export async function addComment(momentId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ moment_id: momentId, user_id: userId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 删除朋友圈
export async function deleteMoment(momentId: string) {
  const { error } = await supabase
    .from('moments')
    .delete()
    .eq('id', momentId);
  if (error) throw error;
  return true;
}

// 删除评论（需要 comment id）
export async function deleteComment(comment: { user_id: string, user_nickname: string, user_avatar: string, content: string }) {
  // 先找到评论 ID
  const { data: comments, error: fetchError } = await supabase
    .from('comments')
    .select('*')
    .eq('user_id', comment.user_id)
    .eq('content', comment.content)
    .order('created_at', { ascending: false });
  
  if (fetchError) throw fetchError;
  if (!comments || comments.length === 0) throw new Error('未找到该评论');
  
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', comments[0].id);
  if (error) throw error;
  return true;
}
