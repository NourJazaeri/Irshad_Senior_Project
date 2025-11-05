import * as React from 'react';

const Dialog = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  );
};

const DialogContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`relative z-50 bg-card rounded-xl border border-border shadow-elevated overflow-hidden ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogHeader = ({ children, className = '' }) => {
  return (
    <div className={`p-6 pb-4 border-b border-border ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle = ({ children, className = '' }) => {
  return (
    <h2 className={`text-xl font-semibold text-foreground ${className}`}>
      {children}
    </h2>
  );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle };


