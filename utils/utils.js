/**
 * Shared utility functions for Chronos extension
 */

/**
 * Extract domain from URL
 * @param {string} url
 * @returns {string|null}
 */
export function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error("URL parsing error:", e);
    return null;
  }
}

/**
 * Format time (convert milliseconds to readable format)
 * @param {number} milliseconds
 * @returns {string}
 */
export function formatTime(milliseconds) {
  if (milliseconds < 1000) return "Less than 1 second";

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes % 60} minute${minutes % 60 !== 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
}

/**
 * Get today's date string (YYYY-MM-DD)
 * @returns {string}
 */
export function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Apply theme based on settings
 * @param {string} theme
 */
export function applyTheme(theme) {
  // Remove any existing theme classes
  document.body.classList.remove("dark-theme", "theme-system");

  // Apply the selected theme
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
  } else if (theme === "system") {
    document.body.classList.add("theme-system");
  }
  // For 'light' theme, no class is needed as it's the default
}
