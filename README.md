# LearnSync

> **Turn Video Learning Into Structured Knowledge**

LearnSync is a Chrome Extension (Manifest V3) that lets students capture timestamp-linked notes while watching YouTube lectures, build a searchable knowledge base, and instantly jump back to any saved moment.

---

## Features

| Feature | Description |
|---|---|
| 📝 Timestamp Notes | Capture notes linked to the exact video moment |
| ⏱️ Jump to Timestamp | Click any note to seek the video to that point |
| 🔍 Search | Instant full-text search across all notes and video titles |
| 📚 Library | Browse all saved videos and their notes |
| 📊 Dashboard | Stats: total notes, videos, learning hours, weekly activity |
| 📤 Export | Export notes as TXT, Markdown, or PDF |
| 🎨 Themes | Light / Dark / System |
| 💾 Backup & Restore | JSON backup and restore |

---

## Installation (Unpacked Extension)

1. Download or clone this repository to your machine.
2. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions
   ```
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the `learnsync/` folder (the one containing `manifest.json`).
6. The LearnSync icon will appear in your Chrome toolbar.

---

## How to Use

1. **Open any YouTube video** (e.g. a lecture, DSA tutorial, or course).
2. **Click the LearnSync icon** in the toolbar.
3. The popup detects the current video and shows the live timestamp.
4. **Write your note** in the text area and press **Save Note** (or Ctrl+Enter).
5. Notes appear in the popup list — click the play button to jump back.
6. Use the **bottom nav** to explore:
   - **Search** — full-text search across all notes
   - **Stats** — weekly activity dashboard
   - **Library** — all your saved videos

---

## Folder Structure

```
learnsync/
├── manifest.json              # Extension manifest (V3)
│
├── popup/
│   ├── popup.html             # Main popup UI
│   ├── popup.css              # Popup styles
│   └── popup.js               # Popup logic
│
├── content/
│   └── youtube.js             # Content script: video detection & timestamp seek
│
├── background/
│   └── background.js          # Service worker
│
├── pages/
│   ├── dashboard/             # Stats dashboard
│   ├── library/               # Video library + note detail
│   ├── search/                # Full-text search
│   └── settings/              # Theme, backup, clear data
│
├── storage/
│   └── storage-manager.js     # Unified Chrome Storage API wrapper
│
├── exports/
│   ├── export-txt.js          # Plain text export
│   ├── export-md.js           # Markdown export
│   └── export-pdf.js          # PDF export (jsPDF)
│
├── utils/
│   ├── time.js                # secondsToLabel, relativeTime, generateId
│   ├── format.js              # escapeHtml, highlight, showToast, applyTheme
│   └── constants.js           # App-wide constants
│
└── assets/
    └── shared.css             # Design system CSS variables + shared components
```

---

## Tech Stack

- **Manifest V3** Chrome Extension
- **HTML5 / CSS3 / Vanilla JavaScript (ES6+)**
- **Chrome Storage API** — persistent local storage
- **Chrome Tabs API** — active tab detection
- **Chrome Scripting API** — content script injection
- **jsPDF** (CDN, loaded on demand) — PDF export



## Data Model

```json
{
  "id": "note_abc123",
  "videoId": "dQw4w9WgXcQ",
  "videoTitle": "Advanced React Patterns",
  "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  "timestamp": 754,
  "timestampLabel": "12:34",
  "note": "Binary Search starts here",
  "tags": [],
  "createdAt": 1784520000000
}
```

All notes are stored under the key `learnsync_notes` in `chrome.storage.local`.

---

## Privacy

- All data stays **100% local** on your device.
- No accounts, no servers, no telemetry, no analytics.

---
