# 燃脂搭子 · 减脂健身 Agent

Next.js + TypeScript 网页 Agent：记饮食与宏量、管训练计划与打卡、推今日练/吃，必要时用 Tavily 联网查证。

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 填写环境变量：复制 `.env.example` 为 `.env`，填入：

| 变量 | 说明 |
|------|------|
| `OPENAI_API_KEY` | 必填。DeepSeek / 智谱等兼容密钥 |
| `OPENAI_BASE_URL` | API **根路径**，不要带 `/chat/completions`。DeepSeek 例：`https://api.deepseek.com`；智谱例：`https://open.bigmodel.cn/api/paas/v4` |
| `OPENAI_MODEL` | 如 `deepseek-chat` / `glm-4-flash` |
| `TAVILY_API_KEY` | 可选，联网搜动作做法 |
| `DATABASE_URL` | 默认 `file:./dev.db` |

3. 初始化数据库

```bash
npx prisma db push
```

4. 启动

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，底部导航：**对话 / 今日 / 计划 / 打卡 / 我的**。先去「我的」建档。

## 试试这些话

- 「中午吃了鸡胸和米饭」
- 「启用推拉腿」→ 去计划页开练
- 「今天吃什么」
- 「我膝盖不好，避免跳跃」→ 写入伤病偏好
- 「罗马尼亚硬拉怎么做」（需 Tavily）

## 当前能力摘要

- 热量 + 蛋白/碳/脂进度；饮食可纠错写回
- 本地中式食物库（查库优先）：螺蛳粉、奶茶、麻辣烫等高热量项有固定估值，未命中再模型估算
- 训练计划、自建课表（力量+有氧动作库）、打卡日历
- 体重趋势、规则周小结（不耗模型 Token）
- 对话最近约 40 条本地持久化，刷新可恢复

## 说明

- 单用户本地 SQLite，无登录（上云以后再说）
- 训练课表来自本地模板/计划，不靠搜索生成
- 建议非医疗指导

## 产品演进

分阶段计划见：[docs/产品演进计划书.md](./docs/产品演进计划书.md)
