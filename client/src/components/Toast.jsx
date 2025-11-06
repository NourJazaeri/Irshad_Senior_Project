import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: bgColor,
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {type === 'success' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        )}
      </svg>
      <span>{message}</span>
    </div>
  );
};

export default Toast;

