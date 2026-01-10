/**
 * @file GamePage.jsx
 * @description CŒUR DU JEU.
 * 1. Charge et analyse le fichier MusicXML (via OSMD).
 * 2. Transforme les données XML en objets "Note" simplifiés.
 * 3. Affiche une portée SVG interactive.
 * 4. Gère la boucle de jeu (Input Clavier -> Validation -> Scroll).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { ArrowLeft, Settings, RotateCcw } from 'lucide-react';
import { getScoreMxl } from '../api/backendClient';

// Composants
import GameStats from '../components/game/GameStats';
import VirtualKeyboard from '../components/game/VirtualKeyboard';
import GameSettingsDialog from '../components/game/GameSettingsDialog';

// --- CONFIGURATION CONSTANTE ---
const NOTE_SPACING = 150;  // Espace horizontal entre deux notes (en px)
const STAFF_Y_START = 100; // Marge haute de la portée
const LINE_GAP = 20;       // Espace vertical entre les lignes de la portée

// Mapping : Touche Clavier Ordi -> Note de Musique
const KEY_NOTE_MAP = {
  'A': 'C', 'S': 'D', 'D': 'E', 'F': 'F',
  'G': 'G', 'H': 'A', 'J': 'B', 'K': 'C',
};

const NOTE_NAMES_FR = {
  'C': 'Do', 'D': 'Ré', 'E': 'Mi', 'F': 'Fa', 'G': 'Sol', 'A': 'La', 'B': 'Si'
};

// Dictionnaire pour calculer la hauteur (Y) des notes
const PITCH_ORDER = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
const ENUM_TO_STEP = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export default function GamePage() {
  const { scoreId } = useParams();
  const navigate = useNavigate();
  
  // Refs pour manipuler le DOM directement (nécessaire pour OSMD et le Scroll)
  const hiddenContainer = useRef(null); // Sert juste à parser le XML (invisible)
  const scrollContainer = useRef(null); // La div qui scrolle horizontalement
  
  // --- ÉTAT DU JEU ---
  const [activeKey, setActiveKey] = useState(null); // Touche pressée
  const [showSettings, setShowSettings] = useState(false);
  const [gameStatus, setGameStatus] = useState("loading"); // loading | ready | finished
  
  const [virtualNotes, setVirtualNotes] = useState([]); // Liste des notes à jouer
  const [currentIndex, setCurrentIndex] = useState(0);  // Note active

  const [stats, setStats] = useState({ correct: 0, errors: 0, totalNotes: 0, progress: 0 });
  
  // Initialisation complète des settings pour éviter les bugs de sliders
  const [settings, setSettings] = useState({ 
    showNoteNames: true,
    bpm: 60,
    volume: 50 
  });

  // Largeur d'écran (Responsive) : Utile pour centrer la note active
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Récupération du fichier XML depuis le Backend
  const { data: xmlContent } = useQuery({
    queryKey: ['scoreXml', scoreId],
    queryFn: () => getScoreMxl(scoreId),
    refetchOnWindowFocus: false,
  });

  /**
   * --- SCROLL ENGINE ---
   * bouge la div horizontale pour amener la note 'index' au centre.
   */
  const scrollToNote = useCallback((index) => {
    if (scrollContainer.current) {
      // On déplace le scroll de "index * 150px".
      // Comme la 1ère note est décalée visuellement (startOffset), ce scroll l'amène pile au centre.
      const notePosition = index * NOTE_SPACING;
      
      scrollContainer.current.scrollTo({
        left: notePosition, 
        behavior: 'smooth'
      });
    }
  }, []);

  /**
   * Vérifie si la touche appuyée correspond à la note attendue.
   */
  const handleNoteCheck = useCallback((pressedKey) => {
    if (gameStatus !== "ready" || currentIndex >= virtualNotes.length) return;

    const currentNote = virtualNotes[currentIndex];
    const playedStep = KEY_NOTE_MAP[pressedKey]; 

    setVirtualNotes(prevNotes => {
        const newNotes = [...prevNotes];
        const noteToUpdate = newNotes[currentIndex];
        
        if (playedStep === currentNote.step) {
            noteToUpdate.status = 'correct';
            setStats(s => ({ ...s, correct: s.correct + 1, progress: currentIndex + 1 }));
        } else {
            noteToUpdate.status = 'wrong';
            setStats(s => ({ ...s, errors: s.errors + 1 }));
        }
        return newNotes;
    });

    // Passage à la note suivante
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    scrollToNote(nextIndex); // Déclenche le mouvement

    if (nextIndex >= virtualNotes.length) setGameStatus("finished");
    
  }, [currentIndex, virtualNotes, gameStatus, scrollToNote]);

  /**
   * --- PARSER MUSICXML  ---
   * Utilise OpenSheetMusicDisplay pour lire le fichier, mais on n'affiche pas son rendu.
   * On extrait juste les données brutes (Hauteur, Durée, Timestamp) pour construire notre propre SVG.
   */
  useEffect(() => {
    if (!xmlContent || !hiddenContainer.current) return;

    hiddenContainer.current.innerHTML = '';
    const osmd = new OpenSheetMusicDisplay(hiddenContainer.current, {
      backend: "svg", autoResize: false, darkMode: false
    });

    osmd.load(xmlContent).then(() => {
      try { osmd.render(); } catch(e) {}
      
      const sheet = osmd.Sheet;
      const notesByTimestamp = new Map();

      // Parcours de la hiérarchie MusicXML : Mesure -> Staff -> Voice -> Note
      if (sheet && sheet.SourceMeasures) {
        for (const measure of sheet.SourceMeasures) {
            if (!measure.VerticalSourceStaffEntryContainers) continue;
            for (const container of measure.VerticalSourceStaffEntryContainers) {
                //  On utilise le timestamp réel pour trier les notes chronologiquement
                const timestamp = container.AbsoluteTimestamp ? container.AbsoluteTimestamp.RealValue : Math.random(); 
                if (!container.StaffEntries) continue;
                for (const entry of container.StaffEntries) {
                    if (!entry || !entry.VoiceEntries) continue;
                    for (const voiceEntry of entry.VoiceEntries) {
                        if (!voiceEntry.Notes) continue;
                        for (const note of voiceEntry.Notes) {
                            // On ignore les silences (Rest)
                            if (note.isRest && (typeof note.isRest === 'function' ? note.isRest() : note.isRest)) continue;
                            
                            // --- EXTRACTION DE LA HAUTEUR (PITCH) ---
                            let step = null;
                            let octave = 4;
                            let midiVal = 0;
                            const p = note.Pitch || note.pitch;

                            // Cas 1 : Note définie par demi-tons (MIDI)
                            if (note.halfTone !== undefined) {
                                midiVal = note.halfTone + 12; 
                                const notesScale = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
                                step = notesScale[midiVal % 12];
                                octave = Math.floor(midiVal / 12) - 1;
                            } 
                            // Cas 2 : Note définie par Step/Octave (XML standard)
                            else if (p) {
                                try {
                                    let s = p.step || p.Step;
                                    if (typeof s === 'number') step = ENUM_TO_STEP[s];
                                    else if (s) step = s.toString().replace("Step", "").trim().charAt(0).toUpperCase();
                                    octave = p.octave || p.Octave || 4;
                                    midiVal = (octave * 12) + PITCH_ORDER[step];
                                } catch(e) {}
                            }

                            // Validation et Ajout
                            if (step && "CDEFGAB".includes(step)) {
                                if (octave < 3) continue; // On ignore les notes trop graves pour le jeu
                                // Si plusieurs notes en même temps (accord), on garde la plus aiguë
                                if (!notesByTimestamp.has(timestamp) || midiVal > notesByTimestamp.get(timestamp).midiVal) {
                                    notesByTimestamp.set(timestamp, {
                                        step: step,
                                        octave: Number(octave),
                                        midiVal: midiVal,
                                        timestamp: timestamp,
                                        fullNote: `${step}${octave}`,
                                        status: 'waiting',
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
      }

      // Tri final et mise en état
      const sortedNotes = Array.from(notesByTimestamp.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((n, index) => ({ ...n, id: index }));

      console.log(`✅ Notes extraites : ${sortedNotes.length}`);
      
      if (sortedNotes.length > 0) {
        setVirtualNotes(sortedNotes);
        setStats(s => ({ ...s, totalNotes: sortedNotes.length }));
        setGameStatus("ready");
        setTimeout(() => scrollToNote(0), 100);
      } else {
        alert("Erreur : Aucune note trouvée dans cette partition.");
      }
    }).catch(e => console.error("OSMD Error:", e));
  }, [xmlContent, scrollToNote]);

  // --- GESTION DES ÉVÉNEMENTS CLAVIER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (KEY_NOTE_MAP[key]) {
        setActiveKey(key);
        handleNoteCheck(key);
      }
    };
    const handleKeyUp = () => setActiveKey(null);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleNoteCheck]);

  /**
   * Calcule la position verticale (Y) d'une note sur le SVG.
   * Plus la note est aiguë, plus Y est petit (vers le haut).
   */
  const getNoteTopPosition = (note) => {
    const baseOctave = 4;
    const octaveDiff = (note.octave || 4) - baseOctave; 
    const stepVal = PITCH_ORDER[note.step] || 0;
    const baseStepVal = PITCH_ORDER['B']; 
    const totalSteps = (octaveDiff * 7) + (stepVal - baseStepVal);
    const middleLineY = STAFF_Y_START + (2 * LINE_GAP);
    const top = middleLineY - (totalSteps * (LINE_GAP / 2)); 
    return top;
  };

  const precision = (stats.correct + stats.errors) > 0 
    ? Math.round((stats.correct / (stats.correct + stats.errors)) * 100) : 0;

  // Calcul de la largeur totale du SVG : Notes + Marge de fin d'écran
  const svgTotalWidth = (virtualNotes.length * NOTE_SPACING) + screenWidth;

  return (
    <div className="h-screen bg-[#0f172a] flex flex-col font-sans text-white overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap');
        .font-title { font-family: 'Outfit', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HEADER */}
      <header className="h-14 flex-none bg-slate-900/90 border-b border-white/10 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/library')} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft size={20} /></button>
          <h1 className="font-title font-bold text-lg hidden sm:block">Mode Jeu</h1>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-full"><Settings size={20} /></button>
      </header>

      {/* Parser Invisible */}
      <div ref={hiddenContainer} style={{ position: 'absolute', left: '-9999px' }} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* STATS */}
        <div className="flex-none pt-4 pb-2 px-4 flex justify-center z-30">
            <div className="scale-90 origin-top w-full max-w-5xl">
              <GameStats precision={precision} correct={stats.correct} errors={stats.errors} progress={stats.progress} totalNotes={stats.totalNotes} />
            </div>
        </div>

        {/* --- ZONE DE JEU (SCROLLER) --- */}
        <div className="flex-1 flex items-center justify-center px-4 mb-4">
             <div className="w-full max-w-5xl bg-slate-800/80 rounded-2xl border border-white/5 relative overflow-hidden h-[350px] flex items-center shadow-2xl">
                
                {/* CURSEUR DE LECTURE (Fixe au centre de l'écran) */}
                <div className="absolute left-1/2 top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center justify-center">
                    <div className="h-full w-[2px] bg-blue-500 border-r border-dashed border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                </div>

                {/* CONTENEUR DÉFILANT (SVG) */}
                <div ref={scrollContainer} className="w-full h-full overflow-x-auto hide-scrollbar relative flex items-center">
                    
                    {/* SVG GÉANT */}
                    <svg height="350" width={svgTotalWidth} style={{ minWidth: svgTotalWidth }} className="flex-none">
                        {/* 1. Lignes de la portée */}
                        {[0, 1, 2, 3, 4].map((line) => (
                            <line 
                                key={line} 
                                x1="0" y1={STAFF_Y_START + line * LINE_GAP} 
                                x2="100%" y2={STAFF_Y_START + line * LINE_GAP} 
                                stroke="#64748b" strokeWidth="2" 
                            />
                        ))}

                        {/* 2. Les Notes */}
                        {virtualNotes.map((note, index) => {
                            // --- CALCUL DE POSITION X ---
                            // startOffset = Moitié de l'écran. 
                            // Cela permet à la 1ère note (index 0) de commencer sous le curseur central.
                            const startOffset = screenWidth / 2;
                            const x = startOffset + (index * NOTE_SPACING);

                            const y = getNoteTopPosition(note);
                            const isActive = index === currentIndex;
                            const isPast = index < currentIndex;

                            // Gestion des couleurs (État passé / présent / futur)
                            let noteColor = "#94a3b8"; 
                            let noteFill = "transparent";
                            
                            if (isActive) noteColor = "#3b82f6"; // Bleu (Actif)
                            else if (isPast) {
                                if (note.status === 'correct') { noteColor = "#10b981"; noteFill = "#10b981"; } // Vert (Réussi)
                                else if (note.status === 'wrong') { noteColor = "#ef4444"; noteFill = "#ef4444"; } // Rouge (Raté)
                            }

                            const stemDirection = note.octave >= 5 ? 1 : -1;
                            const stemY2 = y + (stemDirection * 35);

                            return (
                                <g key={note.id} className="transition-all duration-300">
                                    {/* Petit trait pour le Do central (qui est hors portée) */}
                                    {note.step === 'C' && note.octave === 4 && (
                                        <line x1={x - 12} y1={y} x2={x + 12} y2={y} stroke="#64748b" strokeWidth="2" />
                                    )}
                                    {/* Queue de la note */}
                                    <line x1={x + (stemDirection === 1 ? -7 : 7)} y1={y} x2={x + (stemDirection === 1 ? -7 : 7)} y2={stemY2} stroke={noteColor} strokeWidth="2" />
                                    {/* Tête de la note */}
                                    <ellipse cx={x} cy={y} rx="8" ry="6" fill={noteFill} stroke={noteColor} strokeWidth="2" transform={`rotate(-15, ${x}, ${y})`} className={isActive ? "scale-125" : ""} />
                                    
                                    {/* Nom de la note (Optionnel) */}
                                    {settings.showNoteNames && (
                                        <text x={x} y={y + (stemDirection === 1 ? -15 : 25)} textAnchor="middle" fill={noteColor} fontSize="12" fontWeight="bold" fontFamily="Outfit">
                                            {NOTE_NAMES_FR[note.step]}
                                        </text>
                                    )}
                                    {/* Animation "Pulse" sur la note active */}
                                    {isActive && (
                                        <rect x={x - 15} y={y - 15} width="30" height="30" rx="4" stroke="#3b82f6" strokeWidth="2" fill="none">
                                            <animate attributeName="stroke-opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
                                        </rect>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
             </div>
        </div>

        {/* PIANO VIRTUEL  */}
        <div className="flex-none bg-[#0f172a] pt-2 pb-4 flex flex-col items-center z-40 border-t border-white/10">
          <div className="flex gap-4 mb-2">
            <button onClick={() => window.location.reload()} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-medium flex items-center gap-1">
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <div className="transform scale-90 origin-top">
             <VirtualKeyboard activeKey={activeKey} />
          </div>
        </div>
      </main>
      
      {/* MODALE REGLAGES */}
      <GameSettingsDialog open={showSettings} onClose={() => setShowSettings(false)} settings={settings} onUpdate={(key, val) => setSettings(prev => ({...prev, [key]: val}))} />
    </div>
  );
}