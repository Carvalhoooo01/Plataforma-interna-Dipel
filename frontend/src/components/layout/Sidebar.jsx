import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const S = ({ d }) => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const getLidos = () => {
  try { return JSON.parse(localStorage.getItem('dp_avisos_lidos') || '[]'); }
  catch { return []; }
};

const NavItem = ({ to, label, icon, onClick, badge }) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-all ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
    }`
  }>
    {icon}
    <span className="flex-1">{label}</span>
    {badge > 0 && (
      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </NavLink>
);

const Label = ({ text }) => (
  <div className="px-4 pt-4 pb-1 text-[10px] font-semibold tracking-widest uppercase text-gray-500">{text}</div>
);

const ini = n => (n||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

export default function Sidebar({ open, onClose, dark, toggleDark }) {
  const { usuario, temRole, temAcesso, logout } = useAuth();
  const [naoLidos, setNaoLidos] = useState(0);

  const calcularNaoLidos = (lista) => {
    const lidos = getLidos();
    return lista.filter(a => !lidos.includes(a.id)).length;
  };

  useEffect(() => {
    const atualizar = () => {
      api.get('/avisos').then(r => {
        setNaoLidos(calcularNaoLidos(r.data));
      }).catch(() => {});
    };
    atualizar();
    window.addEventListener('avisos-lidos', atualizar);
    const interval = setInterval(atualizar, 2 * 60 * 1000);
    return () => {
      window.removeEventListener('avisos-lidos', atualizar);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-gray-900 z-40">
        <SidebarContent usuario={usuario} temRole={temRole} temAcesso={temAcesso} logout={logout} dark={dark} toggleDark={toggleDark} onNav={() => {}} naoLidos={naoLidos} />
      </aside>
      {open && (
        <aside className="flex lg:hidden flex-col fixed top-0 left-0 bottom-0 w-64 bg-gray-900 z-50">
          <SidebarContent usuario={usuario} temRole={temRole} temAcesso={temAcesso} logout={logout} dark={dark} toggleDark={toggleDark} onNav={onClose} showClose onClose={onClose} naoLidos={naoLidos} />
        </aside>
      )}
    </>
  );
}

function SidebarContent({ usuario, temRole, temAcesso, logout, dark, toggleDark, onNav, showClose, onClose, naoLidos }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">D</div>
        <div>
          <div className="text-sm font-bold text-white">Dipelnet</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Guia Interno</div>
        </div>
        {showClose && (
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Usuário */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-300 text-xs font-bold flex-shrink-0">
          {ini(usuario?.nome)}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-white truncate">{usuario?.nome}</div>
          <div className="text-[10px] text-gray-500 capitalize">{usuario?.role}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <Label text="Principal" />
        {temAcesso('dashboard')     && <NavItem to="/dashboard"     label="Dashboard"               icon={<S d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>} onClick={onNav} />}
        {temAcesso('guias')         && <NavItem to="/guias"         label="Guias de Instrução"      icon={<S d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>} onClick={onNav} />}
        {temAcesso('equipamentos')  && <NavItem to="/equipamentos"  label="Equipamentos"            icon={<S d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>} onClick={onNav} />}
        {temAcesso('tecnicos')      && <NavItem to="/tecnicos"      label="Técnicos"                icon={<S d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>} onClick={onNav} />}
        {temAcesso('colaboradores') && <NavItem to="/colaboradores" label="Setores e Colaboradores" icon={<S d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>} onClick={onNav} />}
        {temAcesso('mapa')          && <NavItem to="/mapa"          label="Mapa de Técnicos"        icon={<S d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>} onClick={onNav} />}

        <Label text="Comunicação" />
        {temAcesso('reciclagem')    && <NavItem to="/reciclagem"    label="Manual de Reciclagem"    icon={<S d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>} onClick={onNav} />}
        {temAcesso('avisos')        && <NavItem to="/avisos"        label="Avisos e Comunicados"    badge={naoLidos} icon={<S d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>} onClick={onNav} />}

        {temRole('admin','gestor') && <>
          <Label text="Admin" />
          <NavItem to="/usuarios" label="Gerenciar Usuários" icon={<S d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>} onClick={onNav} />
        </>}

        {/* Modo Claro/Escuro */}
        <div className="px-2 mt-2">
          <button onClick={toggleDark}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <span className="text-base w-4 h-4 flex-shrink-0 leading-none">{dark ? '☀️' : '🌙'}</span>
            {dark ? 'Modo Claro' : 'Modo Escuro'}
            <div className="ml-auto w-9 h-5 rounded-full relative transition-colors" style={{ background: dark ? '#2563eb' : 'rgba(255,255,255,0.2)' }}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${dark ? 'left-4' : 'left-0.5'}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <S d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          Sair da conta
        </button>
        <div className="text-[10px] text-gray-600 text-center">v1.0.0 · Dipelnet 2025</div>
      </div>
    </>
  );
}