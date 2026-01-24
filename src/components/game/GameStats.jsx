/**
 * @file GameStats.jsx
 * @description Tableau de bord des statistiques en temps réel.
 * Affiche la précision, le nombre de notes justes/fausses et la progression dans la partition.
 * Utilise une grille responsive (2 colonnes sur mobile, 4 sur desktop).
 */
import React from 'react';
import { Target, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

/**
 * @param {number} precision - Pourcentage de réussite (0-100).
 * @param {number} correct - Nombre total de notes jouées correctement.
 * @param {number} errors - Nombre total d'erreurs.
 * @param {number} progress - Index de la note actuelle.
 * @param {number} totalNotes - Nombre total de notes dans la partition.
 */
export default function GameStats({ precision, correct, errors, progress, totalNotes }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl mb-6">
      
      <div className="bg-[#1e293b] p-4 rounded-xl border-l-4 border-blue-500 shadow-lg">
        <div className="flex items-center gap-2 text-blue-400 mb-1">
          <Target size={18} />
          <span className="text-sm font-medium">Précision</span>
        </div>
        <p className="text-3xl font-bold text-white">{precision}%</p>
      </div>

      
      <div className="bg-[#1e293b] p-4 rounded-xl border-l-4 border-emerald-500 shadow-lg">
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">Correctes</span>
        </div>
        <p className="text-3xl font-bold text-white">{correct}</p>
      </div>

      
      <div className="bg-[#1e293b] p-4 rounded-xl border-l-4 border-red-500 shadow-lg">
        <div className="flex items-center gap-2 text-red-400 mb-1">
          <XCircle size={18} />
          <span className="text-sm font-medium">Erreurs</span>
        </div>
        <p className="text-3xl font-bold text-white">{errors}</p>
      </div>

      
      <div className="bg-[#1e293b] p-4 rounded-xl border-l-4 border-purple-500 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-2 text-purple-400 mb-1 relative z-10">
          <TrendingUp size={18} />
          <span className="text-sm font-medium">Progression</span>
        </div>
        <p className="text-3xl font-bold text-white relative z-10">
            {progress}<span className="text-xl text-slate-400">/{totalNotes}</span>
        </p>
        
        
        <div 
            className="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all duration-500"
            style={{ width: `${(progress / (totalNotes || 1)) * 100}%` }}
        />
      </div>
      
    </div>
  );
}