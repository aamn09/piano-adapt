/**
 * @file backendClient.js
 * @description Couche de service API.
 * Gère la communication avec le Backend Python (FastAPI).
 */

const hostname = window.location.hostname;
const PORT = 8000; 
const API_URL = `http://${hostname}:${PORT}/api`;

console.log(`Backend ciblé : ${API_URL}`);

// ==========================================
// authentification
// ==========================================

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response.json();
};

export const loginUser = async (creds) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  return response.json();
};

// ==========================================
// profils
// ==========================================

export const getProfiles = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/profiles`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

export const createProfile = async (name, icon, color) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/profiles`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ name, icon, color }),
  });
  return response.json();
};

// ==========================================
// partitions
// ==========================================

export const getProfileScores = async (profileId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/profiles/${profileId}/scores`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

export const uploadScorePdf = async (file, title, profileId) => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title); 
  
  const response = await fetch(`${API_URL}/scores/upload-pdf?profileId=${profileId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return response.json();
};

export const deleteScore = async (scoreId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/scores/${scoreId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// ==========================================
// moteur de jeu
// ==========================================

/**
 * Récupère le XML brut (pour l'affichage visuel OSMD uniquement)
 */
export const getScoreMxl = async (scoreId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/scores/${scoreId}/mxl`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Erreur XML");
  return response.text();
};

/**
 * récupère les notes du format xml et les transforme en JSON exploitable par le jeu
 */
export const getScoreJson = async (scoreId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/scores/${scoreId}/json`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Erreur JSON Notes");
  return response.json();
};

// ==========================================
// sauvegarde et ia
// ==========================================

// enregistre une session de jeu
export const saveGameSession = async (scoreId, duration, accuracy, aiStats) => {
  const token = localStorage.getItem('authToken');
  const aiLogsString = JSON.stringify(aiStats);

  const response = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({
      score_id: scoreId ? parseInt(scoreId) : null,
      duration_seconds: duration,
      accuracy: accuracy,
      ai_logs: aiLogsString
    }),
  });
  return response.json();
};