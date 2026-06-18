// Warm-up exercises (15s each, no rests between them)
const warmupExercises = [
    { name: "Deep Breathing", duration: 15, type: "warmup", instruction: "Inhale deeply through nose for 4s, exhale through mouth for 4s." },
    { name: "Neck Rolls", duration: 15, type: "warmup", instruction: "Slowly roll your neck in a circular motion, alternating directions." },
    { name: "Arm Circles", duration: 15, type: "warmup", instruction: "Extend arms and make small circles forward, then reverse." },
];

// Main workout exercises
const workoutExercises = [
    { name: "Jumping Jacks", duration: 30, type: "work", instruction: "Jump with legs wide and arms overhead, then return." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Wall Sit", duration: 30, type: "work", instruction: "Lean against a wall with knees at 90 degrees." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Push-ups", duration: 30, type: "work", instruction: "Lower and raise your body using your arms." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Abdominal Crunches", duration: 30, type: "work", instruction: "Curl your torso toward your knees." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Step-up onto Chair", duration: 30, type: "work", instruction: "Step up onto a stable chair or bench." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Squats", duration: 30, type: "work", instruction: "Lower your hips from a standing position." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Triceps Dip on Chair", duration: 30, type: "work", instruction: "Lower yourself using your arms on a chair edge." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Plank", duration: 30, type: "work", instruction: "Hold a push-up position on your forearms." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "High Knees Running in Place", duration: 30, type: "work", instruction: "Run in place, bringing knees up high." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Lunges", duration: 30, type: "work", instruction: "Step forward and lower your hips." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Push-up and Rotation", duration: 30, type: "work", instruction: "Do a push-up, then rotate one arm to the ceiling." },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Side Plank", duration: 30, type: "work", instruction: "Hold your body sideways on one forearm." },
    { name: "Rest", duration: 10, type: "rest" }
];

// Stretch categories: each category has 4 variants (one per day in rotation)
const stretchCategories = {
    "Lower Back Stretch": [
        { name: "Knee-to-Chest Stretch", instruction: "Lie on your back and pull one knee to your chest, hold 30s." },
        { name: "Child's Pose (Balasana)", instruction: "Sit back on heels, reach arms forward and rest forehead; breathe deeply 30s." },
        { name: "Seated Forward Fold", instruction: "Sit with legs extended and hinge forward from hips; hold 30s." },
        { name: "Supine Spinal Twist", instruction: "Lie on back, drop knees to one side while looking opposite; hold 30s each side." }
    ],
    "Plantar Fasciitis Stretch": [
        { name: "Calf Stretch (Straight Knee)", instruction: "Stand and lean into a wall keeping back leg straight; hold 30s." },
        { name: "Calf Stretch (Bent Knee)", instruction: "Lean into a wall with back knee slightly bent to target soleus; hold 30s." },
        { name: "Seated Towel Stretch", instruction: "Sit and loop a towel over toes; pull toward you to stretch plantar fascia; hold 30s." },
        { name: "Toe Pull / Plantar Fascia Stretch", instruction: "Pull toes back toward shin to stretch the arch; hold 30s." }
    ],
    "IT Band Stretch": [
        { name: "Standing Cross-Leg IT Band Stretch", instruction: "Cross one leg behind and lean away from that side; hold 30s." },
        { name: "Supine IT Band Stretch with Strap", instruction: "Lie on back, loop strap over foot and pull across body; hold 30s." },
        { name: "Figure-4 Glute/IT Stretch (Lying)", instruction: "Lie, cross ankle over opposite knee and pull leg toward chest; hold 30s." },
        { name: "Side-Lying IT Band Release Stretch", instruction: "Lie on side and stretch top leg back and down gently; hold 30s." }
    ],
    "Upper Back Stretch": [
        { name: "Cat-Cow (Upper Back Focus)", instruction: "On hands/knees, round and arch spine slowly, focus on upper back mobility; 30s." },
        { name: "Thread the Needle", instruction: "From hands/knees, thread one arm under the body and rest shoulder; hold 30s each side." },
        { name: "Eagle Arms Stretch (Upper Back)", instruction: "Wrap arms and lift elbows to open upper back; hold 30s." },
        { name: "Standing Chest Opener / Upper Back Stretch", instruction: "Clasp hands behind and gently lift to open chest and upper back; hold 30s." }
    ]
};

// Combined exercises — built at runtime so stretches rotate daily
let allExercises = [];

function getRotationIndex() {
    const dayNumber = Math.floor(Date.now() / 86400000);
    return dayNumber % 4;
}

function buildStretchExercisesForToday() {
    const rot = getRotationIndex();
    const arr = [];
    for (const category of Object.keys(stretchCategories)) {
        const variants = stretchCategories[category];
        const v = variants[rot % variants.length];
        arr.push({ name: v.name, duration: 30, type: 'stretch', instruction: v.instruction || '' });
    }
    return arr;
}

function buildAllExercises() {
    const stretches = buildStretchExercisesForToday();
    allExercises = [...warmupExercises, ...workoutExercises, ...stretches];
}

// State
let currentExerciseIndex = 0;
let timeRemaining = 0;
let timerHandle = null;
let isPaused = false;
let workoutStartTime = null;
let pausedDuration = 0;
let pauseStartTime = null;
let audioContext = null;
let muted = localStorage.getItem('nineminuteMuted') === 'true';

// UI Elements
const startScreen = document.getElementById('startScreen');
const workoutScreen = document.getElementById('workoutScreen');
const completeScreen = document.getElementById('completeScreen');
const exerciseType = document.getElementById('exerciseType');
const exerciseName = document.getElementById('exerciseName');
const timerDisplay = document.getElementById('timerDisplay');
const progressFill = document.getElementById('progressFill');
const pauseBtn = document.getElementById('pauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const timelineRange = document.getElementById('timelineRange');
const timelineLabel = document.getElementById('timelineLabel');
const timelineName = document.getElementById('timelineName');
const todayStatus = document.getElementById('todayStatus');
const totalWorkouts = document.getElementById('totalWorkouts');
const calendarContainer = document.getElementById('calendarContainer');
const calendarWrapper = document.getElementById('calendarWrapper');
const calendarToggleBtn = document.getElementById('calendarToggle');
const muteFloatBtn = document.getElementById('muteFloatBtn');
const statsPanel = document.getElementById('statsPanel');
const CAL_KEY = 'calendarOpen';
const exerciseInstructionEl = document.getElementById('exerciseInstruction');
const exerciseDetailsEl = document.getElementById('exerciseDetails');
const exerciseDetailsSummary = document.getElementById('exerciseDetailsSummary');

// Calendar state
let calendarYear = (new Date()).getFullYear();
let calendarMonth = (new Date()).getMonth();
let completedDatesSet = new Set();
let recentCompletions = [];
let visibleIndexes = [];

function buildVisibleIndexes() {
    visibleIndexes = [];
    for (let i = 0; i < allExercises.length; i++) {
        if (allExercises[i].type !== 'rest') {
            visibleIndexes.push(i);
        }
    }
}

// Initialize
buildAllExercises();
buildVisibleIndexes();
initCalendarState();
loadStats();
updateMuteButton();

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
    if (!workoutScreen || workoutScreen.classList.contains('hidden')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
        case ' ':
            e.preventDefault();
            pauseWorkout();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            prevExercise();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextExercise();
            break;
        case 'm':
        case 'M':
            toggleMute();
            break;
    }
});

// --- Mute toggle ---
function toggleMute() {
    muted = !muted;
    localStorage.setItem('nineminuteMuted', muted);
    updateMuteButton();
}

function updateMuteButton() {
    if (!muteFloatBtn) return;
    if (muted) {
        muteFloatBtn.textContent = '✕ Off';
        muteFloatBtn.style.background = 'rgba(200,60,60,0.35)';
        muteFloatBtn.style.opacity = '0.7';
    } else {
        muteFloatBtn.textContent = '♫ On';
        muteFloatBtn.style.background = 'rgba(255,255,255,0.2)';
        muteFloatBtn.style.opacity = '1';
    }
}

function hideStats() {
    if (statsPanel) statsPanel.style.display = 'none';
}

function showStats() {
    if (statsPanel) statsPanel.style.display = '';
}

// --- Voice synthesis ---
function speak(text) {
    if (muted) return;
    try {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.88;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    } catch (e) {
        // Speech synthesis unavailable
    }
}

function speakExerciseName(name) {
    // Skip "Rest" — we'll say "Next: ..." instead
    if (name === "Rest") return;
    speak(name);
}

function speakNextUp(name) {
    speak("Next: " + name);
}

function speakWorkoutComplete() {
    speak("Great job! Workout complete.");
}

// --- Audio tones (Web Audio) ---
function ensureAudioContext() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    } catch (e) {
        // Audio not available
    }
}

function playTone(frequency, duration, type, volume) {
    if (muted) return;
    try {
        ensureAudioContext();
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = type || 'sine';
        gainNode.gain.setValueAtTime(volume || 0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Audio unavailable
    }
}

function playTransitionSound(type) {
    switch (type) {
        case 'warmup':
            playTone(660, 0.15, 'sine', 0.2);
            break;
        case 'work':
            playTone(440, 0.08, 'sine', 0.25);
            setTimeout(() => playTone(660, 0.08, 'sine', 0.25), 80);
            setTimeout(() => playTone(880, 0.12, 'sine', 0.25), 160);
            break;
        case 'rest':
            playTone(330, 0.15, 'triangle', 0.2);
            break;
        case 'stretch':
            playTone(528, 0.2, 'sine', 0.2);
            break;
        default:
            playTone(600, 0.1, 'sine', 0.2);
    }
}

function playCountdownBeep() {
    playTone(880, 0.06, 'sine', 0.15);
}

function playCompleteSound() {
    playTone(523, 0.15, 'sine', 0.3);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 150);
    setTimeout(() => playTone(784, 0.3, 'sine', 0.3), 300);
}

// --- Workout timer (wall-clock based, no drift) ---
function startWorkout() {
    currentExerciseIndex = 0;
    isPaused = false;
    workoutStartTime = Date.now();

    startScreen.classList.add('hidden');
    completeScreen.classList.add('hidden');
    workoutScreen.classList.remove('hidden');
    hideStats();

    buildAllExercises();
    buildVisibleIndexes();
    if (timelineRange) {
        timelineRange.max = Math.max(0, visibleIndexes.length - 1);
        timelineRange.value = 0;
    }
    updateTimelineLabels();

    beginExercise();
}

function beginExercise() {
    if (currentExerciseIndex >= allExercises.length) {
        completeWorkout();
        return;
    }

    const exercise = allExercises[currentExerciseIndex];
    timeRemaining = exercise.duration;

    updateDisplay();
    playTransitionSound(exercise.type);

    // Voice: announce the exercise (skip rest announcements here — handled in previous tick)
    if (exercise.type !== 'rest') {
        speakExerciseName(exercise.name);
    }

    // Start wall-clock-based timer
    scheduleTick();
}

function scheduleTick() {
    if (timerHandle) {
        clearTimeout(timerHandle);
    }

    const exercise = allExercises[currentExerciseIndex];
    const phaseStartTime = Date.now();
    const phaseDuration = exercise.duration * 1000;
    // Reset paused duration for this phase
    pausedDuration = 0;

    function tick() {
        if (isPaused) {
            // Resume from where we paused — reschedule to check again
            timerHandle = setTimeout(tick, 100);
            return;
        }

        const elapsed = Date.now() - phaseStartTime - pausedDuration;
        timeRemaining = Math.max(0, Math.round((phaseDuration - elapsed) / 1000));
        updateDisplay();

        if (elapsed >= phaseDuration) {
            // This phase is done — move to next
            timerHandle = null;
            currentExerciseIndex++;

            // If the next exercise is rest, announce the work exercise after it
            if (currentExerciseIndex < allExercises.length) {
                const next = allExercises[currentExerciseIndex];
                if (next.type === 'rest') {
                    // Look ahead to what comes after rest
                    const afterRest = currentExerciseIndex + 1;
                    if (afterRest < allExercises.length) {
                        const upcoming = allExercises[afterRest];
                        if (upcoming.type !== 'rest') {
                            setTimeout(() => speakNextUp(upcoming.name), 300);
                        }
                    }
                }
            }

            beginExercise();
            return;
        }

        // Countdown beeps in last 3 seconds
        if (timeRemaining <= 3 && timeRemaining > 0) {
            playCountdownBeep();
        }

        timerHandle = setTimeout(tick, 200);
    }

    tick();
}

function updateDisplay() {
    const exercise = allExercises[currentExerciseIndex];

    exerciseName.textContent = exercise.name;

    // Instruction details
    if (exerciseInstructionEl) {
        exerciseInstructionEl.textContent = exercise.instruction || '';
    }
    if (exerciseDetailsEl) {
        if (exercise.instruction) {
            exerciseDetailsEl.classList.remove('hidden');
        } else {
            exerciseDetailsEl.classList.add('hidden');
        }
    }

    // Phase type label and color
    const type = exercise.type;
    if (type === 'warmup') {
        exerciseType.textContent = 'WARMUP';
        workoutScreen.className = 'timer-container warmup-phase';
    } else if (type === 'work') {
        exerciseType.textContent = 'WORK';
        workoutScreen.className = 'timer-container work-phase';
    } else if (type === 'rest') {
        exerciseType.textContent = 'REST';
        workoutScreen.className = 'timer-container rest-phase';
    } else if (type === 'stretch') {
        exerciseType.textContent = 'STRETCH';
        workoutScreen.className = 'timer-container stretch-phase';
    }

    // Timer display
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Progress bar
    const totalProgress = currentExerciseIndex / allExercises.length * 100;
    const exerciseProgress = (1 - timeRemaining / exercise.duration) / allExercises.length * 100;
    progressFill.style.width = `${totalProgress + exerciseProgress}%`;

    // Rest urgency: pulse progress bar in last 3s of rest
    if (type === 'rest' && timeRemaining <= 3 && timeRemaining > 0) {
        progressFill.classList.add('rest-urgent');
    } else {
        progressFill.classList.remove('rest-urgent');
    }

    // Timeline
    if (timelineRange) {
        let pos = visibleIndexes.indexOf(currentExerciseIndex);
        if (pos === -1) {
            pos = visibleIndexes.reduce((acc, v, i) => (v <= currentExerciseIndex ? i : acc), 0);
        }
        timelineRange.value = pos;
    }
    updateTimelineLabels();
}

function pauseWorkout() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';

    if (isPaused) {
        pauseStartTime = Date.now();
    } else if (pauseStartTime !== null) {
        pausedDuration += Date.now() - pauseStartTime;
        pauseStartTime = null;
    }
}

function stopWorkout() {
    if (timerHandle) {
        clearTimeout(timerHandle);
        timerHandle = null;
    }
    window.speechSynthesis.cancel();

    workoutScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    showStats();

    currentExerciseIndex = 0;
    isPaused = false;
    pausedDuration = 0;
    pauseStartTime = null;
}

function completeWorkout() {
    if (timerHandle) {
        clearTimeout(timerHandle);
        timerHandle = null;
    }

    workoutScreen.classList.add('hidden');
    completeScreen.classList.remove('hidden');
    completeScreen.classList.add('animate-complete');

    pausedDuration = 0;
    pauseStartTime = null;

    playCompleteSound();
    speakWorkoutComplete();

    saveCompletion();
}

function resetWorkout() {
    completeScreen.classList.add('hidden');
    completeScreen.classList.remove('animate-complete');
    startScreen.classList.remove('hidden');
    showStats();
}

function prevExercise() {
    const pos = visibleIndexes.indexOf(currentExerciseIndex);
    let targetPos = pos > -1 ? pos - 1 : visibleIndexes.reduce((acc, v, i) => (v < currentExerciseIndex ? i : acc), -1);
    if (targetPos >= 0) {
        goToExercise(visibleIndexes[targetPos]);
    }
}

function nextExercise() {
    const pos = visibleIndexes.indexOf(currentExerciseIndex);
    let targetPos = pos;
    if (pos === -1) {
        targetPos = visibleIndexes.findIndex(v => v > currentExerciseIndex);
    } else {
        targetPos = pos + 1;
    }
    if (targetPos >= 0 && targetPos < visibleIndexes.length) {
        goToExercise(visibleIndexes[targetPos]);
    } else {
        goToExercise(allExercises.length);
    }
}

function goToExercise(index) {
    if (timerHandle) {
        clearTimeout(timerHandle);
        timerHandle = null;
    }

    const clamped = Math.min(Math.max(0, index), allExercises.length - 1);
    currentExerciseIndex = clamped;

    // Reset and restart
    beginExercise();
}

// Wire range control
if (timelineRange) {
    timelineRange.addEventListener('input', (e) => {
        const visiblePos = Number(e.target.value);
        const totalVisible = Math.max(1, visibleIndexes.length);
        const actualIndex = visibleIndexes[visiblePos] ?? visibleIndexes[Math.min(visiblePos, visibleIndexes.length-1)];
        timelineLabel.textContent = `Exercise ${visiblePos + 1} / ${totalVisible}`;
        if (actualIndex !== undefined) timelineName.textContent = allExercises[actualIndex].name;
    });

    timelineRange.addEventListener('change', (e) => {
        const visiblePos = Number(e.target.value);
        const actualIndex = visibleIndexes[visiblePos];
        if (actualIndex !== undefined) goToExercise(actualIndex);
    });
}

function updateTimelineLabels() {
    if (!timelineLabel) return;
    const totalVisible = Math.max(1, visibleIndexes.length);
    let pos = visibleIndexes.indexOf(currentExerciseIndex);
    if (pos === -1) {
        pos = visibleIndexes.reduce((acc, v, i) => (v <= currentExerciseIndex ? i : acc), 0);
    }
    timelineLabel.textContent = `Exercise ${pos + 1} / ${totalVisible}`;
    const actualIndex = visibleIndexes[pos] ?? visibleIndexes[0];
    timelineName.textContent = allExercises[actualIndex].name;
}

// Toggle summary text when details are opened/closed
if (exerciseDetailsEl && exerciseDetailsSummary) {
    exerciseDetailsEl.addEventListener('toggle', () => {
        exerciseDetailsSummary.textContent = exerciseDetailsEl.open ? 'Hide details' : 'Show details';
    });
}

async function saveCompletion() {
    try {
        const response = await fetch('/api/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                workout_type: 'full'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Workout saved:', data);
            loadStats();
        }
    } catch (error) {
        console.error('Error saving workout:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const data = await response.json();
            todayStatus.textContent = data.completed_today ? '✓ Completed' : 'Not yet';
            totalWorkouts.textContent = data.total_completions;

            recentCompletions = Array.isArray(data.recent_completions) ? data.recent_completions : [];
            completedDatesSet.clear();
            recentCompletions.forEach(c => completedDatesSet.add(c.date));

            renderCalendar(calendarYear, calendarMonth);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        todayStatus.textContent = '-';
        totalWorkouts.textContent = '-';
    }
}

function renderCalendar(year, month) {
    if (!calendarContainer) return;
    calendarContainer.innerHTML = '';

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const monthName = start.toLocaleString(undefined, { month: 'long' });

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';
    header.innerHTML = `<div style="font-weight:600">${monthName} ${year}</div>`;
    calendarContainer.appendChild(header);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    grid.style.gap = '6px';

    const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    weekdays.forEach(w => {
        const el = document.createElement('div');
        el.style.opacity = '0.8';
        el.style.fontSize = '0.85em';
        el.style.textAlign = 'center';
        el.textContent = w;
        grid.appendChild(el);
    });

    const firstDay = start.getDay();
    for (let i=0;i<firstDay;i++) {
        const empty = document.createElement('div');
        grid.appendChild(empty);
    }

    for (let d = 1; d <= end.getDate(); d++) {
        const cell = document.createElement('div');
        cell.style.padding = '8px';
        cell.style.borderRadius = '6px';
        cell.style.textAlign = 'center';
        cell.style.cursor = 'pointer';

        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isCompleted = completedDatesSet.has(dateStr);

        if (isCompleted) {
            cell.style.background = 'linear-gradient(90deg, #4caf50, #45a049)';
            cell.style.color = 'white';
            cell.title = 'Completed';
        } else {
            cell.style.background = 'transparent';
            cell.style.color = 'rgba(255,255,255,0.9)';
        }

        cell.textContent = d;
        cell.addEventListener('click', () => onCalendarDayClick(dateStr, isCompleted));
        grid.appendChild(cell);
    }

    calendarContainer.appendChild(grid);
}

function toggleCalendar() {
    if (!calendarWrapper || !calendarToggleBtn) return;
    const isCollapsed = calendarWrapper.classList.contains('calendar-collapsed');
    if (isCollapsed) {
        calendarWrapper.classList.remove('calendar-collapsed');
        calendarWrapper.classList.add('calendar-expanded');
        calendarToggleBtn.textContent = 'Hide';
        localStorage.setItem(CAL_KEY, 'true');
        renderCalendar(calendarYear, calendarMonth);
    } else {
        calendarWrapper.classList.remove('calendar-expanded');
        calendarWrapper.classList.add('calendar-collapsed');
        calendarToggleBtn.textContent = 'Show';
        localStorage.setItem(CAL_KEY, 'false');
    }
}

function initCalendarState() {
    try {
        if (!calendarWrapper || !calendarToggleBtn) return;
        const open = localStorage.getItem(CAL_KEY) === 'true';
        if (open) {
            calendarWrapper.classList.remove('calendar-collapsed');
            calendarWrapper.classList.add('calendar-expanded');
            calendarToggleBtn.textContent = 'Hide';
        } else {
            calendarWrapper.classList.remove('calendar-expanded');
            calendarWrapper.classList.add('calendar-collapsed');
            calendarToggleBtn.textContent = 'Show';
        }
    } catch (e) {
        // ignore localStorage errors
    }
}

function onCalendarDayClick(dateStr, completed) {
    const entries = recentCompletions.filter(e => e.date === dateStr);
    if (entries.length > 0) {
        renderDayDetails(dateStr, entries);
        return;
    }

    const go = confirm(`${dateStr} has no recorded completion. Start a workout now?`);
    if (go) {
        startScreen.classList.remove('hidden');
        workoutScreen.classList.add('hidden');
        completeScreen.classList.add('hidden');
    }
}

function renderDayDetails(dateStr, entries) {
    const existing = document.getElementById('dayDetails');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'dayDetails';
    panel.style.background = 'rgba(0,0,0,0.45)';
    panel.style.padding = '12px';
    panel.style.borderRadius = '8px';
    panel.style.marginTop = '8px';

    const title = document.createElement('div');
    title.style.display = 'flex';
    title.style.justifyContent = 'space-between';
    title.style.alignItems = 'center';
    title.style.marginBottom = '8px';
    title.innerHTML = `<strong>${dateStr}</strong>`;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.marginLeft = '8px';
    closeBtn.onclick = () => panel.remove();
    title.appendChild(closeBtn);
    panel.appendChild(title);

    entries.forEach(e => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '6px 0';
        row.style.borderBottom = '1px solid rgba(255,255,255,0.06)';

        const left = document.createElement('div');
        left.textContent = e.workout_type || 'workout';
        const right = document.createElement('div');
        right.textContent = e.completed_at ? new Date(e.completed_at).toLocaleTimeString() : '';

        row.appendChild(left);
        row.appendChild(right);
        panel.appendChild(row);
    });

    calendarContainer.appendChild(panel);
}

function calendarPrevMonth() {
    calendarMonth -= 1;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear -= 1; }
    renderCalendar(calendarYear, calendarMonth);
}

function calendarNextMonth() {
    calendarMonth += 1;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear += 1; }
    renderCalendar(calendarYear, calendarMonth);
}
