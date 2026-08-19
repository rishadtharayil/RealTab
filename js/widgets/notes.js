/**
 * Smart Scratchpad & To-Do List Widget
 */
class NotesWidget {
  constructor() {
    this.todos = [];
    this.notesText = '';
    this.activeTab = 'todo'; // 'todo' or 'scratchpad'
  }

  async init() {
    const savedTodos = await Storage.get('realtab_todos', await Storage.get('aura_todos', [
      { id: 't_1', text: 'Plan today\'s top goals', completed: false, priority: 'high' },
      { id: 't_2', text: 'Review project milestones', completed: true, priority: 'medium' },
      { id: 't_3', text: 'Take a 5-minute hydration break', completed: false, priority: 'low' }
    ]));
    this.todos = savedTodos;

    const savedNotes = await Storage.get('realtab_notes', await Storage.get('aura_notes', '📌 Quick Scratchpad\n\n• Ideas for today\n• Meeting thoughts & references\n• Links and quick snippets'));
    this.notesText = savedNotes;

    this.bindEvents();
    this.render();
  }

  async saveTodos() {
    await Storage.set('realtab_todos', this.todos);
  }

  async saveNotes() {
    await Storage.set('realtab_notes', this.notesText);
  }

  bindEvents() {
    const tabTodo = document.getElementById('tab-todo-btn');
    const tabScratch = document.getElementById('tab-scratchpad-btn');
    const todoForm = document.getElementById('todo-input-form');
    const todoInput = document.getElementById('todo-input-field');
    const clearCompletedBtn = document.getElementById('todo-clear-completed');
    const notesArea = document.getElementById('scratchpad-textarea');
    const copyNotesBtn = document.getElementById('scratchpad-copy-btn');
    const clearNotesBtn = document.getElementById('scratchpad-clear-btn');

    if (tabTodo) {
      tabTodo.addEventListener('click', () => {
        this.activeTab = 'todo';
        this.renderTabs();
      });
    }

    if (tabScratch) {
      tabScratch.addEventListener('click', () => {
        this.activeTab = 'scratchpad';
        this.renderTabs();
      });
    }

    if (todoForm) {
      todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (todoInput && todoInput.value.trim()) {
          this.addTodo(todoInput.value.trim());
          todoInput.value = '';
        }
      });
    }

    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', () => {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.renderTodos();
      });
    }

    if (notesArea) {
      notesArea.value = this.notesText;
      notesArea.addEventListener('input', (e) => {
        this.notesText = e.target.value;
        this.saveNotes();
        this.updateNotesStats();
      });
    }

    if (copyNotesBtn) {
      copyNotesBtn.addEventListener('click', () => {
        if (navigator.clipboard && this.notesText) {
          navigator.clipboard.writeText(this.notesText).then(() => {
            const orig = copyNotesBtn.textContent;
            copyNotesBtn.textContent = 'Copied!';
            setTimeout(() => copyNotesBtn.textContent = orig, 1500);
          });
        }
      });
    }

    if (clearNotesBtn) {
      clearNotesBtn.addEventListener('click', () => {
        if (confirm('Clear all scratchpad notes?')) {
          this.notesText = '';
          if (notesArea) notesArea.value = '';
          this.saveNotes();
          this.updateNotesStats();
        }
      });
    }
  }

  addTodo(text) {
    const newTodo = {
      id: 't_' + Date.now(),
      text,
      completed: false,
      priority: 'medium'
    };
    this.todos.unshift(newTodo);
    this.saveTodos();
    this.renderTodos();
  }

  toggleTodo(id) {
    const item = this.todos.find(t => t.id === id);
    if (item) {
      item.completed = !item.completed;
      this.saveTodos();
      this.renderTodos();
    }
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.saveTodos();
    this.renderTodos();
  }

  render() {
    this.renderTabs();
    this.renderTodos();
    this.updateNotesStats();
  }

  renderTabs() {
    const tabTodo = document.getElementById('tab-todo-btn');
    const tabScratch = document.getElementById('tab-scratchpad-btn');
    const todoPane = document.getElementById('todo-pane');
    const scratchPane = document.getElementById('scratchpad-pane');

    if (this.activeTab === 'todo') {
      if (tabTodo) tabTodo.classList.add('active');
      if (tabScratch) tabScratch.classList.remove('active');
      if (todoPane) todoPane.classList.remove('hidden');
      if (scratchPane) scratchPane.classList.add('hidden');
    } else {
      if (tabTodo) tabTodo.classList.remove('active');
      if (tabScratch) tabScratch.classList.add('active');
      if (todoPane) todoPane.classList.add('hidden');
      if (scratchPane) scratchPane.classList.remove('hidden');
    }
  }

  renderTodos() {
    const list = document.getElementById('todo-items-list');
    const countEl = document.getElementById('todo-remaining-count');
    if (!list) return;

    list.innerHTML = '';
    const pendingCount = this.todos.filter(t => !t.completed).length;
    if (countEl) countEl.textContent = `${pendingCount} item${pendingCount === 1 ? '' : 's'} remaining`;

    if (this.todos.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'todo-empty-state';
      empty.textContent = 'All tasks completed! Enjoy your day ✨';
      list.appendChild(empty);
      return;
    }

    this.todos.forEach(t => {
      const li = document.createElement('li');
      li.className = `todo-item ${t.completed ? 'completed' : ''}`;
      li.dataset.id = t.id;

      li.innerHTML = `
        <label class="todo-checkbox-wrap">
          <input type="checkbox" ${t.completed ? 'checked' : ''} />
          <span class="todo-custom-check"></span>
        </label>
        <span class="todo-text">${this.escapeHtml(t.text)}</span>
        <button type="button" class="todo-delete-btn" title="Delete task">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      `;

      const checkInput = li.querySelector('input[type="checkbox"]');
      checkInput.addEventListener('change', () => this.toggleTodo(t.id));

      const delBtn = li.querySelector('.todo-delete-btn');
      delBtn.addEventListener('click', () => this.deleteTodo(t.id));

      list.appendChild(li);
    });
  }

  updateNotesStats() {
    const wordsEl = document.getElementById('scratchpad-words-count');
    if (!wordsEl) return;
    const words = this.notesText.trim() ? this.notesText.trim().split(/\s+/).length : 0;
    const chars = this.notesText.length;
    wordsEl.textContent = `${words} words, ${chars} chars`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
}

window.NotesWidget = NotesWidget;
