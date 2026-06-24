from app.errors import ValidationServiceError
from app.models import AssignDriverRequest, AssignDriverResponse
from app.repositories.base import DriverRepository


class AssignmentService:
    def __init__(self, repository: DriverRepository) -> None:
        self.repository = repository

    def assign(self, request: AssignDriverRequest) -> AssignDriverResponse:
        order_id = request.order_id.strip()
        if not order_id:
            raise ValidationServiceError("Order ID is required.")
        driver_id = request.driver_id.strip() if request.driver_id else None
        assignment, driver, _ = self.repository.assign_driver(order_id, driver_id)
        return AssignDriverResponse(assignment=assignment, driver=driver)
