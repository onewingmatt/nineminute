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
const todayStatus = document.getElementById('todayStatus');
const totalWorkouts = document.getElementById('totalWorkouts');

// Initialize
loadStats();

function startWorkout() {
    currentExerciseIndex = 0;
    isPaused = false;
    workoutStartTime = Date.now();
    
    startScreen.classList.add('hidden');
    completeScreen.classList.add('hidden');
    workoutScreen.classList.remove('hidden');
    
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
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        todayStatus.textContent = '-';
        totalWorkouts.textContent = '-';
    }
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
