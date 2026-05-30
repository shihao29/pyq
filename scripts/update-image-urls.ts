
import { createClient } from '@supabase/supabase-js';

// 配置
const SUPABASE_URL = 'https://aupotkiczutqapppmaff.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CPsXC_ZQN5I4pT3HCm42rA_A2MA1KiE';
const SUPABASE_STORAGE_PREFIX = 'https://aupotkiczutqapppmaff.supabase.co/storage/v1/object/public';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateImageUrls() {
  console.log('🚀 开始更新图片路径...\n');

  // 1. 读取所有 moments
  console.log('1/3 读取数据库数据...');
  const { data: moments, error: fetchError } = await supabase
    .from('moments')
    .select('id, image_urls');

  if (fetchError) throw fetchError;
  console.log(`   找到 ${moments.length} 条朋友圈`);

  // 2. 遍历并更新
  console.log('\n2/3 开始更新图片路径...');
  let updatedCount = 0;
  let skippedCount = 0;

  for (const moment of moments) {
    if (!moment.image_urls || moment.image_urls.length === 0) {
      skippedCount++;
      continue;
    }

    // 更新每个图片路径
    const updatedImageUrls = moment.image_urls.map((url: string) => {
      if (url.startsWith('/photos/') || url.startsWith('/images/')) {
        return `${SUPABASE_STORAGE_PREFIX}${url}`;
      }
      return url;
    });

    // 更新数据库
    const { error: updateError } = await supabase
      .from('moments')
      .update({ image_urls: updatedImageUrls })
      .eq('id', moment.id);

    if (updateError) {
      console.error(`   错误更新 ID ${moment.id}:`, updateError);
    } else {
      console.log(`   更新成功 ID: ${moment.id}`);
      updatedCount++;
    }
  }

  // 3. 完成
  console.log('\n3/3 完成！');
  console.log(`\n✅ 更新完成：`);
  console.log(`   更新了 ${updatedCount} 条朋友圈`);
  console.log(`   跳过了 ${skippedCount} 条朋友圈（无图片）`);
  console.log(`   使用前缀: ${SUPABASE_STORAGE_PREFIX}`);
}

updateImageUrls().catch(console.error);
