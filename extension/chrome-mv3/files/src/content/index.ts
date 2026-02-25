/**
 * Content Script
 *
 * Runs in the context of web pages. Can access and manipulate the DOM,
 * but has limited access to Chrome APIs. Communicates with the background
 * script via message passing.
 */

console.log('Content script loaded');

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  switch (message.type) {
    case 'CAPTURE':
      const data = capturePageData();
      sendResponse({ success: true, data });
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

/**
 * Send data to the background script
 */
function sendToBackground(type: string, payload: unknown) {
  chrome.runtime.sendMessage({ type, payload }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
      return;
    }
    console.log('Background response:', response);
  });
}

// Example: Automatically capture data on specific pages
// Uncomment and modify as needed
/*
if (window.location.hostname.includes('example.com')) {
  const data = capturePageData();
  sendToBackground('DATA_CAPTURED', data);
}
*/

export {};
