/**
 * @file backendClient.js
 * @description Couche de service API.
 * Ce fichier centralise toutes les communications asynchrones (Fetch) vers le serveur FastAPI.
 * Il gère l'injection du Token JWT (Sécurité) et le formatage des données (JSON/FormData).
 */

const API_URL = "http://127.0.0.1:8000/api";

// ==========================================
// 1. AUTHENTIFICATION
// ==========================================

/**
 * Inscrit un nouvel utilisateur.
 * @param {Object} userData - { email, password, firstName, lastName }
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response.json();
};

/**
 * Connecte un utilisateur existant.
 * @param {Object} creds - { email, password }
 * @returns {Promise<Object>} Contient le token JWT et les infos user.
 */
export const loginUser = async (creds) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  return response.json();
};


// ==========================================
// 2. GESTION DES PROFILS
// ==========================================

/**
 * Récupère la liste des profils du compte connecté.
 */
export const getProfiles = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/profiles`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

/**
 * Crée un nouveau profil musicien.
 * @param {string} name - Nom du profil (ex: "Mozart")
 * @param {string} icon - Emoji (ex: "🎹")
 * @param {string} color - Classe CSS Tailwind (ex: "from-blue-500...")
 */
export const createProfile = async (name, icon, color) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/profiles`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    // On structure l'objet comme attendu par le Pydantic du backend
    body: JSON.stringify({ name, icon, color }),
  });
  return response.json();
};


// ==========================================
// 3. GESTION DES PARTITIONS (SCORES)
// ==========================================

/**
 * Récupère les partitions associées à un profil spécifique.
 */
export const getProfileScores = async (profileId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/profiles/${profileId}/scores`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

/**
 * Upload un PDF pour conversion.
 * Utilise FormData pour gérer l'envoi de fichier binaire.
 * @param {File} file - Le fichier PDF
 * @param {string} title - Le titre donné par l'utilisateur
 * @param {number} profileId - L'ID du profil à qui appartient la partition
 */
export const uploadScorePdf = async (file, title, profileId) => {
  const token = localStorage.getItem('authToken');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title); 
  
  // On passe profileId en Query Param (?profileId=...)
  const response = await fetch(`${API_URL}/scores/upload-pdf?profileId=${profileId}`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}` 
    },
    body: formData,
  });
  return response.json();
};

/**
 * Supprime une partition (Base de données + Fichiers).
 */
export const deleteScore = async (scoreId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/scores/${scoreId}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  });
  return response.json();
};


// ==========================================
// 4. TÉLÉCHARGEMENT & JEU
// ==========================================

/**
 * Récupère le contenu XML brut d'une partition convertie.
 * Indispensable pour le moteur d'affichage (OSMD).
 * @returns {Promise<string>} Le contenu XML sous forme de texte.
 */
export const getScoreMxl = async (scoreId) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_URL}/scores/${scoreId}/mxl`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Erreur lors du téléchargement du fichier XML");
  }

  // On retourne .text() car le backend a déjà extrait le XML du ZIP
  return response.text();
};