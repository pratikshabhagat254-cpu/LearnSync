/**
 * LearnSync — Dashboard Page
 */
'use strict';

async function initDashboard() {
  const settings = await StorageManager.getSettings();
  applyTheme(settings);

  const [stats, library] = await Promise.all([
    StorageManager.getStats(),
    StorageManager.getVideoLibrary(),
  ]);

  renderStats(stats);
  renderActivityChart(stats.weekly);
  renderRecentVideos(library);
}

/* ─── Stats Cards ─── */

function renderStats(stats) {
  const grid = document.getElementById('stats-grid');
  const cards = [
    {
      label: 'Videos Studied',
      value: stats.totalVideos,
      icon: 'play_circle',
      colorClass: 'stat-purple',
      sub: 'unique videos',
    },
    {
      label: 'Notes Created',
      value: stats.totalNotes,
      icon: 'edit_note',
      colorClass: 'stat-blue',
      sub: 'captured moments',
    },
    {
      label: 'Learning Hours',
      value: stats.learningHours,
      icon: 'schedule',
      colorClass: 'stat-green',
      sub: 'tracked watch time',
    },
    {
      label: 'This Week',
      value: Object.values(stats.weekly).reduce((a, b) => a + b, 0),
      icon: 'local_fire_department',
      colorClass: 'stat-amber',
      sub: 'notes this week',
    },
  ];

  grid.innerHTML = cards.map(c => `
    <div class="stat-card ${c.colorClass} animate-in">
      <div class="stat-icon">
        <span class="material-symbols-outlined fill-icon">${c.icon}</span>
      </div>
      <div class="stat-value">${c.value}</div>
      <div class="stat-label">${c.label}</div>
      <div class="stat-sub">${c.sub}</div>
    </div>
  `).join('');
}

/* ─── Activity Chart ─── */

function renderActivityChart(weekly) {
  const chart = document.getElementById('activity-chart');
  const todayLabel = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
  const maxVal = Math.max(...Object.values(weekly), 1);

  chart.innerHTML = Object.entries(weekly).map(([day, count]) => {
    const pct = Math.round((count / maxVal) * 100);
    const isToday = day === todayLabel;
    return `
      <div class="bar-wrap">
        <div class="bar-count">${count || ''}</div>
        <div class="bar-track">
          <div class="bar-fill ${isToday ? 'today' : ''}" style="height:${pct}%"></div>
        </div>
        <div class="bar-label">${day}</div>
      </div>
    `;
  }).join('');
}

/* ─── Recent Videos ─── */

function renderRecentVideos(library) {
  const container = document.getElementById('recent-videos');
  const empty = document.getElementById('empty-dash');

  if (library.length === 0) {
    container.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  const recent = library.slice(0, 6);
  container.innerHTML = recent.map(v => `
    <a class="recent-video-card animate-in"
       href="../library/library.html?video=${encodeURIComponent(v.videoId)}"
       title="${escapeHtml(v.videoTitle)}">
      <div class="recent-thumb-wrap">
        <img src="${escapeHtml(v.thumbnail)}" alt="" loading="lazy" />
      </div>
      <div class="recent-video-info">
        <div class="recent-video-title">${escapeHtml(v.videoTitle)}</div>
        <div class="recent-video-meta">
          <span class="note-count-badge">${v.notes.length} note${v.notes.length !== 1 ? 's' : ''}</span>
          <span class="recent-video-date">${relativeTime(v.lastUpdated)}</span>
        </div>
      </div>
    </a>
  `).join('');
}

document.addEventListener('DOMContentLoaded', initDashboard);
