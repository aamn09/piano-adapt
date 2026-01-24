/**
 * @file App.jsx
 * @description Point d'entrée principal  de l'application React.
 * Ce fichier configure :
 * Le Routage : Définit quelle URL affiche quelle page.
 * React Query : Gère le cache et les appels API.
 * La Réhydratation : Récupère les profils si l'utilisateur est déjà connecté.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { useAuthStore } from './store/authStore';
import { getProfiles } from './api/backendClient';


import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfileSelectionPage from './pages/ProfileSelectionPage';
import LibraryPage from './pages/LibraryPage';
import GamePage from './pages/GamePage';


const queryClient = new QueryClient();

export default function App() {

  const { isAuthenticated, setProfiles } = useAuthStore();
 
  useEffect(() => {
    async function rehydrate() {
      if (isAuthenticated) {
        try {
          const data = await getProfiles();
          if (data.success) {
            setProfiles(data.profiles);
          }
        } catch (error) {
          console.error("Échec de la récupération des profils au démarrage", error);
        }
      }
    }
    rehydrate();
  }, [isAuthenticated, setProfiles]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* routes publiques */}
            {/* Si l'utilisateur arrive sur la racine '/', on l'envoie vers le login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* routes privées */}
            {/* Sélection du profil (Qui joue ?) */}
            <Route path="/select-profile" element={<ProfileSelectionPage />} />
            
            {/* Bibliothèque des partitions du profil sélectionné */}
            <Route path="/library" element={<LibraryPage />} />
            
            {/* Page de jeu (L'ID de la partition est passé en paramètre d'URL :scoreId) */}
            <Route path="/game/:scoreId" element={<GamePage />} />
            
         
            {/* Si l'utilisateur tape n'importe quoi dans l'URL, on le ramène au login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}