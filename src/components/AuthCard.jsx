import React from 'react';

const AuthCard = ({ title, children, scrollClassName = 'pr-1', compact = false }) => (
  <div className={`relative z-10 w-full bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden ${
    compact ? 'max-w-94 h-110 rounded-[2.25rem] p-5 md:p-6' : 'max-w-sm h-112 rounded-[2.5rem] p-8 md:p-10'
  }`}>
    <h2 className={`font-bold text-center text-slate-900 ${compact ? 'text-[1.95rem] leading-[1.1] mb-4' : 'text-3xl mb-8'}`}>
      {title}
    </h2>

    <div className={`grow min-h-0 overflow-y-auto custom-scrollbar ${scrollClassName}`}>
      {children}
    </div>
  </div>
);

export default AuthCard;