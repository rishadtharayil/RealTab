/**
 * Pomodoro Focus Timer Widget with Web Audio Chime
 */
class PomodoroWidget {
  constructor() {
    this.durations = {
      focus: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60
    };
    this.mode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
    this.timeLeft = this.durations.focus;
    this.isRunning = false;
    this.intervalId = null;
    this.focusGoal = '';
  }

  async init() {
    const savedGoal = await Storage.get('realtab_pomodoro_goal', await Storage.get('aura_pomodoro_goal', ''));
    this.focusGoal = savedGoal;

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const startPauseBtn = document.getElementById('pomo-start-btn');
    const resetBtn = document.getElementById('pomo-reset-btn');
    const skipBtn = document.getElementById('pomo-skip-btn');
    const modeTabs = document.querySelectorAll('.pomo-mode-tab');
    const goalInput = document.getElementById('pomo-goal-input');

    const headerPill = document.getElementById('pomodoro-header-pill');
    const widgetCard = document.getElementById('pomodoro-widget-card');

    if (startPauseBtn) {
      startPauseBtn.addEventListener('click', () => this.toggleTimer());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetTimer());
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.switchNextMode());
    }

    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        if (mode && this.durations[mode]) {
          this.setMode(mode);
        }
      });
    });

    if (goalInput) {
      goalInput.value = this.focusGoal;
      goalInput.addEventListener('input', (e) => {
        this.focusGoal = e.target.value;
        Storage.set('realtab_pomodoro_goal', this.focusGoal);
      });
    }

    if (headerPill) {
      headerPill.addEventListener('click', () => {
        if (widgetCard) {
          widgetCard.scrollIntoView({ behavior: 'smooth' });
          widgetCard.classList.add('highlight-pulse');
          setTimeout(() => widgetCard.classList.remove('highlight-pulse'), 1200);
        }
      });
    }
  }

  setMode(mode) {
    this.pauseTimer();
    this.mode = mode;
    this.timeLeft = this.durations[mode];
    this.render();
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
    this.render();
  }

  pauseTimer() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.render();
  }

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.durations[this.mode];
    this.render();
  }

  tick() {
    if (this.timeLeft > 0) {
      this.timeLeft--;
      this.render();
    } else {
      this.handleComplete();
    }
  }

  handleComplete() {
    this.pauseTimer();
    this.playChime();

    if (this.mode === 'focus') {
      alert(`🎉 Focus session complete! Take a relaxing break.`);
      this.setMode('shortBreak');
    } else {
      alert(`⚡ Break complete! Ready to focus again?`);
      this.setMode('focus');
    }
  }

  switchNextMode() {
    if (this.mode === 'focus') {
      this.setMode('shortBreak');
    } else {
      this.setMode('focus');
    }
  }

  playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.3);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  render() {
    const timeDisplay = document.getElementById('pomo-time-display');
    const startBtn = document.getElementById('pomo-start-btn');
    const progressRing = document.getElementById('pomo-progress-circle');
    const modeTabs = document.querySelectorAll('.pomo-mode-tab');
    const headerPillTime = document.getElementById('pomodoro-pill-time');
    const headerPill = document.getElementById('pomodoro-header-pill');

    const formatted = this.formatTime(this.timeLeft);

    if (timeDisplay) timeDisplay.textContent = formatted;
    if (headerPillTime) headerPillTime.textContent = formatted;

    if (headerPill) {
      if (this.isRunning) {
        headerPill.classList.add('active-running');
      } else {
        headerPill.classList.remove('active-running');
      }
    }

    if (startBtn) {
      startBtn.innerHTML = this.isRunning
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start`;
    }

    modeTabs.forEach(tab => {
      if (tab.dataset.mode === this.mode) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (progressRing) {
      const total = this.durations[this.mode];
      const progress = (total - this.timeLeft) / total;
      const circumference = 2 * Math.PI * 88; // radius 88
      const offset = circumference - (progress * circumference);
      progressRing.style.strokeDashoffset = offset;
    }
  }
}

window.PomodoroWidget = PomodoroWidget;
