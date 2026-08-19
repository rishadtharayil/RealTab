/**
 * Storage Layer - Universal Chrome Extension & LocalStorage / IndexedDB persistence
 */
const Storage = {
  // Check if Chrome extension storage API is available
  isExtension: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local,

  /**
   * Get an item from storage
   * @param {string} key 
   * @param {*} defaultValue 
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = null) {
    if (this.isExtension) {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError || result[key] === undefined) {
              const localVal = this._getLocalStorage(key);
              resolve(localVal !== null ? localVal : defaultValue);
            } else {
              resolve(result[key]);
            }
          });
        } catch (e) {
          const localVal = this._getLocalStorage(key);
          resolve(localVal !== null ? localVal : defaultValue);
        }
      });
    }

    const localVal = this._getLocalStorage(key);
    return Promise.resolve(localVal !== null ? localVal : defaultValue);
  },

  /**
   * Save an item to storage
   * @param {string} key 
   * @param {*} value 
   * @returns {Promise<void>}
   */
  async set(key, value) {
    this._setLocalStorage(key, value);
    if (this.isExtension) {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.set({ [key]: value }, () => resolve());
        } catch (e) {
          resolve();
        }
      });
    }
    return Promise.resolve();
  },

  /**
   * Remove an item from storage
   * @param {string} key 
   * @returns {Promise<void>}
   */
  async remove(key) {
    localStorage.removeItem(key);
    if (this.isExtension) {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.remove(key, () => resolve());
        } catch (e) {
          resolve();
        }
      });
    }
    return Promise.resolve();
  },

  _getLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item);
    } catch (e) {
      return null;
    }
  },

  _setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage quota exceeded or unavailable', e);
    }
  },

  // IndexedDB for large custom wallpaper blobs
  _dbPromise: null,
  getDB() {
    if (!this._dbPromise) {
      this._dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('RealTabDB', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('assets')) {
            db.createObjectStore('assets');
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e);
      });
    }
    return this._dbPromise;
  },

  async saveWallpaperBlob(dataUrl) {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('assets', 'readwrite');
        const store = tx.objectStore('assets');
        store.put(dataUrl, 'custom_wallpaper');
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e);
      });
    } catch (e) {
      console.error('Failed to save to IndexedDB', e);
      return false;
    }
  },

  async getWallpaperBlob() {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('assets', 'readonly');
        const store = tx.objectStore('assets');
        const req = store.get('custom_wallpaper');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async removeWallpaperBlob() {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('assets', 'readwrite');
        const store = tx.objectStore('assets');
        store.delete('custom_wallpaper');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }
};

window.Storage = Storage;
