/**
 * LearnSync — Settings Page
 */
'use strict';

let currentSettings = { theme: 'system' };

async function initSettings() {
  currentSettings = await StorageManager.getSettings();
  applyTheme(currentSettings);

  // Theme radio
  const radios = document.querySelectorAll('input[name="theme"]');
  radios.forEach(r => {
    if (r.value === currentSettings.theme) r.checked = true;
    r.addEventListener('change', async () => {
      currentSettings.theme = r.value;
      await StorageManager.saveSettings(currentSettings);
      applyTheme(currentSettings);
      showToast('Theme updated');
    });
  });

  // Backup
  document.getElementById('btn-backup').addEventListener('click', async () => {
    const json = await StorageManager.exportBackup();
    downloadText(json, `learnsync-backup-${Date.now()}.json`, 'application/json');
    showToast('Backup downloaded!');
  });

  // Restore
  document.getElementById('restore-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await StorageManager.importBackup(text);
      showToast(`Restored ${count} notes`);
    } catch (err) {
      showToast('Invalid backup file', 'error');
    }
    e.target.value = '';
  });

  // Export all TXT
  document.getElementById('btn-export-all').addEventListener('click', async () => {
    const library = await StorageManager.getVideoLibrary();
    ExportTxt.exportAll(library);
    showToast('Exported all notes!');
  });

  // Clear All
  const modal = document.getElementById('confirm-modal');
  document.getElementById('btn-clear').addEventListener('click', () => modal.classList.remove('hidden'));
  document.getElementById('confirm-cancel').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('confirm-delete').addEventListener('click', async () => {
    await StorageManager.clearAll();
    modal.classList.add('hidden');
    showToast('All data cleared');
    renderAboutStats();
  });

  renderAboutStats();
}

async function renderAboutStats() {
  const stats = await StorageManager.getStats();
  document.getElementById('about-stats').innerHTML = `
    <div class="about-stat">
      <div class="about-stat-value">${stats.totalNotes}</div>
      <div class="about-stat-label">Notes</div>
    </div>
    <div class="about-stat">
      <div class="about-stat-value">${stats.totalVideos}</div>
      <div class="about-stat-label">Videos</div>
    </div>
    <div class="about-stat">
      <div class="about-stat-value">${stats.learningHours}h</div>
      <div class="about-stat-label">Learned</div>
    </div>
  `;
}

function downloadText(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', initSettings);
