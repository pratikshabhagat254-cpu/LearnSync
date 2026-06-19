/**
 * LearnSync — Popup Script
 * Handles all popup UI interactions:
 *   - YouTube video detection
 *   - Note creation / display
 *   - Timestamp jumping
 *   - Navigation to full pages
 */

'use strict';

/* ─── State ─── */
let currentVideo = null;
let currentNotes  = [];

/* ─── DOM References ─── */
const $ = id => document.getElementById(id);
const stateNoVideo    = $('state-no-video');
const stateVideo      = $('state-video');
const videoThumb      = $('video-thumb');
const videoTitle      = $('video-title');
const videoTime       = $('video-time');
const progressPct     = $('video-progress-pct');
const progressBar     = $('progress-bar');
const captureTs       = $('capture-ts');
const noteInput       = $('note-input');
const btnSave         = $('btn-save');
const notesList       = $('notes-list');
const notesEmpty      = $('notes-empty');
const liveBadge       = $('live-badge');

/* ─── Init ─── */

async function init() {
  // Apply theme
  const settings = await StorageManager.getSettings();
  applyTheme(settings);

  // Detect YouTube tab
  await detectYouTube();

  // Wire nav buttons
  $('btn-settings').addEventListener('click', () => openPage('pages/settings/settings.html'));
  $('btn-search').addEventListener('click', () => openPage('pages/search/search.html'));
  $('btn-view-all').addEventListener('click', () => openPage('pages/library/library.html'));
  $('nav-search').addEventListener('click', () => openPage('pages/search/search.html'));
  $('nav-dashboard').addEventListener('click', () => openPage('pages/dashboard/dashboard.html'));
  $('nav-library').addEventListener('click', () => openPage('pages/library/library.html'));

  // Save note
  btnSave.addEventListener('click', saveNote);

  // Auto-grow textarea
  noteInput.addEventListener('input', () => {
    noteInput.style.height = 'auto';
    noteInput.style.height = noteInput.scrollHeight + 'px';
  });

  // Ctrl+Enter to save
  noteInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveNote();
  });
}

/* ─── YouTube Detection ─── */

async function detectYouTube() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.includes('youtube.com/watch')) {
      showNoVideoState();
      return;
    }

    // Ensure content script is injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/youtube.js'],
      });
    } catch (_) { /* already injected */ }

    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_DATA' });

    if (response && response.success && response.data && response.data.videoId) {
      currentVideo = response.data;
      showVideoState();
      renderVideoCard();
      await loadNotes();
    } else {
      showNoVideoState();
    }
  } catch (err) {
    console.warn('[LearnSync] Detection error:', err);
    showNoVideoState();
  }
}

/* ─── UI State Toggles ─── */

function showNoVideoState() {
  stateNoVideo.classList.remove('hidden');
  stateVideo.classList.add('hidden');
}

function showVideoState() {
  stateNoVideo.classList.add('hidden');
  stateVideo.classList.remove('hidden');
}

/* ─── Video Card ─── */

function renderVideoCard() {
  if (!currentVideo) return;
  const { videoTitle: title, thumbnail, currentTime, duration } = currentVideo;

  videoThumb.src = thumbnail || '';
  videoTitle.textContent = title || 'YouTube Video';
  videoTitle.title = title;

  const pct = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  videoTime.textContent = `${secondsToLabel(currentTime)} / ${secondsToLabel(duration)}`;
  progressPct.textContent = `${pct}% Complete`;
  progressBar.style.width = `${pct}%`;
  captureTs.textContent = secondsToLabel(currentTime);

  if (!duration || duration === Infinity) {
    liveBadge.classList.remove('hidden');
  }
}

/* ─── Notes ─── */

async function loadNotes() {
  if (!currentVideo) return;
  currentNotes = await StorageManager.getNotesByVideo(currentVideo.videoId);
  renderNotesList();
}

function renderNotesList() {
  notesList.innerHTML = '';

  if (currentNotes.length === 0) {
    notesEmpty.classList.remove('hidden');
    return;
  }
  notesEmpty.classList.add('hidden');

  // Show max 5 in popup; rest in library
  const toShow = currentNotes.slice(0, 5);
  toShow.forEach(note => notesList.appendChild(createNoteCard(note)));
}

function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = 'note-card';
  card.dataset.id = note.id;
  card.innerHTML = `
    <div class="note-card-top">
      <div class="timestamp-badge timestamp-mono">${escapeHtml(note.timestampLabel)}</div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span class="note-date">${relativeTime(note.createdAt)}</span>
        <div class="note-card-actions">
          <button class="jump-btn" title="Jump to timestamp">
            <span class="material-symbols-outlined">play_arrow</span>
          </button>
          <button class="delete delete-btn" title="Delete note">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    </div>
    <p class="note-text">${escapeHtml(note.note)}</p>
  `;

  // Jump on timestamp click
  card.querySelector('.jump-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    jumpToTimestamp(note.timestamp);
  });

  // Delete
  card.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteNote(note.id, card);
  });

  // Jump on card click too
  card.addEventListener('click', () => jumpToTimestamp(note.timestamp));

  return card;
}

async function saveNote() {
  const text = noteInput.value.trim();
  if (!text) {
    showToast('Please enter a note', 'error');
    noteInput.focus();
    return;
  }
  if (!currentVideo) {
    showToast('No active video', 'error');
    return;
  }

  // Re-fetch timestamp at save time for accuracy
  let timestamp = currentVideo.currentTime;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_DATA' });
      if (res && res.data) timestamp = res.data.currentTime;
    }
  } catch (_) {}

  const note = {
    id: generateId(),
    videoId: currentVideo.videoId,
    videoTitle: currentVideo.videoTitle,
    thumbnail: currentVideo.thumbnail,
    timestamp,
    timestampLabel: secondsToLabel(timestamp),
    note: text,
    tags: [],
    createdAt: Date.now(),
  };

  try {
    await StorageManager.saveNote(note);
    noteInput.value = '';
    noteInput.style.height = 'auto';
    showToast('Note saved!');
    await loadNotes();
  } catch (err) {
    console.error('[LearnSync] Save error:', err);
    showToast('Failed to save note', 'error');
  }
}

async function deleteNote(id, cardEl) {
  try {
    await StorageManager.deleteNote(id);
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'scale(0.95)';
    cardEl.style.transition = 'all 0.2s ease';
    setTimeout(() => {
      cardEl.remove();
      currentNotes = currentNotes.filter(n => n.id !== id);
      if (currentNotes.length === 0) notesEmpty.classList.remove('hidden');
    }, 200);
    showToast('Note deleted');
  } catch (err) {
    showToast('Failed to delete note', 'error');
  }
}

/* ─── Timestamp Jump ─── */

async function jumpToTimestamp(seconds) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    await chrome.tabs.sendMessage(tab.id, { type: 'JUMP_TO_TIMESTAMP', timestamp: seconds });
    showToast(`Jumped to ${secondsToLabel(seconds)}`);
  } catch (err) {
    showToast('Could not seek video', 'error');
  }
}

/* ─── Navigation ─── */

function openPage(path) {
  const url = chrome.runtime.getURL(path);
  chrome.tabs.create({ url });
}

/* ─── Start ─── */
document.addEventListener('DOMContentLoaded', init);
