import React from 'react';
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <Link 
      to="/landing" 
      className="text-2xl font-bold tracking-tight text-violet-700 cursor-pointer hover:opacity-80 transition-opacity"
    >
      Harpagon
    </Link>
  );
};

export default Logo;