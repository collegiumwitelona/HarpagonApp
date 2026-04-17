import React from 'react';


const LoadingSpinner = ({ message = 'Ładowanie...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin"></div>
      {message && (
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
