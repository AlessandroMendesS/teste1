import React, { createContext, useState, useContext } from 'react';
import { temaClaro, temaEscuro } from '../temas';

export const ContextoTema = createContext();

export const ProvedorTema = ({ children }) => {
  const [modoEscuro, setModoEscuro] = useState(false);

  const alternarTema = () => {
    setModoEscuro(!modoEscuro);
  };

  const tema = modoEscuro ? temaEscuro : temaClaro;

  return (
    <ContextoTema.Provider value={{ theme: tema, isDarkMode: modoEscuro, toggleTheme: alternarTema }}>
      {children}
    </ContextoTema.Provider>
  );
};

export const usarTema = () => useContext(ContextoTema);

