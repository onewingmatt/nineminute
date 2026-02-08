// Exercise definitions
const workoutExercises = [
    { name: "Jumping Jacks", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Wall Sit", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Push-ups", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Abdominal Crunches", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Step-up onto Chair", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Squats", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Triceps Dip on Chair", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Plank", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "High Knees Running in Place", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Lunges", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Push-up and Rotation", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" },
    { name: "Side Plank", duration: 30, type: "work" },
    { name: "Rest", duration: 10, type: "rest" }
];

const stretchExercises = [
    { name: "Lower Back Stretch", duration: 30, type: "stretch" },
    { name: "Plantar Fasciitis Stretch", duration: 30, type: "stretch" },
    { name: "IT Band Stretch", duration: 30, type: "stretch" },
    { name: "Upper Back Stretch", duration: 30, type: "stretch" }
];

// Combine all exercises
const allExercises = [...workoutExercises, ...stretchExercises];

// State
let currentExerciseIndex = 0;
let timeRemaining = 0;
let timerInterval = null;
let isPaused = false;
let workoutStartTime = null;
let audioContext = null;

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
const CAL_KEY = 'calendarOpen';

// Calendar state
let calendarYear = (new Date()).getFullYear();
let calendarMonth = (new Date()).getMonth(); // 0-based
let completedDatesSet = new Set(); // strings like '2026-02-07'
let recentCompletions = []; // array of {date, workout_type, completed_at}
let visibleIndexes = []; // indices in allExercises excluding rests for the timeline

function buildVisibleIndexes() {
    visibleIndexes = [];
    for (let i = 0; i < allExercises.length; i++) {
        if (allExercises[i].type !== 'rest') {
            visibleIndexes.push(i);
        }
    }
}

// Initialize
buildVisibleIndexes();

// Initialize calendar state from localStorage
initCalendarState();

loadStats();

function startWorkout() {
    currentExerciseIndex = 0;
    isPaused = false;
    workoutStartTime = Date.now();
    
    startScreen.classList.add('hidden');
    completeScreen.classList.add('hidden');
    workoutScreen.classList.remove('hidden');
    
    // initialize timeline controls
    buildVisibleIndexes();
    if (timelineRange) {
        timelineRange.max = Math.max(0, visibleIndexes.length - 1);
        // set timeline to first visible exercise
        timelineRange.value = 0;
    }
    updateTimelineLabels();

    startExercise();
}

function startExercise() {
    if (currentExerciseIndex >= allExercises.length) {
        completeWorkout();
        return;
    }
    
    const exercise = allExercises[currentExerciseIndex];
    timeRemaining = exercise.duration;
    
    updateDisplay();
    
    // Play beep sound (if available)
    playBeep();
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;
            updateDisplay();
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                currentExerciseIndex++;
                startExercise();
            }
        }
    }, 1000);
}

function updateDisplay() {
    const exercise = allExercises[currentExerciseIndex];
    
    // Update exercise name
    exerciseName.textContent = exercise.name;
    
    // Update exercise type
    if (exercise.type === 'work') {
        exerciseType.textContent = 'WORK';
        workoutScreen.className = 'timer-container work-phase';
    } else if (exercise.type === 'rest') {
        exerciseType.textContent = 'REST';
        workoutScreen.className = 'timer-container rest-phase';
    } else if (exercise.type === 'stretch') {
        exerciseType.textContent = 'STRETCH';
        workoutScreen.className = 'timer-container stretch-phase';
    }
    
    // Update timer
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update progress
    const totalProgress = currentExerciseIndex / allExercises.length * 100;
    const exerciseProgress = (1 - timeRemaining / exercise.duration) / allExercises.length * 100;
    progressFill.style.width = `${totalProgress + exerciseProgress}%`;
    
    // update timeline UI (map current exercise to visible index)
    if (timelineRange) {
        // find visible position for currentExerciseIndex
        let pos = visibleIndexes.indexOf(currentExerciseIndex);
        if (pos === -1) {
            // if currently on a rest, show the nearest previous visible exercise
            pos = visibleIndexes.reduce((acc, v, i) => (v <= currentExerciseIndex ? i : acc), 0);
        }
        timelineRange.value = pos;
    }
    updateTimelineLabels();
}

function pauseWorkout() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

function stopWorkout() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    workoutScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    currentExerciseIndex = 0;
    isPaused = false;
}

function completeWorkout() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    workoutScreen.classList.add('hidden');
    completeScreen.classList.remove('hidden');
    
    // Save completion to backend
    saveCompletion();
}

function resetWorkout() {
    completeScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

function prevExercise() {
    // move to previous visible (non-rest) exercise
    const pos = visibleIndexes.indexOf(currentExerciseIndex);
    let targetPos = pos > -1 ? pos - 1 : visibleIndexes.reduce((acc, v, i) => (v < currentExerciseIndex ? i : acc), -1);
    if (targetPos >= 0) {
        goToExercise(visibleIndexes[targetPos]);
    }
}

function nextExercise() {
    // move to next visible (non-rest) exercise
    const pos = visibleIndexes.indexOf(currentExerciseIndex);
    let targetPos = pos;
    if (pos === -1) {
        // if currently on rest, find first visible after current
        targetPos = visibleIndexes.findIndex(v => v > currentExerciseIndex);
    } else {
        targetPos = pos + 1;
    }
    if (targetPos >= 0 && targetPos < visibleIndexes.length) {
        goToExercise(visibleIndexes[targetPos]);
    } else {
        // finish
        goToExercise(allExercises.length);
    }
}

function goToExercise(index) {
    // clamp
    const clamped = Math.min(Math.max(0, index), allExercises.length - 1);
    currentExerciseIndex = clamped;

    // reset timer for the selected exercise
    timeRemaining = allExercises[currentExerciseIndex].duration;

    // update UI immediately
    updateDisplay();

    // restart interval if workout is active
    if (!startScreen.classList.contains('hidden') && !workoutScreen.classList.contains('hidden')) {
        // nothing: workout not active
        return;
    }

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;
            updateDisplay();

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                currentExerciseIndex++;
                startExercise();
            }
        }
    }, 1000);
}

// wire range control
if (timelineRange) {
    timelineRange.addEventListener('input', (e) => {
        const visiblePos = Number(e.target.value);
        // show preview but don't change running state until user releases
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
    // determine visible position
    let pos = visibleIndexes.indexOf(currentExerciseIndex);
    if (pos === -1) {
        // if on rest, pick nearest previous visible
        pos = visibleIndexes.reduce((acc, v, i) => (v <= currentExerciseIndex ? i : acc), 0);
    }
    timelineLabel.textContent = `Exercise ${pos + 1} / ${totalVisible}`;
    const actualIndex = visibleIndexes[pos] ?? visibleIndexes[0];
    timelineName.textContent = allExercises[actualIndex].name;
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

            // populate recentCompletions and completedDatesSet from recent_completions if available
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

    // Weekday labels
    const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    weekdays.forEach(w => {
        const el = document.createElement('div');
        el.style.opacity = '0.8';
        el.style.fontSize = '0.85em';
        el.style.textAlign = 'center';
        el.textContent = w;
        grid.appendChild(el);
    });

    // padding blanks
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
    // Show per-day details using recentCompletions if available
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
    // remove existing details if present
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

function playBeep() {
    // Simple beep using Web Audio API
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Beep not available
        console.log('Audio not available');
    }
}
