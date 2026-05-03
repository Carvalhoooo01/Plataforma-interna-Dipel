import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useToggleDark, useDark } from '../../contexts/ThemeContext';
import api from '../../services/api';

const PAGE = {
  '/dashboard':    ['Dashboard',             'Visão geral do sistema'],
  '/guias':        ['Guias de Instrução',     'Tutoriais e procedimentos'],
  '/equipamentos': ['Equipamentos',           'Modelos compatíveis e planos'],
  '/tecnicos':     ['Técnicos',               'Equipe e regiões de atuação'],
  '/mapa':         ['Mapa de Técnicos',       'Localização em tempo real'],
  '/avisos':       ['Avisos e Comunicados',   'Informações para a equipe'],
  '/usuarios':     ['Gerenciar Usuários',     'Colaboradores com acesso'],
  '/reciclagem':   ['Manual de Reciclagem',   'Documentação de reciclagem'],
};

const getVistos = () => {
  try { return JSON.parse(localStorage.getItem('dp_avisos_vistos') || '[]'); }
  catch { return []; }
};

const salvarVistos = (ids) => {
  localStorage.setItem('dp_avisos_vistos', JSON.stringify(ids));
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dark       = useDark();
  const toggleDark = useToggleDark();
  const { pathname } = useLocation();
  const [title, sub = ''] = PAGE[pathname] || ['Dipelnet', ''];
  const pollingRef = useRef(null);
  const iniciadoRef = useRef(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // ── POLLING DE AVISOS ────────────────────────────────
  useEffect(() => {
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;

    const verificarAvisos = async () => {
      // Só notifica se o usuário deu permissão
      if (Notification.permission !== 'granted') return;

      try {
        const { data } = await api.get('/avisos');
        const vistos = getVistos();
        const novos  = data.filter(a => !vistos.includes(a.id));

        if (novos.length > 0 && vistos.length > 0) {
          // Só notifica se já havia avisos antes (não na primeira carga)
          novos.forEach(a => {
            new Notification('📢 Dipelnet — ' + a.titulo, {
              body:  a.corpo.slice(0, 100) + (a.corpo.length > 100 ? '...' : ''),
              icon:  '/favicon.png',
              badge: '/favicon.png',
              tag:   'aviso-' + a.id,
            });
          });
        }

        // Atualiza lista de vistos
        salvarVistos(data.map(a => a.id));
      } catch {}
    };

    // Verifica imediatamente e depois a cada 60s
    verificarAvisos();
    pollingRef.current = setInterval(verificarAvisos, 60000);

    return () => clearInterval(pollingRef.current);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} dark={dark} toggleDark={toggleDark} />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div>
            <h1 className="text-base lg:text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100">{title}</h1>
            {sub && <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{sub}</p>}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}