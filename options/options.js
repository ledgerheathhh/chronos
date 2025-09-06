// Get today's date string (YYYY-MM-DD)
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Save settings
function saveOptions() {
  const timeFormat = document.getElementById('time-format').value;
  const themeSetting = document.getElementById('theme-setting').value;
  
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {};
    settings.timeFormat = timeFormat;
    settings.theme = themeSetting;
    
    chrome.storage.local.set({ settings: settings }, function() {
      showStatusMessage('Settings saved', 'success');
      applyTheme(themeSetting);
      // Notify popup.js about theme change
      chrome.runtime.sendMessage({ action: 'themeChanged' });
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
    
    if (settings.theme) {
      document.getElementById('theme-setting').value = settings.theme;
      applyTheme(settings.theme);
    } else {
      // Default to system theme if not set
      document.getElementById('theme-setting').value = 'system';
      applyTheme('system');
    }
  });
}

// Apply theme based on setting
function applyTheme(theme) {
  // Remove any existing theme classes
  document.body.classList.remove('dark-theme', 'theme-system');
  
  // Apply the selected theme
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (theme === 'system') {
    document.body.classList.add('theme-system');
  }
  // For 'light' theme, no class is needed as it's the default
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
          // Optionally notify background script to clear its cache
          chrome.runtime.sendMessage({ action: 'clearTimeDataCache' });
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
    
    const exportFileDefaultName = `chronos-data-${getTodayString()}.json`;
    
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
      
      // Basic validation for imported data structure
      if (typeof importedData !== 'object' || importedData === null) {
        throw new Error('Invalid data format: Expected an object.');
      }

      for (const domain in importedData) {
        const siteData = importedData[domain];
        if (typeof siteData !== 'object' || siteData === null ||
            !('totalTime' in siteData) || !('visits' in siteData) || !('lastVisit' in siteData) || !('daily' in siteData)) {
          throw new Error(`Invalid data format for domain: ${domain}. Missing required properties.`);
        }
        if (typeof siteData.totalTime !== 'number' || typeof siteData.visits !== 'number' || typeof siteData.lastVisit !== 'number' || typeof siteData.daily !== 'object') {
          throw new Error(`Invalid data types for domain: ${domain}.`);
        }
      }
      
      chrome.storage.local.get(['timeData'], function(result) {
        const currentData = result.timeData || {};
        
        // Merge data
        const mergedData = { ...currentData };
        
        for (const domain in importedData) {
          if (mergedData[domain]) {
            // If domain already exists, merge data
            mergedData[domain].totalTime = (mergedData[domain].totalTime || 0) + (importedData[domain].totalTime || 0);
            mergedData[domain].visits = (mergedData[domain].visits || 0) + (importedData[domain].visits || 0);
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
          // Notify background script to update its cache
          chrome.runtime.sendMessage({ action: 'updateTimeDataCache', data: mergedData });
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
  statusElement.textContent = '';
  statusElement.className = 'status-message ' + type;
  
  // Add icon based on message type
  if (type === 'success' || type === 'error') {
    statusElement.textContent = ' ' + message;
  } else {
    statusElement.textContent = message;
  }
  
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
  
  // Add event listener for theme change
  document.getElementById('theme-setting').addEventListener('change', function() {
    const selectedTheme = this.value;
    applyTheme(selectedTheme);
    // Notify popup.js about theme change
    chrome.runtime.sendMessage({ action: 'themeChanged' });
  });
});
