# The 9-Minute Foundation

A mobile-friendly Progressive Web App (PWA) for a warm-up, classic 7-minute workout, and 2-minute stretch routine.

## Features

- **Warm-up**: 3 mobility exercises (15s each) to prepare your body
- **7-Minute Workout**: 12 bodyweight exercises (30s work / 10s rest)
  - Jumping Jacks, Wall Sit, Push-ups, Abdominal Crunches, Step-up onto Chair, Squats, Triceps Dip on Chair, Plank, High Knees Running in Place, Lunges, Push-up and Rotation, Side Plank
- **2-Minute Stretch Block**: 4 stretches (30s each) — rotates daily across 4 variants per body area
  - Lower Back, Plantar Fasciitis, IT Band, Upper Back
- **Voice Guidance**: Speaks each exercise name and counts down final seconds
- **Audio Cues**: Distinct tones for warm-up / work / rest / stretch transitions
- **Drift-Free Timer**: Wall-clock-based timing — accurate even if the tab is backgrounded
- **Daily Completion Tracking**: SQLite database tracks your workout history
- **Year-Long Calendar**: View up to 366 days of workout history with per-day details
- **PWA Features**: Installable on mobile devices with full-screen support
- **Mobile-Friendly**: Responsive design optimized for phone screens

## Quick Start

### Local (Python)

```bash
pip install -r requirements.txt
python main.py
# Opens on http://localhost:8000
# Set PORT env var to change: PORT=9876 python main.py
```

### Docker

```bash
docker compose up -d
# Opens on http://localhost:9876
```

## Installing on Mobile

1. Open the app in your mobile browser
2. Add to Home Screen (iOS Safari: Share → Add to Home Screen)
3. Launch from your home screen for full-screen experience

## Technology Stack

- **Backend**: FastAPI + SQLAlchemy 2.0 + SQLite
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Audio**: Web Audio API (tones) + Web Speech API (voice cues)
- **PWA**: Service Worker for offline asset caching and installability

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Main application |
| `/health` | GET | Health check |
| `/api/complete` | POST | Record workout completion |
| `/api/stats` | GET | Get workout statistics |

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | HTTP server port |
| `DATABASE_URL` | `sqlite:///./workout.db` | SQLite database path |
