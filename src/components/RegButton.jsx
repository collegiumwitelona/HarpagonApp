import { Link } from "react-router-dom";

const RegButton = ({ text, className = "" }) => {
  return (
    <Link
      to="/register"
      className={`inline-block text-center w-full sm:w-auto px-8 py-4 bg-violet-700 text-white font-semibold rounded-lg shadow-lg shadow-violet-400 hover:bg-violet-800 hover:-translate-y-0.5 transition-all duration-200 ${className}`}
    >
      {text}
    </Link>
  );
};

export default RegButton;