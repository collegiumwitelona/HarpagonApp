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
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-600',
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-600',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-600',
    },
  };

  const style = styles[type] || styles.error;

  return (
    <div 
      className={`${style.bg} ${style.border} ${style.text} border rounded-xl py-3 px-4 mb-6 flex items-center justify-between ${className}`}
      role="alert"
    >
      <p className={`text-sm font-medium ${style.text}`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-4 text-lg font-semibold ${style.text} opacity-60 hover:opacity-100 transition-opacity`}
        >
          x
        </button>
      )}
    </div>
  );
};

export default AlertCard;
