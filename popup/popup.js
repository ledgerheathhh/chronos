import {
  extractDomain,
  formatTime,
  getTodayString,
  applyTheme,
} from "../utils/utils.js";

// Get the start date of current week
function getStartOfWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // If Sunday, getDay() returns 0, we treat it as 7
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
  return startOfWeek.toISOString().split("T")[0];
}

// Get the start date of current month
function getStartOfMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.toISOString().split("T")[0];
}

function initTheme() {
  chrome.storage.local.get(["settings"], function (result) {
    const settings = result.settings || {};
    const theme = settings.theme || "system";
    applyTheme(theme);
    const themeSelect = document.getElementById("theme-select");
    if (themeSelect) themeSelect.value = theme;
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
    const domainElement = document.getElementById("current-domain");
    if (domainElement) domainElement.textContent = domain || "None";
  } catch (e) {
    const domainElement = document.getElementById("current-domain");
    if (domainElement) domainElement.textContent = "Invalid URL";
    return;
  }

  if (!domain) return;

  const response = await chrome.runtime.sendMessage({ action: "getTimeData" });
  const timeData = response.timeData || {};
  const siteData = timeData[domain];

  if (!siteData) {
    document.getElementById("today-time").textContent = "0 minutes";
    document.getElementById("total-time").textContent = "0 minutes";
    document.getElementById("visit-count").textContent = "0";
    return;
  }

  const today = getTodayString();
  const todayTime =
    siteData.daily && siteData.daily[today] ? siteData.daily[today] : 0;

  document.getElementById("today-time").textContent = formatTime(todayTime);
  document.getElementById("total-time").textContent = formatTime(
    siteData.totalTime,
  );
  document.getElementById("visit-count").textContent = siteData.visits;
}

// Display website ranking
async function showSitesRanking(filter = "today") {
  const sitesListElement = document.getElementById("sites-list");
  sitesListElement.innerHTML = '<div class="loading">Loading...</div>';

  const response = await chrome.runtime.sendMessage({ action: "getTimeData" });
  const timeData = response.timeData || {};
  let filteredData = [];

  const today = getTodayString();
  const startOfWeek = getStartOfWeek();
  const startOfMonth = getStartOfMonth();

  // 根据过滤条件处理数据
  switch (filter) {
    case "today":
      for (const domain in timeData) {
        const siteData = timeData[domain];
        const todayTime =
          siteData.daily && siteData.daily[today] ? siteData.daily[today] : 0;
        if (todayTime > 0) {
          filteredData.push({ domain, time: todayTime });
        }
      }
      break;

    case "week":
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

    case "month":
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

    case "all":
      for (const domain in timeData) {
        filteredData.push({ domain, time: timeData[domain].totalTime });
      }
      break;
  }

  filteredData.sort((a, b) => b.time - a.time);
  sitesListElement.innerHTML = "";

  if (filteredData.length === 0) {
    sitesListElement.innerHTML =
      '<div class="no-data"><i class="fas fa-info-circle"></i> No data available</div>';
    return;
  }

  filteredData.forEach((item, index) => {
    const siteItem = document.createElement("div");
    siteItem.className = "site-item";
    siteItem.style.animationDelay = `${index * 50}ms`;

    const siteDomain = document.createElement("div");
    siteDomain.className = "site-domain";

    let icon = "fa-globe";
    if (index === 0) icon = "fa-trophy";
    else if (index === 1) icon = "fa-medal";
    else if (index === 2) icon = "fa-award";

    siteDomain.innerHTML = `<i class="fas ${icon}"></i> ${item.domain}`;
    siteDomain.title = item.domain;

    const siteTime = document.createElement("div");
    siteTime.className = "site-time";
    siteTime.innerHTML = `<i class="fas fa-clock"></i> ${formatTime(item.time)}`;

    siteItem.appendChild(siteDomain);
    siteItem.appendChild(siteTime);
    sitesListElement.appendChild(siteItem);
  });
}

// Initialize filter buttons
function initFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      const filter = this.getAttribute("data-filter");
      showSitesRanking(filter);
    });
  });
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
  });
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  showCurrentSiteInfo();
  showSitesRanking("today");
  initFilterButtons();

  document.getElementById("options-btn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById("export-btn").addEventListener("click", exportData);

  const themeSelect = document.getElementById("theme-select");
  chrome.storage.local.get(["settings"], function (result) {
    const settings = result.settings || {};
    themeSelect.value = settings.theme || "system";
  });

  themeSelect.addEventListener("change", function () {
    const selectedTheme = this.value;
    chrome.storage.local.get(["settings"], function (result) {
      const settings = result.settings || {};
      settings.theme = selectedTheme;
      chrome.storage.local.set({ settings: settings }, function () {
        applyTheme(selectedTheme);
        chrome.runtime.sendMessage({ action: "themeChanged" });
      });
    });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "themeChanged") {
      initTheme();
    }
  });

  setInterval(showCurrentSiteInfo, 1000);
});
