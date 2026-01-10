"""
BACKEND API - PIANO ADAPT
Ce fichier contient toute la logique serveur.
Il gère :
1. La base de données (Utilisateurs, Profils, Partitions).
2. L'authentification sécurisée.
3. Le pont entre Linux (WSL) et Windows pour lancer Audiveris.
4. L'envoi des fichiers XML au Frontend.
"""

import os
import sys
import time
import shutil
import subprocess
import zipfile  # pour ouvrir les fichiers .mxl (qui sont des zip)
from datetime import datetime, timedelta
from typing import List, Optional

# FastAPI : Le framework qui crée le serveur web
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Response
# CORS : Pour autoriser le Frontend (React) à parler au Backend
from fastapi.middleware.cors import CORSMiddleware
# OAuth2 : Pour gérer les tokens de connexion (le cadenas de sécurité)
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
# Pydantic : Pour valider que les données reçues sont au bon format
from pydantic import BaseModel
# SQLAlchemy : Pour discuter avec la base de données SQLite
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
# Passlib : Pour crypter les mots de passe 
from passlib.context import CryptContext
# Jose : Pour créer et lire les tokens JWT
from jose import JWTError, jwt

# --- 1. CONFIGURATION ---

# Ce chemin est spécifique à mon pc, il faudra le changer en fonction du pc
AUDIVERIS_BIN = "/mnt/c/Program Files/Audiveris/Audiveris.exe"

# Clé utilisée pour signer les tokens. 
SECRET_KEY = "SECRET_SUPER_SECURISE_A_CHANGER_EN_PROD"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  

# base de données (fichier local piano.db)
SQLALCHEMY_DATABASE_URL = "sqlite:///./piano.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# hachage de mot de passe (bcrypt est le standard actuel)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Route où le frontend doit envoyer le login/password pour avoir un token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

app = FastAPI()

# Configuration CORS : On autorise tout le monde ["*"] car on est en mode développement.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Création automatique des dossiers s'ils n'existent pas
os.makedirs("uploads", exist_ok=True)       # Pour les PDF bruts
os.makedirs("scores_output", exist_ok=True) # Pour les résultats d'Audiveris


# --- 2. MODÈLES DE BASE DE DONNÉES (TABLES) ---

class User(Base):
    """Table des comptes principaux (Parents/Professeurs)"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    # Lien : Un utilisateur a plusieurs profils
    profiles = relationship("Profile", back_populates="owner")

class Profile(Base):
    """Table des profils (ex: 'Papa', 'Enfant 1', 'Enfant 2')"""
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    icon = Column(String, default="🎹")
    color = Column(String, default="from-blue-500 to-indigo-500")
    # Clé étrangère : Appartient à un User
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="profiles")
    # Lien : Un profil possède ses propres partitions
    scores = relationship("Score", back_populates="profile")

class Score(Base):
    """Table des partitions"""
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    file_path = Column(String)  # Chemin du PDF original
    mxl_path = Column(String)   # Chemin du fichier converti (.mxl)
    # Clé étrangère : Appartient à un Profil
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    profile = relationship("Profile", back_populates="scores")

# Crée les tables dans le fichier piano.db si elles n'existent pas
Base.metadata.create_all(bind=engine)


# --- 3. SCHÉMAS PYDANTIC (Validation des données reçues) ---

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


# --- 4. UTILITAIRES ET SÉCURITÉ ---

def get_db():
    """Ouvre une connexion BDD pour une requête et la ferme après."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict):
    """Fabrique le jeton JWT encrypté avec la date d'expiration."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Fonction de sécurité critique.
    appelée sur chaque route protégée pour vérifier :
    1. Si le token est valide.
    2. Qui est l'utilisateur derrière ce token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

def wsl_path_to_windows(linux_path: str) -> str:
    """
    Transforme un chemin Linux (ex: /home/user/file.pdf)
    En chemin Windows (ex: C:\\Users\\...\\file.pdf)
    car Audiveris est un programme Windows (.exe).
    """
    abs_path = os.path.abspath(linux_path)
    result = subprocess.run(["wslpath", "-w", abs_path], capture_output=True, text=True)
    return result.stdout.strip()


# --- 5. ROUTES API (Auth & Profils) ---

@app.post("/api/auth/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Vérifie si l'email existe déjà
    if db.query(User).filter(User.email == user_data.email).first():
        return {"success": False, "error": "Email déjà utilisé"}
    
    # On crypte le mot de passe avant de l'enregistrer
    hashed_pw = pwd_context.hash(user_data.password)
    new_user = User(email=user_data.email, hashed_password=hashed_pw, first_name=user_data.firstName, last_name=user_data.lastName)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # On connecte l'utilisateur directement après l'inscription
    token = create_access_token(data={"sub": new_user.email})
    return {"success": True, "token": token, "user": {"email": new_user.email, "name": new_user.first_name}, "profiles": []}

@app.post("/api/auth/login")
def login(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    # Vérification du mot de passe hashé
    if not user or not pwd_context.verify(creds.password, user.hashed_password):
        return {"success": False, "error": "Identifiants incorrects"}
    
    token = create_access_token(data={"sub": user.email})
    profiles_data = [{"profileId": p.id, "name": p.name, "icon": p.icon, "color": p.color} for p in user.profiles]
    return {"success": True, "token": token, "user": {"email": user.email, "name": user.first_name}, "profiles": profiles_data}

@app.get("/api/profiles")
def get_user_profiles(user: User = Depends(get_current_user)):
    return {"success": True, "profiles": [{"profileId": p.id, "name": p.name, "icon": p.icon, "color": p.color} for p in user.profiles]}

@app.post("/api/profiles")
def create_profile(profile: ProfileCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(user.profiles) >= 5: return {"success": False, "error": "Limite de 5 profils atteinte"}
    new_profile = Profile(name=profile.name, icon=profile.icon, color=profile.color, owner=user)
    db.add(new_profile)
    db.commit()
    return {"success": True, "profile": {"id": new_profile.id, "name": new_profile.name}}


# --- 6. UPLOAD & TRAITEMENT (Le cœur du système) ---

@app.post("/api/scores/upload-pdf")
def upload_score(
    profileId: int, 
    title: str = Form(...),
    file: UploadFile = File(...), 
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reçoit un PDF, le sauvegarde, lance Audiveris (Windows) pour le convertir,
    récupère le résultat .mxl et l'enregistre en BDD.
    """
    # Vérif : Le profil appartient bien à l'utilisateur connecté
    profile = db.query(Profile).filter(Profile.id == profileId, Profile.user_id == user.id).first()
    if not profile: raise HTTPException(404, "Profil introuvable")

    # 1. Sauvegarde PDF localement
    # On ajoute l'heure au nom pour éviter les doublons (timestamp)
    safe_filename = f"p{profile.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    pdf_path = os.path.join("uploads", safe_filename)
    
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Préparation des chemins pour Audiveris
    output_dir = os.path.join("scores_output", safe_filename.replace(".pdf", ""))
    os.makedirs(output_dir, exist_ok=True)
    
    print(f" Lancement d'Audiveris sur : {pdf_path}")
    
    try:
        # Conversion des chemins Linux -> Windows
        win_pdf_path = wsl_path_to_windows(pdf_path)
        win_output_dir = wsl_path_to_windows(output_dir)

        # 3. Exécution de la commande Windows
        # -batch : pas d'interface graphique
        # -export : on veut le résultat
        cmd = [AUDIVERIS_BIN, "-batch", "-export", "-output", win_output_dir, "--", win_pdf_path]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        print("Sortie :", result.stdout)
        
        if result.returncode != 0:
             print("Erreur STDERR:", result.stderr)
             raise Exception(f"Crash Audiveris (Code {result.returncode})")

        # 4.  pause car WSL/Windows peuvent avoir un délai d'écriture disque
        print(" Attente synchro WSL...")
        time.sleep(3) 

        # 5. Recherche du fichier .mxl généré
        mxl_file = None
        for root, dirs, files in os.walk(output_dir):
            for f in files:
                if f.endswith(".mxl"):
                    full_path = os.path.join(root, f)
                    if os.path.getsize(full_path) > 100: # Vérif qu'il n'est pas vide
                        mxl_file = full_path
                        break
        
        if not mxl_file:
            raise Exception("Fichier .mxl vide ou introuvable après conversion")

        # 6. Enregistrement BDD
        new_score = Score(title=title, file_path=pdf_path, mxl_path=mxl_file, profile=profile)
        db.add(new_score)
        db.commit()

        return {"success": True, "scoreId": new_score.id, "title": new_score.title}

    except Exception as e:
        print(f"Erreur : {str(e)}")
        # En cas d'erreur, on renvoie une erreur 500 au frontend
        raise HTTPException(500, detail=f"Erreur conversion : {str(e)}")

@app.get("/api/profiles/{profile_id}/scores")
def get_scores(profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id, Profile.user_id == user.id).first()
    if not profile: return {"success": False, "error": "Interdit"}
    return {"success": True, "scores": [{"id": s.id, "title": s.title} for s in profile.scores]}


@app.delete("/api/scores/{score_id}")
def delete_score(score_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    score = db.query(Score).filter(Score.id == score_id).first()
    if not score:
        raise HTTPException(404, "Partition introuvable")
    
    # Sécurité : On ne peut supprimer que ses propres partitions
    if score.profile.user_id != user.id:
        raise HTTPException(403, "Action interdite")

    # Nettoyage du fichier PDF pour ne pas encombrer le disque
    if os.path.exists(score.file_path):
        os.remove(score.file_path)
    # (Note: on pourrait aussi supprimer le dossier output d'Audiveris ici)

    db.delete(score)
    db.commit()
    return {"success": True}

    
@app.get("/api/scores/{score_id}/mxl")
def get_score_mxl(score_id: int, db: Session = Depends(get_db)):
    """
    Cette route est cruciale pour le mode Jeu.
    Le fichier .mxl est en réalité une archive ZIP qui contient un fichier .xml.
    Le frontend (OpenSheetMusicDisplay) a besoin du XML pur.
    On fait l'extraction ici pour simplifier la vie du frontend.
    """
    score = db.query(Score).filter(Score.id == score_id).first()
    if not score or not os.path.exists(score.mxl_path):
        raise HTTPException(404, detail="Partition introuvable")
    
    try:
        # Ouverture du ZIP (le .mxl)
        with zipfile.ZipFile(score.mxl_path, 'r') as z:
            # On cherche le fichier XML principal dans l'archive
            # On évite le dossier META-INF qui contient des métadonnées inutiles
            xml_filename = next((name for name in z.namelist() if name.endswith(".xml") and not name.startswith("META-INF")), None)
            
            if not xml_filename:
                # Si on ne trouve pas le principal, on prend le premier xml trouvé
                xml_filename = next((name for name in z.namelist() if name.endswith(".xml")), None)

            if not xml_filename:
                raise HTTPException(500, detail="XML introuvable dans le MXL")
            
            # Lecture du contenu
            xml_content = z.read(xml_filename)
            
        # On renvoie le contenu XML sous forme de texte brut
        return Response(content=xml_content, media_type="application/xml")

    except Exception as e:
        print(f"Erreur extraction MXL: {e}")
        raise HTTPException(500, detail="Fichier corrompu")