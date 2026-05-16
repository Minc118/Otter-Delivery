from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    query: str = Field(..., min_length=1)
    language: str = "en"
    dietaryPreferences: list[str] = []
    maxPrice: float | None = None


class RecommendationItem(BaseModel):
    restaurantId: str
    restaurantName: str
    dishId: str
    dishName: str
    price: float
    currency: str = "EUR"
    reason: str
    tags: list[str]


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendationItem]


class ErrorBody(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody
