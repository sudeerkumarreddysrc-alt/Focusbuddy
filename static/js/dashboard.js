document.addEventListener('DOMContentLoaded', () => {

    /* --- Clock --- */
    function updateClock() {
        const now = new Date();
        document.getElementById('live-clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    setInterval(updateClock, 1000);
    updateClock();

    /* --- Pomodoro & Focus Lock Overlay --- */
    let timerInterval;
    let workDuration = 25 * 60; // default 25 mins
    let breakDuration = 5 * 60; // default 5 mins
    let isBreakMode = false;
    let timeLeft = workDuration;
    let isRunning = false;

    const timeDisplay = document.getElementById('timer-display');
    const overlayTimeDisplay = document.getElementById('overlay-timer-display');
    const startBtn = document.getElementById('start-timer');
    const resetBtn = document.getElementById('reset-timer');
    const enterLockBtn = document.getElementById('enter-lock-mode');
    const exitLockBtn = document.getElementById('exit-lock-btn');
    const lockOverlay = document.getElementById('focus-lock-overlay');

    let productivityChart = null;

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timeDisplay.textContent = formatted;
        overlayTimeDisplay.textContent = formatted;
    }

    function startTimer() {
        if (!isRunning) {
            timerInterval = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
                    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';

                    if (!isBreakMode) {
                        try {
                            fetch('/api/sessions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ duration_minutes: workDuration / 60 })
                            });
                        } catch (e) { }

                        alert(`Focus session completed! Great job. Time for a ${breakDuration / 60} minute break.`);
                        isBreakMode = true;
                        timeLeft = breakDuration;
                        document.getElementById('timer-title').innerHTML = '<i class="fa-solid fa-mug-hot timer-icon" style="color:#10b981;"></i> Break Time';
                    } else {
                        alert("Break session completed! Let's get back to work.");
                        isBreakMode = false;
                        timeLeft = workDuration;
                        document.getElementById('timer-title').innerHTML = '<i class="fa-solid fa-clock timer-icon"></i> Quick Focus';
                    }
                    updateTimerDisplay();

                    if (lockOverlay.classList.contains('active')) {
                        exitLockMode();
                    }
                }
            }, 1000);
            startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
            isRunning = true;
        }
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        isRunning = false;
    }

    startBtn.addEventListener('click', () => {
        if (isRunning) pauseTimer();
        else startTimer();
    });

    resetBtn.addEventListener('click', () => {
        pauseTimer();
        isBreakMode = false;
        timeLeft = workDuration;
        document.getElementById('timer-title').innerHTML = '<i class="fa-solid fa-clock timer-icon"></i> Quick Focus';
        updateTimerDisplay();
    });

    // Mode selection (25m/50m/120m)
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRunning) pauseTimer();
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            workDuration = parseInt(btn.getAttribute('data-work')) * 60;
            breakDuration = parseInt(btn.getAttribute('data-break')) * 60;

            isBreakMode = false;
            timeLeft = workDuration;
            const titleEl = document.getElementById('timer-title');
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-clock timer-icon"></i> Quick Focus';
            updateTimerDisplay();
        });
    });

    // Focus Lock Mode
    enterLockBtn.addEventListener('click', () => {
        if (!isRunning) startTimer();
        lockOverlay.classList.remove('hidden');
        // small delay for transition
        setTimeout(() => lockOverlay.classList.add('active'), 10);
        document.documentElement.requestFullscreen().catch((err) => console.log(err));
    });

    function exitLockMode() {
        lockOverlay.classList.remove('active');
        setTimeout(() => lockOverlay.classList.add('hidden'), 500);
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.log(err));
        }
    }

    exitLockBtn.addEventListener('click', exitLockMode);


    /* --- Premium Feature: YouTube Viewer --- */
    const loadYtBtn = document.getElementById('load-yt-btn');
    const ytInput = document.getElementById('yt-url-input');
    const ytContainer = document.getElementById('yt-iframe-container');

    function extractVideoID(url) {
        let videoID = '';
        url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
        if (url[2] !== undefined) {
            videoID = url[2].split(/[^0-9a-z_\-]/i);
            videoID = videoID[0];
        } else {
            videoID = url[0]; // assume they just posted the ID
        }
        return videoID;
    }

    loadYtBtn.addEventListener('click', () => {
        const url = ytInput.value.trim();
        if (!url) return;
        const videoId = extractVideoID(url);
        if (videoId) {
            ytContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
            alert('Invalid YouTube URL or ID!');
        }
    });


    /* --- Innovative Feature: Ambient Sounds --- */
    const soundBtns = document.querySelectorAll('.sound-btn');
    soundBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const soundType = btn.getAttribute('data-sound');
            const audioEl = document.getElementById(`audio-${soundType}`);

            if (btn.classList.contains('playing')) {
                audioEl.pause();
                btn.classList.remove('playing');
            } else {
                audioEl.play();
                btn.classList.add('playing');
            }
        });
    });


    /* --- Calendar logic --- */
    const calendarDays = document.getElementById('calendar-days');
    const monthYear = document.getElementById('month-year');
    let currentDate = new Date();

    function renderCalendar() {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDayIndex = date.getDay();
        const prevLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        monthYear.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        calendarDays.innerHTML = '';

        const today = new Date();

        // Prev month days
        for (let i = firstDayIndex; i > 0; i--) {
            calendarDays.innerHTML += `<div class="cal-day dim">${prevLastDay - i + 1}</div>`;
        }
        // Current month days
        for (let i = 1; i <= lastDay; i++) {
            let classes = "cal-day";
            if (i === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
                classes += " today";
            }
            calendarDays.innerHTML += `<div class="${classes}">${i}</div>`;
        }
        // Next month days filler
        const totalDays = firstDayIndex + lastDay;
        const nextDays = 42 - totalDays; // 6 rows max
        for (let i = 1; i <= nextDays; i++) {
            calendarDays.innerHTML += `<div class="cal-day dim">${i}</div>`;
        }
    }

    document.getElementById('prev-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('next-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    renderCalendar();


    /* --- API Integration: Tasks --- */
    const tasksList = document.getElementById('tasks-list');
    const addTaskForm = document.getElementById('add-task-form');
    const newTaskInput = document.getElementById('new-task-input');

    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks');
            const tasks = await res.json();
            renderTasks(tasks);
        } catch (e) {
            tasksList.innerHTML = '<div class="loading">Failed to load tasks.</div>';
        }
    }

    function renderTasks(tasks) {
        if (tasks.length === 0) {
            tasksList.innerHTML = '<div class="loading">No tasks yet. Add one above!</div>';
            return;
        }

        tasksList.innerHTML = '';
        tasks.forEach(task => {
            const date = new Date(task.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

            const div = document.createElement('div');
            div.className = `task-item ${task.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <div class="task-left">
                    <div class="custom-checkbox" onclick="toggleTask(${task.id}, ${task.completed})">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <div>
                        <div class="task-title">${task.title}</div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="icon-btn" onclick="deleteTask(${task.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            tasksList.appendChild(div);
        });
    }

    addTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = newTaskInput.value.trim();
        if (!title) return;

        try {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            newTaskInput.value = '';
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    });

    window.toggleTask = async (id, currentStatus) => {
        try {
            await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus })
            });
            fetchTasks();
        } catch (e) { }
    };

    window.deleteTask = async (id) => {
        if (!confirm('Delete this task?')) return;
        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            fetchTasks();
        } catch (e) { }
    };


    /* --- API Integration: Long Term Goals --- */
    const goalsList = document.getElementById('goals-list');
    const modal = document.getElementById('goal-modal');
    const openModalBtn = document.getElementById('open-goal-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const addGoalForm = document.getElementById('add-goal-form');

    openModalBtn.addEventListener('click', () => modal.classList.add('visible'));
    closeModalBtn.addEventListener('click', () => modal.classList.remove('visible'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('visible');
    });

    async function fetchGoals() {
        try {
            const res = await fetch('/api/goals');
            const goals = await res.json();
            renderGoals(goals);
        } catch (e) {
            goalsList.innerHTML = '<div class="loading">Failed to load goals.</div>';
        }
    }

    function renderGoals(goals) {
        if (goals.length === 0) {
            goalsList.innerHTML = '<div class="loading">No active long-term goals. Set a vision!</div>';
            return;
        }

        goalsList.innerHTML = '';
        goals.forEach(goal => {
            const div = document.createElement('div');
            div.className = 'goal-item';
            div.innerHTML = `
                <div class="goal-header">
                    <span>${goal.title}</span>
                    <span class="text-blue">${goal.progress}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-fill" style="width: ${goal.progress}%"></div>
                </div>
            `;
            goalsList.appendChild(div);
        });
    }

    addGoalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('goal-title-input').value.trim();
        const progress = document.getElementById('goal-progress-input').value;

        if (!title) return;

        try {
            await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, progress: parseInt(progress) })
            });
            document.getElementById('goal-title-input').value = '';
            document.getElementById('goal-progress-input').value = '0';
            modal.classList.remove('visible');
            fetchGoals();
        } catch (e) { }
    });


    /* --- API Integration: Settings --- */
    const settingsModal = document.getElementById('settings-modal');
    const openSettingsBtn = document.getElementById('open-settings-nav');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const settingsForm = document.getElementById('settings-form');

    let userSettings = { auto_start_break: true, strict_mode: false, sound_volume: 70, daily_goal_hours: 4 };

    openSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        settingsModal.classList.add('visible');
    });

    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('visible'));

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('visible');
    });

    async function loadSettings() {
        try {
            const res = await fetch('/api/settings');
            userSettings = await res.json();

            document.getElementById('setting-daily-goal').value = userSettings.daily_goal_hours;
            document.getElementById('setting-auto-break').checked = userSettings.auto_start_break;
            document.getElementById('setting-strict-mode').checked = userSettings.strict_mode;
            document.getElementById('setting-volume').value = userSettings.sound_volume;

            // Apply volume instantly to audio elements
            document.querySelectorAll('audio').forEach(a => a.volume = userSettings.sound_volume / 100);
        } catch (e) { }
    }

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const daily_goal_hours = parseInt(document.getElementById('setting-daily-goal').value);
        const auto_start_break = document.getElementById('setting-auto-break').checked;
        const strict_mode = document.getElementById('setting-strict-mode').checked;
        const sound_volume = parseInt(document.getElementById('setting-volume').value);

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daily_goal_hours, auto_start_break, strict_mode, sound_volume })
            });
            userSettings = await res.json();

            document.querySelectorAll('audio').forEach(a => a.volume = userSettings.sound_volume / 100);
            settingsModal.classList.remove('visible');
            alert('Preferences Saved successfully!');
        } catch (e) { }
    });


    async function loadAnalytics() {
        try {
            const res = await fetch('/api/analytics');
            const data = await res.json();

            // Update stats grid
            const statBoxes = document.querySelectorAll('.stat-box');
            if (statBoxes.length >= 3) {
                // Assuming first box is streak, second is hours, third is tasks
                statBoxes[1].querySelector('.stat-value').textContent = `${data.total_focus_hours}h`;
                statBoxes[2].querySelector('.stat-value').textContent = data.tasks_completed;
            }

            renderProductivityChart(data.tasks_completed, data.tasks_planned - data.tasks_completed);
        } catch (e) {
            console.error("Failed to load analytics", e);
        }
    }

    function renderProductivityChart(completed, pending) {
        const ctx = document.getElementById('productivityChart').getContext('2d');

        if (productivityChart) {
            productivityChart.destroy();
        }

        productivityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [completed, pending],
                    backgroundColor: ['#10b981', '#cbd5e1'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: 'Inter', size: 12 },
                            padding: 20
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    // Initial load
    fetchTasks();
    fetchGoals();
    loadSettings();
    loadAnalytics();
});
