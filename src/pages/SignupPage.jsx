/**
 * @file SignupPage.jsx
 * @description Page de création de compte.
 * Gère l'inscription des nouveaux utilisateurs en envoyant les données au Backend.
 * Inclut une gestion d'erreur détaillée pour guider l'utilisateur en cas de formulaire mal rempli.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Music4 } from 'lucide-react';
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { registerUser } from '../api/backendClient';
import { useAuthStore } from '../store/authStore';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  // On récupère l'action login du store pour connecter l'utilisateur auto après inscription
  const { login } = useAuthStore();

  /**
   * Envoie les données d'inscription au serveur.
   * Format attendu par le Backend : { email, password, firstName, lastName }
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await registerUser({ 
        email,
        password,
        firstName, // Format CamelCase pour correspondre au schéma Pydantic du Backend
        lastName 
      });
      
      // Si l'inscription réussit, le backend renvoie souvent un token directement
      if (result.success || result.token) {
        if (result.token) {
          // Connexion automatique
          login(result.user, result.token, []);
          navigate('/select-profile');
        } else {
          // Sinon redirection vers login
          navigate('/login');
        }
      } 
      /**
       * GESTION DES ERREURS BACKEND
       * Si FastAPI renvoie des erreurs de validation (422 Unprocessable Entity),
       * on les parse pour afficher un message clair.
       */
      else {
        let msg = "Erreur d'inscription.";
        if (result.detail && Array.isArray(result.detail)) {
          // On transforme le tableau d'erreurs technique en texte lisible
          msg = result.detail.map(err => 
            `👉 Champ '${err.loc[1]}' : ${err.msg}`
          ).join('\n');
        } else if (result.error) {
          msg = result.error;
        }
        alert(msg);
      }
    } catch (error) {
      alert("Le serveur ne répond pas. Veuillez réessayer plus tard.");
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

      {/* --- EFFETS VISUELS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-blue-500/20">
            <Music4 className="text-white" size={32} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 font-title tracking-tight">
            Piano Adapt
          </h1>
          <p className="text-slate-400 text-lg font-light">Créez votre compte parent</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* GRILLE : PRÉNOM & NOM */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <Input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-slate-900/50 border-white/10 pl-10 h-12 text-white focus:ring-blue-500 transition-all"
                    placeholder="Jean"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <Input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-slate-900/50 border-white/10 pl-10 h-12 text-white focus:ring-blue-500 transition-all"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
            </div>

            {/* EMAIL */}
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

            {/* MOT DE PASSE */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900/50 border-white/10 pl-10 h-12 text-white focus:ring-blue-500 transition-all"
                  placeholder="8+ caractères"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 text-base"
            >
              Créer mon compte
            </Button>
          </form>

          {/* LIEN VERS CONNEXION */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm">
              Déjà inscrit ?{' '}
              <button 
                onClick={() => navigate('/login')}
                className="text-blue-400 font-bold hover:text-blue-300 transition-colors"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}