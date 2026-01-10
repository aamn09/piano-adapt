/**
 * @file Button.jsx
 * @description Composant Bouton générique et réutilisable.
 * Gère les états de focus, de désactivation et permet de surcharger les styles via className.
 */
import React from 'react';

/**
 * @param {string} className - Classes CSS additionnelles (ex: "bg-red-500").
 * @param {React.ReactNode} children - Le contenu du bouton (Texte, Icône...).
 * @param {Object} props - Toutes les autres props standards (onClick, disabled, type...).
 */
export function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;