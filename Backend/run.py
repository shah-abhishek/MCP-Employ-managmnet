#!/usr/bin/env python3
"""
Development server startup script
"""
import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug"
    )