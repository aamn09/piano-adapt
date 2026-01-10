const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#020617', 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // Optionnel : Enlever la barre de menu par défaut (Fichier, Édition...)
    // autoHideMenuBar: true, 
  });

  
  win.loadURL('http://localhost:3000');

  // Ouvre les outils de développement (inspecteur) au lancement
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

