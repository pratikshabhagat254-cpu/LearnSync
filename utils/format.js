/**
 * LearnSync — Formatting Utilities
 */

/**
 * Truncate text to a max length with ellipsis
 */
function truncate(text, max = 80) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/**
 * Escape HTML special chars for safe DOM insertion
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Highlight search query matches in text
 */
function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'success', duration = 2500) {
  let toast = document.getElementById('ls-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ls-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type}`;
  toast.textContent = message;
  // Force reflow
  toast.getBoundingClientRect();
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), duration);
}

/**
 * Apply saved theme to document
 */
function applyTheme(settings) {
  const theme = settings?.theme || 'light';
  const useDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', useDark);
}
