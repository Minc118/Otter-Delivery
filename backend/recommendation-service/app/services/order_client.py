from __future__ import annotations

from typing import Any, Protocol

import httpx

from app.config import Settings


class OrderClient(Protocol):
    def get_order_history(self, user_id: str) -> list[dict[str, Any]]:
        raise NotImplementedError


class HttpOrderClient:
    def __init__(self, settings: Settings):
        self.base_url = settings.order_service_url.rstrip("/")
        self.timeout = settings.restaurant_service_timeout_seconds

    def get_order_history(self, user_id: str) -> list[dict[str, Any]]:
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(
                    f"{self.base_url}/orders/customer/{user_id}"
                )
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPError:
            return []
        except ValueError:
            return []

        if not isinstance(payload, list):
            return []

        return [
            order for order in payload
            if isinstance(order, dict)
        ]


class MockOrderClient:
    def get_order_history(self, user_id: str) -> list[dict[str, Any]]:
        return []