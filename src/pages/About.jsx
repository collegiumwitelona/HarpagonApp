import React from "react";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';


export default function About() {
    const { t } = useLanguage();
    
  return (
      <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
          <Navbar />
          <main className="grow flex flex-col justify-center items-center px-6 py-4 lg:py-6 bg-hero-blur w-full text-center space-y-12 min-h-0 overflow-y-auto">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white!">
                  About <br />
              </h1>
              <p className="text-lg md:text-xl text-white! leading-relaxed max-w-2xl pt-10">
                  Harpagon to wygodna aplikacja stworzona z myslą o zarządzaniu budżetem domowym. <br /> <br />
                  Projekt studencji wykonany przez:
                  <ul>
                      <li>Julia Kozłowska 44922</li>
                      <li>Stanislav Zhuk 44963</li>
                      <li>Michał Nocuń 40669</li>
                  </ul>
              </p>
          </main>
          <Footer />
      </div>
  );
}