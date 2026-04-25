import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useToggleDark, useDark } from '../../contexts/ThemeContext';

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

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dark       = useDark();
  const toggleDark = useToggleDark();
  const { pathname } = useLocation();
  const [title, sub = ''] = PAGE[pathname] || ['Dipelnet', ''];

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} dark={dark} toggleDark={toggleDark} />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
          </div>
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors no-print"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Exportar PDF
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
}