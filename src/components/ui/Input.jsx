/**
 * @file Input.jsx
 * @description Champ de saisie (Input) générique.
 * Supporte tous les types HTML (text, password, email, file...).
 */
import React from 'react';

/**
 * @param {string} className - Classes CSS additionnelles.
 * @param {string} type - Le type d'input (text, password, file, etc.).
 * @param {Object} props - Les props standards (value, onChange, placeholder...).
 */
export function Input({ className = "", type, ...props }) {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white
        file:border-0 file:bg-transparent file:text-sm file:font-medium 
        placeholder:text-slate-400 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 
        ${className}`}
      {...props}
    />
  );
}

export default Input;