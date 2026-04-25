import { createContext, useContext, useState, useEffect } from 'react';

const Ctx = createContext({ dark: false, toggleDark: () => {} });

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('dp_tema') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('dp_tema', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <Ctx.Provider value={{ dark, toggleDark: () => setDark(d => !d) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useDark = () => useContext(Ctx).dark;
export const useToggleDark = () => useContext(Ctx).toggleDark;