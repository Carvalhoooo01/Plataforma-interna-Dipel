import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PRIO = {
  alta:   { badge:'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',    borda:'border-l-red-500',   label:'🔴 Alta' },
  normal: { badge:'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', borda:'',                   label:'🔵 Normal' },
  baixa:  { badge:'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',    borda:'',                   label:'⚪ Baixa' },
};

const FORM_INI = { titulo:'', corpo:'', prioridade:'normal' };

const getLidos = () => {
  try { return JSON.parse(localStorage.getItem('dp_avisos_lidos') || '[]'); }
  catch { return []; }
};

const marcarLido = (id) => {
  const lidos = getLidos();
  if (!lidos.includes(id)) {
    localStorage.setItem('dp_avisos_lidos', JSON.stringify([...lidos, id]));
  }
};

export const getAvisosNaoLidos = (lista) => {
  const lidos = getLidos();
  return lista.filter(a => !lidos.includes(a.id)).length;
};

export default function Avisos() {
  const { temRole, podeEditar: podeEditarCtx, usuario } = useAuth();
  const [lista, setLista]         = useState([]);
  const [modal, setModal]         = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(FORM_INI);
  const [erro, setErro]           = useState('');
  const [salvando, setSalv]       = useState(false);
  const [permNotif, setPermNotif] = useState(Notification.permission);
  const podeEditar = temRole('admin', 'gestor') || podeEditarCtx('avisos');

  useEffect(() => { carregar(); }, []);

  const carregar = () => api.get('/avisos').then(r => {
    setLista(r.data);
    r.data.forEach(a => marcarLido(a.id));
    window.dispatchEvent(new Event('avisos-lidos'));
  }).catch(() => {});

  const ativarNotificacoes = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      return;
    }
    const perm = await Notification.requestPermission();
    setPermNotif(perm);
    if (perm === 'granted') {
      // Salva avisos atuais como vistos para não notificar os antigos
      localStorage.setItem('dp_avisos_vistos', JSON.stringify(lista.map(a => a.id)));
      new Notification('✅ Notificações ativadas!', {
        body: 'Você receberá alertas quando novos avisos forem publicados.',
        icon: '/favicon.png',
      });
    }
  };

  const abrirModal = (a = null) => {
    setEditId(a?.id || null);
    setForm(a ? { titulo:a.titulo, corpo:a.corpo, prioridade:a.prioridade||'normal' } : FORM_INI);
    setErro(''); setModal(true);
  };

  const salvar = async () => {
    if (!form.titulo.trim() || !form.corpo.trim()) { setErro('Título e mensagem obrigatórios'); return; }
    setSalv(true); setErro('');
    try {
      if (editId) await api.put(`/avisos/${editId}`, form);
      else        await api.post('/avisos', form);
      setModal(false); setForm(FORM_INI); setEditId(null); carregar();
    } catch(err) { setErro(err.response?.data?.erro || 'Erro ao salvar'); }
    finally { setSalv(false); }
  };

  const remover = async (id) => {
    if (!confirm('Remover este aviso?')) return;
    try { await api.delete(`/avisos/${id}`); carregar(); }
    catch { setLista(p => p.filter(a => a.id !== id)); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        {/* Botão de notificações */}
        {'Notification' in window && permNotif !== 'denied' && (
          permNotif === 'granted' ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              Notificações ativas
            </div>
          ) : (
            <button onClick={ativarNotificacoes}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              Ativar notificações
            </button>
          )
        )}

        {podeEditar && (
          <button onClick={() => abrirModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors ml-auto">
            + Novo Aviso
          </button>
        )}
      </div>

      {lista.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Nenhum aviso publicado ainda.</div>
      )}

      <div className="space-y-3">
        {lista.map(a => {
          const p = PRIO[a.prioridade] || PRIO.normal;
          return (
            <div key={a.id} className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${p.borda ? 'border-l-4 '+p.borda : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{a.titulo}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${p.badge}`}>{p.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : 'Hoje'}
                  </span>
                  {podeEditar && (
                    <>
                      <button onClick={() => abrirModal(a)} className="text-xs px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">✏️</button>
                      <button onClick={() => remover(a.id)} className="text-xs px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors">🗑️</button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{a.corpo}</p>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-3">👤 {a.autor || usuario?.nome || 'Admin'}</div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={() => setModal(false)} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{editId ? '✏️ Editar Aviso' : '📢 Novo Aviso'}</span>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Título</label>
                <input value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Título do aviso"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Mensagem</label>
                <textarea value={form.corpo} onChange={e => set('corpo', e.target.value)} placeholder="Escreva o aviso..." rows={4}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 resize-y font-inherit leading-relaxed"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Prioridade</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PRIO).map(([key, val]) => (
                    <button key={key} onClick={() => set('prioridade', key)}
                      className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${form.prioridade===key ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
              {erro && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg px-3 py-2 text-sm">{erro}</div>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {salvando ? 'Publicando...' : editId ? '💾 Salvar' : '📢 Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}