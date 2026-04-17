import React from 'react';


const UserCard = ({ 
  user, 
  isSelected = false, 
  onClick = null,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors ${
        isSelected
          ? 'border-violet-600 bg-violet-100 dark:bg-violet-950 text-slate-900 dark:text-slate-100'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
      } ${className}`}
    >
      <p className="text-xs font-black uppercase tracking-wide">ID: {user.id}</p>
      <p className="text-sm font-semibold mt-1 truncate">{user.email}</p>
    </button>
  );
};

export default UserCard;
