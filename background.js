// 存储当前活动标签的信息
let currentTab = {
  id: null,
  url: null,
  domain: null,
  startTime: null
};

// 从URL中提取域名
function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error("URL解析错误:", e);
    return null;
  }
}

// 更新当前标签的使用时间
function updateTimeSpent() {
  if (!currentTab.startTime || !currentTab.domain) return;
  
  const now = Date.now();
  const timeSpent = now - currentTab.startTime;
  
  // 只有当停留时间超过1秒时才记录
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
  
  // 重置开始时间以便继续追踪
  currentTab.startTime = now;
}

// 当标签变为活动状态时
function handleTabActivated(activeInfo) {
  // 保存之前标签的时间
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

// 当标签更新时
function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tabId === currentTab.id) {
    // 保存之前URL的时间
    updateTimeSpent();
    
    const domain = extractDomain(tab.url);
    
    // 如果域名没有变化，只更新URL
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

// 当浏览器窗口获得焦点时
function handleWindowFocusChanged(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // 浏览器失去焦点，保存当前标签的时间
    updateTimeSpent();
    currentTab.startTime = null;
  } else {
    // 浏览器获得焦点，重新开始计时
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

// 定期保存数据（每30秒）
setInterval(updateTimeSpent, 30000);

// 注册事件监听器
chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);

// 初始化
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