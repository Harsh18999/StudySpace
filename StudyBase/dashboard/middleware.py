import urllib.parse
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


@database_sync_to_async
def get_user_from_token(token_string):
    if not token_string:
        return AnonymousUser()

    token_string = urllib.parse.unquote(token_string).strip().strip('"').strip("'")
    if token_string.startswith("Bearer "):
        token_string = token_string[7:].strip()

    try:
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token_string)
        user = jwt_auth.get_user(validated_token)
        return user
    except Exception as e:
        print(f"[WS AUTH] Validation error: {e}")
        return AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        token = None
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = urllib.parse.parse_qs(query_string)
        token_list = query_params.get("token")

        if token_list and token_list[0]:
            token = token_list[0]
        else:
            # Check headers as fallback
            headers = dict(scope.get("headers", []))
            if b"authorization" in headers:
                auth_header = headers[b"authorization"].decode("utf-8")
                if auth_header.startswith("Bearer "):
                    token = auth_header[7:]

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)
