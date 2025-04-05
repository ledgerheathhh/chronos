// Store information about the current active tab
let currentTab = {
  id: null,
  url: null,
  domain: null,
  startTime: null
};

// Extract domain from URL
function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error("URL parsing error:", e);
    return null;
  }
}

// Update the usage time of the current tab
function updateTimeSpent() {
  if (!currentTab.startTime || !currentTab.domain) return;
  
  const now = Date.now();
  const timeSpent = now - currentTab.startTime;
  
  // Only record if the time spent is more than 1 second
  if (timeSpent < 1000) return;
  
  chrome.storage.local.get(['timeData'], function(result) {
    const timeData = result.timeData || {};
    const domain = currentTab.domain;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!timeData[domain]) {
      timeData[domain] = {
        totalTime: 0,
        visits: 0,
        lastVisit: now,
        daily: {}
      };
    }
    
    if (!timeData[domain].daily[today]) {
      timeData[domain].daily[today] = 0;
    }
    
    timeData[domain].totalTime += timeSpent;
    timeData[domain].daily[today] += timeSpent;
    timeData[domain].lastVisit = now;
    
    chrome.storage.local.set({ timeData: timeData });
  });
  
  // Reset start time to continue tracking
  currentTab.startTime = now;
}

// When a tab becomes active
function handleTabActivated(activeInfo) {
  // Save time for the previous tab
  updateTimeSpent();
  
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    
    const domain = extractDomain(tab.url);
    
    currentTab = {
      id: tab.id,
      url: tab.url,
      domain: domain,
      startTime: Date.now()
    };
    
    if (domain) {
      chrome.storage.local.get(['timeData'], function(result) {
        const timeData = result.timeData || {};
        
        if (!timeData[domain]) {
          timeData[domain] = {
            totalTime: 0,
            visits: 0,
            lastVisit: Date.now(),
            daily: {}
          };
        }
        
        timeData[domain].visits += 1;
        
        chrome.storage.local.set({ timeData: timeData });
      });
    }
  });
}

// When a tab is updated
function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tabId === currentTab.id) {
    // Save time for the previous URL
    updateTimeSpent();
    
    const domain = extractDomain(tab.url);
    
    // If domain hasn't changed, just update the URL
    if (domain === currentTab.domain) {
      currentTab.url = tab.url;
      return;
    }
    
    currentTab = {
      id: tab.id,
      url: tab.url,
      domain: domain,
      startTime: Date.now()
    };
    
    if (domain) {
      chrome.storage.local.get(['timeData'], function(result) {
        const timeData = result.timeData || {};
        
        if (!timeData[domain]) {
          timeData[domain] = {
            totalTime: 0,
            visits: 0,
            lastVisit: Date.now(),
            daily: {}
          };
        }
        
        timeData[domain].visits += 1;
        
        chrome.storage.local.set({ timeData: timeData });
      });
    }
  }
}

// When browser window focus changes
function handleWindowFocusChanged(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus, save time for current tab
    updateTimeSpent();
    currentTab.startTime = null;
  } else {
    // Browser gained focus, restart timing
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length > 0) {
        const tab = tabs[0];
        const domain = extractDomain(tab.url);
        
        currentTab = {
          id: tab.id,
          url: tab.url,
          domain: domain,
          startTime: Date.now()
        };
      }
    });
  }
}

// Periodically save data (every 30 seconds)
setInterval(updateTimeSpent, 30000);

// Register event listeners
chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);

// Initialize
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  if (tabs.length > 0) {
    const tab = tabs[0];
    const domain = extractDomain(tab.url);
    
    currentTab = {
      id: tab.id,
      url: tab.url,
      domain: domain,
      startTime: Date.now()
    };
  }
});