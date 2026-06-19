/**
 * LearnSync — Constants
 */
const LEARNSYNC = {
  VERSION: '1.0.0',
  STORAGE_KEY: 'learnsync_notes',
  SETTINGS_KEY: 'learnsync_settings',
  PAGES: {
    DASHBOARD:  chrome.runtime.getURL('pages/dashboard/dashboard.html'),
    LIBRARY:    chrome.runtime.getURL('pages/library/library.html'),
    SEARCH:     chrome.runtime.getURL('pages/search/search.html'),
    SETTINGS:   chrome.runtime.getURL('pages/settings/settings.html'),
  },
};
