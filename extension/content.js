(function injectStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('styles.css');
    document.head.appendChild(link);
  })();
  
function getHighlightedText() {
    const selection = window.getSelection();
    return selection 
        ? selection.toString().trim() 
        : "";
}
  

async function loadTemplate(templateName) {
    const url = chrome.runtime.getURL(`templates/${templateName}.html`);
    const response = await fetch(url);
    const html = await response.text();
    
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.cloneNode(true);
}
  
async function displayResults(results) {
    removeExistingResults();
    
    // Load the main template
    const templateFragment = await loadTemplate('fact-checker');
    const container = templateFragment.querySelector('.fact-checker-container');
    const resultsBody = container.querySelector('.fact-checker-body');
    
    // Add click event for close button
    const closeButton = container.querySelector('.fact-checker-close');
    closeButton.addEventListener('click', () => container.remove());
    
    // Handle empty results
    if (!results || results.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'fact-checker-empty';
      emptyMessage.textContent = 'No verifiable health or nutrition claims were found.';
      resultsBody.appendChild(emptyMessage);
    } else {
        for (const result of results) {
            const resultElement = await createResultItem(result);
            resultsBody.appendChild(resultElement);
        }
    }
    
    document.body.appendChild(container);
    
    // Add escape key listener
    document.addEventListener('keydown', handleEscKeyPress);
  }
  

async function createResultItem(result) {
    const templateFragment = await loadTemplate('result-item');
    const item = templateFragment.querySelector('.fact-checker-item');
    
    // Determine verification status and style accordingly
    const statusText = result.verification || 'Unknown';
    let statusClass = 'fact-checker-unknown';
    
    if (statusText.toLowerCase().includes('true')) {
      statusClass = 'fact-checker-true';
    } else if (statusText.toLowerCase().includes('false')) {
      statusClass = 'fact-checker-false';
    } else if (statusText.toLowerCase().includes('partial') || 
               statusText.toLowerCase().includes('approximately')) {
      statusClass = 'fact-checker-partially-true';
    }
    
    item.classList.add(statusClass);
    
    // Set claim text
    item.querySelector('.fact-checker-claim')
        .textContent = result.claim;
    
    // Set verification status
    item.querySelector('.fact-checker-verification-badge')
        .textContent = statusText;
    
    // Set Wolfram query if available
    const queryElement = item.querySelector('.fact-checker-wolfram-query');
    if (result.wolfram_query) {
      queryElement.querySelector('span').textContent = result.wolfram_query;
    } else {
      queryElement.style.display = 'none';
    }
    
    // Set Wolfram response if available
    const responseElement = item.querySelector('.fact-checker-wolfram-response');
    if (result.wolfram_response) {
      responseElement.querySelector('span').textContent = result.wolfram_response;
      responseElement.style.marginTop = '8px';
    } else {
      responseElement.style.display = 'none';
    }
    
    return item;
  }
  
  /**
   * Handle Escape key press to close results
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleEscKeyPress(event) {
    if (event.key === 'Escape') {
      removeExistingResults();
      // Remove the event listener once used
      document.removeEventListener('keydown', handleEscKeyPress);
    }
  }
  
  /**
   * Remove any existing fact check result elements
   */
  function removeExistingResults() {
    const existingResults = document.getElementById('fact-checker-results');
    if (existingResults) {
      existingResults.remove();
      document.removeEventListener('keydown', handleEscKeyPress);
    }
  }
  
  /**
   * Show loading indicator while performing fact check
   */
  async function showLoadingIndicator() {
    // Remove any existing results first
    removeExistingResults();
    
    const templateFragment = await loadTemplate('loading');
    const container = templateFragment.querySelector('.fact-checker-container');
    
    document.body.appendChild(container);
  }
  

async function displayError(message) {
    removeExistingResults();
    
    const templateFragment = await loadTemplate('error');
    const container = templateFragment.querySelector('.fact-checker-container');
    
    // Set error message
    container.querySelector('#error-message').textContent = message;
    
    // Add click event for close button
    const closeButton = container.querySelector('.fact-checker-close');
    closeButton.addEventListener('click', () => container.remove());
    
    document.body.appendChild(container);
    
    // Automatically remove after 5 seconds
    setTimeout(() => {
      if (container.parentNode) {
        container.remove();
      }
    }, 5000);
}
  
  async function performFactCheck() {
    const text = getHighlightedText();
    
    if (!text) {
      displayError("No text selected. Please highlight some text containing health or nutrition claims.");
      return;
    }
    
    await showLoadingIndicator();
    
    try {
      const response = await fetch("http://localhost:5000/api/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const results = await response.json();
        await displayResults(results);
      } else {
        const errorText = await response.text();
        await displayError(`Error from fact-check API: ${response.status} - ${errorText || response.statusText}`);
      }
    } catch (error) {
      await displayError("Error connecting to fact-check service. Make sure the backend is running at localhost:5000.");
      console.error("Fact check error:", error);
    }
  }
  
  // Listen for messages from the popup to trigger a fact-check
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "ping") {
      sendResponse({ status: "content script active" });
      return true;
    } else if (message.action === "runFactCheck") {
      performFactCheck();
      sendResponse({ status: "Fact check initiated" });
      return true;
    }
    return true; // Keep the message channel open for async response
  });