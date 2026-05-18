import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session


def _embedding_literal(embedding: list[float]) -> str:
    return "[" + ",".join(str(float(value)) for value in embedding) + "]"


def store_food_item_embedding(
    db: Session,
    *,
    restaurant_id: str,
    food_item_id: str,
    content: str,
    embedding: list[float],
    metadata: dict[str, Any] | None = None,
) -> None:
    statement = text(
        """
        INSERT INTO food_item_embeddings (
            restaurant_id,
            food_item_id,
            content,
            embedding,
            metadata
        )
        VALUES (
            :restaurant_id,
            :food_item_id,
            :content,
            CAST(:embedding AS vector),
            CAST(:metadata AS jsonb)
        )
        ON CONFLICT (food_item_id) DO UPDATE SET
            restaurant_id = EXCLUDED.restaurant_id,
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata,
            updated_at = now()
        """
    )
    try:
        db.execute(
            statement,
            {
                "restaurant_id": restaurant_id,
                "food_item_id": food_item_id,
                "content": content,
                "embedding": _embedding_literal(embedding),
                "metadata": json.dumps(metadata or {}),
            },
        )
        db.commit()
    except Exception:
        db.rollback()
        raise


def query_similar_food_items(
    db: Session,
    *,
    embedding: list[float],
    limit: int = 10,
) -> list[dict[str, Any]]:
    statement = text(
        """
        SELECT
            restaurant_id,
            food_item_id,
            content,
            metadata,
            1 - (embedding <=> CAST(:embedding AS vector)) AS score
        FROM food_item_embeddings
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
        """
    )
    rows = db.execute(
        statement,
        {
            "embedding": _embedding_literal(embedding),
            "limit": limit,
        },
    ).mappings()

    return [dict(row) for row in rows]
