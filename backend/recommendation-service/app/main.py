from fastapi import FastAPI

from app.routes.recommendations import router as recommendations_router

app = FastAPI(
    title="Otter Delivery Recommendation Service",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "recommendation-service",
    }


app.include_router(recommendations_router)
