# 聚财通路

个人财务工具，包含两大模块：

## 功能

### 私募基金看板
- 基于飞书 Bitable 的私募基金数据管理
- 净值跟踪、收益统计、持仓分析

### 装修记账
- 装修费用记录与管理
- 分类统计、预算控制

## 技术栈

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** (样式)
- **@larksuiteoapi/node-sdk** (飞书 API)
- **Axios** (HTTP 请求)

## 快速开始

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 构建
npm run build

# 生产启动
npm start
```

## 环境变量

复制 `.env.local` 并填入实际的飞书应用 ID 和表格 ID：

```
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_TABLE_PRIVATE_FUND_INPUT=your_table_id
FEISHU_TABLE_PRIVATE_FUND_STATS=your_table_id
FEISHU_TABLE_RENOVATION_INPUT=your_table_id
FEISHU_TABLE_RENOVATION_STATS=your_table_id
```

## 项目结构

```
src/
├── app/
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── private-fund/      # 私募基金看板路由
│   │   └── page.tsx
│   └── renovation/        # 装修记账路由
│       └── page.tsx
├── components/
│   ├── HomePage.tsx       # 首页组件
│   ├── private-fund/      # 私募基金组件
│   └── renovation/        # 装修记账组件
└── lib/
    └── feishu.ts          # 飞书 API 工具函数
```
