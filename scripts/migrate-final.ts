import { createClient } from '@supabase/supabase-js';
import { archiveMomentsData, initialMomentsData } from '../src/data/momentsData';

// 配置
const SUPABASE_URL = 'https://aupotkiczutqapppmaff.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CPsXC_ZQN5I4pT3HCm42rA_A2MA1KiE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateData() {
  console.log('🚀 开始迁移数据到最终版...\n');

  // --------------------------
  // 1. 获取或创建默认用户
  // --------------------------
  console.log('1/4 处理用户数据...');
  let userId: string;

  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .eq('nickname', '29')
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    userId = existingUsers[0].id;
    console.log('   找到已有用户:', userId);
  } else {
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        nickname: '29',
        avatar_url: '/images/头像.jpg',
        bio: '记录生活的点滴'
      })
      .select()
      .single();

    if (userError) throw userError;
    userId = newUser.id;
    console.log('   创建新用户:', userId);
  }

  // --------------------------
  // 2. 准备朋友圈数据
  // --------------------------
  console.log('\n2/4 导入朋友圈数据...');
  
  const allMoments = [...archiveMomentsData, ...initialMomentsData].filter(m => 
    !m.id.includes('test') && 
    !m.content.includes('测试专用') && 
    !m.content.includes('这是一条测试')
  );

  // 解析时间字符串用于排序
  const parseTimeToDate = (timeStr: string): Date => {
    try {
      const match = timeStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2}):(\d{1,2})/);
      if (match) {
        const [, year, month, day, hour, minute] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      }
    } catch {
      return new Date(0);
    }
    return new Date(0);
  };

  // 按时间倒序排列
  allMoments.sort((a, b) => parseTimeToDate(b.time).getTime() - parseTimeToDate(a.time).getTime());

  // 插入 moments
  const momentsToInsert = allMoments.map(item => ({
    author_id: userId,
    content: item.content,
    image_urls: item.images,
    display_time: item.time,
    visibility: 'public'
  }));

  const { data: insertedMoments, error: momentsError } = await supabase
    .from('moments')
    .insert(momentsToInsert)
    .select('id, display_time');

  if (momentsError) throw momentsError;
  console.log(`   成功导入 ${insertedMoments.length} 条朋友圈`);

  // --------------------------
  // 3. 导入点赞数据
  // --------------------------
  console.log('\n3/4 导入点赞数据...');

  const likesToInsert: any[] = [];
  
  for (const localMoment of allMoments) {
    const dbMoment = insertedMoments.find(m => m.display_time === localMoment.time);
    if (!dbMoment) continue;

    for (const likerNickname of localMoment.likes) {
      let likerId: string;
      const { data: likers } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', likerNickname)
        .limit(1);

      if (likers && likers.length > 0) {
        likerId = likers[0].id;
      } else {
        const { data: newLiker } = await supabase
          .from('users')
          .insert({
            nickname: likerNickname,
            avatar_url: '/images/头像.jpg'
          })
          .select()
          .single();
        likerId = newLiker.id;
      }

      likesToInsert.push({
        moment_id: dbMoment.id,
        user_id: likerId
      });
    }
  }

  if (likesToInsert.length > 0) {
    await supabase.from('likes').insert(likesToInsert);
  }
  console.log(`   成功导入 ${likesToInsert.length} 个点赞`);

  // --------------------------
  // 4. 导入评论数据
  // --------------------------
  console.log('\n4/4 导入评论数据...');

  const commentsToInsert: any[] = [];

  for (const localMoment of allMoments) {
    const dbMoment = insertedMoments.find(m => m.display_time === localMoment.time);
    if (!dbMoment) continue;

    for (const localComment of localMoment.comments) {
      let commenterId: string;
      const { data: commenters } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', localComment.author)
        .limit(1);

      if (commenters && commenters.length > 0) {
        commenterId = commenters[0].id;
      } else {
        const { data: newCommenter } = await supabase
          .from('users')
          .insert({
            nickname: localComment.author,
            avatar_url: '/images/头像.jpg'
          })
          .select()
          .single();
        commenterId = newCommenter.id;
      }

      commentsToInsert.push({
        moment_id: dbMoment.id,
        user_id: commenterId,
        content: localComment.content
      });
    }
  }

  if (commentsToInsert.length > 0) {
    await supabase.from('comments').insert(commentsToInsert);
  }
  console.log(`   成功导入 ${commentsToInsert.length} 条评论`);

  // --------------------------
  // 完成
  // --------------------------
  console.log('\n✅ 数据迁移完成！');
}

migrateData().catch(console.error);
