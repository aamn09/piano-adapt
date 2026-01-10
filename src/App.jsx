/**
 * @file App.jsx
 * @description Point d'entrée principal  de l'application React.
 * Ce fichier configure :
 * 1. Le Routage : Définit quelle URL affiche quelle page.
 * 2. React Query : Gère le cache et les appels API.
 * 3. La Réhydratation : Récupère les profils si l'utilisateur est déjà connecté.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// TanStack Query : Librairie puissante pour gérer l'état asynchrone (chargement, cache)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { useAuthStore } from './store/authStore';
import { getProfiles } from './api/backendClient';

// --- IMPORT DES PAGES ET LAYOUTS ---
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfileSelectionPage from './pages/ProfileSelectionPage';
import LibraryPage from './pages/LibraryPage';
import GamePage from './pages/GamePage';

// Création d'une instance unique de QueryClient
const queryClient = new QueryClient();

export default function App() {
  // On extrait l'état de connexion et la fonction de mise à jour des profils du store global
  const { isAuthenticated, setProfiles } = useAuthStore();
  
  /**
   * EFFET DE RÉHYDRATATION
   * S'exécute au chargement de l'application.
   * Si un token est présent (utilisateur connecté), on va chercher ses profils au backend
   * pour que le store soit à jour immédiatement.
   */
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
    // QueryClientProvider : Indispensable pour utiliser useQuery/useMutation dans les composants enfants
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* AppLayout : Enveloppe toutes les routes pour appliquer le fond animé et le style global */}
        <AppLayout>
          <Routes>
            {/* --- REDIRECTIONS & ROUTES PUBLIQUES --- */}
            {/* Si l'utilisateur arrive sur la racine '/', on l'envoie vers le login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* --- ROUTES PRIVÉES (LOGIQUE APPLICATIVE) --- */}
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