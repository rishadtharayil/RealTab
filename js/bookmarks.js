/**
 * Bookmarks & Quick Shortcuts Manager
 */
class BookmarksManager {
  constructor() {
    this.bookmarks = [];
    this.categories = ['All', 'Favorites', 'Dev', 'Media', 'Tools', 'Social'];
    this.currentCategory = 'All';
    this.searchQuery = '';
    this.editingId = null;

    this.defaultBookmarks = [
      { id: 'b_1', title: 'GitHub', url: 'https://github.com', category: 'Dev', pinned: true },
      { id: 'b_2', title: 'YouTube', url: 'https://youtube.com', category: 'Media', pinned: true },
      { id: 'b_3', title: 'ChatGPT', url: 'https://chat.openai.com', category: 'Tools', pinned: true },
      { id: 'b_4', title: 'Reddit', url: 'https://reddit.com', category: 'Social', pinned: true },
      { id: 'b_5', title: 'Notion', url: 'https://notion.so', category: 'Tools', pinned: false },
      { id: 'b_6', title: 'Spotify', url: 'https://open.spotify.com', category: 'Media', pinned: false },
      { id: 'b_7', title: 'Figma', url: 'https://figma.com', category: 'Dev', pinned: false },
      { id: 'b_8', title: 'X / Twitter', url: 'https://x.com', category: 'Social', pinned: false },
      { id: 'b_9', title: 'Gmail', url: 'https://mail.google.com', category: 'Favorites', pinned: true },
      { id: 'b_10', title: 'Dribbble', url: 'https://dribbble.com', category: 'Media', pinned: false },
      { id: 'b_11', title: 'Google Drive', url: 'https://drive.google.com', category: 'Tools', pinned: false },
      { id: 'b_12', title: 'Vercel', url: 'https://vercel.com', category: 'Dev', pinned: false }
    ];
  }

  async init() {
    const saved = await Storage.get('realtab_bookmarks', await Storage.get('aura_bookmarks', null));
    if (saved && Array.isArray(saved) && saved.length > 0) {
      this.bookmarks = saved;
    } else {
      this.bookmarks = [...this.defaultBookmarks];
      await this.save();
    }

    const savedCats = await Storage.get('realtab_categories', await Storage.get('aura_categories', null));
    if (savedCats && Array.isArray(savedCats)) {
      this.categories = savedCats;
    }

    this.bindEvents();
    this.render();
  }

  async save() {
    await Storage.set('realtab_bookmarks', this.bookmarks);
  }

  async saveCategories() {
    await Storage.set('realtab_categories', this.categories);
  }

  bindEvents() {
    const addBtn = document.getElementById('add-bookmark-btn');
    const modal = document.getElementById('bookmark-modal');
    const closeBtn = document.getElementById('close-bookmark-modal');
    const form = document.getElementById('bookmark-form');
    const deleteBtn = document.getElementById('delete-bookmark-btn');
    const importChromeBtn = document.getElementById('import-chrome-bookmarks-btn');
    const searchInput = document.getElementById('bookmark-search-filter');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    const cancelBtn = document.getElementById('cancel-bookmark-modal-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (this.editingId) {
          this.deleteBookmark(this.editingId);
          this.closeModal();
        }
      });
    }

    if (importChromeBtn) {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        importChromeBtn.style.display = 'inline-flex';
        importChromeBtn.addEventListener('click', () => this.importFromChrome());
      } else {
        importChromeBtn.style.display = 'none';
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderBookmarksGrid();
      });
    }
  }

  getFaviconUrl(url) {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`;
    } catch (e) {
      return '';
    }
  }

  getDomainInitial(url, title) {
    if (title && title.length > 0) return title.charAt(0).toUpperCase();
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace('www.', '').charAt(0).toUpperCase();
    } catch (e) {
      return '★';
    }
  }

  render() {
    this.renderCategories();
    this.renderBookmarksGrid();
  }

  renderCategories() {
    const container = document.getElementById('bookmark-categories');
    if (!container) return;

    container.innerHTML = '';
    this.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `category-pill ${this.currentCategory === cat ? 'active' : ''}`;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        this.currentCategory = cat;
        this.renderCategories();
        this.renderBookmarksGrid();
      });
      container.appendChild(btn);
    });
  }

  renderBookmarksGrid() {
    const grid = document.getElementById('bookmarks-grid');
    if (!grid) return;

    let list = this.bookmarks;

    if (this.currentCategory === 'Favorites') {
      list = list.filter(b => b.pinned);
    } else if (this.currentCategory !== 'All') {
      list = list.filter(b => b.category === this.currentCategory);
    }

    if (this.searchQuery) {
      list = list.filter(b => 
        b.title.toLowerCase().includes(this.searchQuery) || 
        b.url.toLowerCase().includes(this.searchQuery)
      );
    }

    // Sort: pinned first
    list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    grid.innerHTML = '';

    if (list.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'bookmarks-empty-state';
      emptyState.innerHTML = `
        <div class="empty-icon">📂</div>
        <p>No shortcuts found in this category</p>
        <button class="btn btn-secondary btn-sm" id="empty-add-btn">+ Add Shortcut</button>
      `;
      grid.appendChild(emptyState);
      const emptyAdd = document.getElementById('empty-add-btn');
      if (emptyAdd) emptyAdd.addEventListener('click', () => this.openModal());
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = `bookmark-card ${item.pinned ? 'is-pinned' : ''}`;
      card.dataset.id = item.id;

      const faviconUrl = this.getFaviconUrl(item.url);
      const initial = this.getDomainInitial(item.url, item.title);

      card.innerHTML = `
        <a href="${item.url}" class="bookmark-link" title="${item.title} (${item.url})">
          <div class="bookmark-icon-wrap">
            <img src="${faviconUrl}" alt="" class="bookmark-favicon" />
            <div class="bookmark-fallback-avatar" style="display:none;">${initial}</div>
          </div>
          <span class="bookmark-title">${this.escapeHtml(item.title)}</span>
        </a>
        <div class="bookmark-actions">
          <button type="button" class="btn-icon bookmark-pin-btn" title="${item.pinned ? 'Unpin' : 'Pin to favorites'}">
            ${item.pinned ? '★' : '☆'}
          </button>
          <button type="button" class="btn-icon bookmark-edit-btn" title="Edit shortcut">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        </div>
      `;

      // Handle favicon loading error safely without inline onerror
      const img = card.querySelector('.bookmark-favicon');
      const fallback = card.querySelector('.bookmark-fallback-avatar');
      if (img && fallback) {
        img.addEventListener('error', () => {
          img.style.display = 'none';
          fallback.style.display = 'flex';
        });
      }

      // Event: Pin toggle
      const pinBtn = card.querySelector('.bookmark-pin-btn');
      pinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePin(item.id);
      });

      // Event: Edit modal
      const editBtn = card.querySelector('.bookmark-edit-btn');
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openModal(item);
      });

      grid.appendChild(card);
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  openModal(item = null) {
    const modal = document.getElementById('bookmark-modal');
    const titleInput = document.getElementById('bookmark-title-input');
    const urlInput = document.getElementById('bookmark-url-input');
    const catInput = document.getElementById('bookmark-category-select');
    const pinCheckbox = document.getElementById('bookmark-pinned-checkbox');
    const modalHeader = document.getElementById('bookmark-modal-title');
    const deleteBtn = document.getElementById('delete-bookmark-btn');

    this.populateCategorySelect();

    if (item) {
      this.editingId = item.id;
      if (modalHeader) modalHeader.textContent = 'Edit Shortcut';
      if (titleInput) titleInput.value = item.title;
      if (urlInput) urlInput.value = item.url;
      if (catInput) catInput.value = item.category || 'Dev';
      if (pinCheckbox) pinCheckbox.checked = !!item.pinned;
      if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    } else {
      this.editingId = null;
      if (modalHeader) modalHeader.textContent = 'Add Shortcut';
      if (titleInput) titleInput.value = '';
      if (urlInput) urlInput.value = '';
      if (catInput) catInput.value = this.currentCategory !== 'All' && this.currentCategory !== 'Favorites' ? this.currentCategory : 'Dev';
      if (pinCheckbox) pinCheckbox.checked = false;
      if (deleteBtn) deleteBtn.style.display = 'none';
    }

    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.add('active'), 10);
      if (urlInput && !item) urlInput.focus();
      else if (titleInput) titleInput.focus();
    }
  }

  closeModal() {
    const modal = document.getElementById('bookmark-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.classList.add('hidden'), 250);
    }
    this.editingId = null;
  }

  populateCategorySelect() {
    const select = document.getElementById('bookmark-category-select');
    if (!select) return;

    select.innerHTML = '';
    const available = this.categories.filter(c => c !== 'All' && c !== 'Favorites');
    available.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  }

  async handleFormSubmit() {
    const titleInput = document.getElementById('bookmark-title-input');
    const urlInput = document.getElementById('bookmark-url-input');
    const catInput = document.getElementById('bookmark-category-select');
    const pinCheckbox = document.getElementById('bookmark-pinned-checkbox');

    let url = urlInput.value.trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    let title = titleInput.value.trim();
    if (!title) {
      try {
        title = new URL(url).hostname.replace('www.', '');
      } catch (e) {
        title = 'Shortcut';
      }
    }

    const category = catInput ? catInput.value : 'Dev';
    const pinned = pinCheckbox ? pinCheckbox.checked : false;

    if (this.editingId) {
      const idx = this.bookmarks.findIndex(b => b.id === this.editingId);
      if (idx !== -1) {
        this.bookmarks[idx] = {
          ...this.bookmarks[idx],
          title,
          url,
          category,
          pinned
        };
      }
    } else {
      const newBookmark = {
        id: 'b_' + Date.now(),
        title,
        url,
        category,
        pinned
      };
      this.bookmarks.unshift(newBookmark);
    }

    await this.save();
    this.renderBookmarksGrid();
    this.closeModal();
  }

  async togglePin(id) {
    const b = this.bookmarks.find(item => item.id === id);
    if (b) {
      b.pinned = !b.pinned;
      await this.save();
      this.renderBookmarksGrid();
    }
  }

  async deleteBookmark(id) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
    await this.save();
    this.renderBookmarksGrid();
  }

  async importFromChrome() {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      alert('Chrome Bookmarks API is only accessible when running inside Chrome Extension.');
      return;
    }

    try {
      chrome.bookmarks.getTree((tree) => {
        const extracted = [];
        const traverse = (nodes) => {
          for (const node of nodes) {
            if (node.url) {
              extracted.push({
                id: 'b_cr_' + Math.random().toString(36).substr(2, 9),
                title: node.title || 'Chrome Bookmark',
                url: node.url,
                category: 'Favorites',
                pinned: false
              });
            }
            if (node.children) {
              traverse(node.children);
            }
          }
        };
        traverse(tree);

        if (extracted.length > 0) {
          // Merge unique URLs
          const existingUrls = new Set(this.bookmarks.map(b => b.url));
          const newOnes = extracted.filter(b => !existingUrls.has(b.url));
          this.bookmarks = [...this.bookmarks, ...newOnes];
          this.save();
          this.renderBookmarksGrid();
          alert(`Successfully imported ${newOnes.length} bookmarks from Chrome!`);
        } else {
          alert('No bookmarks found in Chrome.');
        }
      });
    } catch (e) {
      console.error('Error importing Chrome bookmarks:', e);
    }
  }
}

window.BookmarksManager = BookmarksManager;
