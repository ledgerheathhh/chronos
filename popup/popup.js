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

// Format time (convert milliseconds to readable format)
function formatTime(milliseconds) {
  if (milliseconds < 1000) return "Less than 1 second";
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

// Get today's date string (YYYY-MM-DD)
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Get the start date of current week
function getStartOfWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // If Sunday, getDay() returns 0, we treat it as 7
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
  return startOfWeek.toISOString().split('T')[0];
}

// Get the start date of current month
function getStartOfMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.toISOString().split('T')[0];
}

// Apply theme based on settings
function applyTheme() {
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {};
    const theme = settings.theme || 'system';
    
    // Remove any existing theme classes
    document.body.classList.remove('dark-theme', 'theme-system');
    
    // Apply the selected theme
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else if (theme === 'system') {
      document.body.classList.add('theme-system');
    }
    // For 'light' theme, no class is needed as it's the default
  });
}

// Display current website information
async function showCurrentSiteInfo() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) return;
  
  const url = tabs[0].url;
  let domain;
  
  try {
    domain = extractDomain(url);
    document.getElementById('current-domain').textContent = domain;
  } catch (e) {
    document.getElementById('current-domain').textContent = "Invalid URL";
    return;
  }
  
  const response = await chrome.runtime.sendMessage({ action: 'getTimeData' });
  const timeData = response.timeData || {};
  const siteData = timeData[domain];
  
  if (!siteData) {
    document.getElementById('today-time').textContent = "0 minutes";
    document.getElementById('total-time').textContent = "0 minutes";
    document.getElementById('visit-count').textContent = "0";
    return;
  }
  
  const today = getTodayString();
  const todayTime = siteData.daily && siteData.daily[today] ? siteData.daily[today] : 0;
  
  document.getElementById('today-time').textContent = formatTime(todayTime);
  document.getElementById('total-time').textContent = formatTime(siteData.totalTime);
  document.getElementById('visit-count').textContent = siteData.visits;
}

// Display website ranking
async function showSitesRanking(filter = 'today') {
  const sitesListElement = document.getElementById('sites-list');
  sitesListElement.innerHTML = '<div class="loading">Loading...</div>';
  
  const response = await chrome.runtime.sendMessage({ action: 'getTimeData' });
  const timeData = response.timeData || {};
  let filteredData = [];
  
  const today = getTodayString();
  const startOfWeek = getStartOfWeek();
  const startOfMonth = getStartOfMonth();
  
  // 根据过滤条件处理数据
  switch (filter) {
    case 'today':
      // Today's data
      for (const domain in timeData) {
        const siteData = timeData[domain];
        const todayTime = siteData.daily && siteData.daily[today] ? siteData.daily[today] : 0;
        if (todayTime > 0) {
          filteredData.push({ domain, time: todayTime });
        }
      }
      break;
      
    case 'week':
      // This week's data
      for (const domain in timeData) {
        const siteData = timeData[domain];
        let weekTime = 0;
        
        if (siteData.daily) {
          for (const date in siteData.daily) {
            if (date >= startOfWeek) {
              weekTime += siteData.daily[date];
            }
          }
        }
        
        if (weekTime > 0) {
          filteredData.push({ domain, time: weekTime });
        }
      }
      break;
      
    case 'month':
      // This month's data
      for (const domain in timeData) {
        const siteData = timeData[domain];
        let monthTime = 0;
        
        if (siteData.daily) {
          for (const date in siteData.daily) {
            if (date >= startOfMonth) {
              monthTime += siteData.daily[date];
            }
          }
        }
        
        if (monthTime > 0) {
          filteredData.push({ domain, time: monthTime });
        }
      }
      break;
      
    case 'all':
      // All data
      for (const domain in timeData) {
        filteredData.push({ domain, time: timeData[domain].totalTime });
      }
      break;
  }
  
  // Sort by time
  filteredData.sort((a, b) => b.time - a.time);
  
  // Update UI
  sitesListElement.innerHTML = '';
  
  if (filteredData.length === 0) {
    sitesListElement.innerHTML = '<div class="no-data"><i class="fas fa-info-circle"></i> No data available</div>';
    return;
  }
  
  filteredData.forEach((item, index) => {
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    // Add animation delay based on index
    siteItem.style.animationDelay = `${index * 50}ms`;
    
    const siteDomain = document.createElement('div');
    siteDomain.className = 'site-domain';
    
    // Add icon based on ranking
    let icon = 'fa-globe';
    if (index === 0) icon = 'fa-trophy';
    else if (index === 1) icon = 'fa-medal';
    else if (index === 2) icon = 'fa-award';
    
    siteDomain.innerHTML = `<i class="fas ${icon}"></i> ${item.domain}`;
    siteDomain.title = item.domain;
    
    const siteTime = document.createElement('div');
    siteTime.className = 'site-time';
    siteTime.innerHTML = `<i class="fas fa-clock"></i> ${formatTime(item.time)}`;
    
    siteItem.appendChild(siteDomain);
    siteItem.appendChild(siteTime);
    sitesListElement.appendChild(siteItem);
  });
}

// Initialize filter buttons
function initFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to current button
      this.classList.add('active');
      
      // Display corresponding ranking data
      const filter = this.getAttribute('data-filter');
      showSitesRanking(filter);
    });
  });
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
  });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Apply theme before showing content
  applyTheme();
  
  // Display current website information
  showCurrentSiteInfo();
  
  // Display default ranking (today)
  showSitesRanking('today');
  
  // Initialize filter buttons
  initFilterButtons();
  
  // Settings button event
  document.getElementById('options-btn').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  // Export button event
  document.getElementById('export-btn').addEventListener('click', exportData);

  // Listen for theme changes from options page
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'themeChanged') {
      applyTheme();
    }
  });

  // Set up real-time update for current site info
  setInterval(showCurrentSiteInfo, 1000);
});
