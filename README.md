# Otter Delivery

Otter Delivery is a demo-scale food delivery web application built as a microservice project. It supports restaurant discovery, recommendation/search, cart management, checkout, driver assignment, delivery tracking, order history, profile handling, and optional translation.

## Live Demo

The easiest way to review the user-facing product flow is through the deployed frontend:

https://otter-delivery.vercel.app

The frontend is deployed on Vercel and communicates with backend services deployed on Google Cloud Run.

## What We Are Most Proud Of

What we are most proud of is the way the project developed from a product idea into a usable microservice-based application.

At the beginning, we approached the project from a product perspective. Instead of only implementing isolated backend services, we first thought about the complete workflow of a food delivery application: restaurant discovery, search and recommendation, cart management, checkout, order history, and delivery tracking. This helped us define a clearer user journey and a PRD-style feature plan before implementing the individual services.

We are also proud of the collaboration experience we gained during the project. Different parts of the system were developed by different team members, and many important improvements happened during integration, when frontend behavior, backend APIs, persistence, and deployment constraints had to work together.

In the later phase of the project, we researched serverless and managed cloud deployment more deeply. This helped us identify weaknesses in the original implementation. By fixing these issues, the project became more stable and closer to a real deployable product.

Overall, we are proud that the final result is not just a set of services, but a working food delivery application that can be used through a deployed frontend and demonstrates a realistic end-to-end workflow.

## Work Distribution

Work was distributed roughly by service and based on voluntary self-selection within the team. At the beginning of the project, each team member chose the areas and services they wanted to focus on, depending on their interests.

| Team member | Main contributions |
|---|---|
| Minjian Li |  Frontend development, Recommendation service, driver service, deployment setup,integration support, testing and debugging|
| Nikolay Iliev | Translation service, Resturant service, integration support, testing and debugging |
| Sohrab Dokmehchin | Frontend development，Order service, Profile service, integration support, testing and debugging |

## Use of AI

We used ChatGPT for early research, architectural discussions, debugging support, test design, and code review suggestions. Figma was used for frontend design, and Figma-related tooling support was used to refine UI ideas and export initial frontend code, which was then manually reviewed, adapted, and integrated into the React/Vite application. We also used ChatGPT and  to help generate mock restaurant, menu, and demo content.

The final architecture, service boundaries, implementation decisions, integration work, deployment configuration, testing, and validation were carried out and reviewed by the team. AI-generated outputs were treated as suggestions and were manually checked, modified, and tested before being included in the project.

## How to Run the Project

The project can be run locally with Docker Compose.

From the repository root:

```bash
docker compose up --build
```

After startup, open the frontend at:

```txt
http://localhost:5173
```

Required environment variables and external API configuration are documented in `.env.example`.



## Locust

A short Locust file can be added as `locustfile.py` for basic endpoint testing. Since the system consists of multiple services with different base URLs, Locust should be run against one service host at a time.


Relevant endpoints for simple experiments include restaurant listing, recommendation requests, driver assignment/tracking, translation health, profile login, and order history endpoints.

## Use for Further Experiments

We are open to the project being used for course-related comparison experiments on different microservice architectures. The repository may be used for testing and analysis as long as no private credentials, API keys, or production database secrets are exposed or reused.


