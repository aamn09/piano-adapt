/**
 * @file UploadScoreDialog.jsx
 * @description Modale d'importation de nouvelles partitions.
 * Permet à l'utilisateur de sélectionner un fichier PDF et de lui donner un titre.
 * Gère l'état de chargement (conversion Audiveris) et met à jour la bibliothèque en temps réel.
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UploadCloud, Loader2, FileText, Type } from 'lucide-react';
import { Button } from "../ui/Button";
import { Input } from "../ui/Input"; 
import { uploadScorePdf } from '../../api/backendClient';

/**
 * @param {boolean} open 
 * @param {Function} onClose 
 * @param {number} profileId 
 */
export default function UploadScoreDialog({ open, onClose, profileId }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(""); 
  
  // React Query Client pour rafraîchir les données après modification
  const queryClient = useQueryClient();

  // Mutation pour gérer l'appel asynchrone d'upload
  const mutation = useMutation({
    mutationFn: ({ file, title }) => uploadScorePdf(file, title, profileId),
    onSuccess: () => {
      // Si ça marche, on force le re-téléchargement de la liste des partitions
      queryClient.invalidateQueries(['scores', profileId]);
      handleClose();
    },
    onError: (err) => {
      
      alert("Erreur upload : " + err.message);
    }
  });

  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setTitle(selectedFile.name.replace('.pdf', ''));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || !title) return;
    mutation.mutate({ file, title });
  };

  // Reset du formulaire à la fermeture
  const handleClose = () => {
    setFile(null);
    setTitle("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      
      <div className="relative w-full max-w-lg bg-[#1e293b] border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-title">Ajouter une partition</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        
        {mutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <div className="text-center">
              <p className="text-white font-medium text-lg">Analyse de la partition...</p>
              <p className="text-slate-400 text-sm">Conversion de "{title}" par l'IA Audiveris.</p>
            </div>
          </div>
        ) : (
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            
            <div className="relative border-2 border-dashed border-slate-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors group cursor-pointer">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
              
              {file ? (
                <div className="flex flex-col items-center text-blue-400 animate-in zoom-in duration-200">
                  <FileText size={40} className="mb-2" />
                  <p className="font-medium text-white max-w-[200px] truncate">{file.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400 group-hover:text-slate-200 transition-colors">
                  <UploadCloud size={40} className="mb-2" />
                  <p className="font-medium">Cliquez ou glissez un PDF ici</p>
                </div>
              )}
            </div>

            
            {file && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-sm font-medium text-slate-300 ml-1 flex items-center gap-2">
                  <Type size={14} /> Nom de la partition
                </label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-900/50 border-white/10 text-white focus:ring-blue-500 h-12"
                  placeholder="Ex: Sonate au Clair de Lune"
                  autoFocus
                />
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={handleClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-6">
                Annuler
              </Button>
              <Button type="submit" disabled={!file || !title} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-6">
                Importer
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}