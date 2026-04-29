import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SETORES = [
  'Instalação',
  'Suporte',
  'Manutenção LOSS',
  'Comercial',
  'SAC',
  'Telefonia',
  'N2',
  'Desenvolvimento',
  'RH',
  'NOC',
  'Redes',
];

const CORES_SETOR = {
  'Instalação':      ['#dbeafe','#1e40af'],
  'Suporte':         ['#d1fae5','#065f46'],
  'Manutenção LOSS': ['#fef3c7','#92400e'],
  'Comercial':       ['#ede9fe','#5b21b6'],
  'SAC':             ['#fee2e2','#991b1b'],
  'Telefonia':       ['#e0f2fe','#0369a1'],
  'N2':              ['#fce7f3','#9d174d'],
  'Desenvolvimento': ['#f0fdf4','#166534'],
  'RH':              ['#fff7ed','#9a3412'],
  'NOC':             ['#f1f5f9','#334155'],
  'Redes':           ['#ecfdf5','#047857'],
};

const ini = n => (n||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

export default function Colaboradores() {
  const { temRole } = useAuth();
  const [colaboradores, setColaboradores] = useState([]);
  const [modal, setModal]     = useState(false);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState({ nome:'', cargo:'', setor: SETORES[0] });
  const [erro, setErro]       = useState('');
  const [busca, setBusca]     = useState('');
  const [setorFiltro, setSetorFiltro] = useState('Todos');

  const podeEditar = temRole('admin','gestor') || (temRole && false); // RH será adicionado via permissão

  useEffect(() => { carregar(); }, []);

  const carregar = () => {
    api.get('/colaboradores').then(r => setColaboradores(r.data)).catch(() => {});
  };

  const abrirModal = (c = null) => {
    setEditId(c?.id || null);
    setForm(c ? { nome:c.nome, cargo:c.cargo, setor:c.setor } : { nome:'', cargo:'', setor:SETORES[0] });
    setErro(''); setModal(true);
  };

  const salvar = async () => {
    if (!form.nome.trim() || !form.cargo.trim()) { setErro('Nome e cargo obrigatórios'); return; }
    try {
      if (editId) await api.put(`/colaboradores/${editId}`, form);
      else        await api.post('/colaboradores', form);
      setModal(false); carregar();
    } catch(err) { setErro(err.response?.data?.erro || 'Erro ao salvar'); }
  };

  const excluir = async (id) => {
    if (!confirm('Remover este colaborador?')) return;
    try { await api.delete(`/colaboradores/${id}`); carregar(); }
    catch { alert('Erro ao remover'); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Agrupa por setor
  const setoresComColaboradores = SETORES.filter(s =>
    setorFiltro === 'Todos' || s === setorFiltro
  ).map(setor => ({
    setor,
    lista: colaboradores.filter(c =>
      c.setor === setor &&
      (busca === '' || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cargo.toLowerCase().includes(busca.toLowerCase()))
    ),
  })).filter(s => s.lista.length > 0 || setorFiltro !== 'Todos');

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Busca */}
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 flex-1 min-w-[180px]">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou cargo..."
            className="border-none outline-none text-sm flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"/>
        </div>

        {/* Filtro setor */}
        <select value={setorFiltro} onChange={e => setSetorFiltro(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none">
          <option value="Todos">Todos os setores</option>
          {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {podeEditar && (
          <button onClick={() => abrirModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0">
            + Adicionar
          </button>
        )}
      </div>

      {/* Cards por setor */}
      {setoresComColaboradores.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
          Nenhum colaborador encontrado.
        </div>
      )}

      <div className="space-y-6">
        {setoresComColaboradores.map(({ setor, lista }) => {
          const [bg, cor] = CORES_SETOR[setor] || ['#f3f4f6','#374151'];
          return (
            <div key={setor} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              {/* Header do setor */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{background: cor}}/>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{setor}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{background: bg, color: cor}}>
                    {lista.length} {lista.length === 1 ? 'colaborador' : 'colaboradores'}
                  </span>
                </div>
                {podeEditar && (
                  <button onClick={() => { setForm({ nome:'', cargo:'', setor }); setEditId(null); setErro(''); setModal(true); }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    + Adicionar ao setor
                  </button>
                )}
              </div>

              {/* Grid de colaboradores */}
              {lista.length === 0 ? (
                <div className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 italic">Nenhum colaborador neste setor ainda.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-800">
                  {lista.map(c => (
                    <div key={c.id} className="px-5 py-4 flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{background: bg, color: cor}}>
                        {ini(c.nome)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{c.nome}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.cargo}</div>
                      </div>
                      {podeEditar && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => abrirModal(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => excluir(c.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={() => setModal(false)} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{editId ? 'Editar Colaborador' : 'Novo Colaborador'}</span>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Nome completo</label>
                <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do colaborador"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Cargo / Função</label>
                <input value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex: Técnico de Campo, Analista..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Setor</label>
                <select value={form.setor} onChange={e => set('setor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400">
                  {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {erro && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg px-3 py-2 text-sm">{erro}</div>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={salvar} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                {editId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}