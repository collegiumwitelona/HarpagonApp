import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from "react-router-dom";

const LoginPage = () => {
  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar />

      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full relative">
        
        <div className="relative z-10 max-w-sm w-full bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100">
          
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">
            Zaloguj się do <span className="text-violet-700">Harpagon</span>
          </h2>

          <form className="space-y-1" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                E-mail
              </label>
              <input 
                type="email" 
                placeholder="Twój adres e-mail"
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Hasło
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-violet-600 text-white font-bold py-4 rounded-2xl hover:bg-violet-700 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all mt-4"
            >
              <Link to="/dashboard" className="px-5 py-2.5 font-medium block w-full">
                Zaloguj się
              </Link>
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            <p>Nie masz konta? <Link to="/register" className="text-violet-700 font-bold hover:underline">Zarejestruj się</Link></p>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;