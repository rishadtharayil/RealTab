/**
 * Settings & Customization Controller (Matte & Neutral Minimalist)
 */
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      theme: 'clean-chalk', // 'clean-chalk', 'sage-mint', 'nordic-sky', 'warm-stone', 'soft-lavender', 'matte-slate'
      wallpaperType: 'none', // 'none', 'preset', 'custom-url', 'custom-file'
      wallpaperPreset: 'sky',
      wallpaperCustomUrl: '',
      wallpaperBlur: 0,
      wallpaperDim: 0,
      clockFormat24: false,
      showSeconds: false,
      userName: '',
      defaultSearchEngine: 'google',
      widgets: {
        clock: true,
        greeting: true,
        search: true,
        bookmarks: true,
        weather: true,
        pomodoro: true,
        notes: true,
        quotes: true,
        ambient: true
      }
    };
    this.settings = { ...this.defaultSettings };

    this.wallpaperPresets = {
      sky: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=2560&q=80',
      sage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=2560&q=80',
      stone: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2560&q=80',
      fog: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=2560&q=80',
      minimal: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=80',
      texture: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2560&q=80'
    };
  }

  async init() {
    const saved = await Storage.get('realtab_settings', await Storage.get('aura_settings', null));
    if (saved) {
      this.settings = {
        ...this.defaultSettings,
        ...saved,
        widgets: { ...this.defaultSettings.widgets, ...(saved.widgets || {}) }
      };
    }

    this.bindEvents();
    await this.applyAll();
  }

  async save() {
    await Storage.set('realtab_settings', this.settings);
  }

  bindEvents() {
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const drawer = document.getElementById('settings-drawer');
    const closeBtn = document.getElementById('settings-close-btn');

    if (settingsToggleBtn) {
      settingsToggleBtn.addEventListener('click', () => this.openDrawer());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    if (drawer) {
      drawer.addEventListener('click', (e) => {
        if (e.target === drawer) this.closeDrawer();
      });
    }

    // Theme Selector
    const themeSelect = document.getElementById('setting-theme-select');
    if (themeSelect) {
      themeSelect.value = this.settings.theme;
      themeSelect.addEventListener('change', (e) => {
        this.settings.theme = e.target.value;
        this.applyTheme();
        this.save();
      });
    }

    // Wallpaper Preset Radios / Cards
    const presetCards = document.querySelectorAll('.wallpaper-preset-card');
    const updateActivePresetUI = () => {
      presetCards.forEach(card => {
        const preset = card.dataset.preset;
        if (this.settings.wallpaperType === 'none' && preset === 'none') {
          card.classList.add('active');
        } else if (this.settings.wallpaperType === 'preset' && preset === this.settings.wallpaperPreset) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    };
    updateActivePresetUI();

    presetCards.forEach(card => {
      card.addEventListener('click', () => {
        const preset = card.dataset.preset;
        if (preset === 'none') {
          this.settings.wallpaperType = 'none';
          updateActivePresetUI();
          this.applyWallpaper();
          this.applyWallpaperEffects();
          this.save();
        } else if (preset) {
          this.settings.wallpaperType = 'preset';
          this.settings.wallpaperPreset = preset;
          updateActivePresetUI();
          this.applyWallpaper();
          this.applyWallpaperEffects();
          this.save();
        }
      });
    });

    // Custom Wallpaper URL
    const customUrlInput = document.getElementById('setting-wallpaper-url');
    const applyUrlBtn = document.getElementById('setting-wallpaper-url-btn');
    const handleCustomUrl = () => {
      const url = customUrlInput ? customUrlInput.value.trim() : '';
      if (url) {
        this.settings.wallpaperType = 'custom-url';
        this.settings.wallpaperCustomUrl = url;
        presetCards.forEach(c => c.classList.remove('active'));
        this.applyWallpaper();
        this.applyWallpaperEffects();
        this.save();
      }
    };

    if (customUrlInput && applyUrlBtn) {
      customUrlInput.value = this.settings.wallpaperCustomUrl || '';
      applyUrlBtn.addEventListener('click', handleCustomUrl);
      customUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCustomUrl();
        }
      });
    }

    // Custom Wallpaper File Upload
    const fileInput = document.getElementById('setting-wallpaper-file');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target.result;
            await Storage.saveWallpaperBlob(dataUrl);
            this.settings.wallpaperType = 'custom-file';
            presetCards.forEach(c => c.classList.remove('active'));
            await this.applyWallpaper();
            this.applyWallpaperEffects();
            this.save();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Blur & Dim Sliders
    const blurSlider = document.getElementById('setting-wallpaper-blur');
    const blurVal = document.getElementById('setting-blur-value');
    if (blurSlider) {
      blurSlider.value = this.settings.wallpaperBlur;
      if (blurVal) blurVal.textContent = `${this.settings.wallpaperBlur}px`;
      blurSlider.addEventListener('input', (e) => {
        this.settings.wallpaperBlur = parseInt(e.target.value, 10);
        if (blurVal) blurVal.textContent = `${this.settings.wallpaperBlur}px`;
        this.applyWallpaperEffects();
        this.save();
      });
    }

    const dimSlider = document.getElementById('setting-wallpaper-dim');
    const dimVal = document.getElementById('setting-dim-value');
    if (dimSlider) {
      dimSlider.value = this.settings.wallpaperDim;
      if (dimVal) dimVal.textContent = `${this.settings.wallpaperDim}%`;
      dimSlider.addEventListener('input', (e) => {
        this.settings.wallpaperDim = parseInt(e.target.value, 10);
        if (dimVal) dimVal.textContent = `${this.settings.wallpaperDim}%`;
        this.applyWallpaperEffects();
        this.save();
      });
    }

    // Clock format & Seconds
    const time24Check = document.getElementById('setting-clock-24h');
    if (time24Check) {
      time24Check.checked = this.settings.clockFormat24;
      time24Check.addEventListener('change', (e) => {
        this.settings.clockFormat24 = e.target.checked;
        this.save();
        if (window.App && window.App.updateClock) window.App.updateClock();
      });
    }

    const secondsCheck = document.getElementById('setting-clock-seconds');
    if (secondsCheck) {
      secondsCheck.checked = this.settings.showSeconds;
      secondsCheck.addEventListener('change', (e) => {
        this.settings.showSeconds = e.target.checked;
        this.save();
        if (window.App && window.App.updateClock) window.App.updateClock();
      });
    }

    // Custom User Name
    const nameInput = document.getElementById('setting-user-name');
    if (nameInput) {
      nameInput.value = this.settings.userName || '';
      nameInput.addEventListener('input', (e) => {
        this.settings.userName = e.target.value.trim();
        this.save();
        if (window.App && window.App.updateGreeting) window.App.updateGreeting();
      });
    }

    // Default Search Engine
    const searchSelect = document.getElementById('setting-search-engine');
    if (searchSelect) {
      searchSelect.value = this.settings.defaultSearchEngine;
      searchSelect.addEventListener('change', (e) => {
        this.settings.defaultSearchEngine = e.target.value;
        this.save();
        if (window.App && window.App.setSearchEngine) {
          window.App.setSearchEngine(this.settings.defaultSearchEngine);
        }
      });
    }

    // Widget Toggles
    Object.keys(this.settings.widgets).forEach(wKey => {
      const toggle = document.getElementById(`setting-toggle-${wKey}`);
      if (toggle) {
        toggle.checked = this.settings.widgets[wKey];
        toggle.addEventListener('change', (e) => {
          this.settings.widgets[wKey] = e.target.checked;
          this.applyWidgetVisibility();
          this.save();
        });
      }
    });

    // Export & Import
    const exportBtn = document.getElementById('setting-export-btn');
    const importInput = document.getElementById('setting-import-file');
    const resetBtn = document.getElementById('setting-reset-btn');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    if (importInput) {
      importInput.addEventListener('change', (e) => this.importData(e));
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
          this.resetAll();
        }
      });
    }
  }

  async applyAll() {
    this.applyTheme();
    await this.applyWallpaper();
    this.applyWallpaperEffects();
    this.applyWidgetVisibility();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    this.applyWallpaperEffects();
  }

  async applyWallpaper() {
    const bgContainer = document.getElementById('app-background');
    if (!bgContainer) return;

    if (this.settings.wallpaperType === 'preset') {
      const url = this.wallpaperPresets[this.settings.wallpaperPreset] || this.wallpaperPresets.sky;
      bgContainer.style.backgroundImage = `url("${url}")`;
      document.body.classList.add('has-wallpaper');
    } else if (this.settings.wallpaperType === 'custom-url' && this.settings.wallpaperCustomUrl) {
      bgContainer.style.backgroundImage = `url("${this.settings.wallpaperCustomUrl}")`;
      document.body.classList.add('has-wallpaper');
    } else if (this.settings.wallpaperType === 'custom-file') {
      const blobData = await Storage.getWallpaperBlob();
      if (blobData) {
        bgContainer.style.backgroundImage = `url("${blobData}")`;
        document.body.classList.add('has-wallpaper');
      } else {
        bgContainer.style.backgroundImage = 'none';
        document.body.classList.remove('has-wallpaper');
      }
    } else {
      bgContainer.style.backgroundImage = 'none';
      document.body.classList.remove('has-wallpaper');
    }
  }

  applyWallpaperEffects() {
    const bg = document.getElementById('app-background');
    const overlay = document.getElementById('app-bg-overlay');

    if (bg) {
      bg.style.filter = this.settings.wallpaperBlur > 0 ? `blur(${this.settings.wallpaperBlur}px)` : 'none';
    }

    if (overlay) {
      if (this.settings.wallpaperType === 'none') {
        overlay.style.backgroundColor = 'transparent';
      } else {
        const isDark = this.settings.theme === 'matte-slate';
        const color = isDark ? '0, 0, 0' : '255, 255, 255';
        overlay.style.backgroundColor = `rgba(${color}, ${this.settings.wallpaperDim / 100})`;
      }
    }
  }

  applyWidgetVisibility() {
    Object.keys(this.settings.widgets).forEach(wKey => {
      const el = document.getElementById(`widget-container-${wKey}`);
      if (el) {
        if (this.settings.widgets[wKey]) {
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      }
    });
  }

  openDrawer() {
    const drawer = document.getElementById('settings-drawer');
    if (drawer) {
      drawer.classList.remove('hidden');
      setTimeout(() => drawer.classList.add('active'), 10);
    }
  }

  closeDrawer() {
    const drawer = document.getElementById('settings-drawer');
    if (drawer) {
      drawer.classList.remove('active');
      setTimeout(() => drawer.classList.add('hidden'), 250);
    }
  }

  async exportData() {
    const bookmarks = await Storage.get('realtab_bookmarks', await Storage.get('aura_bookmarks', []));
    const todos = await Storage.get('realtab_todos', await Storage.get('aura_todos', []));
    const notes = await Storage.get('realtab_notes', await Storage.get('aura_notes', ''));

    const exportObj = {
      version: '1.0.0',
      date: new Date().toISOString(),
      settings: this.settings,
      bookmarks,
      todos,
      notes
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realtab_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.settings) await Storage.set('realtab_settings', data.settings);
      if (data.bookmarks) await Storage.set('realtab_bookmarks', data.bookmarks);
      if (data.todos) await Storage.set('realtab_todos', data.todos);
      if (data.notes) await Storage.set('realtab_notes', data.notes);

      alert('Backup restored successfully! Reloading...');
      window.location.reload();
    } catch (err) {
      alert('Failed to import backup file. Make sure it is a valid JSON file.');
      console.error(err);
    }
  }

  async resetAll() {
    localStorage.clear();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.clear();
    }
    await Storage.removeWallpaperBlob();
    window.location.reload();
  }
}

window.SettingsManager = SettingsManager;
