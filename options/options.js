import { getTodayString, applyTheme } from "../utils/utils.js";

// Save settings
function saveOptions() {
  const timeFormat = document.getElementById("time-format").value;
  const themeSetting = document.getElementById("theme-setting").value;

  chrome.storage.local.get(["settings"], function (result) {
    const settings = result.settings || {};
    settings.timeFormat = timeFormat;
    settings.theme = themeSetting;

    chrome.storage.local.set({ settings: settings }, function () {
      showStatusMessage("Settings saved", "success");
      applyTheme(themeSetting);
      // Notify other parts of the extension about theme change
      chrome.runtime.sendMessage({ action: "themeChanged" });
    });
  });
}

// Load settings
function loadOptions() {
  chrome.storage.local.get(["settings"], function (result) {
    const settings = result.settings || {};

    if (settings.timeFormat) {
      document.getElementById("time-format").value = settings.timeFormat;
    }

    if (settings.theme) {
      document.getElementById("theme-setting").value = settings.theme;
      applyTheme(settings.theme);
    } else {
      document.getElementById("theme-setting").value = "system";
      applyTheme("system");
    }
  });
}

// Clear all data
function clearAllData() {
  if (
    confirm(
      "Are you sure you want to clear all usage time data? This action cannot be undone.",
    )
  ) {
    chrome.storage.local.get(["settings"], function (result) {
      const settings = result.settings || {};

      // Clear data but keep settings
      chrome.storage.local.clear(function () {
        chrome.storage.local.set({ settings: settings }, function () {
          showStatusMessage("All data has been cleared", "success");
          chrome.runtime.sendMessage({ action: "clearTimeDataCache" });
        });
      });
    });
  }
}

// Export data
function exportData() {
  chrome.storage.local.get(["timeData"], function (result) {
    const timeData = result.timeData || {};
    const dataStr = JSON.stringify(timeData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `chronos-data-${getTodayString()}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    showStatusMessage("Data exported", "success");
  });
}

// Import data
function importData() {
  const fileInput = document.getElementById("import-file");
  const file = fileInput.files[0];

  if (!file) {
    showStatusMessage("Please select a file", "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // Basic validation
      if (typeof importedData !== "object" || importedData === null) {
        throw new Error("Invalid data format.");
      }

      chrome.storage.local.get(["timeData"], function (result) {
        const currentData = result.timeData || {};
        const mergedData = { ...currentData };

        for (const domain in importedData) {
          if (mergedData[domain]) {
            mergedData[domain].totalTime =
              (mergedData[domain].totalTime || 0) +
              (importedData[domain].totalTime || 0);
            mergedData[domain].visits =
              (mergedData[domain].visits || 0) +
              (importedData[domain].visits || 0);
            mergedData[domain].lastVisit = Math.max(
              mergedData[domain].lastVisit || 0,
              importedData[domain].lastVisit || 0,
            );

            if (importedData[domain].daily) {
              if (!mergedData[domain].daily) mergedData[domain].daily = {};
              for (const date in importedData[domain].daily) {
                mergedData[domain].daily[date] =
                  (mergedData[domain].daily[date] || 0) +
                  importedData[domain].daily[date];
              }
            }
          } else {
            mergedData[domain] = importedData[domain];
          }
        }

        chrome.storage.local.set({ timeData: mergedData }, function () {
          showStatusMessage("Data imported", "success");
          chrome.runtime.sendMessage({
            action: "updateTimeDataCache",
            data: mergedData,
          });
        });
      });
    } catch (error) {
      showStatusMessage("Import failed: " + error.message, "error");
    }
  };

  reader.readAsText(file);
}

// Display status message
function showStatusMessage(message, type) {
  const statusElement = document.getElementById("status-message");
  statusElement.textContent = message;
  statusElement.className = "status-message " + type;

  setTimeout(function () {
    statusElement.textContent = "";
    statusElement.className = "status-message";
  }, 3000);
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  loadOptions();

  document.getElementById("save-btn").addEventListener("click", saveOptions);
  document
    .getElementById("clear-data-btn")
    .addEventListener("click", clearAllData);
  document
    .getElementById("export-data-btn")
    .addEventListener("click", exportData);
  document
    .getElementById("import-data-btn")
    .addEventListener("click", importData);

  document
    .getElementById("theme-setting")
    .addEventListener("change", function () {
      applyTheme(this.value);
      chrome.runtime.sendMessage({ action: "themeChanged" });
    });
});
