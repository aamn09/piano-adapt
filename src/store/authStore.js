/**
 * @file authStore.js
 * @description Store global géré par Zustand.
 * persiste les données dans le LocalStorage
 * pour que l'utilisateur reste connecté même s'il rafraîchit la page.
 */
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  
  // --- ÉTAT INITIAL ---
  // On essaie de lire le localStorage au démarrage 
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('authToken') || null,
  isAuthenticated: !!localStorage.getItem('authToken'), // Transforme la présence du token en booléen 
  profiles: [], // Liste vide au départ
  
  // On force la conversion en Nombre 
  selectedProfileId: localStorage.getItem('selectedProfileId') ? Number(localStorage.getItem('selectedProfileId')) : null,

  
  /**
   * Connecte l'utilisateur et sauvegarde la session.
   * @param {Object} user - Infos utilisateur (email, nom...).
   * @param {string} token - Jeton JWT de sécurité.
   * @param {Array} profiles - Liste des profils associés.
   */
  login: (user, token, profiles = []) => {
    // 1. Sauvegarde disque 
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // 2. Mise à jour mémoire (React)
    set({ 
      user, 
      token, 
      isAuthenticated: true, 
      profiles 
    });
  },

  /**
   * Déconnecte l'utilisateur et nettoie tout.
   */
  logout: () => {
    localStorage.clear(); // Grand nettoyage
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      profiles: [], 
      selectedProfileId: null 
    });
  },

  /**
   * Remplace toute la liste des profils (ex: au chargement de l'app).
   */
  setProfiles: (profiles) => set({ profiles }),

  /**
   * Ajoute un seul profil à la liste existante.
   */
  addProfile: (newProfile) => set((state) => ({ 
    profiles: [...state.profiles, newProfile] 
  })),

  /**
   * Sélectionne le profil actif 
   */
  selectProfile: (profileId) => {
    localStorage.setItem('selectedProfileId', profileId);
    set({ selectedProfileId: Number(profileId) });
  }
}));