import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
// 注意：这里的路径需要根据你的 archiveMomentsData 实际导出的变量名来写
import { archiveMomentsData } from '../src/data/archiveMomentsData'; 

dotenv.config();

// 1. 填入你在 Step 0 复制的专属账号 UUID！！！
const MY_USER_ID = '48ce07a4-5d6e-438f-b717-47a65e72b032';

// 2. 初始化 Supabase 客户端 (使用项目里的 .env 变量)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('缺失 Supabase 环境变量，请检查 .env 文件');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 开始迁移朋友圈数据...');

  for (const moment of archiveMomentsData) {
    try {
      // 1. 插入朋友圈内容
      // 注意：如果是老数据，主键 id 可能需要由数据库重新生成 UUID。
      // 我们在插入时不传老的 id，让数据库自动生成
      const { data: insertedMoment, error: momentError } = await supabase
        .from('moments')
        .insert({
          author_id: MY_USER_ID, // 强制绑定为你自己的账号
          content: moment.content,
          image_urls: moment.images || [], // 映射本地的图片数组
          display_time: moment.time || moment.display_time, // 映射时间
          // created_at 留空，数据库会自动生成，或者如果你想保留历史时间可以手动传入
        })
        .select('id')
        .single();

      if (momentError) {
        console.error(`❌ 插入朋友圈失败:`, momentError);
        continue; // 跳过这一条，继续下一条
      }

      console.log(`✅ 成功插入朋友圈: ${moment.content?.substring(0, 10)}...`);

      const newMomentId = insertedMoment.id;

      // 2. 如果老数据里有评论，一并迁移（可选）
      if (moment.comments && moment.comments.length > 0) {
        const commentsToInsert = moment.comments.map((comment: any) => ({
          moment_id: newMomentId,
          user_id: MY_USER_ID, // 假设老评论也算作你自己的测试号发的
          content: comment.content,
        }));

        const { error: commentsError } = await supabase
          .from('comments')
          .insert(commentsToInsert);

        if (commentsError) {
          console.error(`⚠️ 评论插入失败:`, commentsError);
        }
      }
    } catch (err) {
      console.error('发生异常:', err);
    }
  }

  console.log('🎉 所有数据迁移完成！');
}

migrate();