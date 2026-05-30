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

async function checkUser() {
  const userId = '48ce07a4-5d6e-438f-b717-47a65e72b032';
  
  console.log('正在查询用户信息...');
  
  // 查询用户表
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('查询用户失败:', error);
    return;
  }

  console.log('用户信息:');
  console.log(JSON.stringify(user, null, 2));
  
  if (user?.avatar_url) {
    console.log('\n当前头像URL:', user.avatar_url);
    console.log('尝试访问URL:', user.avatar_url);
  } else {
    console.log('\n用户没有设置头像URL');
  }
}

checkUser().catch(console.error);
