/**
 * @file Card.jsx
 * @description conteneur stylisé avec effet Glassmorphism.
 * Sert à encadrer les formulaires (Login, Signup) ou les sections importantes.
 */
import React from 'react';

/**
 * @param {React.ReactNode} children - Le contenu à afficher à l'intérieur de la carte.
 * @param {string} className - Classes CSS additionnelles pour ajuster la taille ou les marges.
 */
export default function Card({ children, className = '' }) {
  return (
    <div className={`
      relative overflow-hidden 
      bg-slate-900/60 backdrop-blur-xl border border-white/10 
      p-8 rounded-3xl shadow-2xl 
      ${className}
    `}>
      
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/20 blur-[60px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 blur-[50px] rounded-full pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}