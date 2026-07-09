from locust import HttpUser, task, between
import os


RESTAURANT_URL = os.getenv("RESTAURANT_URL", "http://localhost:8001")
ORDER_URL = os.getenv("ORDER_URL", "http://localhost:8002")
DRIVER_URL = os.getenv("DRIVER_URL", "http://localhost:8003")
RECOMMENDATION_URL = os.getenv("RECOMMENDATION_URL", "http://localhost:8004")
TRANSLATION_URL = os.getenv("TRANSLATION_URL", "http://localhost:8005")
PROFILE_URL = os.getenv("PROFILE_URL", "http://localhost:8006")


class OtterDeliveryUser(HttpUser):
    wait_time = between(1, 3)

    # Locust requires a host value. The requests below use full service URLs
    # so that multiple microservices can be tested in one run.
    host = "http://localhost"

    @task(4)
    def list_restaurants(self):
        self.client.get(
            f"{RESTAURANT_URL}/api/restaurants",
            name="Restaurant Service: GET /api/restaurants",
        )

    @task(2)
    def order_list(self):
        self.client.get(
            f"{ORDER_URL}/orders",
            name="Order Service: GET /orders",
        )

    @task(2)
    def driver_health(self):
        self.client.get(
            f"{DRIVER_URL}/health",
            name="Driver Service: GET /health",
        )

    @task(2)
    def recommendation_health(self):
        self.client.get(
            f"{RECOMMENDATION_URL}/health",
            name="Recommendation Service: GET /health",
        )

    @task(2)
    def translation_health(self):
        self.client.get(
            f"{TRANSLATION_URL}/api/translations/health",
            name="Translation Service: GET /api/translations/health",
        )

    @task(2)
    def profile_login_demo_user(self):
        self.client.get(
            f"{PROFILE_URL}/profiles/login/sohrab",
            name="Profile Service: GET /profiles/login/sohrab",
        )

    @task(1)
    def translated_restaurants_de(self):
        self.client.get(
            f"{TRANSLATION_URL}/api/translations/restaurants?lang=DE",
            name="Translation Service: GET /api/translations/restaurants?lang=DE",
        )
