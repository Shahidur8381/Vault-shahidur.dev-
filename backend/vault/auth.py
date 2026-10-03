import functools
from datetime import datetime, timedelta, timezone
from django.conf import settings
from django.http import JsonResponse
import jwt
import pyotp

def verify_totp(code: str) -> bool:
    """Verifies a 6-digit TOTP code against the configured secret."""
    if not code or not isinstance(code, str):
        return False
    clean_code = code.strip().replace(" ", "")
    if len(clean_code) != 6 or not clean_code.isdigit():
        return False

    totp = pyotp.TOTP(settings.TOTP_SHARED_SECRET)
    # Check current interval and +/- 1 window (30s grace)
    return totp.verify(clean_code, valid_window=1)


def generate_auth_token() -> str:
    """Generates a signed JWT token valid for JWT_EXPIRY_DAYS."""
    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=getattr(settings, 'JWT_EXPIRY_DAYS', 7))
    payload = {
        'role': 'vault_admin',
        'iat': int(now.timestamp()),
        'exp': int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')


def extract_token_from_request(request) -> str | None:
    """Extracts token from Authorization header or 'token' query param."""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:].strip()
    # Check query param for direct browser file streaming
    query_token = request.GET.get('token')
    if query_token:
        return query_token.strip()
    return None


def validate_token(token: str | None) -> dict | None:
    """Validates JWT token and returns payload if valid, None otherwise."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def is_authenticated(request) -> bool:
    """Returns True if the request has a valid auth token."""
    token = extract_token_from_request(request)
    return validate_token(token) is not None


def require_auth(view_func):
    """Decorator to enforce TOTP-authenticated JWT token on sensitive endpoints."""
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not is_authenticated(request):
            return JsonResponse(
                {'error': 'Unauthorized. Valid TOTP authentication required.'},
                status=401
            )
        return view_func(request, *args, **kwargs)
    return wrapper
