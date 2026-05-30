# Supabase 快速设置指南

## 第一步：创建数据库表

1. 登录你的 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择你的项目 `aupotkiczutqapppmaff`
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query**
5. 打开项目根目录的 `supabase-setup.sql` 文件，复制全部内容
6. 粘贴到 SQL Editor 中，点击 **Run** 执行

## 第二步：导入本地数据

只需在终端运行一条命令：

```bash
npm run import-data
```

这条命令会自动：
- 读取本地所有朋友圈数据
- 批量导入到 Supabase 数据库

## 完成！

现在你的应用会自动从 Supabase 读取数据了。启动开发服务器测试一下：

```bash
npm run dev
```

---

## 备注

- 如果需要重新导入数据，先在 Supabase 的 Table Editor 中清空 `moments` 表，然后再次运行 `npm run import-data`
- 要修改数据结构，直接修改 `supabase-setup.sql` 然后重新执行即可
