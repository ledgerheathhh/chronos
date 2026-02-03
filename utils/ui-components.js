/**
 * Chronos UI Components Library
 * Provides reusable UI components for loading states, error handling, and accessibility
 */

export const LoadingState = {
  showSpinner(element, message = 'Loading...') {
    element.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-light);">
        <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i>
        <div style="font-size: 14px;">${message}</div>
      </div>
    `;
  },

  showSkeleton(element, lines = 3) {
    const skeletonHTML = Array(lines).fill(0).map((_, i) => `
      <div style="
        height: 20px;
        width: ${i === lines - 1 ? '60%' : '100%'};
        margin-bottom: 8px;
        background: linear-gradient(90deg, var(--border-color) 25%, #f1f5f9 50%, var(--border-color) 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: var(--radius-sm);
      "></div>
    `).join('');
    
    element.innerHTML = `<div style="padding: 16px;">${skeletonHTML}</div>`;
  }
};

export const ErrorState = {
  show(element, message = 'Something went wrong', retryFn = null) {
    const retryButton = retryFn ? `
      <button onclick="(${retryFn})()" style="
        margin-top: 16px;
        padding: 8px 16px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 14px;
      ">Retry</button>
    ` : '';
    
    element.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--error-color, #e74c3c);">
        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.8;"></i>
        <div style="font-size: 16px; font-weight: 500;">${message}</div>
        ${retryButton}
      </div>
    `;
  }
};

export const EmptyState = {
  show(element, message = 'No data available', submessage = '') {
    element.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-light);">
        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">${message}</div>
        ${submessage ? `<div style="font-size: 14px; opacity: 0.8;">${submessage}</div>` : ''}
      </div>
    `;
  }
};

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
