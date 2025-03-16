// Popup script for the NutriProof Chrome Extension
const API_URL = 'http://localhost:5001/api/fact-check';
let chartInstance = null;

function calculateGrade(results) {
  if (!results || results.length === 0) {
    return { letter: 'N/A', score: 0, description: 'No claims to verify' };
  }
  
  // Count different verdict types for grading
  const verdictCounts = {
    'True': 0,
    'False': 0,
    'Approximately True': 0,
    'Approximately False': 0,
    'Inconclusive': 0
  };
  
  // Process results to count each verdict type (using the new field "verdict")
  results.forEach(result => {
    if (!result.verdict) {
      verdictCounts['Inconclusive']++;
      return;
    }
    
    if (verdictCounts.hasOwnProperty(result.verdict)) {
      verdictCounts[result.verdict]++;
    } else if (result.verdict.includes('True') && !result.verdict.includes('False')) {
      verdictCounts['Approximately True']++;
    } else if (result.verdict.includes('False')) {
      verdictCounts['Approximately False']++;
    } else {
      verdictCounts['Inconclusive']++;
    }
  });
  
  // If all results are inconclusive, return N/A
  if (results.length === verdictCounts['Inconclusive']) {
    return { letter: 'N/A', score: 0, description: 'Insufficient data to grade' };
  }
  
  // Calculate weighted score (exclude inconclusive from calculation)
  const weights = {
    'True': 10,
    'Approximately True': 7.5,
    'Approximately False': 2.5,
    'False': 0
  };
  
  const verifiableCount = results.length - verdictCounts['Inconclusive'];
  
  if (verifiableCount === 0) {
    return { letter: 'N/A', score: 0, description: 'No verifiable claims' };
  }
  
  const weightedSum = 
    (verdictCounts['True'] * weights['True']) +
    (verdictCounts['Approximately True'] * weights['Approximately True']) +
    (verdictCounts['Approximately False'] * weights['Approximately False']) +
    (verdictCounts['False'] * weights['False']);
  
  const averageScore = weightedSum / verifiableCount;
  
  let letter, description;
  if (averageScore >= 9) {
    letter = 'A';
    description = 'Excellent - Highly accurate information';
  } else if (averageScore >= 7.5) {
    letter = 'B';
    description = 'Good - Mostly accurate with minor issues';
  } else if (averageScore >= 5) {
    letter = 'C';
    description = 'Fair - Mix of accurate and inaccurate information';
  } else if (averageScore >= 2.5) {
    letter = 'D';
    description = 'Poor - Mostly inaccurate information';
  } else {
    letter = 'F';
    description = 'Very poor - Contains serious inaccuracies';
  }
  
  return {
    letter,
    score: parseFloat(averageScore.toFixed(1)),
    description,
    counts: verdictCounts
  };
}

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

      clearResultsContent();

      // Calculate grade first using the new "verdict" field
      const grade = calculateGrade(results);
      console.log('Calculated grade:', grade);

      // Create a grade display BEFORE the chart
      const gradeDisplay = document.createElement('div');
      gradeDisplay.className = 'grade-summary';
      gradeDisplay.innerHTML = `
        <div class="grade-simple">
          <span class="grade-letter grade-${grade.letter.toLowerCase()}">${grade.letter}</span>
          <div class="grade-details">
            <span class="grade-score">${grade.letter !== 'N/A' ? grade.score + '/10' : ''}</span>
            <span class="grade-description">${grade.description}</span>
          </div>
        </div>
      `;
      
      // Insert the grade display at the top of the results container, before the chart container
      const chartContainer = document.getElementById('chart-container');
      resultsContainer.insertBefore(gradeDisplay, chartContainer);
      
      // Set up the chart container
      chartContainer.style.height = '250px';
      const canvas = document.createElement('canvas');
      canvas.id = 'verification-chart';
      chartContainer.appendChild(canvas);

      // Create chart with proper error handling
      try {
        console.log('Creating chart with results:', results);
        createVerificationChart(results);
      } catch (e) {
        console.error('Error creating chart:', e);
        chartContainer.innerHTML = `
          <div style="color: #f44336; text-align: center; padding: 20px;">
            <p>Error creating chart: ${e.message}</p>
            <p>Results will still be displayed below.</p>
          </div>`;
      }
      
      // Create result cards for each claim
      resultsList.innerHTML = '';
      results.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        // Determine the verdict class for styling
        let verdictClass = 'inconclusive';
        if (result.verdict && result.verdict.includes('True')) {
          verdictClass = 'true';
        } else if (result.verdict && result.verdict.includes('False')) {
          verdictClass = 'false';
        }
        
        resultCard.innerHTML = `
          <div class="claim">${result.claim || 'Unknown claim'}</div>
          <div class="verification ${verdictClass}">
            ${result.verdict || 'Inconclusive'}
          </div>
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
              <div class="detail-item">
                <span class="detail-label">Final Answer:</span>
                <span class="detail-value">${result.final_answer || 'N/A'}</span>
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

  // Helper to clear existing results content
  function clearResultsContent() {
    const existingGradeSummary = document.querySelector('.grade-summary');
    if (existingGradeSummary) {
      existingGradeSummary.remove();
    }
    
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = '';
    chartContainer.style.height = '250px';
    
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';
  }
  
  function createVerificationChart(results) {
    // Count verdict types for chart
    const verdictCounts = {
      'True': 0,
      'False': 0,
      'Approximately True': 0,
      'Approximately False': 0,
      'Inconclusive': 0
    };
    
    results.forEach(result => {
      const v = result.verdict;
      if (!v) {
        verdictCounts['Inconclusive']++;
        return;
      }
      
      if (verdictCounts.hasOwnProperty(v)) {
        verdictCounts[v]++;
      } else if (v.includes('True')) {
        verdictCounts['Approximately True']++;
      } else if (v.includes('False')) {
        verdictCounts['Approximately False']++;
      } else {
        verdictCounts['Inconclusive']++;
      }
    });
    
    // Define colors for the pie chart
    const chartColors = {
      'True': '#4caf50',
      'False': '#c62828',
      'Approximately True': '#89a832',
      'Approximately False': '#ffc107',
      'Inconclusive': '#777875'
    };
    
    // Define a specific order to group verdict types
    const orderedLabels = ['True', 'Approximately True', 'False', 'Approximately False', 'Inconclusive'];
    
    const labels = orderedLabels.filter(key => verdictCounts[key] > 0);
    const data = labels.map(key => verdictCounts[key]);
    const backgroundColor = labels.map(key => chartColors[key]);
    
    if (labels.length === 0) {
      throw new Error('No valid verdict data to display');
    }
    
    const shortenedLabels = {
      'True': 'True',
      'False': 'False',
      'Approximately True': 'Approx. True',
      'Approximately False': 'Approx. False',
      'Inconclusive': 'Unclear'
    };
    
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
    
    const canvas = document.getElementById('verification-chart');
    const ctx = canvas.getContext('2d');
    
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    console.log('Creating pie chart with data:', chartData);
    
    canvas.width = canvas.width;
    
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
            return context.dataIndex * 100;
          }
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 0,
            bottom: 0
          }
        },
        plugins: {
          legend: {
            position: 'right',
            align: 'center',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              padding: 15,
              font: {
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                size: 12
              },
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const meta = chart.getDatasetMeta(0);
                    const style = meta.controller.getStyle(i);
                    return {
                      text: shortenedLabels[labels[i]] || labels[i],
                      fillStyle: style.backgroundColor,
                      strokeStyle: '#fff',
                      lineWidth: 1,
                      hidden: !chart.getDataVisibility(i),
                      index: i
                    };
                  });
                }
                return [];
              },
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
    
    const chartContainer = document.getElementById('chart-container');
    chartContainer.style.animation = 'none';
    void chartContainer.offsetWidth;
    chartContainer.style.animation = 'fadeIn 0.6s ease-in-out';
  }
});
