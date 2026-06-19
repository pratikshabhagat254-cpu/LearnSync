/**
 * LearnSync Background Service Worker
 */

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('[LearnSync] Extension installed.');
  }
});

// Open full-page views when messages request them
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'OPEN_PAGE') {
    chrome.tabs.create({ url: chrome.runtime.getURL(msg.url) });
    sendResponse({ success: true });
  }
  return true;
});
