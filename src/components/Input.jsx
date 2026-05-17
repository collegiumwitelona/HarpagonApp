
const Input = ({ 
  label, 
  error = '', 
  disabled = false,
  helperText = '',
  compact = false,
  ...props 
}) => (
  <div className={`flex flex-col text-left w-full ${compact ? 'gap-1' : 'gap-1.5'}`}>
    {label && (
      <label className={`font-semibold text-slate-700 dark:text-slate-300 ml-1 ${compact ? 'text-[0.95rem]' : 'text-sm'}`}>
        {label}
      </label>
    )}
    <input 
      {...props}
      disabled={disabled}
      className={`w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all shadow-sm ${
        compact ? 'px-4 py-2.5' : 'px-5 py-3'
      } ${
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