import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
const Ctx = createContext(null);

export const ABAS = [
  { key:'dashboard',    label:'Dashboard' },
  { key:'guias',        label:'Guias de Instrução' },
  { key:'equipamentos', label:'Equipamentos' },
  { key:'tecnicos',     label:'Técnicos' },
  { key:'mapa',         label:'Mapa de Técnicos' },
  { key:'reciclagem',   label:'Manual de Reciclagem' },
  { key:'avisos',       label:'Avisos e Comunicados' },
];

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null);
  const [carregando, setCarreg] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dp_token');
    const salvo = localStorage.getItem('dp_usuario');
    if (token && salvo) {
      try {
        setUsuario(JSON.parse(salvo));
        // Valida o token no backend — se inválido, faz logout
        api.get('/auth/me').catch(() => {
          localStorage.removeItem('dp_token');
          localStorage.removeItem('dp_usuario');
          setUsuario(null);
        });
      } catch {
        localStorage.removeItem('dp_token');
        localStorage.removeItem('dp_usuario');
      }
    }
    setCarreg(false);
  }, []);

  const login = async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('dp_token',   data.token);
    localStorage.setItem('dp_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  };

  const logout = () => {
    localStorage.removeItem('dp_token');
    localStorage.removeItem('dp_usuario');
    setUsuario(null);
  };

  const temRole = (...roles) => roles.includes(usuario?.role);

  const temAcesso = (aba) => {
    if (!usuario) return false;
    if (temRole('admin', 'gestor')) return true;
    const perms = usuario.permissoes || {};
    if (Object.keys(perms).length === 0) return aba === 'dashboard';
    return perms[aba] === true;
  };

  const podeEditar = (contexto) => {
    if (temRole('admin', 'gestor')) return true;
    const perms = usuario?.permissoes || {};
    return perms[`editar_${contexto}`] === true;
  };

  const podeExcluir = (contexto) => {
    if (temRole('admin', 'gestor')) return true;
    const perms = usuario?.permissoes || {};
    return perms[`excluir_${contexto}`] === true;
  };

  return (
    <Ctx.Provider value={{ usuario, carregando, login, logout, temRole, temAcesso, podeEditar, podeExcluir }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
};