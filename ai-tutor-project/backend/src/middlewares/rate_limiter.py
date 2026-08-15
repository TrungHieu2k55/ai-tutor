import time
from collections import defaultdict
from fastapi import HTTPException, Request


class SimpleRateLimiter:
    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.history = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        minute_ago = now - 60
        # Clean old timestamps
        self.history[key] = [t for t in self.history[key] if t > minute_ago]
        if len(self.history[key]) >= self.requests_per_minute:
            return False
        self.history[key].append(now)
        return True


rate_limiter = SimpleRateLimiter(requests_per_minute=40)


async def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    key = f"{client_ip}:{request.url.path}"
    if not rate_limiter.is_allowed(key):
        raise HTTPException(
            status_code=429,
            detail="Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 1 phút.",
        )
