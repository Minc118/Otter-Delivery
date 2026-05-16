# Otter Delivery

Otter Delivery is an AI-first, multilingual food discovery and delivery platform prototype built for international and multicultural users. The project explores how restaurant discovery, menu understanding, personalized recommendations, checkout, and delivery tracking can work together in a modern delivery experience.

The current implementation is a desktop MVP with a polished React frontend, mock data, and early backend microservice skeletons. It is designed as a portfolio project and as a foundation for a team-based microservices implementation.

## Project Highlights

- AI-first food discovery flow with natural-language style search and recommendation-ready service boundaries.
- Multilingual product direction with planned menu translation and language preferences.
- Desktop MVP covering the main delivery journey from discovery to checkout and tracking.
- Restaurant-grouped cart and checkout flow that reflects real delivery constraints.
- Profile area with saved restaurants, recent orders, and preference settings.
- Polyglot backend architecture prepared for independent team ownership.
- Mock-first implementation that keeps UI development and backend architecture moving without exposing real API keys.

## Current Features

### Frontend MVP

- Homepage with AI-style food search and recommendation sections.
- Restaurant discovery page with restaurant cards and filtering UI.
- Restaurant detail page with menu sections and add-to-cart behavior.
- Cart drawer with restaurant grouping, quantity controls, item deletion, and selected-restaurant checkout.
- Order confirmation page with mocked payment method selection.
- Order success page after mocked checkout.
- Order tracking page with fixed ETA and tracking-focused layout.
- Ranking page with top restaurants and AI picks.
- Login page prepared for future authentication.
- Profile page with user preferences, saved restaurants, recent orders, settings panels, and order history navigation.
- Saved restaurants and order history views.

### Backend Foundation

- `driver-service` in Go with mock driver availability, location, status, and ETA APIs.
- `recommendation-service` in Python FastAPI with mock recommendation data and frontend-friendly JSON responses.
- Placeholder folders for teammate-owned services:
  - `restaurant-service`
  - `order-service`
  - `translation-service`
  - `auth-service`
- Docker Compose setup for running the frontend and implemented backend services.

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Rethink Sans typography
- Mock data and service adapters for future API integration

### Backend

- Go for `driver-service`
- Python FastAPI for `recommendation-service`
- REST APIs with JSON
- Docker and Docker Compose
- Planned Java / Spring Boot teammate services

### Planned Integrations

- Keycloak for authentication
- Gemini API for AI recommendation
- Google Cloud Translation for menu translation
- Google Maps or route estimation for driver ETA
- Supabase or service-owned PostgreSQL databases

No real external APIs are connected in the current MVP.

## Repository Structure

```txt
otter-delivery/
  frontend/                 React + Vite desktop MVP
    src/
      components/
      context/
      data/
      hooks/
      routes/
      services/
      styles/
      utils/

  backend/                  Microservice workspace
    driver-service/         Go service
    recommendation-service/ Python FastAPI service
    restaurant-service/     Placeholder for teammate implementation
    order-service/          Placeholder for teammate implementation
    translation-service/    Placeholder for teammate implementation
    auth-service/           Placeholder for teammate implementation

  docs/                     Local architecture notes
  docker-compose.yml
  .env.example
  README.md
```

## Architecture Overview

Otter Delivery is structured around independently deployable services. Services can be implemented in different languages as long as they communicate through REST APIs using JSON.

```txt
frontend
  -> restaurant-service
  -> order-service
  -> driver-service
  -> recommendation-service
  -> translation-service
  -> auth-service / Keycloak
```

The MVP keeps data mocked and frontend-friendly. The backend service skeletons define boundaries and API shapes so teammates can implement their services independently.

## Local Development

### Frontend

Install dependencies:

```bash
cd frontend
npm install
```

Run the development server:

```bash
cd frontend
npm run dev
```

Build for production:

```bash
cd frontend
npm run build
```

### Driver Service

```bash
cd backend/driver-service
go run ./cmd/server
```

Default port: `8003`

Example:

```bash
curl http://localhost:8003/health
curl http://localhost:8003/drivers/available
```

### Recommendation Service

```bash
cd backend/recommendation-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8004
```

Example:

```bash
curl http://localhost:8004/health
```

## Docker Compose

Run the frontend and implemented backend services:

```bash
docker compose up --build
```

Run only backend services:

```bash
docker compose up --build driver-service recommendation-service
```

## Validation

Frontend build:

```bash
cd frontend
npm run build
```

Docker Compose config:

```bash
docker compose config --quiet
```

Recommendation service compile check:

```bash
cd backend/recommendation-service
python3 -m compileall app
```

Driver service check:

```bash
cd backend/driver-service
gofmt -w .
go test ./...
```

## Current Scope

- Desktop MVP only.
- Mock data only.
- No real payment integration.
- No real authentication yet.
- No production database connection yet.
- Fixed delivery ETA: approximately 40 minutes.
- External AI, translation, maps, and auth providers are planned but not connected.

## Design Direction

The UI keeps a Stitch-inspired delivery app style:

- near-white surfaces
- teal-green primary color
- warm yellow AI and friendly accent color
- rounded cards
- soft borders
- subtle shadows
- clear desktop information hierarchy

The design goal is to feel practical, friendly, and polished without turning the product into a marketing landing page.

## Portfolio Notes

This project demonstrates:

- frontend product implementation from generated design references
- component extraction and UI consistency work
- mock-first product iteration
- checkout and order tracking flow design
- repository restructuring for team collaboration
- early microservice architecture planning
- Go and Python service skeleton implementation
- Docker Compose-based local development setup

The current repository is intentionally structured to support future team work, where each backend service can evolve independently while the frontend continues to use stable service adapters.

---

# Otter Delivery 中文说明

Otter Delivery 是一个 AI-first、多语言美食发现与外卖平台原型，面向国际化和多文化用户。这个项目探索了餐厅发现、菜单理解、个性化推荐、购物车结算和配送追踪如何组合成一个完整的现代外卖体验。

当前版本是桌面端 MVP，包含较完整的 React 前端、mock data，以及初步的后端微服务骨架。项目既用于作品集展示，也作为团队协作式微服务项目的基础。

## 项目亮点

- AI-first 的美食发现流程，预留自然语言推荐服务边界。
- 面向多语言用户的产品方向，后续可接入菜单翻译和语言偏好。
- 覆盖从餐厅发现、加购、确认订单、模拟支付到配送追踪的主要路径。
- 支持按餐厅分组的购物车和单餐厅结算流程。
- 个人资料区域包含收藏餐厅、近期订单和偏好设置。
- 后端采用多语言微服务架构，方便团队成员独立开发。
- 使用 mock data 优先推进 MVP，不在前端暴露真实 API key 或后端密钥。

## 当前功能

### 前端 MVP

- 首页 AI 风格美食搜索和推荐区域。
- 餐厅发现页面。
- 餐厅详情页和菜单展示。
- 购物车抽屉，支持餐厅分组、数量调整、删除餐品和选择餐厅结算。
- 订单确认页和模拟支付方式选择。
- 下单成功页。
- 订单追踪页，当前使用固定 ETA。
- 餐厅排行榜页和 AI Picks 区域。
- 登录页，为后续认证预留。
- 个人资料页，包含偏好设置、收藏餐厅、近期订单和历史订单入口。
- 收藏餐厅和订单历史页面。

### 后端基础

- `driver-service` 使用 Go 实现，提供 mock driver、位置、状态和 ETA API。
- `recommendation-service` 使用 Python FastAPI 实现，提供 mock 推荐数据和结构化 JSON 响应。
- 为队友负责的服务预留目录：
  - `restaurant-service`
  - `order-service`
  - `translation-service`
  - `auth-service`
- 使用 Docker Compose 管理本地开发服务。

## 技术栈

### 前端

- React
- Vite
- Tailwind CSS
- React Router
- Rethink Sans 字体
- mock data 和面向未来 API 的 service adapter

### 后端

- Go：`driver-service`
- Python FastAPI：`recommendation-service`
- REST JSON API
- Docker 和 Docker Compose
- 队友服务后续可使用 Java / Spring Boot

## 本地运行

前端：

```bash
cd frontend
npm install
npm run dev
```

生产构建：

```bash
cd frontend
npm run build
```

Driver Service：

```bash
cd backend/driver-service
go run ./cmd/server
```

Recommendation Service：

```bash
cd backend/recommendation-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8004
```

Docker Compose：

```bash
docker compose up --build
```

## 当前范围

- 仅桌面端 MVP。
- 仅使用 mock data。
- 不实现真实支付。
- 不实现真实认证。
- 暂不连接真实数据库。
- 固定配送 ETA：约 40 分钟。
- Gemini、Google Translation、Google Maps、Keycloak、Supabase 等均为后续集成方向。

## 作品集价值

这个项目展示了：

- 从生成式设计稿落地为 React 前端的能力。
- 组件抽取和设计一致性维护。
- mock-first 的产品迭代方式。
- 购物车、结算、下单成功和订单追踪的完整流程设计。
- 面向团队协作的仓库结构整理。
- 微服务边界和 API 契约规划。
- Go 与 Python FastAPI 服务骨架实现。
- Docker Compose 本地开发环境搭建。

项目当前的重点不是接入真实商业服务，而是展示完整产品思路、前端实现质量和后端架构准备。
