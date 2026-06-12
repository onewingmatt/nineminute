# The 9-Minute Foundation

A mobile-friendly Progressive Web App (PWA) for the classic 7-minute workout plus a 2-minute stretch routine.

## Features

- **7-Minute Workout**: 12 bodyweight exercises (30s work / 10s rest)
  - Jumping Jacks, Wall Sit, Push-ups, Abdominal Crunches, Step-up onto Chair, Squats, Triceps Dip on Chair, Plank, High Knees Running in Place, Lunges, Push-up and Rotation, Side Plank

- **2-Minute Stretch Block**: 4 stretches (30s each)
  - Lower Back Stretch
  - Plantar Fasciitis Stretch
  - IT Band Stretch
  - Upper Back Stretch

- **Timer Player UI**: Visual countdown timer with progress bar and audio cues
- **Daily Completion Tracking**: SQLite database tracks your workout completions
- **PWA Features**: Installable on mobile devices with full-screen support
- **Mobile-Friendly**: Responsive design optimized for phone screens

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python main.py
```

3. Open your browser to `http://localhost:9876`

## Installing on Mobile

1. Open the app in your mobile browser
2. Add to Home Screen (iOS Safari: Share → Add to Home Screen)
3. Launch from your home screen for full-screen experience

## Technology Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **PWA**: Service Worker for offline capability and installability

## API Endpoints

- `GET /` - Main application
- `POST /api/complete` - Record workout completion
- `GET /api/stats` - Get workout statistics 
