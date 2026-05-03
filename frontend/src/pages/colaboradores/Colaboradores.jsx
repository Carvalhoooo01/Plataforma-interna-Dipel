import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SETORES = [
  'Instalação','Suporte','Manutenção LOSS','Comercial','SAC',
  'Telefonia','N2','Desenvolvimento','RH','NOC','Redes',
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

const IconWhatsApp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.849L.057 23.57a.75.75 0 00.918.913l5.84-1.527A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.708 9.708 0 01-4.951-1.354l-.355-.211-3.674.961.978-3.58-.231-.367A9.709 9.709 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
  </svg>
);

// ── Seção de contrato ─────────────────────────────────
function ContratoSection({ tipo, id, contratoUrl, onAtualizar, apiInstance }) {
  const [uploading, setUploading] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const inputRef = useRef(null);

  const uploadContrato = async (file) => {
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const { data } = await apiInstance.post(`/${tipo}/${id}/contrato`, buffer, {
        headers: { 'x-filename': file.name, 'Content-Type': 'application/octet-stream' },
        transformRequest: [(d) => d],
      });
      if (data.ok) onAtualizar(data.url);
      else alert('Erro ao enviar contrato');
    } catch (e) { alert('Erro ao enviar contrato: ' + (e.response?.data?.erro || e.message)); }
    finally { setUploading(false); }
  };

  const removerContrato = async () => {
    if (!confirm('Remover contrato?')) return;
    setRemovendo(true);
    try {
      await apiInstance.delete(`/${tipo}/${id}/contrato`);
      onAtualizar(null);
    } catch { alert('Erro ao remover'); }
    finally { setRemovendo(false); }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        📄 Contrato
      </div>
      {contratoUrl ? (
        <div className="flex items-center gap-2">
          {/* URL direta do Cloudinary */}
          <a href={contratoUrl?.startsWith('http') ? contratoUrl : `${apiInstance.defaults.baseURL?.replace(/\/api$/, '')}${contratoUrl}`} target="_blank" rel="noreferrer"
            className="flex-1 text-xs text-blue-600 dark:text-blue-400 hover:underline truncate flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Ver contrato
          </a>
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Trocar
          </button>
          <button onClick={removerContrato} disabled={removendo}
            className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors">
            {removendo ? '...' : '×'}
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full text-xs px-3 py-2 rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1.5">
          {uploading ? 'Enviando...' : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              Enviar contrato
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" className="hidden"
        onChange={e => e.target.files?.[0] && uploadContrato(e.target.files[0])}/>
    </div>
  );
}

export default function Colaboradores() {
  const { temRole } = useAuth();
  const [colaboradores, setColaboradores] = useState([]);
  const [modal, setModal]       = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ nome:'', cargo:'', setor: SETORES[0], telefone:'' });
  const [erro, setErro]         = useState('');
  const [busca, setBusca]       = useState('');
  const [setorFiltro, setSetorFiltro] = useState('Todos');

  const podeEditar = temRole('admin','gestor');

  useEffect(() => { carregar(); }, []);

  const carregar = () => {
    api.get('/colaboradores').then(r => setColaboradores(r.data)).catch(() => {});
  };

  const abrirModal = (c = null) => {
    setEditId(c?.id || null);
    setForm(c
      ? { nome:c.nome, cargo:c.cargo, setor:c.setor, telefone:c.telefone||'' }
      : { nome:'', cargo:'', setor:SETORES[0], telefone:'' }
    );
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

  const abrirWhatsApp = (telefone) => {
    const num  = telefone.replace(/\D/g, '');
    const fone = num.startsWith('55') ? num : '55' + num;
    window.open(`https://wa.me/${fone}`, '_blank');
  };

  const atualizarContrato = (id, url) => {
    setColaboradores(prev => prev.map(c => c.id === id ? { ...c, contrato_url: url } : c));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 flex-1 min-w-[180px]">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou cargo..."
            className="border-none outline-none text-sm flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"/>
        </div>
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

      {setoresComColaboradores.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">Nenhum colaborador encontrado.</div>
      )}

      <div className="space-y-6">
        {setoresComColaboradores.map(({ setor, lista }) => {
          const [bg, cor] = CORES_SETOR[setor] || ['#f3f4f6','#374151'];
          return (
            <div key={setor} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{background: cor}}/>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{setor}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{background: bg, color: cor}}>
                    {lista.length} {lista.length === 1 ? 'colaborador' : 'colaboradores'}
                  </span>
                </div>
                {podeEditar && (
                  <button onClick={() => { setForm({ nome:'', cargo:'', setor, telefone:'' }); setEditId(null); setErro(''); setModal(true); }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    + Adicionar ao setor
                  </button>
                )}
              </div>

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
                        {c.contrato_url && (
                          <a href={c.contrato_url?.startsWith('http') ? c.contrato_url : `${api.defaults.baseURL?.replace(/\/api$/, '')}${c.contrato_url}`} target="_blank" rel="noreferrer"
                            className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            Contrato
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {c.telefone && (
                          <button onClick={() => abrirWhatsApp(c.telefone)}
                            className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 transition-colors"
                            title="WhatsApp">
                            <IconWhatsApp />
                          </button>
                        )}
                        {podeEditar && (
                          <>
                            <button onClick={() => abrirModal(c)}
                              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button onClick={() => excluir(c.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Setor</label>
                  <select value={form.setor} onChange={e => set('setor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400">
                    {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Telefone</label>
                  <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(45) 9 9999-9999"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"/>
                </div>
              </div>
              {editId && (
                <ContratoSection
                  tipo="colaboradores"
                  id={editId}
                  contratoUrl={colaboradores.find(c => c.id === editId)?.contrato_url || null}
                  onAtualizar={(url) => atualizarContrato(editId, url)}
                  apiInstance={api}
                />
              )}
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