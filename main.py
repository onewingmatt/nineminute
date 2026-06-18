import os
from datetime import date, datetime, timezone

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# --- Config ---
PORT = int(os.environ.get("PORT", "8000"))
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./workout.db")

# --- Database ---
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class WorkoutCompletion(Base):
    __tablename__ = "workout_completions"

    id = Column(Integer, primary_key=True, index=True)
    completion_date = Column(Date, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=False)
    workout_type = Column(String, default="full")


Base.metadata.create_all(bind=engine)


# --- Pydantic models ---
class CompletionRequest(BaseModel):
    workout_type: str = "full"


class CompletionResponse(BaseModel):
    message: str
    date: str
    total_completions: int


# --- FastAPI app ---
app = FastAPI(title="The 9-Minute Foundation")

if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def read_root():
    return RedirectResponse(url="/static/index.html")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/complete", response_model=CompletionResponse)
async def complete_workout(completion: CompletionRequest):
    today = date.today()
    db = SessionLocal()
    try:
        existing = (
            db.query(WorkoutCompletion)
            .filter(
                WorkoutCompletion.completion_date == today,
                WorkoutCompletion.workout_type == completion.workout_type,
            )
            .first()
        )

        if not existing:
            db.add(
                WorkoutCompletion(
                    completion_date=today,
                    completed_at=datetime.now(timezone.utc),
                    workout_type=completion.workout_type,
                )
            )
            db.commit()

        total = (
            db.query(WorkoutCompletion)
            .filter(WorkoutCompletion.workout_type == completion.workout_type)
            .count()
        )

        return CompletionResponse(
            message="Workout completed!",
            date=str(today),
            total_completions=total,
        )
    finally:
        db.close()


@app.get("/api/stats")
async def get_stats():
    today = date.today()
    db = SessionLocal()
    try:
        today_completion = (
            db.query(WorkoutCompletion)
            .filter(WorkoutCompletion.completion_date == today)
            .first()
        )

        total_completions = db.query(WorkoutCompletion).count()

        recent = (
            db.query(WorkoutCompletion)
            .order_by(
                WorkoutCompletion.completion_date.desc(),
                WorkoutCompletion.completed_at.desc(),
            )
            .limit(366)
            .all()
        )

        return {
            "completed_today": today_completion is not None,
            "total_completions": total_completions,
            "recent_completions": [
                {
                    "date": str(c.completion_date),
                    "workout_type": c.workout_type,
                    "completed_at": c.completed_at.isoformat(),
                }
                for c in recent
            ],
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
