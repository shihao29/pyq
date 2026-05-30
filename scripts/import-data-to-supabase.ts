import { createClient } from '@supabase/supabase-js';
import { archiveMomentsData, initialMomentsData } from '../src/data/momentsData';

// 从环境变量读取 Supabase 配置
const SUPABASE_URL = 'https://aupotkiczutqapppmaff.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CPsXC_ZQN5I4pT3HCm42rA_A2MA1KiE';

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 合并所有数据
const allData = [...archiveMomentsData, ...initialMomentsData].filter(m => 
    !m.id.includes('test') && 
    !m.content.includes('测试专用') && 
    !m.content.includes('这是一条测试')
);

async function importData() {
    console.log(`准备导入 ${allData.length} 条数据...`);

    // 转换数据格式
    const records = allData.map(item => ({
        author: item.author,
        avatar: item.avatar,
        content: item.content,
        images: item.images,
        time: item.time,
        likes: item.likes,
        comments: item.comments
    }));

    // 批量插入
    const { data, error } = await supabase
        .from('moments')
        .insert(records)
        .select();

    if (error) {
        console.error('导入失败:', error);
        process.exit(1);
    }

    console.log(`✅ 成功导入 ${data?.length || 0} 条数据！`);
}

// 执行导入
importData();
