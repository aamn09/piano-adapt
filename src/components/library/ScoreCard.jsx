/**
 * @file ScoreCard.jsx
 * @description Carte représentant une partition dans la bibliothèque.
 * Gère l'affichage, le survol (hover) avec animation, le lancement du jeu et la suppression.
 * Utilise Framer Motion pour une apparition fluide.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Play, Music, Trash2 } from 'lucide-react';

/**
 * @param {Object} score - Les données de la partition (id, title, profile_id...).
 * @param {Function} onClick - Fonction appelée pour lancer le jeu.
 * @param {Function} onDelete - Fonction appelée pour supprimer la partition.
 * @param {number} index - Position dans la liste (utilisé pour le délai d'animation).
 */
export default function ScoreCard({ score, onClick, onDelete, index }) {
  
  const handleDeleteClick = (e) => {
    e.stopPropagation(); 
    if (window.confirm(`Voulez-vous vraiment supprimer "${score.title}" ?`)) {
      onDelete(score.id);
    }
  };

  return (
    <motion.div
      // Animation d'entrée (Fade In + Slide Up)
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }} // Effet de cascade
      whileHover={{ y: -8 }} // La carte "flotte" au survol
      
      onClick={() => onClick(score)}
      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-blue-900/20 transition-all w-full max-w-[220px]"
    >
      
      
      <button 
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 z-20 p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
        title="Supprimer la partition"
      >
        <Trash2 size={16} />
      </button>

      
      <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors" />
        
        {/* Icône Musique par défaut */}
        <Music className="text-slate-600 group-hover:text-blue-400 transition-colors duration-300" size={48} />
        
        {/* Overlay avec bouton PLAY au survol */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
            <Play fill="white" className="text-white ml-1" size={20} />
          </div>
        </div>
      </div>

      
      <div className="p-4">
        <h3 className="text-white font-bold truncate font-title tracking-wide">
          {score.title}
        </h3>
        <p className="text-slate-400 text-xs mt-1 truncate">
          Partition Piano
        </p>
      </div>
    </motion.div>
  );
}