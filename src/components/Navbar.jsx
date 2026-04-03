import React from 'react';
import Logo from './Logo';

const Navbar = ({ children }) => {
  return (
    <nav className="flex items-center justify-between px-8 h-16 bg-white border-b border-slate-200 w-full">
      <Logo />
      <div className="flex items-center gap-4 min-h-10">
        {children}
      </div>
    </nav>
  );
};

export default Navbar;