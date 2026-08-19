/**
 * Procedural Web Audio Ambient Soundscapes Synthesizer
 * 100% offline, zero network requests, pure Web Audio API synthesis
 */
class AmbientSoundscapes {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.sounds = {
      rain: { active: false, volume: 0.5, nodes: null },
      waves: { active: false, volume: 0.5, nodes: null },
      vinyl: { active: false, volume: 0.4, nodes: null },
      whitenoise: { active: false, volume: 0.3, nodes: null }
    };
  }

  init() {
    this.bindEvents();
    this.render();
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  bindEvents() {
    const toggleHeaderBtn = document.getElementById('ambient-pill-btn');
    const modal = document.getElementById('ambient-modal');
    const closeBtn = document.getElementById('ambient-modal-close');
    const masterPlayBtn = document.getElementById('ambient-master-play-btn');

    if (toggleHeaderBtn) {
      toggleHeaderBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    if (masterPlayBtn) {
      masterPlayBtn.addEventListener('click', () => this.toggleMaster());
    }

    // Bind individual sound card toggles and sliders
    ['rain', 'waves', 'vinyl', 'whitenoise'].forEach(type => {
      const toggle = document.getElementById(`ambient-${type}-toggle`);
      const slider = document.getElementById(`ambient-${type}-volume`);

      if (toggle) {
        toggle.addEventListener('change', (e) => {
          this.setSoundActive(type, e.target.checked);
        });
      }

      if (slider) {
        slider.addEventListener('input', (e) => {
          this.setSoundVolume(type, parseFloat(e.target.value));
        });
      }
    });
  }

  toggleMaster() {
    this.ensureContext();
    if (this.isPlaying) {
      this.stopAll();
    } else {
      // If none active, turn on rain by default
      const anyActive = Object.values(this.sounds).some(s => s.active);
      if (!anyActive) {
        this.setSoundActive('rain', true);
        const rainToggle = document.getElementById('ambient-rain-toggle');
        if (rainToggle) rainToggle.checked = true;
      }
      this.startAllActive();
    }
  }

  setSoundActive(type, active) {
    this.sounds[type].active = active;
    if (active) {
      this.ensureContext();
      this.startSound(type);
      this.isPlaying = true;
    } else {
      this.stopSound(type);
      const anyActive = Object.values(this.sounds).some(s => s.active);
      if (!anyActive) this.isPlaying = false;
    }
    this.render();
  }

  setSoundVolume(type, volume) {
    this.sounds[type].volume = volume;
    if (this.sounds[type].nodes && this.sounds[type].nodes.gain) {
      this.sounds[type].nodes.gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  startAllActive() {
    this.ensureContext();
    this.isPlaying = true;
    Object.keys(this.sounds).forEach(type => {
      if (this.sounds[type].active) {
        this.startSound(type);
      }
    });
    this.render();
  }

  stopAll() {
    Object.keys(this.sounds).forEach(type => {
      this.stopSound(type);
    });
    this.isPlaying = false;
    this.render();
  }

  createNoiseBuffer(type = 'pink') {
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds looping buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Gain compensation
      }
    } else {
      // White noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    return buffer;
  }

  startSound(type) {
    if (this.sounds[type].nodes) return; // already playing

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sounds[type].volume, this.ctx.currentTime);
    gain.connect(this.masterGain);

    if (type === 'rain') {
      // Rain: Pink noise through lowpass + random droplets
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer('pink');
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      noise.connect(filter);
      filter.connect(gain);
      noise.start();

      this.sounds[type].nodes = { source: noise, gain, filter };
    } 
    else if (type === 'waves') {
      // Ocean Waves: Brown noise modulated with an LFO
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer('brown');
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 450;

      // LFO for wave swelling
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.12; // wave cycle ~8 seconds
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.35;

      const waveGain = this.ctx.createGain();
      waveGain.gain.value = 0.5;

      lfo.connect(lfoGain);
      lfoGain.connect(waveGain.gain);

      noise.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(gain);

      noise.start();
      lfo.start();

      this.sounds[type].nodes = { source: noise, lfo, gain };
    }
    else if (type === 'vinyl') {
      // Lo-fi Vinyl / Cafe: filtered noise with warm crackle
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer('pink');
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 1.8;

      noise.connect(filter);
      filter.connect(gain);
      noise.start();

      this.sounds[type].nodes = { source: noise, gain, filter };
    }
    else if (type === 'whitenoise') {
      // White Noise
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer('white');
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 6000;

      noise.connect(filter);
      filter.connect(gain);
      noise.start();

      this.sounds[type].nodes = { source: noise, gain, filter };
    }
  }

  stopSound(type) {
    const nodes = this.sounds[type].nodes;
    if (nodes) {
      try {
        if (nodes.source) nodes.source.stop();
        if (nodes.lfo) nodes.lfo.stop();
      } catch (e) {}
      this.sounds[type].nodes = null;
    }
  }

  render() {
    const headerPill = document.getElementById('ambient-pill-btn');
    const headerPillText = document.getElementById('ambient-pill-text');
    const masterBtn = document.getElementById('ambient-master-play-btn');

    const activeCount = Object.values(this.sounds).filter(s => s.active).length;

    if (headerPill) {
      if (this.isPlaying && activeCount > 0) {
        headerPill.classList.add('active-playing');
        if (headerPillText) headerPillText.textContent = `Ambient (${activeCount})`;
      } else {
        headerPill.classList.remove('active-playing');
        if (headerPillText) headerPillText.textContent = 'Ambient Off';
      }
    }

    if (masterBtn) {
      masterBtn.innerHTML = this.isPlaying && activeCount > 0
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause Soundscape`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play Soundscape`;
    }
  }

  openModal() {
    const modal = document.getElementById('ambient-modal');
    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.add('active'), 10);
    }
  }

  closeModal() {
    const modal = document.getElementById('ambient-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.classList.add('hidden'), 250);
    }
  }
}

window.AmbientSoundscapes = AmbientSoundscapes;
