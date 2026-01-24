import React from 'react';
import { X, Activity, Eye, Zap, Bug } from 'lucide-react';

export default function DebugPanel({ isOpen, onClose, aiState, setAiState, triggerIntervention }) {
  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setAiState(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  // Protection : Si une valeur est undefined, on met 0 par défaut
  const safeState = {
    wrong_note_rate: aiState?.wrong_note_rate || 0,
    timing_jitter: aiState?.timing_jitter || 0,
    reading_fluency: aiState?.reading_fluency !== undefined ? aiState.reading_fluency : 1, // Lui par défaut c'est 1
    mental_load: aiState?.mental_load || 0
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-white/10 p-4 overflow-y-auto z-[100] shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-indigo-400 flex items-center gap-2">
          <Bug size={18} /> VARIABLES IA
        </h2>
        <button onClick={onClose}><X size={20} /></button>
      </div>

      <div className="space-y-6">
        {/* AUDIO */}
        <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-white/5">
          <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Activity size={14}/> Audio (Simulé)</h3>
          
          <div>
            <label className="text-xs flex justify-between mb-1">Taux d'erreur ({Math.round(safeState.wrong_note_rate * 100)}%)</label>
            <input 
              type="range" min="0" max="1" step="0.05" 
              value={safeState.wrong_note_rate} 
              onChange={(e) => handleChange('wrong_note_rate', e.target.value)}
              className="w-full accent-red-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs flex justify-between mb-1">Jitter / Rythme ({safeState.timing_jitter}ms)</label>
            <input 
              type="range" min="0" max="200" step="10" 
              value={safeState.timing_jitter} 
              onChange={(e) => handleChange('timing_jitter', e.target.value)}
              className="w-full accent-orange-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* EYE TRACKING */}
        <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-white/5">
          <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Eye size={14}/> Oculométrie</h3>
          
          <div>
            <label className="text-xs flex justify-between mb-1">Fluidité Lecture ({Math.round(safeState.reading_fluency * 100)}%)</label>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={safeState.reading_fluency} 
              onChange={(e) => handleChange('reading_fluency', e.target.value)}
              className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* FUSION */}
        <div className="pt-4 border-t border-white/10">
            <button 
            onClick={triggerIntervention}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
            <Zap size={14} /> TRIGGER AGENCY (TEST)
            </button>
        </div>
      </div>
    </div>
  );
}