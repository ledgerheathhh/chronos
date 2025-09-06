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

// Store information about the current active tab
let currentTab = {
  id: null,
  url: null,
  domain: null,
  startTime: null
};

// In-memory cache for time data
let timeDataCache = {};

// Function to save timeDataCache to chrome.storage.local
async function saveTimeDataToStorage() {
  await chrome.storage.local.set({ timeData: timeDataCache });
}

// Update the usage time of the current tab
function updateTimeSpent() {
  if (!currentTab.startTime || !currentTab.domain) return;
  
  const now = Date.now();
  const timeSpent = now - currentTab.startTime;
  
  // Only record if the time spent is more than 1 second
  if (timeSpent < 1000) return;
  
  const domain = currentTab.domain;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (!timeDataCache[domain]) {
    timeDataCache[domain] = {
      totalTime: 0,
      visits: 0,
      lastVisit: now,
      daily: {}
    };
  }
  
  if (!timeDataCache[domain].daily[today]) {
    timeDataCache[domain].daily[today] = 0;
  }
  
  timeDataCache[domain].totalTime += timeSpent;
  timeDataCache[domain].daily[today] += timeSpent;
  timeDataCache[domain].lastVisit = now;
  
  // Reset start time to continue tracking
  currentTab.startTime = now;
}

// When a tab becomes active
async function handleTabActivated(activeInfo) {
  // Save time for the previous tab
  updateTimeSpent();
  
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    const domain = extractDomain(tab.url);
    
    currentTab = {
      id: tab.id,
      url: tab.url,
      domain: domain,
      startTime: Date.now()
    };
    
    if (domain) {
      if (!timeDataCache[domain]) {
        timeDataCache[domain] = {
          totalTime: 0,
          visits: 0,
          lastVisit: Date.now(),
          daily: {}
        };
      }
      timeDataCache[domain].visits += 1;
    }
  } catch (e) {
    console.error("Error in handleTabActivated:", e);
  }
}

// When a tab is updated
async function handleTabUpdated(tabId, changeInfo, tab) {
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
      if (!timeDataCache[domain]) {
        timeDataCache[domain] = {
          totalTime: 0,
          visits: 0,
          lastVisit: Date.now(),
          daily: {}
        };
      }
      timeDataCache[domain].visits += 1;
    }
  }
}

// When browser window focus changes
async function handleWindowFocusChanged(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus, save time for current tab
    updateTimeSpent();
    currentTab.startTime = null;
    // Save data to storage when browser loses focus
    await saveTimeDataToStorage();
  } else {
    // Browser gained focus, restart timing
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
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
    } catch (e) {
      console.error("Error in handleWindowFocusChanged:", e);
    }
  }
}

// Periodically save data (every 10 seconds)
setInterval(saveTimeDataToStorage, 10000);

// Register event listeners
chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);

// Initialize
async function initializeBackgroundScript() {
  const result = await chrome.storage.local.get(['timeData']);
  timeDataCache = result.timeData || {};

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
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
  } catch (e) {
    console.error("Error during initialization:", e);
  }
}

initializeBackgroundScript();

// Listen for messages from popup/options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveTimeData') {
    saveTimeDataToStorage().then(() => {
      sendResponse({ status: 'success' });
    });
    return true; // Indicates that sendResponse will be called asynchronously
  } else if (message.action === 'getTimeData') {
    sendResponse({ timeData: timeDataCache });
    return true; // Indicates that sendResponse will be called synchronously
  } else if (message.action === 'clearTimeDataCache') {
    timeDataCache = {}; // Clear in-memory cache
    saveTimeDataToStorage(); // Persist empty cache to storage
    sendResponse({ status: 'success' });
    return true;
  } else if (message.action === 'updateTimeDataCache') {
    timeDataCache = message.data; // Update in-memory cache with imported data
    sendResponse({ status: 'success' });
    return true;
  }
});

// Save data before browser closes (best effort)
chrome.windows.onRemoved.addListener(async (windowId) => {
  // Check if this was the last window
  const allWindows = await chrome.windows.getAll();
  if (allWindows.length === 0) {
    updateTimeSpent(); // Ensure current tab's time is updated
    await saveTimeDataToStorage();
    console.log("All windows closed, time data saved.");
  }
});

chrome.runtime.onSuspend.addListener(async () => {
  updateTimeSpent(); // Ensure current tab's time is updated
  await saveTimeDataToStorage();
  console.log("Extension suspending, time data saved.");
});
