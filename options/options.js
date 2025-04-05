// Save settings
function saveOptions() {
  const timeFormat = document.getElementById('time-format').value;
  
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {};
    settings.timeFormat = timeFormat;
    
    chrome.storage.local.set({ settings: settings }, function() {
      showStatusMessage('Settings saved', 'success');
    });
  });
}

// Load settings
function loadOptions() {
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {};
    
    if (settings.timeFormat) {
      document.getElementById('time-format').value = settings.timeFormat;
    }
  });
}

// Clear all data
function clearAllData() {
  if (confirm('Are you sure you want to clear all usage time data? This action cannot be undone.')) {
    chrome.storage.local.get(['settings'], function(result) {
      const settings = result.settings || {};
      
      // Clear data but keep settings
      chrome.storage.local.clear(function() {
        chrome.storage.local.set({ settings: settings }, function() {
          showStatusMessage('All data has been cleared', 'success');
        });
      });
    });
  }
}

// Export data
function exportData() {
  chrome.storage.local.get(['timeData'], function(result) {
    const timeData = result.timeData || {};
    const dataStr = JSON.stringify(timeData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `chronos-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showStatusMessage('Data exported', 'success');
  });
}

// Import data
function importData() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  
  if (!file) {
    showStatusMessage('Please select a file', 'error');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // Validate imported data format
      if (typeof importedData !== 'object') {
        throw new Error('Invalid data format');
      }
      
      chrome.storage.local.get(['timeData'], function(result) {
        const currentData = result.timeData || {};
        
        // Merge data
        const mergedData = { ...currentData };
        
        for (const domain in importedData) {
          if (mergedData[domain]) {
            // If domain already exists, merge data
            mergedData[domain].totalTime += importedData[domain].totalTime || 0;
            mergedData[domain].visits += importedData[domain].visits || 0;
            mergedData[domain].lastVisit = Math.max(
              mergedData[domain].lastVisit || 0,
              importedData[domain].lastVisit || 0
            );
            
            // Merge daily data
            if (importedData[domain].daily) {
              if (!mergedData[domain].daily) {
                mergedData[domain].daily = {};
              }
              
              for (const date in importedData[domain].daily) {
                if (mergedData[domain].daily[date]) {
                  mergedData[domain].daily[date] += importedData[domain].daily[date];
                } else {
                  mergedData[domain].daily[date] = importedData[domain].daily[date];
                }
              }
            }
          } else {
            // If domain doesn't exist, add it directly
            mergedData[domain] = importedData[domain];
          }
        }
        
        chrome.storage.local.set({ timeData: mergedData }, function() {
          showStatusMessage('Data imported', 'success');
        });
      });
    } catch (error) {
      showStatusMessage('Import failed: ' + error.message, 'error');
    }
  };
  
  reader.onerror = function() {
    showStatusMessage('Failed to read file', 'error');
  };
  
  reader.readAsText(file);
}

// Display status message
function showStatusMessage(message, type) {
  const statusElement = document.getElementById('status-message');
  statusElement.textContent = message;
  statusElement.className = 'status-message ' + type;
  
  // Clear message after 3 seconds
  setTimeout(function() {
    statusElement.textContent = '';
    statusElement.className = 'status-message';
  }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Load settings
  loadOptions();
  
  // Save button event
  document.getElementById('save-btn').addEventListener('click', saveOptions);
  
  // Clear data button event
  document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
  
  // Export data button event
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  
  // Import data button event
  document.getElementById('import-data-btn').addEventListener('click', importData);
});