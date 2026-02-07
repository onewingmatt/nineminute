from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import date, datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
import os

# Database setup
DATABASE_URL = "sqlite:///./workout.db"
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

# Pydantic models
class CompletionRequest(BaseModel):
    workout_type: str = "full"

class CompletionResponse(BaseModel):
    message: str
    date: str
    total_completions: int

# FastAPI app
app = FastAPI(title="The 9-Minute Foundation")

# Mount static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

@app.post("/api/complete", response_model=CompletionResponse)
async def complete_workout(completion: CompletionRequest):
    """Record a workout completion"""
    db = SessionLocal()
    try:
        today = date.today()
        
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

@app.get("/api/stats")
async def get_stats():
    """Get workout statistics"""
    db = SessionLocal()
    try:
        today = date.today()
        
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
                    "workout_type": c.workout_type
                }
                for c in recent
            ]
        }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
