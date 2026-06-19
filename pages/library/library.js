/**
 * LearnSync — Library Page
 */
'use strict';

let allLibrary = [];
let currentVideoEntry = null;

async function initLibrary() {
  const settings = await StorageManager.getSettings();
  applyTheme(settings);

  allLibrary = await StorageManager.getVideoLibrary();

  const params = new URLSearchParams(window.location.search);
  const focusVideo = params.get('video');

  if (focusVideo) {
    const entry = allLibrary.find(v => v.videoId === focusVideo);
    if (entry) { openVideoDetail(entry); return; }
  }

  renderLibrary(allLibrary);
  setupFilterSort();

  document.getElementById('btn-back').addEventListener('click', closeVideoDetail);
  document.getElementById('btn-export-video').addEventListener('click', () => {
    document.getElementById('export-modal').classList.remove('hidden');
  });
  document.getElementById('close-export-modal').addEventListener('click', () => {
    document.getElementById('export-modal').classList.add('hidden');
  });

  // Export buttons
  document.getElementById('exp-txt').addEventListener('click', () => {
    if (currentVideoEntry) ExportTxt.exportVideo(currentVideoEntry);
    document.getElementById('export-modal').classList.add('hidden');
  });
  document.getElementById('exp-md').addEventListener('click', () => {
    if (currentVideoEntry) ExportMd.exportVideo(currentVideoEntry);
    document.getElementById('export-modal').classList.add('hidden');
  });
  document.getElementById('exp-pdf').addEventListener('click', () => {
    if (currentVideoEntry) ExportPdf.exportVideo(currentVideoEntry);
    document.getElementById('export-modal').classList.add('hidden');
  });
}

/* ─── Library Grid ─── */

function renderLibrary(library) {
  const grid = document.getElementById('lib-grid');
  const empty = document.getElementById('lib-empty');
  const count = document.getElementById('lib-count');

  count.textContent = `${library.length} video${library.length !== 1 ? 's' : ''} with notes`;

  if (library.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = library.map(v => `
    <div class="lib-card" data-video-id="${escapeHtml(v.videoId)}">
      <div class="lib-thumb">
        <img src="${escapeHtml(v.thumbnail)}" alt="" loading="lazy" />
        <div class="lib-thumb-overlay"></div>
        <div class="lib-notes-count">${v.notes.length} notes</div>
      </div>
      <div class="lib-info">
        <div class="lib-title" title="${escapeHtml(v.videoTitle)}">${escapeHtml(v.videoTitle)}</div>
        <div class="lib-meta">
          <span class="lib-date">${relativeTime(v.lastUpdated)}</span>
          <span class="lib-tag">${v.notes.length} note${v.notes.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.lib-card').forEach(card => {
    card.addEventListener('click', () => {
      const vid = card.dataset.videoId;
      const entry = allLibrary.find(v => v.videoId === vid);
      if (entry) openVideoDetail(entry);
    });
  });
}

/* ─── Filter / Sort ─── */

function setupFilterSort() {
  const filterInput = document.getElementById('lib-filter');
  const sortSelect  = document.getElementById('lib-sort');

  function applyFilter() {
    const q = filterInput.value.toLowerCase().trim();
    const sort = sortSelect.value;

    let filtered = q
      ? allLibrary.filter(v => v.videoTitle.toLowerCase().includes(q))
      : [...allLibrary];

    if (sort === 'notes') filtered.sort((a, b) => b.notes.length - a.notes.length);
    else if (sort === 'alpha') filtered.sort((a, b) => a.videoTitle.localeCompare(b.videoTitle));

    renderLibrary(filtered);
  }

  filterInput.addEventListener('input', applyFilter);
  sortSelect.addEventListener('change', applyFilter);
}

/* ─── Video Detail ─── */

function openVideoDetail(entry) {
  currentVideoEntry = entry;
  document.getElementById('view-library').classList.add('hidden');
  document.getElementById('view-video').classList.remove('hidden');
  renderVideoDetail(entry);
}

function closeVideoDetail() {
  currentVideoEntry = null;
  document.getElementById('view-library').classList.remove('hidden');
  document.getElementById('view-video').classList.add('hidden');
}

function renderVideoDetail(entry) {
  const header = document.getElementById('video-detail-header');
  header.innerHTML = `
    <img class="detail-thumb" src="${escapeHtml(entry.thumbnail)}" alt="" />
    <div class="detail-info">
      <h2>${escapeHtml(entry.videoTitle)}</h2>
      <p>${entry.notes.length} note${entry.notes.length !== 1 ? 's' : ''} · Last updated ${relativeTime(entry.lastUpdated)}</p>
      <a href="https://www.youtube.com/watch?v=${escapeHtml(entry.videoId)}" target="_blank" class="btn-ghost" style="text-decoration:none;margin-top:8px;display:inline-flex;">
        <span class="material-symbols-outlined">open_in_new</span> Open on YouTube
      </a>
    </div>
  `;

  renderDetailNotes(entry.notes);
}

function renderDetailNotes(notes) {
  const container = document.getElementById('video-detail-notes');
  if (notes.length === 0) {
    container.innerHTML = '<p style="color:var(--on-surface-variant);padding:var(--space-md) 0;">No notes for this video.</p>';
    return;
  }

  container.innerHTML = notes.map(n => `
    <div class="detail-note-card" data-id="${escapeHtml(n.id)}">
      <div class="detail-note-top">
        <div class="timestamp-badge timestamp-mono">${escapeHtml(n.timestampLabel)}</div>
        <div class="detail-note-actions">
          <button class="jump-ts" title="Open at this timestamp" data-ts="${n.timestamp}" data-vid="${escapeHtml(n.videoId)}">
            <span class="material-symbols-outlined">open_in_new</span>
          </button>
          <button class="del del-note" data-id="${escapeHtml(n.id)}" title="Delete note">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
      <p class="detail-note-text">${escapeHtml(n.note)}</p>
      <div class="detail-note-footer">
        <span class="detail-note-date">${formatDate(n.createdAt)}</span>
      </div>
    </div>
  `).join('');

  // Jump to timestamp
  container.querySelectorAll('.jump-ts').forEach(btn => {
    btn.addEventListener('click', () => {
      const ts = parseFloat(btn.dataset.ts);
      const vid = btn.dataset.vid;
      window.open(`https://www.youtube.com/watch?v=${vid}&t=${Math.floor(ts)}s`, '_blank');
    });
  });

  // Delete note
  container.querySelectorAll('.del-note').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const card = btn.closest('.detail-note-card');
      await StorageManager.deleteNote(id);
      card.style.opacity = '0';
      card.style.transition = 'opacity 0.2s';
      setTimeout(() => card.remove(), 200);
      // Update current entry
      currentVideoEntry.notes = currentVideoEntry.notes.filter(n => n.id !== id);
      showToast('Note deleted');
    });
  });
}

document.addEventListener('DOMContentLoaded', initLibrary);
