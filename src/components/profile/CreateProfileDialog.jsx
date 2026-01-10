/**
 * @file CreateProfileDialog.jsx
 * @description Modale de création de profil utilisateur.
 * Permet de définir le nom, l'avatar  et le thème visuel.
 * Utilise React Query pour rafraîchir la liste des profils après création.
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check } from 'lucide-react';
import { Button } from "../ui/Button"; 
import { Input } from "../ui/Input"; 
import { createProfile } from '../../api/backendClient';

// --- CONFIGURATION DES CHOIX VISUELS ---

const ICONS = ["🎹", "🎻", "🎸", "🎷", "🎺", "🥁", "🎤", "🎼", "🎧", "🎵"];

const COLORS = [
  { label: "Bleu", value: "from-blue-500 to-indigo-500", bg: "bg-blue-500" },
  { label: "Vert", value: "from-emerald-500 to-teal-500", bg: "bg-emerald-500" },
  { label: "Violet", value: "from-purple-500 to-fuchsia-500", bg: "bg-purple-500" },
  { label: "Orange", value: "from-orange-500 to-amber-500", bg: "bg-orange-500" },
  { label: "Rose", value: "from-pink-500 to-rose-500", bg: "bg-pink-500" },
];

/**
 * @param {boolean} open - Visibilité du dialogue.
 * @param {Function} onClose - Fonction de fermeture.
 */
export default function CreateProfileDialog({ open, onClose }) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  
  const queryClient = useQueryClient();

  // Mutation React Query pour gérer l'appel API
  const mutation = useMutation({
    mutationFn: () => createProfile(name, selectedIcon, selectedColor.value),
    onSuccess: () => {
      // Invalide le cache 'profiles' pour forcer le rechargement de la liste
      queryClient.invalidateQueries(['profiles']);
      handleClose();
    },
    onError: (err) => {
      alert("Erreur création profil: " + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  };

  const handleClose = () => {
    setName("");
    setSelectedIcon(ICONS[0]);
    setSelectedColor(COLORS[0]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay sombre */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={handleClose}
      />

      {/* Contenu du modal */}
      <div className="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-title">Nouveau Profil</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Prévisualisation (Avatar rond) */}
          <div className="flex justify-center mb-4">
             <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${selectedColor.value} flex items-center justify-center text-4xl shadow-lg ring-4 ring-slate-800 transition-all duration-300`}>
                {selectedIcon}
             </div>
          </div>

          {/* 2. Champ Nom */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nom du musicien</label>
            <Input 
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mozart"
              className="bg-slate-900 border-slate-700 text-white focus:ring-blue-500"
            />
          </div>

          {/* 3. Sélecteur d'Icône */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Choisir un avatar</label>
            <div className="flex flex-wrap gap-2 justify-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all ${
                    selectedIcon === icon 
                      ? 'bg-white/10 scale-110 shadow-sm ring-1 ring-white/20' 
                      : 'hover:bg-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Sélecteur de Couleur */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Couleur du thème</label>
            <div className="flex gap-3 justify-center">
              {COLORS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedColor(option)}
                  className={`w-10 h-10 rounded-full ${option.bg} transition-transform hover:scale-110 flex items-center justify-center ring-2 ring-offset-2 ring-offset-[#1e293b] ${
                      selectedColor.value === option.value ? 'ring-white scale-110' : 'ring-transparent opacity-70 hover:opacity-100'
                  }`}
                  title={option.label}
                >
                  {selectedColor.value === option.value && <Check size={16} className="text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              onClick={handleClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending || !name}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
            >
              {mutation.isPending ? "Création..." : "Créer le profil"}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}