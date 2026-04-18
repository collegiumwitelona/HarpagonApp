import React from 'react';
import RegButton from '../components/RegButton';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from "react-router-dom";
import { useLanguage } from '../context/LanguageContext';

const LandingPage = () => {
  const { t } = useLanguage();

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar>
        <Link to="/login" className="px-5 py-2.5 font-medium hover:text-violet-700">
          {t('common.login')}
        </Link>
      </Navbar>

      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full text-center space-y-12">
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white!">
          {t('landing.titleStart')} <br />
          <span className="text-violet-700">{t('landing.titleAccent')}</span>
        </h1>
        
        <p className="text-lg md:text-xl text-white! leading-relaxed max-w-2xl pt-10">
          {t('landing.description')}
        </p>

        <div className="pt-10">
          <RegButton 
            text={t('common.register')} 
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};
export default LandingPage;