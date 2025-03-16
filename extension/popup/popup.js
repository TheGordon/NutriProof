document.getElementById('checkButton').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = 'Running fact check...';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, { action: 'runFactCheck' }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: Could not communicate with page';
          return;
        }
        
        if (response && response.status) {
          statusDiv.textContent = response.status;
        }
      });
    } catch (error) {
      statusDiv.textContent = `Error: ${error.message}`;
    }
  });
  
  document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    
    try {
      const response = await fetch('http://localhost:5000/', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        statusDiv.textContent = 'Fact checker is ready!';
      } else {
        statusDiv.textContent = 'Warning: Backend service not responding';
      }
    } catch (error) {
      statusDiv.textContent = 'Warning: Backend service not available';
    }
  });