/**
 * @file GameSettingsDialog.jsx
 * @description Modale de configuration (Pop-up).
 * Permet au joueur de modifier le tempo (BPM), le volume et d'activer les aides visuelles.
 * Utilise un Z-Index élevé (z-[60]) pour passer au-dessus de tout le reste.
 */
import React from 'react';
import { X, Volume2, Clock } from 'lucide-react';

/**
 * @param {boolean} open - Si true, la modale est visible.
 * @param {Function} onClose - Fonction appelée pour fermer la modale.
 * @param {Object} settings - L'objet contenant les réglages actuels ({showNoteNames, bpm, volume}).
 * @param {Function} onUpdate - Fonction pour mettre à jour un réglage (key, value).
 */
export default function GameSettingsDialog({ open, onClose, settings, onUpdate }) {
  // Si la modale est fermée, on ne rend rien pour économiser des ressources
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay sombre (Arrière-plan flouté). Le clic dessus ferme la modale. */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Contenu de la modale */}
      <div className="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl p-6 text-white animate-in zoom-in duration-200">
        
        {/* En-tête avec Titre et Bouton Fermer */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-title">Paramètres</h2>
          <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
        </div>

        <div className="space-y-8">
          
          {/* --- 1. TOGGLE : NOMS DES NOTES --- */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Afficher les noms des notes</p>
              <p className="text-xs text-slate-400">Aide à identifier les notes sur la partition</p>
            </div>
            {/* Bouton Switch personnalisé */}
            <button 
              onClick={() => onUpdate('showNoteNames', !settings.showNoteNames)}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.showNoteNames ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.showNoteNames ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* --- 2. SLIDER : TEMPO (BPM) --- */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium flex items-center gap-2"><Clock size={16}/> Tempo</span>
              <span className="text-blue-400 font-bold">{settings.bpm || 60} BPM</span>
            </div>
            <input 
              type="range" min="40" max="200" 
              value={settings.bpm || 60} // Valeur par défaut de sécurité
              onChange={(e) => onUpdate('bpm', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Lent</span><span>Rapide</span>
            </div>
          </div>

          {/* --- 3. SLIDER : VOLUME MÉTRONOME --- */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium flex items-center gap-2"><Volume2 size={16}/> Volume métronome</span>
              <span className="text-blue-400 font-bold">{settings.volume || 50}%</span>
            </div>
            <input 
              type="range" min="0" max="100" 
              value={settings.volume || 50} // Valeur par défaut de sécurité
              onChange={(e) => onUpdate('volume', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Silencieux</span><span>Fort</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}