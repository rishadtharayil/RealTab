/**
 * RealTab - Main Application Bootstrapper
 */
class App {
  constructor() {
    this.searchEngines = {
      google: {
        name: 'Google',
        url: 'https://www.google.com/search?q=',
        icon: '🔍',
        placeholder: 'Search Google or type a URL...'
      },
      duckduckgo: {
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q=',
        icon: '🦆',
        placeholder: 'Search DuckDuckGo privately...'
      },
      bing: {
        name: 'Bing',
        url: 'https://www.bing.com/search?q=',
        icon: '🌊',
        placeholder: 'Search Bing...'
      },
      youtube: {
        name: 'YouTube',
        url: 'https://www.youtube.com/results?search_query=',
        icon: '▶️',
        placeholder: 'Search YouTube videos...'
      },
      github: {
        name: 'GitHub',
        url: 'https://github.com/search?q=',
        icon: '🐙',
        placeholder: 'Search GitHub repositories...'
      },
      reddit: {
        name: 'Reddit',
        url: 'https://www.reddit.com/search/?q=',
        icon: '🤖',
        placeholder: 'Search Reddit discussions...'
      },
      perplexity: {
        name: 'Perplexity',
        url: 'https://www.perplexity.ai/search?q=',
        icon: '🧠',
        placeholder: 'Ask Perplexity AI...'
      },
      chatgpt: {
        name: 'ChatGPT',
        url: 'https://chatgpt.com/?q=',
        icon: '✨',
        placeholder: 'Ask ChatGPT anything...'
      }
    };

    this.currentEngineKey = 'google';

    // Modules
    this.bookmarksManager = new BookmarksManager();
    this.weatherWidget = new WeatherWidget();
    this.pomodoroWidget = new PomodoroWidget();
    this.notesWidget = new NotesWidget();
    this.ambientSoundscapes = new AmbientSoundscapes();
    this.quotesWidget = new QuotesWidget();
    this.settingsManager = new SettingsManager();
  }

  async start() {
    // Initialize Settings first (sets themes and preferences)
    await this.settingsManager.init();

    // Set search engine from saved preference
    this.setSearchEngine(this.settingsManager.settings.defaultSearchEngine || 'google');

    // Initialize all widgets
    await this.bookmarksManager.init();
    await this.weatherWidget.init();
    await this.pomodoroWidget.init();
    await this.notesWidget.init();
    this.ambientSoundscapes.init();
    await this.quotesWidget.init();

    // Setup UI & Search
    this.bindSearchEvents();
    this.bindKeyboardShortcuts();

    // Start Real-time Clock
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Initial greeting
    this.updateGreeting();
    setInterval(() => this.updateGreeting(), 60000);
  }

  bindSearchEvents() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchEngineBtn = document.getElementById('search-engine-selector-btn');
    const searchEngineMenu = document.getElementById('search-engine-dropdown');
    const clearBtn = document.getElementById('search-clear-btn');

    // Dropdown toggle
    if (searchEngineBtn && searchEngineMenu) {
      searchEngineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        searchEngineMenu.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!searchEngineMenu.contains(e.target) && e.target !== searchEngineBtn) {
          searchEngineMenu.classList.remove('active');
        }
      });

      // Populate & handle dropdown items
      searchEngineMenu.querySelectorAll('.search-engine-item').forEach(item => {
        item.addEventListener('click', () => {
          const engineKey = item.dataset.engine;
          if (engineKey && this.searchEngines[engineKey]) {
            this.setSearchEngine(engineKey);
            searchEngineMenu.classList.remove('active');
            if (searchInput) searchInput.focus();
          }
        });
      });
    }

    // Clear input button
    if (searchInput && clearBtn) {
      searchInput.addEventListener('input', () => {
        clearBtn.style.display = searchInput.value.length > 0 ? 'flex' : 'none';
      });

      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        searchInput.focus();
      });
    }

    // Submit search
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          this.executeSearch(query);
        }
      });
    }
  }

  setSearchEngine(engineKey) {
    if (!this.searchEngines[engineKey]) engineKey = 'google';
    this.currentEngineKey = engineKey;

    const engine = this.searchEngines[engineKey];
    const selectorIcon = document.getElementById('selected-engine-icon');
    const searchInput = document.getElementById('search-input');

    if (selectorIcon) selectorIcon.textContent = engine.icon;
    if (searchInput) searchInput.placeholder = engine.placeholder;

    // Highlight active in menu
    document.querySelectorAll('.search-engine-item').forEach(item => {
      if (item.dataset.engine === engineKey) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  executeSearch(query) {
    // Check if input is a direct URL
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/;
    const isLocalhost = /^localhost(:\d+)?(\/\S*)?$/.test(query);

    if (urlPattern.test(query) || isLocalhost) {
      let targetUrl = query;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      window.location.href = targetUrl;
      return;
    }

    const engine = this.searchEngines[this.currentEngineKey] || this.searchEngines.google;
    window.location.href = `${engine.url}${encodeURIComponent(query)}`;
  }

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const searchInput = document.getElementById('search-input');
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

      // Press '/' to jump to search bar
      if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Escape to close modals or blur input
      if (e.key === 'Escape') {
        // Close voice modal
        if (this.voiceSearch && this.voiceSearch.isListening) {
          this.voiceSearch.stop();
        }
        // Close modals
        ['bookmark-modal', 'weather-modal', 'ambient-modal', 'settings-drawer'].forEach(id => {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('hidden')) {
            if (id === 'settings-drawer') this.settingsManager.closeDrawer();
            else if (id === 'bookmark-modal') this.bookmarksManager.closeModal();
            else if (id === 'weather-modal') this.weatherWidget.closeModal();
            else if (id === 'ambient-modal') this.ambientSoundscapes.closeModal();
          }
        });

        if (document.activeElement === searchInput) {
          searchInput.blur();
        }
      }
    });
  }

  updateClock() {
    const clockEl = document.getElementById('main-clock-time');
    const ampmEl = document.getElementById('main-clock-ampm');
    const dateEl = document.getElementById('main-clock-date');

    const now = new Date();
    const is24h = this.settingsManager.settings.clockFormat24;
    const showSec = this.settingsManager.settings.showSeconds;

    let hours = now.getHours();
    let ampm = '';

    if (!is24h) {
      ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12
    }

    const hStr = hours.toString().padStart(2, '0');
    const mStr = now.getMinutes().toString().padStart(2, '0');
    const sStr = now.getSeconds().toString().padStart(2, '0');

    if (clockEl) {
      clockEl.textContent = showSec ? `${hStr}:${mStr}:${sStr}` : `${hStr}:${mStr}`;
    }

    if (ampmEl) {
      ampmEl.textContent = is24h ? '' : ampm;
      ampmEl.style.display = is24h ? 'none' : 'inline-block';
    }

    if (dateEl) {
      const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString(undefined, options);
    }
  }

  updateGreeting() {
    const greetingEl = document.getElementById('greeting-text');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting = 'Good day';

    if (hour >= 5 && hour < 12) {
      greeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      greeting = 'Good evening';
    } else {
      greeting = 'Good night';
    }

    const userName = this.settingsManager.settings.userName;
    if (userName) {
      greeting += `, ${userName}`;
    }

    greetingEl.textContent = greeting;
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.App = new App();
  window.App.start();
});
