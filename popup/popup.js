import {
  extractDomain,
  formatTime,
  getTodayString,
  applyTheme,
} from "../utils/utils.js";

import { LoadingState, ErrorState, EmptyState, debounce } from "../utils/ui-components.js";

function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// Display current website information with error handling
async function showCurrentSiteInfo() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const domainElement = document.getElementById("current-domain");
    const faviconElement = document.getElementById("current-favicon");
    const skeletonElement = document.getElementById("current-skeleton");
    const contentElement = document.getElementById("current-content");

    if (tabs.length === 0) {
      skeletonElement.style.display = "none";
      contentElement.style.display = "block";
      return;
    }

    const url = tabs[0].url;
    const domain = extractDomain(url);

    if (!domain) {
      domainElement.textContent = "New Tab or Local Page";
      faviconElement.src = "icons/icon48.png";
      skeletonElement.style.display = "none";
      contentElement.style.display = "block";
      return;
    }

    requestAnimationFrame(() => {
      domainElement.textContent = domain;
      faviconElement.src = getFaviconUrl(domain);
      faviconElement.onerror = () => {
        faviconElement.src = "icons/icon48.png";
      };
    });

    const response = await chrome.runtime.sendMessage({ action: "getTimeData" });
    const timeData = response.timeData || {};
    const siteData = timeData[domain];

    requestAnimationFrame(() => {
      skeletonElement.style.display = "none";
      contentElement.style.display = "block";

      if (!siteData) {
        updateStat("today-time", 0);
        updateStat("total-time", 0);
        document.getElementById("visit-count").textContent = "0";
        return;
      }

      const today = getTodayString();
      const todayTime = siteData.daily && siteData.daily[today] ? siteData.daily[today] : 0;

      updateStat("today-time", todayTime);
      updateStat("total-time", siteData.totalTime);
      document.getElementById("visit-count").textContent = siteData.visits;
    });
  } catch (error) {
    console.error("Error showing current site info:", error);
  }
}

function updateStat(id, time) {
  document.getElementById(id).textContent = formatTime(time, true);
  document.getElementById(id).title = formatTime(time, false);
}

// Display website ranking with charts
async function showSitesRanking(filter = "today") {
  const sitesListElement = document.getElementById("sites-list");
  const expandBtnElement = document.getElementById("expand-btn");

  // Keep skeletons if first load, otherwise content updates in place
  if (!sitesListElement.querySelector(".site-row")) {
    // Skeletons are already there by default in HTML
  }

  const response = await chrome.runtime.sendMessage({ action: "getTimeData" });
  const timeData = response.timeData || {};
  let filteredData = [];

  const today = getTodayString();
  const startOfWeek = getStartOfWeek();
  const startOfMonth = getStartOfMonth();

  // Process data based on filter
  for (const domain in timeData) {
    const siteData = timeData[domain];
    let time = 0;

    if (filter === "today") {
      time =
        siteData.daily && siteData.daily[today] ? siteData.daily[today] : 0;
    } else if (filter === "week") {
      if (siteData.daily) {
        for (const date in siteData.daily) {
          if (date >= startOfWeek) time += siteData.daily[date];
        }
      }
    } else if (filter === "month") {
      if (siteData.daily) {
        for (const date in siteData.daily) {
          if (date >= startOfMonth) time += siteData.daily[date];
        }
      }
    } else {
      // all
      time = siteData.totalTime;
    }

    if (time > 0) {
      filteredData.push({ domain, time });
    }
  }

  filteredData.sort((a, b) => b.time - a.time);

  if (filteredData.length === 0) {
    sitesListElement.innerHTML = '<div class="no-data">No data for this period</div>';
    expandBtnElement.style.display = "none";
    return;
  }

  const MAX_VISIBLE_ITEMS = 5;
  const isExpanded = expandBtnElement.getAttribute("data-expanded") === "true";
  const displayData = isExpanded ? filteredData : filteredData.slice(0, MAX_VISIBLE_ITEMS);
  const maxTime = filteredData[0].time;

  requestAnimationFrame(() => {
    const fragment = document.createDocumentFragment();
    
    displayData.forEach((item) => {
      const percentage = Math.max((item.time / maxTime) * 100, 2);
      const row = document.createElement("div");
      row.className = "site-row";
      row.title = `${item.domain}: ${formatTime(item.time, false)}`;
      row.innerHTML = `
        <div class="site-progress-bg" style="width: ${percentage}%"></div>
        <img src="${getFaviconUrl(item.domain)}" class="site-icon" onerror="this.src='icons/icon48.png'" />
        <div class="site-info">
          <span class="site-name">${item.domain}</span>
          <span class="site-duration">${formatTime(item.time, true)}</span>
        </div>
      `;
      fragment.appendChild(row);
    });

    sitesListElement.innerHTML = "";
    sitesListElement.appendChild(fragment);

    if (filteredData.length > MAX_VISIBLE_ITEMS) {
      expandBtnElement.style.display = "block";
      expandBtnElement.textContent = isExpanded ? "Show Less" : "Show More";
    } else {
      expandBtnElement.style.display = "none";
    }
  });
}

function getStartOfWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
  return startOfWeek.toISOString().split("T")[0];
}

function getStartOfMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.toISOString().split("T")[0];
}

function initThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");

  chrome.storage.local.get(["settings"], (result) => {
    const settings = result.settings || {};
    const currentTheme = settings.theme || "system";
    updateThemeIcon(currentTheme);
    applyTheme(currentTheme);
  });

  themeToggle.addEventListener("click", () => {
    chrome.storage.local.get(["settings"], (result) => {
      const settings = result.settings || {};
      let nextTheme = "light";
      if (settings.theme === "light") nextTheme = "dark";
      else if (settings.theme === "dark") nextTheme = "system";

      settings.theme = nextTheme;
      chrome.storage.local.set({ settings }, () => {
        applyTheme(nextTheme);
        updateThemeIcon(nextTheme);
        chrome.runtime.sendMessage({ action: "themeChanged" });
      });
    });
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector("#theme-toggle i");
  icon.className = "fas";
  if (theme === "light") icon.classList.add("fa-sun");
  else if (theme === "dark") icon.classList.add("fa-moon");
  else icon.classList.add("fa-desktop");
}

function initFilterButtons() {
  const buttons = document.querySelectorAll(".tab-btn");
  const debouncedShowRanking = debounce((filter) => showSitesRanking(filter), 150);
  
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      buttons.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      debouncedShowRanking(e.target.dataset.filter);
    });
  });

  document.getElementById("expand-btn").addEventListener("click", (e) => {
    const isExpanded = e.target.getAttribute("data-expanded") === "true";
    e.target.setAttribute("data-expanded", !isExpanded);
    const activeFilter =
      document.querySelector(".tab-btn.active").dataset.filter;
    showSitesRanking(activeFilter);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const faLink = document.getElementById('fa-stylesheet');
  if (faLink) {
    faLink.media = 'all';
  }
  
  initFilterButtons();
  
  document.getElementById("options-btn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    chrome.storage.local.get(["timeData"], (result) => {
      const dataStr = JSON.stringify(result.timeData || {}, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chronos-data-${getTodayString()}.json`;
      a.click();
    });
  });

  requestAnimationFrame(() => {
    initThemeToggle();
    
    requestIdleCallback(() => {
      showCurrentSiteInfo();
      showSitesRanking("today");
    }, { timeout: 100 });
  });

  setInterval(showCurrentSiteInfo, 5000);
});
