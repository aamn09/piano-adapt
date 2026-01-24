/**
 * @file VirtualKeyboard.jsx
 * @description Clavier visuel pour l'interface de jeu.
 * composant passif, il ne gère pas les événements clavier,
 * il sert uniquement de retour visuel pour montrer quelle touche est détectée.
 */
import React from 'react';

// on se limite à la gamme majeurpour simplifier 
const KEYS = [
  { note: 'Do', key: 'A', type: 'white' },
  { note: 'Ré', key: 'S', type: 'white' },
  { note: 'Mi', key: 'D', type: 'white' },
  { note: 'Fa', key: 'F', type: 'white' },
  { note: 'Sol', key: 'G', type: 'white' },
  { note: 'La', key: 'H', type: 'white' },
  { note: 'Si', key: 'J', type: 'white' },
  { note: 'Do', key: 'K', type: 'white' }, // Octave supérieure
];

/**
 * @param {string} activeKey - La touche actuellement pressée (ex: "A", "G").
 */
export default function VirtualKeyboard({ activeKey }) {
  return (
    <div className="flex flex-col items-center w-full px-4">
      
      {/* Conteneur des touches */}
      <div className="flex justify-center gap-1 sm:gap-2 w-full max-w-3xl">
        {KEYS.map((k, index) => {
          // Vérifie si cette touche est celle active
          const isActive = activeKey === k.key;

          return (
            <div 
              key={index}
              className={`
                relative w-12 sm:w-16 h-32 sm:h-40 rounded-b-lg 
                flex flex-col justify-end items-center pb-3 
                transition-all duration-75 select-none border border-slate-200
                ${k.type === 'white' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}
                ${isActive 
                    ? 'bg-blue-400 translate-y-1 shadow-inner ring-2 ring-blue-500 border-transparent' 
                    : 'shadow-lg hover:bg-slate-50'
                }
              `}
            >
              {/* Nom de la note (Do, Ré...) */}
              <span className="font-bold text-lg mb-2">{k.note}</span>
              
              {/* Badge de raccourci clavier (A, S, D...) */}
              <div className={`
                w-6 h-6 rounded flex items-center justify-center font-mono text-xs shadow-sm
                ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white opacity-70'}
              `}>
                {k.key}
              </div>

              {/* Effet visuel supplémentaire quand actif */}
              {isActive && (
                <div className="absolute inset-0 rounded-b-lg pointer-events-none bg-blue-500/10" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Légende utilisateur */}
      <p className="mt-4 text-slate-500 text-xs sm:text-sm font-medium animate-pulse">
        Utilisez votre clavier pour jouer
      </p>
    </div>
  );
}