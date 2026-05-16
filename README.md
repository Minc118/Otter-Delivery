# Otter Delivery Frontend

Otter Delivery is a desktop MVP frontend for an AI-first, multilingual food discovery and delivery experience. The current app uses mock data only. AI recommendations, authentication, translation, order history, and delivery tracking are represented as frontend-ready flows without backend connections.

## Features

- React + Vite + Tailwind frontend
- Desktop-only MVP layout
- Rethink Sans global typography
- Stitch-inspired visual style with near-white surfaces, teal-green primary color, warm yellow accents, rounded cards, soft borders, and subtle shadows
- Homepage with AI-style food discovery search
- Restaurant discovery, rankings, restaurant detail, cart drawer, order confirmation, order success, order tracking, profile, saved restaurants, and order history pages
- Restaurant-grouped cart with quantity controls and per-restaurant checkout summary
- Profile settings for language, translation, dietary preferences, notifications, and account preferences
- Mock data separated from components
- Service files prepared for future API integration

## Tech Stack

- React
- Vite
- Tailwind CSS
- React Router

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Current Scope

- Mock data only
- No backend API connection
- No real authentication
- No real payment
- Desktop layout only
- Fixed ETA display: approximately 40 minutes

## Future Integrations

- Keycloak authentication
- Google Cloud Translation for menu translation
- Gemini API for AI recommendations
- Driver ETA service
- Supabase or service-owned databases
- Order history and user profile backend APIs
- Restaurant filtering and sorting APIs

---

# Otter Delivery 前端

Otter Delivery 是一个桌面端 MVP 前端项目，面向 AI-first、多语言的美食发现与外卖体验。当前应用只使用 mock data。AI 推荐、登录、翻译、订单历史和配送追踪都已经做成前端流程，但还没有连接后端服务。

## 功能

- React + Vite + Tailwind 前端
- 仅支持桌面端 MVP 布局
- 全局使用 Rethink Sans 字体
- 保留 Stitch 风格：近白背景、青绿色主色、暖黄色强调、圆角卡片、柔和边框和轻阴影
- 首页 AI 风格美食发现搜索
- 餐厅发现、排行榜、餐厅详情、购物车抽屉、订单确认、下单成功、订单追踪、个人资料、收藏餐厅和订单历史页面
- 按餐厅分组的购物车，支持数量调整和单餐厅结算摘要
- 个人资料中支持语言、翻译、饮食偏好、通知和账号偏好设置
- mock data 与组件分离
- service 文件已为未来 API 接入预留边界

## 技术栈

- React
- Vite
- Tailwind CSS
- React Router

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

预览生产构建：

```bash
npm run preview
```

## 当前范围

- 仅使用 mock data
- 不连接后端 API
- 不实现真实认证
- 不实现真实支付
- 仅桌面端布局
- 固定 ETA 显示：约 40 分钟

## 未来集成

- Keycloak 认证
- Google Cloud Translation 菜单翻译
- Gemini API AI 推荐
- 司机 ETA 服务
- Supabase 或服务自有数据库
- 订单历史和用户资料后端 API
- 餐厅筛选与排序 API
