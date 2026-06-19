/**
 * LearnSync — Search Page
 */
'use strict';

let searchTimeout = null;

async function initSearch() {
  const settings = await StorageManager.getSettings();
  applyTheme(settings);

  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearBtn.classList.toggle('hidden', !q);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => doSearch(q), 80); // debounce 80ms
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.add('hidden');
    showIdle();
    input.focus();
  });

  // Check URL param
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) { input.value = q; doSearch(q); }
}

function showIdle() {
  document.getElementById('search-idle').classList.remove('hidden');
  document.getElementById('search-empty').classList.add('hidden');
  document.getElementById('results-list').innerHTML = '';
  document.getElementById('results-header').style.display = 'none';
}

async function doSearch(query) {
  if (!query) { showIdle(); return; }

  const results = await StorageManager.searchNotes(query);

  document.getElementById('search-idle').classList.add('hidden');
  document.getElementById('results-header').style.display = 'flex';
  document.getElementById('result-count').textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
  document.getElementById('result-query').textContent = `for "${query}"`;

  if (results.length === 0) {
    document.getElementById('search-empty').classList.remove('hidden');
    document.getElementById('results-list').innerHTML = '';
    return;
  }

  document.getElementById('search-empty').classList.add('hidden');
  renderResults(results, query);
}

function renderResults(results, query) {
  const list = document.getElementById('results-list');
  list.innerHTML = results.map(n => `
    <a class="result-card"
       href="https://www.youtube.com/watch?v=${escapeHtml(n.videoId)}&t=${Math.floor(n.timestamp)}s"
       target="_blank"
       title="Open YouTube at ${escapeHtml(n.timestampLabel)}">
      <div class="result-card-top">
        <div class="result-video-info">
          <img class="result-video-thumb" src="${escapeHtml(n.thumbnail)}" alt="" loading="lazy" />
          <span class="result-video-title">${highlight(n.videoTitle, query)}</span>
        </div>
        <div class="timestamp-badge timestamp-mono">${escapeHtml(n.timestampLabel)}</div>
      </div>
      <p class="result-note-text">${highlight(n.note, query)}</p>
      <p class="result-note-date">${relativeTime(n.createdAt)}</p>
    </a>
  `).join('');
}

document.addEventListener('DOMContentLoaded', initSearch);
