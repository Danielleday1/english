# 云端同步配置

这个项目现在支持两种保存方式：

- 默认本地保存：`localStorage + IndexedDB`
- 可选云端同步：`Supabase Auth + Postgres + Storage`

如果你想在别的电脑继续用同一份学习记录，按下面配置一次就可以。

## 1. 创建 Supabase 项目

在 Supabase 新建一个项目，记下：

- `Project URL`
- `anon public key`

## 2. 建表和存储桶

在 Supabase SQL Editor 运行：

- [supabase/setup.sql](/Users/anan/Documents/New%20project%202/supabase/setup.sql)

它会创建：

- `english_app_snapshots`：保存文字数据快照
- `english-recordings`：保存录音文件
- 对应的 RLS 权限策略

## 3. 本地开发配置

复制 `.env.example` 为 `.env.local`，填入：

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

然后重新运行：

```bash
npm run dev
```

## 4. GitHub Pages 线上配置

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 里增加两个 `Repository secrets`：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

当前部署工作流已经会把这两个 secret 注入 Vite build，不需要再改代码。

## 5. 使用方式

第一次在主电脑上：

1. 打开复盘页里的“云端同步”
2. 输入邮箱，发送 magic link
3. 邮箱登录成功后，点击“上传当前数据到云端”

之后在别的电脑上：

1. 打开同一个网站
2. 用同一个邮箱登录
3. 点击“从云端恢复到这台电脑”

后续继续练习时，新的改动会自动同步到云端。

## 6. 当前同步范围

会同步：

- 所有学习 session
- 句型库
- 录音 metadata
- 录音文件 Blob
- 月目标天数

不会同步：

- 浏览器临时 UI 状态
- 未保存的录音草稿
