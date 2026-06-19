/**
 * LearnSync Content Script — youtube.js
 * Injected into all YouTube pages. Handles:
 *   - Video metadata extraction
 *   - Timestamp seeking
 *   - Communication with popup via chrome.runtime messages
 */

(function () {
  'use strict';

  function getVideoId() {
    const url = new URL(window.location.href);
    return url.searchParams.get('v') || null;
  }

  function getVideoElement() {
    return document.querySelector('video.html5-main-video') ||
           document.querySelector('video');
  }

  function getVideoTitle() {
    // Try multiple selectors as YouTube's DOM can vary
    const selectors = [
      'h1.ytd-video-primary-info-renderer yt-formatted-string',
      'ytd-video-primary-info-renderer h1 .yt-formatted-string',
      '#title h1 yt-formatted-string',
      'h1.title',
      '#title',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return document.title.replace(' - YouTube', '').trim() || 'YouTube Video';
  }

  function getThumbnail(videoId) {
    if (!videoId) return '';
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }

  //Main Data Getter 

  function getVideoData() {
    const videoId = getVideoId();
    const video = getVideoElement();
    const title = getVideoTitle();

    if (!videoId || !video) return null;

    return {
      videoId,
      videoTitle: title,
      thumbnail: getThumbnail(videoId),
      currentTime: video.currentTime || 0,
      duration: video.duration || 0,
    };
  }

  // Timestamp Jump 

  function jumpToTimestamp(seconds) {
    const video = getVideoElement();
    if (!video) return false;
    video.currentTime = seconds;
    // Resume if paused
    if (video.paused) video.play().catch(() => {});
    return true;
  }

  // Message Listener 

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'GET_VIDEO_DATA') {
      sendResponse({ success: true, data: getVideoData() });
      return true;
    }

    if (msg.type === 'JUMP_TO_TIMESTAMP') {
      const ok = jumpToTimestamp(msg.timestamp);
      sendResponse({ success: ok });
      return true;
    }
  });

})();
