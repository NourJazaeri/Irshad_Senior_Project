import React, { useEffect, useState } from 'react';

const TOAST_DURATION_MS = 3000;

const toastStyles = {
  container: {
    position: 'fixed',
    top: 16,
    right: 16,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  toast: (type) => ({
    minWidth: 260,
    maxWidth: 420,
    padding: '12px 16px',
    borderRadius: 10,
    boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
    color: '#111827',
    background: type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#eef2ff',
    border: `1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : '#e0e7ff'}`,
    fontSize: 14,
    lineHeight: '20px'
  })
};

export default function ToastPortal() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (e) => {
      const id = Date.now() + Math.random();
      const { message, type = 'info', duration = TOAST_DURATION_MS } = e.detail || {};
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    };
    window.addEventListener('app:toast', onToast);
    return () => window.removeEventListener('app:toast', onToast);
  }, []);

  return (
    <div style={toastStyles.container}>
      {toasts.map((t) => (
        <div key={t.id} style={toastStyles.toast(t.type)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}



