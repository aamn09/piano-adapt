/**
 * @file index.js
 * @description Point d'entrée JavaScript de l'application.
 * Initialise le rendu React dans le DOM (Document Object Model) et 
 * injecte le composant racine <App /> dans la div d'ID "root".
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Chargement des styles Tailwind
import App from './App';


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);