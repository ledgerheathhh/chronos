// 保存设置
function saveOptions() {
  const timeFormat = document.getElementById('time-format').value;
  
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {};
    settings.timeFormat = timeFormat;
    
    chrome.storage.local.set({ settings: settings }, function() {
      showStatusMessage('设置已保存', 'success');
    });
  });
}

// 加载设置
function loadOptions() {
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {};
    
    if (settings.timeFormat) {
      document.getElementById('time-format').value = settings.timeFormat;
    }
  });
}

// 清除所有数据
function clearAllData() {
  if (confirm('确定要清除所有使用时长数据吗？此操作不可撤销。')) {
    chrome.storage.local.get(['settings'], function(result) {
      const settings = result.settings || {};
      
      // 清除数据但保留设置
      chrome.storage.local.clear(function() {
        chrome.storage.local.set({ settings: settings }, function() {
          showStatusMessage('所有数据已清除', 'success');
        });
      });
    });
  }
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
    
    showStatusMessage('数据已导出', 'success');
  });
}

// 导入数据
function importData() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  
  if (!file) {
    showStatusMessage('请选择文件', 'error');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // 验证导入的数据格式
      if (typeof importedData !== 'object') {
        throw new Error('无效的数据格式');
      }
      
      chrome.storage.local.get(['timeData'], function(result) {
        const currentData = result.timeData || {};
        
        // 合并数据
        const mergedData = { ...currentData };
        
        for (const domain in importedData) {
          if (mergedData[domain]) {
            // 如果域名已存在，合并数据
            mergedData[domain].totalTime += importedData[domain].totalTime || 0;
            mergedData[domain].visits += importedData[domain].visits || 0;
            mergedData[domain].lastVisit = Math.max(
              mergedData[domain].lastVisit || 0,
              importedData[domain].lastVisit || 0
            );
            
            // 合并每日数据
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
            // 如果域名不存在，直接添加
            mergedData[domain] = importedData[domain];
          }
        }
        
        chrome.storage.local.set({ timeData: mergedData }, function() {
          showStatusMessage('数据已导入', 'success');
        });
      });
    } catch (error) {
      showStatusMessage('导入失败: ' + error.message, 'error');
    }
  };
  
  reader.onerror = function() {
    showStatusMessage('读取文件失败', 'error');
  };
  
  reader.readAsText(file);
}

// 显示状态消息
function showStatusMessage(message, type) {
  const statusElement = document.getElementById('status-message');
  statusElement.textContent = message;
  statusElement.className = 'status-message ' + type;
  
  // 3秒后清除消息
  setTimeout(function() {
    statusElement.textContent = '';
    statusElement.className = 'status-message';
  }, 3000);
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
  // 加载设置
  loadOptions();
  
  // 保存按钮事件
  document.getElementById('save-btn').addEventListener('click', saveOptions);
  
  // 清除数据按钮事件
  document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
  
  // 导出数据按钮事件
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  
  // 导入数据按钮事件
  document.getElementById('import-data-btn').addEventListener('click', importData);
});