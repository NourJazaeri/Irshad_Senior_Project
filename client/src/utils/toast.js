export function showToast(message, type = 'info', duration = 3000) {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type, duration } }));
}

// Soft override for window.alert to use toast instead of blocking modal
if (typeof window !== 'undefined' && !window.__APP_ALERT_OVERRIDDEN__) {
  const originalAlert = window.alert?.bind(window);
  window.alert = (msg) => {
    const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
    const normalized = text?.toLowerCase?.() || '';
    const type = normalized.includes('success') ? 'success' : normalized.includes('error') ? 'error' : 'info';
    showToast(text, type);
    // Keep original in console for debugging if needed
    if (originalAlert && import.meta.env?.DEV) {
      console.debug('[alert -> toast]', text);
    }
  };
  window.__APP_ALERT_OVERRIDDEN__ = true;
}


