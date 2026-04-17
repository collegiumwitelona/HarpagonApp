import React from 'react';


const EmptyState = ({ 
  title = 'Brak danych',
  message = 'Nie znaleźliśmy żadnych danych do wyświetlenia',
  icon = '📭',
  className = ''
}) => {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 text-center ${className}`}>
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">{title}</p>
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
