/**
 * GamePage.jsx
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { ArrowLeft, Settings, Bug, Play, Pause } from 'lucide-react';
import { getScoreMxl, getScoreJson } from '../api/backendClient';

import GameStats from '../components/game/GameStats';
import VirtualKeyboard from '../components/game/VirtualKeyboard';
import GameSettingsDialog from '../components/game/GameSettingsDialog';
import DebugPanel from '../components/game/DebugPanel';

const NOTE_SPACING = 160; 
const STAFF_Y_START = 110; 
const LINE_GAP = 22;       
const CURSOR_LEFT_PERCENT = 0.2; 

const KEY_NOTE_MAP = { 'A': 'C', 'S': 'D', 'D': 'E', 'F': 'F', 'G': 'G', 'H': 'A', 'J': 'B', 'K': 'C' };
const NOTE_NAMES_FR = { 'C': 'Do', 'D': 'Ré', 'E': 'Mi', 'F': 'Fa', 'G': 'Sol', 'A': 'La', 'B': 'Si' };
const PITCH_ORDER = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };

export default function GamePage() {
  const { scoreId } = useParams();
  const navigate = useNavigate();
  const hiddenContainer = useRef(null); 
  const scrollContainer = useRef(null); 
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStatus, setGameStatus] = useState("loading"); 
  const [virtualNotes, setVirtualNotes] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(0);  
  const [activeKey, setActiveKey] = useState(null); 
  const [stats, setStats] = useState({ correct: 0, errors: 0, totalNotes: 0, progress: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [aiState, setAiState] = useState({ 
    reading_fluency: 1.0, 
    looking_at_keyboard: false,
    is_distracted: false
  });

  const aiStateRef = useRef(aiState);
  const [settings, setSettings] = useState({ showNoteNames: true, bpm: 60, volume: 50 });
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { aiStateRef.current = aiState; }, [aiState]);

  const { data: xmlContent } = useQuery({ queryKey: ['scoreXml', scoreId], queryFn: () => getScoreMxl(scoreId), refetchOnWindowFocus: false });
  const { data: notesJson } = useQuery({ queryKey: ['scoreJson', scoreId], queryFn: () => getScoreJson(scoreId), refetchOnWindowFocus: false });

  useEffect(() => {
    if (!xmlContent || !hiddenContainer.current) return;
    hiddenContainer.current.innerHTML = '';
    const osmd = new OpenSheetMusicDisplay(hiddenContainer.current, { backend: "svg", autoResize: false, drawingParameters: "compact" });
    osmd.load(xmlContent).then(() => { try { osmd.render(); } catch(e) {} });
  }, [xmlContent]);

  useEffect(() => {
      if (notesJson && notesJson.length > 0) {
          setVirtualNotes(notesJson.map(n => ({ ...n, status: 'waiting' })));
          setStats(s => ({ ...s, totalNotes: notesJson.length }));
          setGameStatus("ready");
          if(notesJson[0].bpm_ref) setSettings(s => ({...s, bpm: notesJson[0].bpm_ref}));
      }
  }, [notesJson]);

  // Tom 
  // C'est ici que les données de l'oculomètre modifient le comportement du jeu.
  useEffect(() => {
    // Récupération des données traitées par le script Python (via FastAPI)
    const interval = setInterval(() => {
      fetch('http://localhost:8000/api/get-eye-data')
        .then(res => res.json())
        .then(data => {
            // 'fluency' est le multiplicateur de vitesse du BPM (1.0 = 100% de la vitesse)
            let fluency = 1.0;
            //Si l'utilisateur regarde ses mains (clavier), on ralentit drastiquement (20% de la vitesse)
            //on peut changer biensûr 
            if (data.looking_at_key) fluency = 0.2;
            // Note pour Tom : Tu peux ajouter d'autres conditions ici.
            // Exemple : if (data.is_distracted) fluency = 0.0; // Pour mettre le jeu en pause

            // Mise à jour de l'état global pour que l'animation React réagisse
            setAiState(prev => ({ ...prev, ...data, reading_fluency: fluency }));
        }).catch(() => {
          // Si le serveur est éteint, on ne bloque pas le jeu
          console.warn("L'API Eye-Tracking ne répond pas.");
        });
    }, 150);// Fréquence de rafraîchissement toutes les 150ms
    return () => clearInterval(interval);
  }, []);

  const animate = useCallback((time) => {
    if (lastTimeRef.current !== 0 && isPlaying) {
        const deltaTime = (time - lastTimeRef.current) / 1000;
        const effectiveBpm = settings.bpm * Math.max(0.1, aiStateRef.current.reading_fluency);
        const pps = (effectiveBpm / 60) * NOTE_SPACING;
        if (scrollContainer.current) {
            scrollContainer.current.scrollLeft += (pps * deltaTime);
        }
    }
    lastTimeRef.current = time;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [settings.bpm, isPlaying]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [animate]);

  const handleNoteCheck = useCallback((pressedKey) => {
    if (gameStatus !== "ready" || currentIndex >= virtualNotes.length) return;
    const currentNote = virtualNotes[currentIndex];
    const isCorrect = KEY_NOTE_MAP[pressedKey] === currentNote.step;

    setVirtualNotes(prev => {
        const newNotes = [...prev];
        newNotes[currentIndex] = { ...newNotes[currentIndex], status: isCorrect ? 'correct' : 'wrong' };
        return newNotes;
    });

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
  
    if (scrollContainer.current) {
        scrollContainer.current.scrollLeft = currentIndex * NOTE_SPACING;
    }

    setStats(prev => ({ ...prev, correct: prev.correct + (isCorrect ? 1 : 0), errors: prev.errors + (isCorrect ? 0 : 1), progress: nextIndex }));
  }, [currentIndex, virtualNotes, gameStatus]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toUpperCase();
      if (KEY_NOTE_MAP[k]) { setActiveKey(k); handleNoteCheck(k); }
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(p => !p); }
    };
    const handleKeyUp = () => setActiveKey(null);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [handleNoteCheck]);

  const getNoteTop = (n) => {
    const steps = ((n.octave - 4) * 7) + (PITCH_ORDER[n.step] - PITCH_ORDER['B']);
    return (STAFF_Y_START + 2 * LINE_GAP) - (steps * (LINE_GAP / 2));
  };

  const cursorX = screenWidth * CURSOR_LEFT_PERCENT;

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-sans text-slate-200 overflow-y-auto overflow-x-hidden">
      <header className="h-14 flex-none bg-slate-900/80 border-b border-white/5 flex items-center justify-between px-6 z-50 sticky top-0">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/library')}><ArrowLeft size={22} /></button>
          <span className="text-sm font-medium">{Math.round(settings.bpm * aiState.reading_fluency)} BPM</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowDebug(true)}><Bug size={18} /></button>
          <button onClick={() => setShowSettings(true)}><Settings size={18} /></button>
        </div>
      </header>

      <div ref={hiddenContainer} style={{ position: 'absolute', left: '-9999px' }} />

      <main className="flex-1 flex flex-col items-center py-6 px-4 space-y-8">
        <GameStats {...stats} />

        {/* Fenêtre Partition FIXE */}
        <div className="w-full max-w-6xl bg-slate-900/40 rounded-[2rem] border border-white/10 relative h-[380px] shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="absolute z-30 pointer-events-none" style={{ left: cursorX, top: 0, bottom: 0 }}>
                <div className="h-full w-[2px] bg-indigo-500/50" />
            </div>

            <div ref={scrollContainer} className="w-full h-full overflow-hidden relative flex items-center no-scrollbar">
                <svg height="380" width={virtualNotes.length * NOTE_SPACING + screenWidth} className="flex-none">
                    {[0,1,2,3,4].map(l => (
                        <line key={l} x1="0" y1={STAFF_Y_START+l*LINE_GAP} x2="100%" y2={STAFF_Y_START+l*LINE_GAP} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                    ))}

                    {virtualNotes.map((note, index) => {
                        const x = cursorX + (index * NOTE_SPACING); 
                        const y = getNoteTop(note);
                        const isActive = index === currentIndex;
                        const color = note.status === 'correct' ? '#10b981' : note.status === 'wrong' ? '#ef4444' : isActive ? '#818cf8' : '#64748b';

                        const isHollow = note.duration >= 2.0; 
                        const isEighth = note.duration === 0.5;
                        const isDotted = note.duration % 1.5 === 0 || note.duration === 0.75;
                        const stemDir = (note.octave > 4) || (note.octave === 4 && PITCH_ORDER[note.step] >= 6) ? 1 : -1;
                        const stemX = x + (stemDir === -1 ? 7 : -7);
                        const stemEndY = y + (stemDir * 35);

                        const nextNote = virtualNotes[index + 1];
                        const drawBeam = isEighth && nextNote && nextNote.duration === 0.5;

                        return (
                            <g key={note.id}>
                                {(note.accidental === '#' || note.accidental === 'b' || note.accidental === 'n') && (
                                    <text x={x - 20} y={y + 6} fill={color} fontSize="22" className="select-none font-bold">
                                        {note.accidental === '#' ? '♯' : note.accidental === 'b' ? '♭' : '♮'}
                                    </text>
                                )}
                                {note.duration < 4.0 && (
                                    <line x1={stemX} y1={y} x2={stemX} y2={stemEndY} stroke={color} strokeWidth="2" />
                                )}
                                {drawBeam && (
                                    <line x1={stemX} y1={stemEndY} x2={stemX + NOTE_SPACING} y2={getNoteTop(nextNote) + ((nextNote.octave > 4 || (nextNote.octave === 4 && PITCH_ORDER[nextNote.step] >= 6)) ? 35 : -35)} stroke={color} strokeWidth="6" />
                                )}
                                {isEighth && !drawBeam && !((virtualNotes[index-1] && virtualNotes[index-1].duration === 0.5)) && (
                                    <path d={stemDir === -1 ? `M ${stemX} ${stemEndY} Q ${stemX+8} ${stemEndY+10} ${stemX+4} ${stemEndY+25}` : `M ${stemX} ${stemEndY} Q ${stemX+8} ${stemEndY-10} ${stemX+4} ${stemEndY-25}`} stroke={color} strokeWidth="2" fill="none" />
                                )}
                                <ellipse cx={x} cy={y} rx="9" ry="7" fill={isHollow ? "#1e293b" : color} stroke={color} strokeWidth="2" transform={`rotate(-15,${x},${y})`} />
                                {isDotted && <circle cx={x + 14} cy={y} r="2.5" fill={color} />}
                                {settings.showNoteNames && <text x={x} y={y + 45} textAnchor="middle" fill={color} fontSize="11" className="font-bold opacity-60 uppercase">{note.name_fr || NOTE_NAMES_FR[note.step]}</text>}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>

        {/* Section Clavier */}
        <div className="w-full flex flex-col items-center space-y-6 pb-12">
          <button onClick={() => setIsPlaying(!isPlaying)} className="px-14 py-4 bg-white text-slate-900 rounded-2xl font-bold active:scale-95 transition-transform shadow-xl">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <VirtualKeyboard activeKey={activeKey} />
        </div>
      </main>

      <DebugPanel isOpen={showDebug} onClose={() => setShowDebug(false)} aiState={aiState} />
      <GameSettingsDialog open={showSettings} onClose={() => setShowSettings(false)} settings={settings} onUpdate={(k, v) => setSettings(s => ({...s, [k]: v}))} />
    </div>
  );
}