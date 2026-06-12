from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import date, datetime, timezone
from pydantic import BaseModel
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = "sqlite:///./workout.db"
SQLALCHEMY_AVAILABLE = False
try:
    from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

    # Database models
    class WorkoutCompletion(Base):
        __tablename__ = "workout_completions"
        
        id = Column(Integer, primary_key=True, index=True)
        completion_date = Column(Date, nullable=False, index=True)
        completed_at = Column(DateTime, nullable=False)
        workout_type = Column(String, default="full")  # full, workout-only, stretch-only

    # Create tables
    Base.metadata.create_all(bind=engine)
    SQLALCHEMY_AVAILABLE = True
except Exception:
    # Fallback in-memory store when SQLAlchemy is unavailable or fails to import
    import threading
    _store_lock = threading.Lock()
    _store = []

    class WorkoutCompletion:
        def __init__(self, completion_date, completed_at, workout_type, id=None):
            self.id = id or (len(_store) + 1)
            self.completion_date = completion_date
            self.completed_at = completed_at
            self.workout_type = workout_type

    def SessionLocal():
        # Return a simple session-like object compatible with the code below
        class DummySession:
            def add(self, obj):
                with _store_lock:
                    _store.append(obj)
            def commit(self):
                return
            def close(self):
                return
        return DummySession()

# Pydantic models
class CompletionRequest(BaseModel):
    workout_type: str = "full"

class CompletionResponse(BaseModel):
    message: str
    date: str
    total_completions: int

# FastAPI app
app = FastAPI(title="The 9-Minute Foundation")

# Basic HTTP auth removed — app now serves without authentication.

# Mount static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

@app.post("/api/complete", response_model=CompletionResponse)
async def complete_workout(completion: CompletionRequest):
    """Record a workout completion"""
    today = date.today()

    if SQLALCHEMY_AVAILABLE:
        db = SessionLocal()
        try:
            # Check if already completed today
            existing = db.query(WorkoutCompletion).filter(
                WorkoutCompletion.completion_date == today,
                WorkoutCompletion.workout_type == completion.workout_type
            ).first()

            if not existing:
                new_completion = WorkoutCompletion(
                    completion_date=today,
                    completed_at=datetime.now(timezone.utc),
                    workout_type=completion.workout_type
                )
                db.add(new_completion)
                db.commit()

            # Get total completions
            total = db.query(WorkoutCompletion).filter(
                WorkoutCompletion.workout_type == completion.workout_type
            ).count()

            return CompletionResponse(
                message="Workout completed!",
                date=str(today),
                total_completions=total
            )
        finally:
            db.close()
    else:
        # Fallback in-memory store
        with _store_lock:
            existing = next((c for c in _store if c.completion_date == today and c.workout_type == completion.workout_type), None)
            if not existing:
                new_completion = WorkoutCompletion(
                    completion_date=today,
                    completed_at=datetime.now(timezone.utc),
                    workout_type=completion.workout_type,
                    id=len(_store) + 1
                )
                _store.append(new_completion)
            total = sum(1 for c in _store if c.workout_type == completion.workout_type)

        return CompletionResponse(
            message="Workout completed!",
            date=str(today),
            total_completions=total
        )

@app.get("/api/stats")
async def get_stats():
    """Get workout statistics"""
    today = date.today()

    if SQLALCHEMY_AVAILABLE:
        db = SessionLocal()
        try:
            # Check today's completion
            today_completion = db.query(WorkoutCompletion).filter(
                WorkoutCompletion.completion_date == today
            ).first()

            # Get total completions
            total_completions = db.query(WorkoutCompletion).count()

            # Get recent completions (last 30 days)
            recent = db.query(WorkoutCompletion).order_by(
                WorkoutCompletion.completion_date.desc()
            ).limit(30).all()

            return {
                "completed_today": today_completion is not None,
                "total_completions": total_completions,
                "recent_completions": [
                    {
                        "date": str(c.completion_date),
                        "workout_type": c.workout_type,
                        "completed_at": c.completed_at.isoformat() if getattr(c, 'completed_at', None) is not None else None
                    }
                    for c in recent
                ]
            }
        finally:
            db.close()
    else:
        # Fallback in-memory store
        with _store_lock:
            today_completion = any(c for c in _store if c.completion_date == today)
            total_completions = len(_store)
            # recent last 30 entries
            recent_entries = list(_store)[-30:]

        return {
            "completed_today": today_completion,
            "total_completions": total_completions,
            "recent_completions": [
                {"date": str(c.completion_date), "workout_type": c.workout_type, "completed_at": str(c.completed_at)}
                for c in reversed(recent_entries)
            ]
        }

if __name__ == "__main__":
    import uvicorn
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "9876"))
    logger.info(f"Starting server on {HOST}:{PORT}")
    uvicorn.run(app, host=HOST, port=PORT)
