/**
 * Content Script
 *
 * Runs in the context of web pages. Can access and manipulate the DOM,
 * but has limited access to Chrome APIs. Communicates with the background
 * script via message passing.
 */

console.log('Content script loaded');

// Listen for messages from the popup (chrome.tabs.sendMessage). Only this extension
// can message its content scripts, but the page itself is untrusted: read the DOM,
// never eval or inject what it contains.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.type) {
    case 'CAPTURE':
      sendResponse({ success: true, data: capturePageData() });
      break;

    case 'PING':
      sendResponse({ pong: true });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

/**
 * Capture data from the current page
 */
function capturePageData() {
  return {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString(),
    // Add your custom data capture logic here
    // Example: Extract specific elements from the page
    // const elements = document.querySelectorAll('[data-id]');
    // ...
  };
}

// Example: send data to the background script automatically on specific pages.
// Uncomment and modify as needed
/*
if (window.location.hostname.includes('example.com')) {
  chrome.runtime.sendMessage({ type: 'DATA_CAPTURED', payload: capturePageData() }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
      return;
    }
    console.log('Background response:', response);
  });
}
*/

export {};
