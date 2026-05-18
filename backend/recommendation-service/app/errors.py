class ServiceError(Exception):
    status_code = 500
    code = "service_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class ConfigurationError(ServiceError):
    code = "configuration_error"


class InvalidInputError(ServiceError):
    status_code = 400
    code = "invalid_input"


class ExternalServiceError(ServiceError):
    code = "external_service_error"


class LLMProviderError(ServiceError):
    code = "llm_error"
