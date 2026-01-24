import React from 'react';
// Fenetre qui apparait quand l'ia detecte un pb (ou quand on veut debug)
export default function AgencyModal({ isOpen, data, onChoice }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-indigo-500/50 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-in fade-in zoom-in duration-200">
        
        <h2 className="text-xl font-bold text-white mb-2">🎹 {data.title}</h2>
        <p className="text-slate-300 mb-6">{data.message}</p>

        <div className="space-y-3">
          {data.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onChoice(opt.action)}
              className="w-full p-4 text-left rounded-xl bg-slate-700 hover:bg-indigo-600 border border-white/5 hover:border-indigo-400 transition-all group"
            >
              <div className="font-bold text-white group-hover:text-white">{opt.label}</div>
              <div className="text-xs text-slate-400 group-hover:text-indigo-200">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}