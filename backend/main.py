"""
FastAPI main application entry point.
This is a minimal setup to get the backend container running.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from api.auth import router as auth_router
from api.content import router as content_router
from api.image_processing import router as image_processing_router
from api.collaboration import router as collaboration_router
from database.connection import create_tables
from auth.dependencies import get_current_user
from models.database_models import User

app = FastAPI(
    title="Language Learning Chat API",
    description="API for the Language Learning Chat application",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "https://t.lrnm.eu"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(content_router)
app.include_router(image_processing_router)
app.include_router(collaboration_router)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

@app.get("/")
async def root():
    return {"message": "Language Learning Chat API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/auth/me")
async def get_current_user_debug(current_user: User = Depends(get_current_user)):
    """Debug endpoint to check current user authentication."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role.value,
        "is_active": current_user.is_active
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)