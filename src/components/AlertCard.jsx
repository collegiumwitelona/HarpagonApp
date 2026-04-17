import React from 'react';


const AlertCard = ({ 
  type = 'error', 
  message, 
  show = true,
  onClose = null,
  className = '' 
}) => {
  if (!show || !message) return null;

  const styles = {
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-100 dark:border-rose-900/30',
      text: 'text-rose-600 dark:text-rose-400',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-100 dark:border-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-100 dark:border-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
    },
  };

  const style = styles[type] || styles.error;

  return (
    <div 
      className={`${style.bg} ${style.border} ${style.text} border rounded-xl py-3 px-4 mb-6 flex items-center justify-between ${className}`}
      role="alert"
    >
      <p className="text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-lg font-semibold opacity-60 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default AlertCard;
