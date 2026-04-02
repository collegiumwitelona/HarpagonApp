import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-3 border-t border-slate-200 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-sm text-slate-500 mb-2">
          &copy; {currentYear} Harpagon. Wszelkie prawa zastrzeżone.
        </p>
        <p className="text-xs text-slate-400 uppercase tracking-widest">
          Projekt studencki • Collegium Witelona W Legnicy
        </p>
      </div>
    </footer>
  );
};

export default Footer;