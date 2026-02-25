/**
 * Background Service Worker
 *
 * Handles extension events, manages state, and coordinates between
 * content scripts and the popup.
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Initialize default settings
    chrome.storage.local.set({
      enabled: true,
      settings: {},
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message, 'from:', sender);

  switch (message.type) {
    case 'GET_STATUS':
      chrome.storage.local.get(['enabled'], (result) => {
        sendResponse({ enabled: result.enabled ?? true });
      });
      return true; // Keep channel open for async response

    case 'TOGGLE_ENABLED':
      chrome.storage.local.get(['enabled'], (result) => {
        const newEnabled = !result.enabled;
        chrome.storage.local.set({ enabled: newEnabled }, () => {
          sendResponse({ enabled: newEnabled });
        });
      });
      return true;

    case 'DATA_CAPTURED':
      // Handle data captured from content script
      console.log('Data captured:', message.payload);
      chrome.storage.local.set({ lastCapture: message.payload }, () => {
        sendResponse({ status: 'stored' });
      });
      return true;

    default:
      console.log('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// Listen for tab updates (optional - for URL-based functionality)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Perform actions when a page finishes loading
    console.log('Tab updated:', tab.url);
  }
});

export {};
