from __future__ import annotations

from typing import Protocol


class OrderClient(Protocol):
    def get_order_history(self, user_id: str) -> list[dict]:
        raise NotImplementedError


class MockOrderClient:
    def get_order_history(self, user_id: str) -> list[dict]:
        return []
