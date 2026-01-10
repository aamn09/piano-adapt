/**
 * @file LoginPage.jsx
 * @description Page d'authentification des utilisateurs.
 * Gère la saisie des identifiants, l'appel à l'API de connexion et 
 * la redirection vers la sélection de profil en cas de succès.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Music4 } from 'lucide-react';
import { Button } from "../components/ui/Button"; 
import { Input } from "../components/ui/Input";  
import { loginUser } from '../api/backendClient';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  // On récupère l'action login du store global
  const { login } = useAuthStore();

  /**
   * Traitement du formulaire de connexion
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await loginUser({ email, password });
      
      if (result.success) {
        // On utilise le store pour enregistrer le token, l'user et les profils d'un coup
        login(result.user, result.token, result.profiles);
        // Redirection vers l'étape suivante : choix du musicien
        navigate('/select-profile');
      } else {
        alert(result.error || "Erreur lors de la connexion");
      }
    } catch (error) {
      alert("Impossible de joindre le serveur.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap');
          .font-title { font-family: 'Outfit', sans-serif; }
        `}
      </style>

      {/* --- DÉCO D'ARRIÈRE-PLAN--- */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* LOGO & TITRE */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-blue-500/20">
            <Music4 className="text-white" size={32} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 font-title tracking-tight">
            Piano Adapt
          </h1>
          <p className="text-slate-400 text-lg font-light">Bienvenue !</p>
        </div>

        {/* FORMULAIRE DANS UNE CARTE STYLE */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Champ Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-900/50 border-white/10 pl-10 h-12 text-white focus:ring-blue-500 transition-all"
                  placeholder="nom@exemple.com"
                  required
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900/50 border-white/10 pl-10 h-12 text-white focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Bouton de Validation */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 text-base"
            >
              Se connecter
            </Button>
          </form>

          {/* LIEN VERS INSCRIPTION */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm">
              Pas encore de compte ?{' '}
              <button 
                onClick={() => navigate('/signup')}
                className="text-blue-400 font-bold hover:text-blue-300 transition-colors"
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}