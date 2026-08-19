# RealTab ✨ - Minimalist Matte New Tab Dashboard

An aesthetic, lightweight, and modern Chrome New Tab extension with a **matte neutral design**, multi-engine search, live weather, pomodoro timer, scratchpad & to-do list, offline procedural ambient soundscapes, and comprehensive bookmark management.

---

## 🌟 Key Features

- 🌿 **Matte & Neutral Aesthetics**: Zero gloss, no glassmorphism blur, built with soothing neutral light palettes (Chalk White, Slate Grey, Botanical Sage, Nordic Sky, Warm Stone).
- 🎨 **6 Curated Themes**:
  - **Clean Chalk** *(Default)*: Pure white surfaces with warm slate grey backgrounds.
  - **Sage & Mint**: Calming muted botanical green with linen off-white cards.
  - **Nordic Sky**: Serene powder light blue and clean neutral grey.
  - **Warm Sand & Stone**: Warm taupe and stone minimalism.
  - **Soft Lavender**: Gentle mist violet and off-white.
  - **Matte Slate**: Low-glare matte dark slate.
- 🔍 **Omni-Search Engine**: Instant switching between Google, DuckDuckGo, Bing, YouTube, GitHub, Reddit, Perplexity AI, and ChatGPT. Direct URL detection and `/` shortcut.
- 🔖 **Bookmark & Shortcut Manager**:
  - High-res auto-favicon resolver with letter avatar fallback.
  - Category filter tabs (`Favorites`, `Dev`, `Media`, `Tools`, `Social`, `All`).
  - Add / Edit / Pin / Delete shortcut modal.
  - 1-click Chrome Bookmarks sync (when running as an extension) and JSON backup export/import.
- ⏱️ **Pomodoro Focus Timer**: 25m Focus / 5m Short Break / 15m Long Break with circular progress ring, focus goal tracking, and Web Audio chime alert.
- 📝 **Tasks & Quick Notes**: Checkable tasks with completion tracking, plus auto-saving scratchpad with word/character counter and 1-click copy.
- 🌤️ **Live Weather & 5-Day Forecast**: Open-Meteo API integration (zero API keys needed!), auto-geolocation, city search, feels-like, humidity, wind speed, and 5-day daily forecast modal.
- 🎵 **Procedural Ambient Soundscapes**: 100% offline Web Audio synthesizer for Soothing Rain, Ocean Waves, Lo-Fi Cafe/Vinyl, and White Noise with custom channel mixers.
- 💡 **Daily Wisdom Quotes**: Curated inspirational quotes with daily rotation, manual shuffle, and copy tool.
- ⌨️ **Keyboard Shortcuts**:
  - `/` : Jump directly to Search bar.
  - `Esc` : Close modals / drawers or blur search bar.

---

## 🚀 Installation Guide

### Option 1: Load as Chrome Extension (Recommended)
1. Clone this repository or download the source code:
   ```bash
   git clone https://github.com/rishadtharayil/RealTab.git
   ```
2. Open Google Chrome (or Edge / Brave / Opera).
3. Navigate to `chrome://extensions`.
4. Enable **Developer mode** (toggle switch in the top-right corner).
5. Click **"Load unpacked"** (top-left button).
6. Select the repository root folder.
7. Open a new tab (`Ctrl + T` / `Cmd + T`) to use RealTab!

### Option 2: Standalone Browser Web App
- Simply open `index.html` directly in any web browser. All data and preferences will be persisted locally using `localStorage` and `IndexedDB`.

---

## 📁 Project Structure

```
RealTab/
├── manifest.json            # Chrome Manifest V3 configuration
├── index.html               # Main dashboard HTML structure
├── README.md                # Documentation & installation guide
├── .gitignore               # Git ignore rules
├── assets/
│   ├── icon16.png           # 16x16 extension icon
│   ├── icon48.png           # 48x48 extension icon
│   └── icon128.png          # 128x128 extension icon
├── css/
│   ├── main.css             # Base styles, matte design tokens, and themes
│   ├── bookmarks.css        # Search bar and bookmark grid
│   └── widgets.css          # Pomodoro, Notes, Ambient audio, Weather, Settings
└── js/
    ├── app.js               # Application coordinator & keyboard shortcuts
    ├── storage.js           # Universal Chrome/localStorage/IndexedDB layer
    ├── bookmarks.js         # Bookmark & shortcut manager
    ├── settings.js          # Theme selector, layout toggles & backup
    └── widgets/
        ├── weather.js       # Live weather & 5-day forecast
        ├── pomodoro.js      # Focus timer & audio chime
        ├── notes.js         # To-Do list & scratchpad
        ├── ambient.js       # Procedural audio synthesizer
        └── quotes.js        # Daily quotes rotator
```

---

## 🛡️ License

MIT License. Open source and free for personal and commercial customization.
