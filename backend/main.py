"""
BACKEND API - PIANO ADAPT
"""

import os
import sys
import time
import shutil
import subprocess
import zipfile
import json
import music21  
from datetime import datetime, timedelta
from typing import List, Optional


from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from jose import JWTError, jwt

# 1. CONFIG

# Chemin vers Audiveris
AUDIVERIS_BIN = "/mnt/c/Program Files/Audiveris/Audiveris.exe"

SECRET_KEY = "SECRET_SUPER_SECURISE_A_CHANGER_EN_PROD"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 semaine

SQLALCHEMY_DATABASE_URL = "sqlite:///./piano.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Ajoute cette map de traduction tout en haut de ton fichier, ou dans la fonction
NOTE_MAP_FR = {
    'C': 'Do', 'D': 'Ré', 'E': 'Mi', 'F': 'Fa', 'G': 'Sol', 'A': 'La', 'B': 'Si'
}



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Création des dossiers de stockage
os.makedirs("uploads", exist_ok=True)
os.makedirs("scores_output", exist_ok=True)


#  modèles bases de données 

# Tom 
# format donnees eye pour les POST que tu fais au backend (tu peux changer le nom des variables )
class EyeData(BaseModel):
    reading_fluency: float = 1.0       # Vitesse de lecture (0.0 à 1.0)
    looking_at_keyboard: bool = False  # Regarde le clavier ?
    is_fixation: bool = False          # Fixe une note ?
    is_distracted: bool = False        # Regarde ailleurs ?
# variable locale qui stocke l'état en temps réel 
current_eye_state = {
    "reading_fluency": 1.0,
    "looking_at_keyboard": False,
    "is_fixation": False,
    "is_distracted": False
}

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    profiles = relationship("Profile", back_populates="owner")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    icon = Column(String, default="🎹")
    color = Column(String, default="from-blue-500 to-indigo-500")
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="profiles")
    scores = relationship("Score", back_populates="profile")

class Score(Base):
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    file_path = Column(String)
    mxl_path = Column(String)
    json_path = Column(String, nullable=True) 
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    profile = relationship("Profile", back_populates="scores")

class GameSession(Base):
    """Historique pour l'analyse de progression (Dossier Conception)"""
    __tablename__ = "game_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score_id = Column(Integer, ForeignKey("scores.id"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    duration_seconds = Column(Integer)
    accuracy = Column(Integer)
    ai_logs = Column(String) 

Base.metadata.create_all(bind=engine)


def wsl_path_to_windows(linux_path: str) -> str:
    abs_path = os.path.abspath(linux_path)
    result = subprocess.run(["wslpath", "-w", abs_path], capture_output=True, text=True)
    return result.stdout.strip()

def convert_mxl_to_json(mxl_path: str, output_json_path: str) -> bool:
    """
    Extrait les notes et sauvegarde un JSON 'joli' (indenté) et enrichi (français).
    """
    try:
        print(f"[Music21] Conversion détaillée de : {mxl_path}")
        c = music21.converter.parse(mxl_path)
        
        # Récupération du BPM (Tempo)
        bpm = 60
        metronome_marks = c.flat.getElementsByClass(music21.tempo.MetronomeMark)
        if len(metronome_marks) > 0:
            bpm = metronome_marks[0].number

        flat_notes = c.flat.notes
        game_notes = []
        
        for element in flat_notes:
            note_obj = None
            is_chord = False

            # Si c'est une note
            if isinstance(element, music21.note.Note):
                note_obj = element
            # Si c'est un accord 
            elif isinstance(element, music21.chord.Chord):
                note_obj = element.sortAscending().notes[-1] # On prend la plus haute
                is_chord = True

            if note_obj:
                
                step = note_obj.step
                accidental = ""
                alter_val = 0
                
                if note_obj.pitch.accidental:
                    alter_val = int(note_obj.pitch.accidental.alter)
                    if alter_val == 1: accidental = "#"
                    elif alter_val == -1: accidental = "b"
                
                note_name_fr = f"{NOTE_MAP_FR.get(step, step)}{accidental}{note_obj.octave}"
                
                game_notes.append({
                    "id": len(game_notes),
                    # Données techniques
                    "step": step,
                    "octave": note_obj.octave,
                    "alter": alter_val,
                    "midi": note_obj.pitch.midi,
                    
                    "name": note_obj.nameWithOctave,  # Ex: "F#4"
                    "name_fr": note_name_fr,          # Ex: "Fa#4"
                    
                    # Rythme
                    "duration": float(element.duration.quarterLength),
                    "type": element.duration.type,
                    "bpm_ref": bpm,
                    
                    "isChord": is_chord,
                    "isRest": False
                })

        with open(output_json_path, "w", encoding='utf-8') as f:
            json.dump(game_notes, f, indent=4, ensure_ascii=False)
            
        print(f"[Music21] JSON lisible généré : {len(game_notes)} notes.")
        return True

    except Exception as e:
        print(f"[Music21] Erreur : {e}")
        return False


class UserCreate(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str

class UserLogin(BaseModel):
    email: str
    password: str

class ProfileCreate(BaseModel):
    name: str
    icon: Optional[str] = "🎹"
    color: Optional[str] = "from-blue-500 to-indigo-500"

class SessionCreate(BaseModel):
    score_id: Optional[int] = None
    duration_seconds: int
    accuracy: int
    ai_logs: str


def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(401)
    except JWTError: raise HTTPException(401)
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(401)
    return user

@app.on_event("startup")
def create_default_user():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "demo@piano.com").first():
            print("🚀 Création user Démo...")
            hashed_pw = pwd_context.hash("piano123")
            demo_user = User(email="demo@piano.com", hashed_password=hashed_pw, first_name="Demo", last_name="Pianist")
            db.add(demo_user)
            db.commit()
    finally:
        db.close()


@app.post("/api/auth/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        return {"success": False, "error": "Email pris"}
    hashed_pw = pwd_context.hash(user_data.password)
    new_user = User(email=user_data.email, hashed_password=hashed_pw, first_name=user_data.firstName, last_name=user_data.lastName)
    db.add(new_user)
    db.commit()
    token = create_access_token(data={"sub": new_user.email})
    return {"success": True, "token": token, "user": {"email": new_user.email}}

@app.post("/api/auth/login")
def login(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not pwd_context.verify(creds.password, user.hashed_password):
        return {"success": False, "error": "Identifiants incorrects"}
    token = create_access_token(data={"sub": user.email})
    profiles = [{"profileId": p.id, "name": p.name, "icon": p.icon, "color": p.color} for p in user.profiles]
    return {"success": True, "token": token, "user": {"email": user.email, "name": user.first_name}, "profiles": profiles}

@app.get("/api/profiles")
def get_profiles(user: User = Depends(get_current_user)):
    return {"success": True, "profiles": [{"profileId": p.id, "name": p.name, "icon": p.icon, "color": p.color} for p in user.profiles]}

@app.post("/api/profiles")
def create_profile(p: ProfileCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(user.profiles) >= 5: return {"success": False, "error": "Max 5 profils"}
    new_p = Profile(name=p.name, icon=p.icon, color=p.color, owner=user)
    db.add(new_p)
    db.commit()
    return {"success": True, "profile": {"id": new_p.id, "name": new_p.name}}

@app.post("/api/sessions")
def save_session(s: SessionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_s = GameSession(user_id=user.id, score_id=s.score_id, duration_seconds=s.duration_seconds, accuracy=s.accuracy, ai_logs=s.ai_logs)
    db.add(new_s)
    db.commit()
    return {"success": True, "id": new_s.id}


@app.post("/api/scores/upload-pdf")
def upload_score(
    profileId: int, title: str = Form(...), file: UploadFile = File(...), 
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.id == profileId, Profile.user_id == user.id).first()
    if not profile: raise HTTPException(404, "Profil introuvable")

    # 1. Sauvegarde PDF
    safe_filename = f"p{profile.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    pdf_path = os.path.join("uploads", safe_filename)
    with open(pdf_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)

    # 2. Audiveris (PDF -> MXL)
    output_dir = os.path.join("scores_output", safe_filename.replace(".pdf", ""))
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        win_pdf, win_out = wsl_path_to_windows(pdf_path), wsl_path_to_windows(output_dir)
        subprocess.run([AUDIVERIS_BIN, "-batch", "-export", "-output", win_out, "--", win_pdf], capture_output=True)
        time.sleep(3) # Pause WSL

        mxl_file = None
        for root, _, files in os.walk(output_dir):
            for f in files:
                if f.endswith(".mxl") and os.path.getsize(os.path.join(root, f)) > 100:
                    mxl_file = os.path.join(root, f)
                    break
        
        if not mxl_file: raise Exception("Audiveris n'a pas généré de MXL valide")

        # 3. Music21 (MXL -> JSON) 
        json_filename = safe_filename.replace(".pdf", ".json")
        json_path = os.path.join("scores_output", json_filename)
        
        if not convert_mxl_to_json(mxl_file, json_path):
            raise Exception("Erreur conversion JSON Music21")

        # 4. Save BDD
        new_score = Score(title=title, file_path=pdf_path, mxl_path=mxl_file, json_path=json_path, profile=profile)
        db.add(new_score)
        db.commit()

        return {"success": True, "scoreId": new_score.id}

    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(500, detail=str(e))

@app.get("/api/profiles/{pid}/scores")
def get_scores(pid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == pid, Profile.user_id == user.id).first()
    if not profile: return {"success": False}
    return {"success": True, "scores": [{"id": s.id, "title": s.title} for s in profile.scores]}

@app.delete("/api/scores/{sid}")
def delete_score(sid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    score = db.query(Score).filter(Score.id == sid).first()
    if not score or score.profile.user_id != user.id: raise HTTPException(404)
    if os.path.exists(score.file_path): os.remove(score.file_path)
    if score.json_path and os.path.exists(score.json_path): os.remove(score.json_path)
    db.delete(score)
    db.commit()
    return {"success": True}

@app.get("/api/scores/{sid}/mxl")
def get_mxl(sid: int, db: Session = Depends(get_db)):
    score = db.query(Score).filter(Score.id == sid).first()
    if not score or not os.path.exists(score.mxl_path): raise HTTPException(404)
    try:
        with zipfile.ZipFile(score.mxl_path, 'r') as z:
            xml = next((n for n in z.namelist() if n.endswith(".xml") and not n.startswith("META-INF")), None)
            if not xml: xml = next((n for n in z.namelist() if n.endswith(".xml")), None)
            return Response(content=z.read(xml), media_type="application/xml")
    except: raise HTTPException(500, "Corrupt MXL")


@app.get("/api/scores/{sid}/json")
def get_json(sid: int, db: Session = Depends(get_db)):
    score = db.query(Score).filter(Score.id == sid).first()
    if not score: raise HTTPException(404)

    
    if score.json_path and os.path.exists(score.json_path):
        with open(score.json_path, 'r') as f:
            return json.load(f)
    
    elif score.mxl_path and os.path.exists(score.mxl_path):
        print(" Génération JSON à la volée (vieux score)")
        temp_json = score.mxl_path.replace(".mxl", ".json")
        if convert_mxl_to_json(score.mxl_path, temp_json):
            score.json_path = temp_json
            db.commit()
            with open(temp_json, 'r') as f: return json.load(f)
            
    raise HTTPException(404, "Données de jeu introuvables")

#Tom 
# données occulomètre
#L'URL ou t'envoies tes données (Post)
#un truc comme requests.post("http://localhost:8000/api/update-eye-data", json={...})
@app.post("/api/update-eye-data")
async def update_eye_data(data: EyeData):
    global current_eye_state
    # On met à jour la mémoire
    current_eye_state = data.dict()
    return {"status": "ok", "received": current_eye_state}

# et ça c'est l'URL ou react va lire tes données 
@app.get("/api/get-eye-data")
async def get_eye_data():
    return current_eye_state

