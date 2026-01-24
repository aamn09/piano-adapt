/**
 * @file AppLayout.jsx
 * @description Structure globale  de l'application.
 * Ce composant enveloppe toutes les pages pour leur fournir un fond commun
 * et une ambiance visuelle unifiée
 */
import React from 'react';
import { motion } from 'framer-motion';

/**
 * @param {React.ReactNode} children - Le contenu de la page active (injecté par le React Router).
 */
export default function AppLayout({ children }) {
  return (
    // Conteneur principal plein écran (w-screen h-screen)
    
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white">
      
      
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          // Animation 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          
          className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.15),transparent_60%)]"
        />
      </div>

      {/* z-10 : Passe au-dessus du fond animé pour être lisible et cliquable */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}