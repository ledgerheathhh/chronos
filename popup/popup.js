// 格式化时间（毫秒转为可读格式）
function formatTime(milliseconds) {
  if (milliseconds < 1000) return "不到1秒";
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟`;
  } else {
    return `${seconds}秒`;
  }
}

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// 获取本周的开始日期
function getStartOfWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // 如果是周日，getDay()返回0，我们将其视为7
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
  return startOfWeek.toISOString().split('T')[0];
}

// 获取本月的开始日期
function getStartOfMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.toISOString().split('T')[0];
}

// 显示当前网站信息
function showCurrentSiteInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length === 0) return;
    
    const url = tabs[0].url;
    let domain;
    
    try {
      domain = new URL(url).hostname;
      document.getElementById('current-domain').textContent = domain;
    } catch (e) {
      document.getElementById('current-domain').textContent = "无效网址";
      return;
    }
    
    chrome.storage.local.get(['timeData'], function(result) {
      const timeData = result.timeData || {};
      const siteData = timeData[domain];
      
      if (!siteData) {
        document.getElementById('today-time').textContent = "0分钟";
        document.getElementById('total-time').textContent = "0分钟";
        document.getElementById('visit-count').textContent = "0";
        return;
      }
      
      const today = getTodayString();
      const todayTime = siteData.daily && siteData.daily[today] ? siteData.daily[today] : 0;
      
      document.getElementById('today-time').textContent = formatTime(todayTime);
      document.getElementById('total-time').textContent = formatTime(siteData.totalTime);
      document.getElementById('visit-count').textContent = siteData.visits;
    });
  });
}

// 显示网站排行
function showSitesRanking(filter = 'today') {
  const sitesListElement = document.getElementById('sites-list');
  sitesListElement.innerHTML = '<div class="loading">加载中...</div>';
  
  chrome.storage.local.get(['timeData'], function(result) {
    const timeData = result.timeData || {};
    let filteredData = [];
    
    const today = getTodayString();
    const startOfWeek = getStartOfWeek();
    const startOfMonth = getStartOfMonth();
    
    // 根据过滤条件处理数据
    switch (filter) {
      case 'today':
        // 今日数据
        for (const domain in timeData) {
          const siteData = timeData[domain];
          const todayTime = siteData.daily && siteData.daily[today] ? siteData.daily[today] : 0;
          if (todayTime > 0) {
            filteredData.push({ domain, time: todayTime });
          }
        }
        break;
        
      case 'week':
        // 本周数据
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
        // 本月数据
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
        // 所有数据
        for (const domain in timeData) {
          filteredData.push({ domain, time: timeData[domain].totalTime });
        }
        break;
    }
    
    // 按时间排序
    filteredData.sort((a, b) => b.time - a.time);
    
    // 更新UI
    sitesListElement.innerHTML = '';
    
    if (filteredData.length === 0) {
      sitesListElement.innerHTML = '<div class="no-data">暂无数据</div>';
      return;
    }
    
    filteredData.forEach(item => {
      const siteItem = document.createElement('div');
      siteItem.className = 'site-item';
      
      const siteDomain = document.createElement('div');
      siteDomain.className = 'site-domain';
      siteDomain.textContent = item.domain;
      siteDomain.title = item.domain;
      
      const siteTime = document.createElement('div');
      siteTime.className = 'site-time';
      siteTime.textContent = formatTime(item.time);
      
      siteItem.appendChild(siteDomain);
      siteItem.appendChild(siteTime);
      sitesListElement.appendChild(siteItem);
    });
  });
}

// 初始化过滤按钮
function initFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // 移除所有按钮的active类
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // 为当前按钮添加active类
      this.classList.add('active');
      
      // 显示对应的排行数据
      const filter = this.getAttribute('data-filter');
      showSitesRanking(filter);
    });
  });
}

// 导出数据
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
  });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
  // 显示当前网站信息
  showCurrentSiteInfo();
  
  // 显示默认排行（今日）
  showSitesRanking('today');
  
  // 初始化过滤按钮
  initFilterButtons();
  
  // 设置按钮事件
  document.getElementById('options-btn').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  // 导出按钮事件
  document.getElementById('export-btn').addEventListener('click', exportData);
});