// Background script for the NutriProof Chrome Extension
const API_URL = 'http://localhost:5001/api/fact-check';

// Create a context menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed, creating context menu');
  chrome.contextMenus.create({
    id: 'fact-check',
    title: 'Check with NutriProof',
    contexts: ['selection']
  });
});

// Listen for clicks on the context menu item
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked', info.menuItemId);
  if (info.menuItemId === 'fact-check' && info.selectionText) {
    console.log('Selected text:', info.selectionText);
    
    // Store the selected text to be accessed by the popup
    chrome.storage.local.set({ 
      selectedText: info.selectionText, 
      processing: true, 
      results: null, 
      error: null 
    }, () => {
      console.log('Data saved to storage');
      
      // Open the popup first
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 600,
        height: 600
      }, () => {
        // Then send the API request
        console.log('Sending request to API:', API_URL);
        fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: info.selectionText })
        })
        .then(response => {
          console.log('API response received:', response.status);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Data received from API:', data);
          // Store the results
          chrome.storage.local.set({ processing: false, results: data, error: null });
        })
        .catch(error => {
          console.error('API Error:', error);
          chrome.storage.local.set({ processing: false, results: null, error: error.toString() });
        });
      });
    });
  }
}); 