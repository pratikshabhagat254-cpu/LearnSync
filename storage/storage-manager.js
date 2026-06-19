/**
 * LearnSync Storage Manager
 * Unified interface for all Chrome Storage operations.
 */

const STORAGE_KEY = 'learnsync_notes';
const SETTINGS_KEY = 'learnsync_settings';

const StorageManager = {

  /* ──────────────────── Core Read / Write ──────────────────── */

  async _getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const data = result[STORAGE_KEY] || { notes: [] };
        resolve(data);
      });
    });
  },

  async _setData(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(true);
      });
    });
  },

  /* ──────────────────── Notes CRUD ──────────────────── */

  async saveNote(note) {
    const data = await this._getData();
    data.notes.unshift(note); // newest first
    await this._setData(data);
    return note;
  },

  async getAllNotes() {
    const data = await this._getData();
    return data.notes || [];
  },

  async getNotesByVideo(videoId) {
    const notes = await this.getAllNotes();
    return notes
      .filter(n => n.videoId === videoId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  async getNoteById(id) {
    const notes = await this.getAllNotes();
    return notes.find(n => n.id === id) || null;
  },

  async updateNote(id, updates) {
    const data = await this._getData();
    const idx = data.notes.findIndex(n => n.id === id);
    if (idx === -1) throw new Error('Note not found');
    data.notes[idx] = { ...data.notes[idx], ...updates, updatedAt: Date.now() };
    await this._setData(data);
    return data.notes[idx];
  },

  async deleteNote(id) {
    const data = await this._getData();
    data.notes = data.notes.filter(n => n.id !== id);
    await this._setData(data);
    return true;
  },

  /* ──────────────────── Search ──────────────────── */

  async searchNotes(query) {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    const notes = await this.getAllNotes();
    return notes.filter(n =>
      (n.note && n.note.toLowerCase().includes(q)) ||
      (n.videoTitle && n.videoTitle.toLowerCase().includes(q))
    );
  },

  /* ──────────────────── Library / Grouping ──────────────────── */

  async getVideoLibrary() {
    const notes = await this.getAllNotes();
    const map = new Map();
    for (const note of notes) {
      if (!map.has(note.videoId)) {
        map.set(note.videoId, {
          videoId: note.videoId,
          videoTitle: note.videoTitle,
          thumbnail: note.thumbnail,
          notes: [],
          lastUpdated: note.createdAt,
        });
      }
      const entry = map.get(note.videoId);
      entry.notes.push(note);
      if (note.createdAt > entry.lastUpdated) entry.lastUpdated = note.createdAt;
    }
    return Array.from(map.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  },

  /* ──────────────────── Statistics ──────────────────── */

  async getStats() {
    const notes = await this.getAllNotes();
    const videoIds = new Set(notes.map(n => n.videoId));

    // Learning hours: max timestamp per video summed
    const maxTs = new Map();
    for (const n of notes) {
      maxTs.set(n.videoId, Math.max(maxTs.get(n.videoId) || 0, n.timestamp || 0));
    }
    const totalSeconds = Array.from(maxTs.values()).reduce((a, b) => a + b, 0);
    const learningHours = (totalSeconds / 3600).toFixed(1);

    // Weekly activity (last 7 days)
    const weekly = {};
    const now = Date.now();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      weekly[days[d.getDay()]] = 0;
    }
    for (const note of notes) {
      const d = new Date(note.createdAt);
      if (now - note.createdAt <= 7 * 86400000) {
        weekly[days[d.getDay()]] = (weekly[days[d.getDay()]] || 0) + 1;
      }
    }

    return {
      totalNotes: notes.length,
      totalVideos: videoIds.size,
      learningHours: parseFloat(learningHours),
      weekly,
    };
  },

  /* ──────────────────── Settings ──────────────────── */

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([SETTINGS_KEY], (res) => {
        resolve(res[SETTINGS_KEY] || { theme: 'light' });
      });
    });
  },

  async saveSettings(settings) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(true);
      });
    });
  },

  /* ──────────────────── Backup / Restore ──────────────────── */

  async exportBackup() {
    const data = await this._getData();
    const settings = await this.getSettings();
    return JSON.stringify({ ...data, settings, exportedAt: Date.now(), version: '1.0' }, null, 2);
  },

  async importBackup(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.notes || !Array.isArray(parsed.notes)) {
      throw new Error('Invalid backup file: missing notes array');
    }
    await this._setData({ notes: parsed.notes });
    if (parsed.settings) await this.saveSettings(parsed.settings);
    return parsed.notes.length;
  },

  async clearAll() {
    await this._setData({ notes: [] });
    return true;
  },
};

// Export for use in extension pages and popup
if (typeof module !== 'undefined') module.exports = StorageManager;
