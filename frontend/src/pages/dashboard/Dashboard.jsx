import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const hora = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const GUIAS_LOCAL = [
  {id:1, titulo:'Ativação 02B / AN5506',       descricao:'NE Manager — PPPoE com VLAN'},
  {id:2, titulo:'Ativação Huawei em Bridge',   descricao:'iManager U2000 — ONT em modo bridge'},
  {id:3, titulo:'Configuração Telefonia VoIP', descricao:'SIP na ONT Huawei — VLAN 240/20'},
  {id:4, titulo:'02B / HG em Bridge',          descricao:'NE Manager — Port Service Config'},
  {id:5, titulo:'Checklist de Fotos',          descricao:'Fotos obrigatórias na instalação'},
];

export default function Dashboard() {
  const { usuario } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState({ guias:0, equipamentos:0, tecnicos:0 });
  const [guias, setGuias] = useState(GUIAS_LOCAL);
  const [tecs,  setTecs]  = useState([]);

  useEffect(() => {
    api.get('/guias')
      .then(r => {
        const data = r.data?.length ? r.data : GUIAS_LOCAL;
        setGuias(data);
        setStats(p => ({...p, guias: data.length}));
      })
      .catch(() => {
        setGuias(GUIAS_LOCAL);
        setStats(p => ({...p, guias: GUIAS_LOCAL.length}));
      });

    api.get('/tecnicos')
      .then(r => { setTecs(r.data); setStats(p => ({...p, tecnicos: r.data.length})); })
      .catch(() => {});

    api.get('/equipamentos')
      .then(r => setStats(p => ({...p, equipamentos: r.data.length})))
      .catch(() => {});
  }, []);

  const ST = {
    'Disponível': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'Em campo':   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Folga':      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const cards = [
    { label:'Guias',        value:stats.guias,        sub:'Tutoriais disponíveis', color:'text-blue-600 dark:text-blue-400',    bg:'bg-blue-50 dark:bg-blue-900/30',    icon:'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', link:'/guias' },
    { label:'Equipamentos', value:stats.equipamentos, sub:'Modelos catalogados',   color:'text-teal-600 dark:text-teal-400',    bg:'bg-teal-50 dark:bg-teal-900/30',    icon:'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18', link:'/equipamentos' },
    { label:'Técnicos',     value:stats.tecnicos,     sub:'Cadastrados',           color:'text-green-600 dark:text-green-400',  bg:'bg-green-50 dark:bg-green-900/30',  icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z', link:'/tecnicos' },
    { label:'Regiões',      value:1,                  sub:'Cascavel e região',     color:'text-orange-600 dark:text-orange-400', bg:'bg-orange-50 dark:bg-orange-900/30', icon:'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', link:'/mapa' },
  ];

  return (
    <div className="space-y-5">
      {/* Saudação */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {hora()}, <strong className="text-gray-900 dark:text-white">{usuario?.nome?.split(' ')[0]}</strong>! Bem-vindo ao guia interno.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} onClick={() => nav(c.link)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <svg className={`w-5 h-5 ${c.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d={c.icon}/></svg>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{c.label}</div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Guias */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Guias de Instrução</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Acesso rápido aos tutoriais</div>
            </div>
            <button onClick={() => nav('/guias')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">Ver todos</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {guias.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-gray-400">Nenhum guia encontrado</div>
            ) : (
              guias.slice(0,5).map(g => (
                <div key={g.id} onClick={() => nav('/guias')}
                  className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{g.titulo}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{g.descricao}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 ml-3 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Técnicos */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Técnicos Cadastrados</div>
            <button onClick={() => nav('/tecnicos')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">Ver todos</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {tecs.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-gray-400">Nenhum técnico cadastrado</div>
            ) : (
              tecs.slice(0,8).map(t => (
                <div key={t.id} className="px-5 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{t.nome}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${ST[t.status]||ST['Folga']}`}>{t.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}