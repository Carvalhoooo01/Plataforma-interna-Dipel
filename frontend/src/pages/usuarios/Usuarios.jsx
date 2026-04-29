import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ABAS } from '../../contexts/AuthContext';

const ROLES      = ['admin','gestor','colaborador'];
const ROLE_BADGE = { admin:['#fee2e2','#991b1b'], gestor:['#ede9fe','#5b21b6'], colaborador:['#e8f0fe','#1e40af'] };
const ROLE_LABEL = { admin:'Admin', gestor:'Gestor', colaborador:'Colaborador' };
const ini = n => (n||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

const th = {padding:'9px 14px',fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:.5,borderBottom:'1px solid #e5e7eb',background:'#f9fafb',textAlign:'left',whiteSpace:'nowrap'};
const td = {padding:'11px 14px',fontSize:13,borderBottom:'1px solid #e5e7eb',verticalAlign:'middle'};

const inp = {
  width:'100%',
  padding:'8px 11px',
  border:'1px solid #d1d5db',
  borderRadius:8,
  fontSize:13,
  outline:'none',
  boxSizing:'border-box',
  color:'#111827',
  background:'#ffffff',
};

const PERM_INI = () => {
  const p = {};
  ABAS.forEach(a => p[a.key] = true);
  return p;
};

const Campo = ({ label, children }) => (
  <div style={{marginBottom:14}}>
    <label style={{display:'block',fontSize:11,fontWeight:600,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.4}}>{label}</label>
    {children}
  </div>
);

export default function Usuarios() {
  const [lista, setLista]       = useState([]);
  const [modal, setModal]       = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ nome:'', email:'', senha:'', role:'colaborador', permissoes: PERM_INI() });
  const [erro, setErro]         = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    api.get('/usuarios').then(r => setLista(r.data)).catch(() => {});
  }, []);

  const set    = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setPerm = (k, v) => setForm(p => ({ ...p, permissoes: { ...p.permissoes, [k]: v } }));

  const abrirModal = (u = null) => {
    setEditId(u?.id || null);
    setForm(u
      ? { nome:u.nome, email:u.email, senha:'', role:u.role, permissoes: u.permissoes || PERM_INI() }
      : { nome:'', email:'', senha:'', role:'colaborador', permissoes: PERM_INI() }
    );
    setErro(''); setModal(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.email) { setErro('Nome e e-mail obrigatórios'); return; }
    if (!editId && form.senha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return; }
    try {
      const payload = { ...form };
      if (form.role !== 'colaborador') payload.permissoes = {};
      if (editId) await api.put(`/usuarios/${editId}`, payload);
      else        await api.post('/usuarios', payload);
      setModal(false);
      api.get('/usuarios').then(r => setLista(r.data)).catch(() => {});
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar'); }
  };

  const excluir = async (id) => {
    if (!confirm('Excluir este usuário permanentemente?\nEsta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      setLista(p => p.filter(u => u.id !== id));
    }
    catch (err) { alert(err.response?.data?.erro || 'Erro ao excluir'); }
  };

  const isColaborador = form.role === 'colaborador';

  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button
          onClick={() => abrirModal()}
          style={{padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:500,background:'#1a56db',color:'#fff',border:'none',cursor:'pointer'}}
        >
          + Novo Colaborador
        </button>
      </div>

      {/* MOBILE: cards */}
      {isMobile ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {!lista.length && (
            <div style={{textAlign:'center',color:'#9ca3af',padding:32,fontSize:13}}>Nenhum usuário encontrado</div>
          )}
          {lista.map(u => {
            const [bg, co] = ROLE_BADGE[u.role] || ['#f3f4f6','#374151'];
            const perms    = u.permissoes || {};
            const nAbas    = u.role !== 'colaborador' ? 'Acesso total' : Object.values(perms).filter(Boolean).length + ' abas';
            return (
              <div key={u.id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'14px 16px',boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'#e8f0fe',color:'#1e40af',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,flexShrink:0}}>
                    {ini(u.nome)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#111827'}}>{u.nome}</div>
                    <div style={{fontSize:12,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                  </div>
                  <span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:500,background:bg,color:co,flexShrink:0}}>
                    {ROLE_LABEL[u.role]||u.role}
                  </span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <span style={{fontSize:11,color:'#6b7280',background:'#f3f4f6',padding:'2px 8px',borderRadius:10}}>{nAbas}</span>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={() => abrirModal(u)} style={{flex:1,background:'transparent',border:'1px solid #e5e7eb',borderRadius:8,padding:'7px 0',fontSize:13,cursor:'pointer',fontWeight:500,color:'#374151'}}>Editar</button>
                  <button onClick={() => excluir(u.id)} style={{flex:1,background:'#dc2626',color:'#fff',border:'none',borderRadius:8,padding:'7px 0',fontSize:13,cursor:'pointer',fontWeight:500}}>Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DESKTOP: tabela */
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  <th style={th}>Nome</th>
                  <th style={th}>E-mail</th>
                  <th style={th}>Perfil</th>
                  <th style={th}>Acesso</th>
                  <th style={th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(u => {
                  const [bg, co] = ROLE_BADGE[u.role] || ['#f3f4f6','#374151'];
                  const perms    = u.permissoes || {};
                  const nAbas    = u.role !== 'colaborador' ? 'Tudo' : Object.values(perms).filter(Boolean).length + ' abas';
                  return (
                    <tr key={u.id}
                      onMouseEnter={e => e.currentTarget.querySelectorAll('td').forEach(t => t.style.background='#f9fafb')}
                      onMouseLeave={e => e.currentTarget.querySelectorAll('td').forEach(t => t.style.background='')}>
                      <td style={td}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <div style={{width:30,height:30,borderRadius:'50%',background:'#e8f0fe',color:'#1e40af',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,flexShrink:0}}>{ini(u.nome)}</div>
                          <span style={{fontWeight:500,color:'#111827'}}>{u.nome}</span>
                        </div>
                      </td>
                      <td style={{...td,color:'#6b7280'}}>{u.email}</td>
                      <td style={td}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:500,background:bg,color:co}}>{ROLE_LABEL[u.role]||u.role}</span></td>
                      <td style={{...td,fontSize:12,color:'#6b7280'}}>{nAbas}</td>
                      <td style={td}>
                        <div style={{display:'flex',gap:6}}>
                          <button onClick={() => abrirModal(u)} style={{background:'transparent',border:'1px solid #e5e7eb',borderRadius:7,padding:'4px 10px',fontSize:12,cursor:'pointer',color:'#374151'}}>Editar</button>
                          <button onClick={() => excluir(u.id)} style={{background:'#dc2626',color:'#fff',border:'none',borderRadius:7,padding:'4px 10px',fontSize:12,cursor:'pointer'}}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!lista.length && (
                  <tr><td colSpan={5} style={{...td,textAlign:'center',color:'#9ca3af',padding:24}}>Nenhum usuário encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          onClick={() => setModal(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center'}}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:'#ffffff',
              borderRadius: isMobile ? '16px 16px 0 0' : 14,
              width: isMobile ? '100%' : 520,
              maxWidth:'100vw',
              maxHeight:'92vh',
              overflowY:'auto',
              boxShadow:'0 20px 60px rgba(0,0,0,.2)',
              position: isMobile ? 'fixed' : 'relative',
              bottom: isMobile ? 0 : 'auto',
              left: isMobile ? 0 : 'auto',
            }}
          >
            <div style={{padding:'18px 22px 14px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#ffffff',zIndex:1}}>
              <span style={{fontSize:15,fontWeight:600,color:'#111827'}}>{editId ? 'Editar Usuário' : 'Novo Colaborador'}</span>
              <button onClick={() => setModal(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#6b7280',lineHeight:1}}>×</button>
            </div>

            <div style={{padding:'18px 22px'}}>
              <Campo label="Nome completo">
                <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" style={inp} />
              </Campo>

              <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:14}}>
                <Campo label="E-mail">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@dipelnet.com.br" style={inp} />
                </Campo>
                <Campo label="Perfil">
                  <select value={form.role} onChange={e => set('role', e.target.value)} style={{...inp, background:'#ffffff'}}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]||r}</option>)}
                  </select>
                </Campo>
              </div>

              {!editId && (
                <Campo label="Senha inicial (mín. 6 caracteres)">
                  <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="••••••••" style={inp} />
                </Campo>
              )}

              {isColaborador && (
                <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,padding:14,marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:12}}>🔒 Permissões de acesso</div>

                  <div style={{fontSize:11,fontWeight:600,color:'#6b7280',marginBottom:8,textTransform:'uppercase',letterSpacing:.4}}>Abas visíveis</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:14}}>
                    {ABAS.map(a => (
                      <label key={a.key} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,border:'1px solid #e2e8f0',background:form.permissoes[a.key]?'#eff6ff':'#fff',cursor:'pointer',fontSize:13,color:'#374151'}}>
                        <input
                          type="checkbox"
                          checked={!!form.permissoes[a.key]}
                          onChange={e => setPerm(a.key, e.target.checked)}
                          style={{accentColor:'#1a56db',width:15,height:15}}
                        />
                        {a.label}
                      </label>
                    ))}
                  </div>

                  <div style={{fontSize:11,fontWeight:600,color:'#6b7280',marginBottom:8,textTransform:'uppercase',letterSpacing:.4}}>Pode editar / excluir</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                    {['tecnicos','avisos','equipamentos','guias','colaboradores'].map(ctx => (
                      <>
                        <label key={`editar_${ctx}`} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,border:'1px solid #e2e8f0',background:form.permissoes[`editar_${ctx}`]?'#f0fdf4':'#fff',cursor:'pointer',fontSize:13,color:'#374151'}}>
                          <input
                            type="checkbox"
                            checked={!!form.permissoes[`editar_${ctx}`]}
                            onChange={e => setPerm(`editar_${ctx}`, e.target.checked)}
                            style={{accentColor:'#059669',width:15,height:15}}
                          />
                          Editar {ctx.charAt(0).toUpperCase()+ctx.slice(1)}
                        </label>
                        <label key={`excluir_${ctx}`} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,border:'1px solid #e2e8f0',background:form.permissoes[`excluir_${ctx}`]?'#fff1f2':'#fff',cursor:'pointer',fontSize:13,color:'#374151'}}>
                          <input
                            type="checkbox"
                            checked={!!form.permissoes[`excluir_${ctx}`]}
                            onChange={e => setPerm(`excluir_${ctx}`, e.target.checked)}
                            style={{accentColor:'#dc2626',width:15,height:15}}
                          />
                          Excluir {ctx.charAt(0).toUpperCase()+ctx.slice(1)}
                        </label>
                      </>
                    ))}
                  </div>
                </div>
              )}

              {erro && (
                <div style={{background:'#fee2e2',color:'#991b1b',borderRadius:8,padding:'8px 12px',fontSize:13,marginBottom:12}}>
                  {erro}
                </div>
              )}

              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={() => setModal(false)} style={{padding:'8px 18px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',fontSize:13,cursor:'pointer',color:'#374151'}}>Cancelar</button>
                <button onClick={salvar} style={{padding:'8px 18px',borderRadius:8,background:'#1a56db',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer'}}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}