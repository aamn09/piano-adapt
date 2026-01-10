/**
 * @file ProfileSelectionPage.jsx
 * @description Écran de sélection du profil utilisateur 
 * Affiche les avatars des musiciens créés, permet d'en ajouter de nouveaux (max 5)
 * et gère la navigation vers la bibliothèque personnelle du profil choisi.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, LogOut, Loader2 } from 'lucide-react';
import { getProfiles } from '../api/backendClient';
import { useAuthStore } from '../store/authStore';
import CreateProfileDialog from '../components/profile/CreateProfileDialog';

export default function ProfileSelectionPage() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // On récupère les actions du store global
  const { logout, selectProfile } = useAuthStore();

  /**
   * RÉCUPÉRATION DES PROFILS
   * useQuery gère automatiquement le cache et l'état de chargement.
   */
  const { data, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
  });

  const profiles = data?.profiles || [];

  /**
   * Gère la sélection d'un musicien.
   * On met à jour le store global et on navigue vers sa bibliothèque.
   */
  const handleSelectProfile = (profile) => {
    selectProfile(profile.profileId);
    navigate('/library');
  };

  /**
   * Gère la déconnexion complète du compte.
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * Mapping des thèmes couleurs (Tailwind) reçus du backend
   */
  const gradients = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-emerald-400 to-teal-600",
    purple: "from-violet-500 to-fuchsia-600",
    orange: "from-orange-400 to-red-500",
    pink: "from-pink-500 to-rose-500",
  };

  return (
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden font-sans">
      {/* Configuration de la police Outfit */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap');
          .font-title { font-family: 'Outfit', sans-serif; }
        `}
      </style>

      {/* --- ÉLÉMENTS DÉCORATIFS --- */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />

      {/* --- BOUTON DÉCONNEXION --- */}
      <header className="absolute top-6 right-6 z-20">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition-all text-sm font-medium border border-white/5"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </header>

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="container mx-auto px-6 h-screen flex flex-col items-center justify-center relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight font-title">
            Qui joue aujourd'hui ?
          </h1>
          <p className="text-slate-400">Sélectionnez un profil pour accéder à vos partitions.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <span className="text-slate-500 animate-pulse">Chargement des musiciens...</span>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-10">
            
            {/* --- LISTE DES PROFILS EXISTANTS --- */}
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.profileId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                onClick={() => handleSelectProfile(profile)}
                className="group cursor-pointer flex flex-col items-center gap-4"
              >
                {/* Avatar avec cercle dégradé (Bordure animée) */}
                <div className={`relative w-36 h-36 rounded-full p-[3px] bg-gradient-to-br ${gradients[profile.color] || gradients.blue} shadow-2xl shadow-blue-900/20`}>
                  
                  {/* Conteneur de l'icône (Emoji) */}
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-slate-900 relative">
                     <span className="text-5xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                       {profile.icon || "🎹"}
                     </span>
                  </div>
                  
                  {/* Halo lumineux au survol */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradients[profile.color] || gradients.blue} opacity-0 group-hover:opacity-60 blur-xl transition-opacity duration-500 -z-10`} />
                </div>
                
                {/* Nom du profil */}
                <span className="text-xl text-slate-300 font-medium group-hover:text-white transition-colors font-title tracking-wide">
                  {profile.name}
                </span>
              </motion.div>
            ))}

            {/* --- BOUTON "AJOUTER UN PROFIL" --- */}
            {/* Condition : On limite à 5 profils par compte */}
            {profiles.length < 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: profiles.length * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                onClick={() => setShowCreateDialog(true)}
                className="group cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-36 h-36 rounded-full bg-white/5 border-2 border-dashed border-slate-600 group-hover:border-slate-400 group-hover:bg-white/10 flex items-center justify-center transition-all shadow-xl">
                  <Plus className="text-slate-500 group-hover:text-slate-200 transition-transform group-hover:rotate-90" size={48} />
                </div>
                
                <span className="text-xl text-slate-500 font-medium group-hover:text-slate-300 transition-colors font-title tracking-wide">
                  Ajouter
                </span>
              </motion.div>
            )}

          </div>
        )}
      </div>

      {/* --- MODALE DE CRÉATION DE PROFIL --- */}
      <CreateProfileDialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
      />
    </div>
  );
}