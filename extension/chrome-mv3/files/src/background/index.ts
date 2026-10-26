/**
 * Background Service Worker
 *
 * Handles extension events, manages state, and coordinates between
 * content scripts and the popup.
 */

import { isAllowedSender, parseMessage } from '../shared/messages';

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

// Listen for messages from content scripts or popup. Unknown messages and messages
// from senders not allowed to send them (see src/shared/messages.ts) are refused.
chrome.runtime.onMessage.addListener((raw, sender, sendResponse) => {
  const message = parseMessage(raw);
  if (!message) {
    sendResponse({ error: 'Unknown message type' });
    return;
  }
  if (!isAllowedSender(message, sender, chrome.runtime.id)) {
    sendResponse({ error: 'Sender not allowed' });
    return;
  }

  switch (message.type) {
    case 'GET_STATUS':
      chrome.storage.local.get(['enabled'], (result) => {
        sendResponse({ enabled: result.enabled ?? true });
      });
      return true; // Keep channel open for async response

    case 'TOGGLE_ENABLED':
      chrome.storage.local.get(['enabled'], (result) => {
        const newEnabled = !(result.enabled ?? true);
        chrome.storage.local.set({ enabled: newEnabled }, () => {
          sendResponse({ enabled: newEnabled });
        });
      });
      return true;

    case 'DATA_CAPTURED':
      // Handle data captured from content script
      chrome.storage.local.set({ lastCapture: message.payload }, () => {
        sendResponse({ status: 'stored' });
      });
      return true;
  }
});

export {};
