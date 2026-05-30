import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateUserAvatar() {
  const userId = '48ce07a4-5d6e-438f-b717-47a65e72b032';
  const newAvatarUrl = 'https://aupotkiczutqapppmaff.supabase.co/storage/v1/object/public/avatars/avatars/29.jpg';
  
  console.log('正在更新用户头像...');
  console.log('用户ID:', userId);
  console.log('新头像URL:', newAvatarUrl);
  
  const { data, error } = await supabase
    .from('users')
    .update({ avatar_url: newAvatarUrl })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('更新失败:', error);
    return;
  }

  console.log('\n✅ 更新成功！');
  console.log('更新后的用户信息:');
  console.log(JSON.stringify(data, null, 2));
}

updateUserAvatar().catch(console.error);
