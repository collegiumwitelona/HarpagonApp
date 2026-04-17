import React from 'react';


const InfoCard = ({ 
  label, 
  value, 
  fullWidth = false,
  className = ''
}) => {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 ${fullWidth ? 'col-span-full' : ''} ${className}`}>
      <p className="text-[11px] uppercase tracking-wider font-black text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 break-all">
        {value || '—'}
      </p>
    </div>
  );
};

export default InfoCard;
