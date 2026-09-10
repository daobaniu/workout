# 燃脂搭子 · 减脂健身 Agent

Next.js + TypeScript 网页 Agent：记饮食、推力量训练、推每日饮食，必要时用 Tavily 联网查证。

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 填写环境变量：复制 `.env.example` 为 `.env`（仓库里已有 `.env` 占位），填入：

- `OPENAI_API_KEY`（必填）
- `OPENAI_BASE_URL`（可选，兼容中转）
- `OPENAI_MODEL`（默认 `gpt-4o-mini`）
- `TAVILY_API_KEY`（可选，联网搜索）

3. 初始化数据库（若尚未 migrate）

```bash
npx prisma migrate dev
```

4. 启动

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，先去「建档」，再开始对话。

## 试试这些话

- 「中午吃了鸡胸和米饭」
- 「今天只有 30 分钟在家练」
- 「今天吃什么」
- 「罗马尼亚硬拉怎么做」（会触发联网搜索，需配置 Tavily）

## 说明

- 单用户本地 SQLite，无登录
- 训练课表来自本地模板，不靠搜索生成
- 建议非医疗指导
