const LogButton = ({ children, className, ...props }) => (
  <button 
    {...props}
    className={`w-full bg-violet-600 text-white font-bold py-4 rounded-2xl hover:bg-violet-700 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all ${className}`}
  >
    {children}
  </button>
);

export default LogButton;