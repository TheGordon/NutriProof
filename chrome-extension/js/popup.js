// Popup script for the NutriProof Chrome Extension
const API_URL = 'http://localhost:5000/api/fact-check';
let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('NutriProof popup loaded');
  
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded!');
    showError('Chart.js library could not be loaded. Please reload the extension.');
    return;
  } else {
    console.log('Chart.js library loaded successfully');
  }

  const selectedTextContainer = document.getElementById('selected-text-container');
  const selectedText = document.getElementById('selected-text');
  const resultsContainer = document.getElementById('results-container');
  const resultsList = document.getElementById('results-list');
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  const errorMessage = document.getElementById('error-message');
  const noSelectionElement = document.getElementById('no-selection');
  const checkAgainButton = document.getElementById('check-again');
  
  let currentText = '';
  
  // Hide loading and error elements initially
  loadingElement.classList.add('hidden');
  errorElement.classList.add('hidden');
  
  // Listen for check again button clicks
  checkAgainButton.addEventListener('click', () => {
    if (currentText) {
      console.log('Check again clicked, re-fetching results');
      fetchFactCheckResults(currentText);
    }
  });
  
  // Check if there's selected text in storage
  chrome.storage.local.get(['selectedText'], function(result) {
    if (result.selectedText) {
      currentText = result.selectedText;
      console.log('Retrieved selected text from storage:', currentText);
      showSelectedText(currentText);
      fetchFactCheckResults(currentText);
    } else {
      console.log('No selected text found in storage');
      noSelectionElement.classList.remove('hidden');
    }
  });
  
  function showLoading() {
    loadingElement.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    errorElement.classList.add('hidden');
    noSelectionElement.classList.add('hidden');
  }
  
  function hideLoading() {
    loadingElement.classList.add('hidden');
  }
  
  function showError(message) {
    errorMessage.textContent = message;
    errorElement.classList.remove('hidden');
    loadingElement.classList.add('hidden');
  }
  
  function showSelectedText(text) {
    selectedText.textContent = text;
    selectedTextContainer.classList.remove('hidden');
  }
  
  async function fetchFactCheckResults(text) {
    showLoading();
    
    try {
      console.log('Fetching NutriProof results from:', API_URL);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      
      const results = await response.json();
      console.log('Received NutriProof results:', results);
      
      hideLoading();
      displayResults(results);
    } catch (error) {
      console.error('Error fetching NutriProof results:', error);
      hideLoading();
      showError(`Failed to check facts: ${error.message}`);
    }
  }
  
  function displayResults(results) {
    if (!results || !Array.isArray(results) || results.length === 0) {
      showError('No results were returned from the NutriProof API.');
      return;
    }
    
    try {
      console.log('Displaying results:', results);
      
      // Attempt to create chart with proper error handling
      try {
        console.log('Creating chart with results:', results);
        createVerificationChart(results);
      } catch (e) {
        console.error('Error creating chart:', e);
        document.getElementById('chart-container').innerHTML = 
          `<div style="color: #f44336; text-align: center;">
            <p>Error creating chart: ${e.message}</p>
            <p>Results will still be displayed below.</p>
          </div>`;
      }
      
      // Create result cards for each claim
      resultsList.innerHTML = '';
      results.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        // Determine the verification class for styling
        let verificationClass = 'inconclusive';
        if (result.verification && result.verification.includes('True')) {
          verificationClass = 'true';
        } else if (result.verification && result.verification.includes('False')) {
          verificationClass = 'false';
        }
        
        resultCard.innerHTML = `
          <div class="claim">${result.claim || 'Unknown claim'}</div>
          <div class="verification ${verificationClass}">${result.verification || 'Unknown'}</div>
          <details>
            <summary>Details</summary>
            <div class="details-content">
              <div class="detail-item">
                <span class="detail-label">Wolfram Query:</span>
                <span class="detail-value">${result.wolfram_query || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Wolfram Response:</span>
                <span class="detail-value">${result.wolfram_response || 'N/A'}</span>
              </div>
            </div>
          </details>
        `;
        
        resultsList.appendChild(resultCard);
      });
    } catch (error) {
      console.error('Error displaying results:', error);
      showError(`Error displaying results: ${error.message}`);
      return;
    }
    
    resultsContainer.classList.remove('hidden');
  }
  
  function createVerificationChart(results) {
    // Count occurrences of each verification status
    const verificationCounts = {
      'True': 0,
      'False': 0,
      'Approximately True': 0,
      'Approximately False': 0,
      'Inconclusive': 0
    };
    
    // Process results to count each verification type
    results.forEach(result => {
      if (!result.verification) {
        verificationCounts['Inconclusive']++;
        return;
      }
      
      if (verificationCounts.hasOwnProperty(result.verification)) {
        verificationCounts[result.verification]++;
      } else if (result.verification.includes('True')) {
        verificationCounts['Approximately True']++;
      } else if (result.verification.includes('False')) {
        verificationCounts['Approximately False']++;
      } else {
        verificationCounts['Inconclusive']++;
      }
    });
    
    // Define colors for the pie chart
    const chartColors = {
      'True': '#2e7d32', // Green
      'False': '#c62828', // Red
      'Approximately True': '#4caf50', // Light green
      'Approximately False': '#f44336', // Light red
      'Inconclusive': '#ffc107' // Amber
    };
    
    // Filter out zero values
    const labels = Object.keys(verificationCounts).filter(key => verificationCounts[key] > 0);
    const data = labels.map(key => verificationCounts[key]);
    const backgroundColor = labels.map(key => chartColors[key]);
    
    if (labels.length === 0) {
      throw new Error('No valid verification data to display');
    }
    
    // Prepare data for Chart.js
    const chartData = {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColor,
        hoverOffset: 4,
        borderWidth: 1,
        borderColor: '#fff'
      }]
    };
    
    // Get the canvas element
    const canvas = document.getElementById('verification-chart');
    const ctx = canvas.getContext('2d');
    
    // Destroy previous chart instance if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    console.log('Creating pie chart with data:', chartData);
    
    // Clear the canvas before creating a new chart
    canvas.width = canvas.width;
    
    // Create the pie chart with animations
    chartInstance = new Chart(ctx, {
      type: 'pie',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000,
          easing: 'easeOutQuart',
          delay: function(context) {
            // Stagger the animation for each segment
            return context.dataIndex * 100;
          }
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                size: 12
              },
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value * 100) / total) + '%';
                return `${label}: ${value} (${percentage})`;
              }
            },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#333',
            bodyColor: '#666',
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 10,
            displayColors: true,
            boxWidth: 12,
            boxHeight: 12
          }
        }
      }
    });
    
    // Add visual appeal by animating the container when chart is created
    const chartContainer = document.getElementById('chart-container');
    chartContainer.style.animation = 'none';
    void chartContainer.offsetWidth; // Force reflow to restart animation
    chartContainer.style.animation = 'fadeIn 0.6s ease-in-out';
  }
}); 