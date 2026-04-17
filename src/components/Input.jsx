
const Input = ({ 
  label, 
  error = '', 
  disabled = false,
  helperText = '',
  ...props 
}) => (
  <div className="flex flex-col gap-1.5 text-left w-full">
    {label && (
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
        {label}
      </label>
    )}
    <input 
      {...props}
      disabled={disabled}
      className={`w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all shadow-sm ${
        error 
          ? 'border-rose-300 focus:ring-rose-500 focus:bg-rose-50 dark:focus:bg-rose-950/10' 
          : 'border-slate-200 dark:border-slate-700 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-700'
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    />
    {error && (
      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 ml-1">
        {error}
      </span>
    )}
    {helperText && !error && (
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">
        {helperText}
      </span>
    )}
  </div>
);

export default Input;