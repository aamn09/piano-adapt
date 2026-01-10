# 🎹 Piano Adapt

Bienvenue sur le projet **Piano Adapt**. Cette application permet de convertir des partitions PDF en format interactif pour apprendre le piano de manière ludique, soit via un navigateur, soit via le logiciel desktop (Electron).

---
https://github.com/Audiveris/audiveris/releases
## Architecture du Projet

- **Frontend :** React (Create React App) + Tailwind CSS
- **Backend :** FastAPI (Python) + SQLite (Base de données)
- **Conversion :** Audiveris (Logiciel OMR pour lire les PDF)
- **Desktop :** Electron (Version logiciel PC)

---

## Instructions par Système (OS)

### Pour Windows (Recommandé)

#### 1. Prérequis système
- **Node.js** (v18 ou +)
- **Python** (3.9 ou +)
- **WSL2 (Ubuntu)** installé (Indispensable pour le pont Linux/Windows)
- **Audiveris** installé sur Windows (Chemin par défaut : `C:\Program Files\Audiveris\Audiveris.exe`)

#### 2. Terminal 1 : Backend (WSL Ubuntu)
> **Note :** Ce terminal gère le serveur API et la conversion des partitions.
```bash
cd piano-adapt/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

#### 3. Terminal 2 : Frontend (PowerShell / CMD)
> À la racine du projet :
```bash
npm install # (si c'est pas installé)
npm start

> Attendre que l'application s'ouvre dans le navigateur sur le port 3000.

#### 4. Terminal 3 : Logiciel Electron (PowerShell / CMD)
> À la racine du projet, une fois le frontend lancé
```bash
npm run electron

### Pour macOS

#### 1. Prérequis système
- **Node.js** (v18 ou +)

- **Python** (3.9 ou +)

- **Audiveris** installé pour macOS.


#### 2. Adaptation du Code
Comme Mac n'utilise pas WSL, il faut modifier ces deux points dans backend/main.py :

1. Change AUDIVERIS_BIN pour pointer vers ton exécutable : /Applications/Audiveris.app/Contents/MacOS/Audiveris.

2. Dans la fonction wsl_path_to_windows, remplace le contenu par :
``Python
def wsl_path_to_windows(linux_path: str) -> str:
    return os.path.abspath(linux_path)


#### 3. Lancement (3 Terminaux)
Terminal 1 (Backend) : cd backend && source venv/bin/activate && uvicorn main:app --reload

Terminal 2 (Frontend) : npm install (que la premiere fois) && npm start

Terminal 3 (Logiciel) : npm run electron