/**
 * @file LibraryPage.jsx
 * @description Page principale de l'utilisateur.
 * Affiche la grille des partitions disponibles pour le profil sélectionné.
 * Permet de rechercher, d'ajouter (Upload PDF) et de supprimer des partitions.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, Settings, LogOut, Search, User, Music } from 'lucide-react';
import { getProfileScores, getProfiles, deleteScore } from '../api/backendClient';
import UploadScoreDialog from '../components/library/UploadScoreDialog';
import ScoreCard from '../components/library/ScoreCard';

export default function LibraryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // On récupère l'ID du profil actif depuis le LocalStorage
  const profileId = localStorage.getItem('selectedProfileId'); // Attention: c'est souvent 'selectedProfileId' dans authStore
  
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. RÉCUPÉRATION DES DONNÉES (Profil & Partitions) ---
  
  // Charge la liste complète des profils pour afficher le nom/avatar en haut
  const { data: profilesData } = useQuery({ 
    queryKey: ['profiles'], 
    queryFn: getProfiles 
  });
  
  // Trouve le profil actuel dans la liste
  const currentProfile = profilesData?.profiles?.find(p => p.profileId.toString() === profileId);

  // Charge les partitions spécifiques à ce profil
  const { data: scoresData, isLoading } = useQuery({
    queryKey: ['scores', profileId],
    queryFn: () => getProfileScores(profileId),
    enabled: !!profileId // Ne lance la requête que si on a un ID
  });

  // --- 2. GESTION DE LA SUPPRESSION ---
  const deleteMutation = useMutation({
    mutationFn: (scoreId) => deleteScore(scoreId),
    onSuccess: () => {
      // Rafraîchit la liste instantanément après suppression
      queryClient.invalidateQueries(['scores', profileId]);
    },
    onError: (err) => {
      alert("Impossible de supprimer cette partition. " + err);
    }
  });

  // Filtrage local (Recherche)
  const scores = scoresData?.scores || [];
  const filteredScores = scores.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // Fallback couleur par défaut si le profil n'est pas encore chargé
  const profileColorClass = currentProfile?.color || "from-slate-500 to-slate-700";

  return (
    <div className="flex h-screen bg-[#0f172a] text-white font-sans overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap');
        .font-title { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* --- SIDEBAR DE NAVIGATION (Gauche) --- */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-white/5 flex flex-col justify-between p-4 z-20">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-10 mt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-bold text-xl">P</span>
            </div>
            <span className="font-title font-bold text-2xl hidden lg:block tracking-tight">PianoAdapt</span>
          </div>

          {/* Menu Principal */}
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-4 px-4 py-3 bg-white/10 text-blue-400 rounded-xl transition-colors">
              <LayoutGrid size={20} />
              <span className="font-medium hidden lg:block">Bibliothèque</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <User size={20} />
              <span className="font-medium hidden lg:block">Profil</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <Settings size={20} />
              <span className="font-medium hidden lg:block">Réglages</span>
            </button>
          </nav>
        </div>

        {/* Bouton Déconnexion / Changement Profil */}
        <button 
          onClick={() => navigate('/select-profile')}
          className="flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium hidden lg:block">Changer profil</span>
        </button>
      </aside>

      {/* --- CONTENU PRINCIPAL (Droite) --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Dégradé décoratif en haut de page */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />

        {/* Header (Barre supérieure) */}
        <header className="h-20 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-title font-bold text-slate-200">
              Bonjour, <span className="text-white">{currentProfile?.name || "Musicien"}</span>
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Barre de Recherche */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher une partition..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-white placeholder-slate-500"
              />
            </div>
            
            {/* Avatar du Profil Actif */}
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${profileColorClass} flex items-center justify-center border-2 border-slate-800 shadow-md`}>
              {currentProfile?.icon || "🎹"}
            </div>
          </div>
        </header>

        {/* Zone de Contenu (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          
          {/* Titre de section + Bouton Ajouter */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white font-title">Vos Partitions</h3>
            <button 
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Ajouter une partition</span>
            </button>
          </div>

          {/* Grille des Partitions */}
          {isLoading ? (
            <div className="text-center py-20 text-slate-500 animate-pulse">Chargement de votre bibliothèque...</div>
          ) : filteredScores.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredScores.map((score, idx) => (
                <ScoreCard 
                  key={score.id} 
                  score={score} 
                  index={idx} 
                  onClick={() => navigate(`/game/${score.id}`)} 
                  onDelete={(id) => deleteMutation.mutate(id)} 
                />
              ))}
            </div>
          ) : (
            /* État Vide  */
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Music className="text-slate-500" size={32} />
              </div>
              <p className="text-slate-300 font-medium text-lg">C'est un peu vide ici...</p>
              <p className="text-slate-500 text-sm mb-6">Importez votre première partition PDF pour commencer.</p>
              <button 
                onClick={() => setShowUpload(true)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors"
              >
                Importer un PDF
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modale d'Upload */}
      <UploadScoreDialog 
        open={showUpload} 
        onClose={() => setShowUpload(false)} 
        profileId={profileId} 
      />
    </div>
  );
}