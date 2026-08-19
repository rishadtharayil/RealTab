/**
 * Inspirational & Aesthetic Quotes Generator
 */
class QuotesWidget {
  constructor() {
    this.quotes = [
      { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
      { text: "Focus is a muscle. The more you practice, the stronger it gets.", author: "Cal Newport" },
      { text: "Make it simple, but significant.", author: "Don Draper" },
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
      { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
      { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
      { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
      { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
      { text: "Wisdom begins in wonder.", author: "Socrates" },
      { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
      { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" }
    ];
    this.currentIndex = 0;
  }

  async init() {
    // Pick daily quote based on day of year or random
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    this.currentIndex = dayOfYear % this.quotes.length;

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const refreshBtn = document.getElementById('quote-refresh-btn');
    const copyBtn = document.getElementById('quote-copy-btn');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.nextQuote();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const q = this.quotes[this.currentIndex];
        if (navigator.clipboard) {
          navigator.clipboard.writeText(`"${q.text}" — ${q.author}`).then(() => {
            const orig = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓';
            setTimeout(() => copyBtn.innerHTML = orig, 1500);
          });
        }
      });
    }
  }

  nextQuote() {
    const quoteEl = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');
    
    if (quoteEl) quoteEl.style.opacity = '0';
    if (authorEl) authorEl.style.opacity = '0';

    setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.quotes.length;
      this.render();
      if (quoteEl) quoteEl.style.opacity = '1';
      if (authorEl) authorEl.style.opacity = '1';
    }, 200);
  }

  render() {
    const quoteEl = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');

    if (quoteEl && authorEl) {
      const current = this.quotes[this.currentIndex];
      quoteEl.textContent = `"${current.text}"`;
      authorEl.textContent = `— ${current.author}`;
    }
  }
}

window.QuotesWidget = QuotesWidget;
