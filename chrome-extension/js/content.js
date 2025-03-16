// Content script for the NutriProof Chrome Extension
// This script runs on the web page and can interact with the DOM

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    // Get the currently selected text on the page
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText });
  }
  return true;
}); 