import React from 'react';
import { Link } from "react-router-dom";
import { isAuthenticated } from '../services/auth';

const Logo = () => {
  const targetPath = isAuthenticated() ? '/dashboard' : '/landing';

  return (
    <Link 
      to={targetPath}
      className="text-2xl font-bold tracking-tight text-violet-700 cursor-pointer hover:opacity-80 transition-opacity"
    >
      Harpagon
    </Link>
  );
};

export default Logo;