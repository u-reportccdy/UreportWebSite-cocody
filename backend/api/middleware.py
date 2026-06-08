from django.conf import settings


class SimpleCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        origin_raw = request.headers.get("Origin", "")
        origin = origin_raw.strip().rstrip("/")
        
        allowed_raw = getattr(settings, "CORS_ALLOWED_ORIGINS", ["*"])
        allowed = [url.strip().rstrip("/") for url in allowed_raw]
        
        if "*" in allowed_raw:
            if origin_raw:
                response["Access-Control-Allow-Origin"] = origin_raw
                response["Access-Control-Allow-Credentials"] = "true"
            else:
                response["Access-Control-Allow-Origin"] = "*"
        elif origin and origin in allowed:
            response["Access-Control-Allow-Origin"] = origin_raw
            response["Access-Control-Allow-Credentials"] = "true"
            
        response["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response["Vary"] = "Origin"
        return response
