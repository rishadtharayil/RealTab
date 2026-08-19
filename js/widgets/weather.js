/**
 * Live Weather Widget (Powered by Open-Meteo API - zero API key required)
 */
class WeatherWidget {
  constructor() {
    this.lat = 40.7128;
    this.lon = -74.0060;
    this.cityName = 'New York';
    this.unit = 'c'; // 'c' or 'f'
    this.weatherData = null;
    this.cacheDuration = 15 * 60 * 1000; // 15 minutes cache
  }

  async init() {
    const savedCity = await Storage.get('realtab_weather_city', await Storage.get('aura_weather_city', null));
    const savedUnit = await Storage.get('realtab_weather_unit', await Storage.get('aura_weather_unit', 'c'));
    this.unit = savedUnit;

    if (savedCity) {
      this.lat = savedCity.lat;
      this.lon = savedCity.lon;
      this.cityName = savedCity.name;
    } else {
      this.detectLocation();
    }

    this.bindEvents();
    this.fetchWeather();
  }

  detectLocation() {
    if (navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            if (position && position.coords) {
              this.lat = position.coords.latitude;
              this.lon = position.coords.longitude;
              this.cityName = 'Local Area';
              this.fetchWeather(true);
            }
          },
          () => {
            // Geolocation not granted; silently use default or saved city
          },
          { timeout: 4000, maximumAge: 600000 }
        );
      } catch (e) {}
    }
  }

  async reverseGeocode(lat, lon) {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(2)}&count=1`);
      // Or simple fallback
    } catch (e) {}
  }

  bindEvents() {
    const weatherPill = document.getElementById('weather-pill');
    const modal = document.getElementById('weather-modal');
    const closeBtn = document.getElementById('weather-modal-close');
    const cityForm = document.getElementById('weather-city-form');
    const unitToggle = document.getElementById('weather-unit-toggle');

    if (weatherPill) {
      weatherPill.addEventListener('click', () => {
        this.openModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    if (cityForm) {
      cityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('weather-city-input');
        if (input && input.value.trim()) {
          this.searchCity(input.value.trim());
        }
      });
    }

    if (unitToggle) {
      unitToggle.addEventListener('click', () => {
        this.unit = this.unit === 'c' ? 'f' : 'c';
        Storage.set('realtab_weather_unit', this.unit);
        this.render();
      });
    }
  }

  async searchCity(query) {
    const errorEl = document.getElementById('weather-search-error');
    if (errorEl) errorEl.textContent = 'Searching...';

    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const place = data.results[0];
        this.lat = place.latitude;
        this.lon = place.longitude;
        this.cityName = `${place.name}${place.country ? ', ' + place.country : ''}`;

        await Storage.set('realtab_weather_city', {
          lat: this.lat,
          lon: this.lon,
          name: this.cityName
        });

        if (errorEl) errorEl.textContent = '';
        const input = document.getElementById('weather-city-input');
        if (input) input.value = '';

        await this.fetchWeather(true);
      } else {
        if (errorEl) errorEl.textContent = 'City not found. Try another search.';
      }
    } catch (e) {
      if (errorEl) errorEl.textContent = 'Network error searching city.';
    }
  }

  async fetchWeather(force = false) {
    const cacheKey = `realtab_weather_cache_${this.lat.toFixed(2)}_${this.lon.toFixed(2)}`;
    if (!force) {
      const cached = await Storage.get(cacheKey, null);
      if (cached && (Date.now() - cached.timestamp < this.cacheDuration)) {
        this.weatherData = cached.data;
        this.render();
        return;
      }
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.current) {
        this.weatherData = data;
        await Storage.set(cacheKey, {
          timestamp: Date.now(),
          data: data
        });
        this.render();
      }
    } catch (e) {
      console.warn('Failed to fetch weather:', e);
    }
  }

  getWeatherInfo(code, isDay = 1) {
    // WMO Weather interpretation codes
    const map = {
      0: { text: 'Clear Sky', icon: isDay ? '☀️' : '🌙' },
      1: { text: 'Mainly Clear', icon: isDay ? '🌤️' : '☁️' },
      2: { text: 'Partly Cloudy', icon: '⛅' },
      3: { text: 'Overcast', icon: '☁️' },
      45: { text: 'Foggy', icon: '🌫️' },
      48: { text: 'Depositing Rime Fog', icon: '🌫️' },
      51: { text: 'Light Drizzle', icon: '🌦️' },
      53: { text: 'Moderate Drizzle', icon: '🌧️' },
      55: { text: 'Dense Drizzle', icon: '🌧️' },
      61: { text: 'Slight Rain', icon: '🌦️' },
      63: { text: 'Moderate Rain', icon: '🌧️' },
      65: { text: 'Heavy Rain', icon: '🌧️' },
      71: { text: 'Slight Snow', icon: '🌨️' },
      73: { text: 'Moderate Snow', icon: '❄️' },
      75: { text: 'Heavy Snow', icon: '❄️' },
      80: { text: 'Rain Showers', icon: '🌦️' },
      81: { text: 'Moderate Showers', icon: '🌧️' },
      82: { text: 'Violent Showers', icon: '⛈️' },
      95: { text: 'Thunderstorm', icon: '⛈️' },
      96: { text: 'Thunderstorm with Hail', icon: '⛈️' },
      99: { text: 'Heavy Thunderstorm', icon: '🌩️' }
    };
    return map[code] || { text: 'Clear', icon: '🌤️' };
  }

  formatTemp(celsius) {
    if (this.unit === 'f') {
      const f = Math.round((celsius * 9 / 5) + 32);
      return `${f}°F`;
    }
    return `${Math.round(celsius)}°C`;
  }

  render() {
    if (!this.weatherData || !this.weatherData.current) return;

    const current = this.weatherData.current;
    const info = this.getWeatherInfo(current.weather_code, current.is_day);

    // Render pill in header
    const pillIcon = document.getElementById('weather-pill-icon');
    const pillTemp = document.getElementById('weather-pill-temp');
    const pillCity = document.getElementById('weather-pill-city');

    if (pillIcon) pillIcon.textContent = info.icon;
    if (pillTemp) pillTemp.textContent = this.formatTemp(current.temperature_2m);
    if (pillCity) pillCity.textContent = this.cityName.split(',')[0];

    // Render Modal details
    const modalIcon = document.getElementById('weather-modal-icon');
    const modalTemp = document.getElementById('weather-modal-temp');
    const modalCondition = document.getElementById('weather-modal-condition');
    const modalCity = document.getElementById('weather-modal-city-title');
    const modalHumidity = document.getElementById('weather-modal-humidity');
    const modalWind = document.getElementById('weather-modal-wind');
    const modalFeels = document.getElementById('weather-modal-feels');
    const forecastList = document.getElementById('weather-forecast-list');
    const unitToggle = document.getElementById('weather-unit-toggle');

    if (modalIcon) modalIcon.textContent = info.icon;
    if (modalTemp) modalTemp.textContent = this.formatTemp(current.temperature_2m);
    if (modalCondition) modalCondition.textContent = info.text;
    if (modalCity) modalCity.textContent = this.cityName;
    if (modalHumidity) modalHumidity.textContent = `${current.relative_humidity_2m}%`;
    if (modalWind) modalWind.textContent = `${current.wind_speed_10m} km/h`;
    if (modalFeels) modalFeels.textContent = this.formatTemp(current.apparent_temperature);
    if (unitToggle) unitToggle.textContent = this.unit === 'c' ? 'Switch to °F' : 'Switch to °C';

    // Daily Forecast
    if (forecastList && this.weatherData.daily) {
      const daily = this.weatherData.daily;
      forecastList.innerHTML = '';

      for (let i = 0; i < Math.min(5, daily.time.length); i++) {
        const dateStr = daily.time[i];
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString(undefined, { weekday: 'short' });
        const dayInfo = this.getWeatherInfo(daily.weather_code[i], 1);
        const maxTemp = this.formatTemp(daily.temperature_2m_max[i]);
        const minTemp = this.formatTemp(daily.temperature_2m_min[i]);

        const row = document.createElement('div');
        row.className = 'forecast-row';
        row.innerHTML = `
          <span class="forecast-day">${dayName}</span>
          <span class="forecast-icon">${dayInfo.icon}</span>
          <span class="forecast-temps">${minTemp} / ${maxTemp}</span>
        `;
        forecastList.appendChild(row);
      }
    }
  }

  openModal() {
    const modal = document.getElementById('weather-modal');
    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.add('active'), 10);
    }
  }

  closeModal() {
    const modal = document.getElementById('weather-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.classList.add('hidden'), 250);
    }
  }
}

window.WeatherWidget = WeatherWidget;
