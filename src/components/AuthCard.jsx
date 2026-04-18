import React from 'react';

const AuthCard = ({ title, children, scrollClassName = 'pr-1' }) => (
  <div className="relative z-10 max-w-sm w-full h-112 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
    <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">{title}</h2>

    <div className={`grow min-h-0 overflow-y-auto custom-scrollbar ${scrollClassName}`}>
      {children}
    </div>
  </div>
);

export default AuthCard;