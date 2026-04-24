import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useDark } from '../../contexts/ThemeContext';
import { tk } from '../../utils/theme';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const AV_CLS   = [['#e8f0fe','#1e40af'],['#d1fae5','#065f46'],['#fef3c7','#92400e'],['#ede9fe','#5b21b6']];
const ST_BADGE = { 'Disponível':['#d1fae5','#065f46'], 'Em campo':['#fef3c7','#92400e'], 'Folga':['#f3f4f6','#374151'] };
const ini = n => (n||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

function loadGoogleMaps() {
  return new Promise(resolve => {
    if (window.google?.maps?.places) { resolve(); return; }
    if (document.getElementById('gmaps-places')) {
      const wait = setInterval(() => { if (window.google?.maps?.places) { clearInterval(wait); resolve(); } }, 100);
      return;
    }
    const s = document.createElement('script');
    s.id  = 'gmaps-places';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=pt`;
    s.async = true; s.onload = resolve;
    document.head.appendChild(s);
  });
}

function RegiaoInput({ valor, onChange, dark }) {
  const c = tk(dark);
  const [busca, setBusca]         = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [aberto, setAberto]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const timer   = useRef(null);
  const autoSvc = useRef(null);
  const tags = valor ? valor.split(',').map(r => r.trim()).filter(Boolean) : [];

  useEffect(() => {
    loadGoogleMaps().then(() => {
      autoSvc.current = new window.google.maps.places.AutocompleteService();
    });
  }, []);

  const buscar = (q) => {
    clearTimeout(timer.current);
    if (q.length < 2) { setSugestoes([]); setAberto(false); return; }
    timer.current = setTimeout(() => {
      if (!autoSvc.current) return;
      setLoading(true);
      autoSvc.current.getPlacePredictions({
        input: q + ' Cascavel Paraná Brasil',
        componentRestrictions: { country: 'br' },
        types: ['geocode'], language: 'pt-BR',
      }, (predictions, status) => {
        setLoading(false);
        if (status !== 'OK' || !predictions) { buscarLocal(q); return; }
        const sug = predictions
          .filter(p => { const d = p.description.toLowerCase(); return d.includes('paraná')||d.includes('pr')||d.includes('cascavel'); })
          .map(p => {
            const partes = p.description.split(',');
            return { nome: partes[0].trim(), display: partes.slice(1,3).join(',').trim(), tipo: p.description.toLowerCase().includes('cascavel') ? 'Bairro · Cascavel' : 'Cidade · PR', place_id: p.place_id };
          })
          .filter((s, i, arr) => arr.findIndex(x => x.nome === s.nome) === i)
          .slice(0, 6);
        if (sug.length === 0) buscarLocal(q); else { setSugestoes(sug); setAberto(true); }
      });
    }, 300);
  };

  const buscarLocal = (q) => {
    const LOCAL = ['Alto Alegre','Aroeira','Bairro São Cristóvão','Brasmadeira','Cancelli','Cascavel Velho','Cataratas','Centro','Country','Esmeralda','Floresta','Interlagos','Morumbi','Pacaembu','Parque São Paulo','Parque Verde','Periolo','Pioneiros Catarinenses','Região do Lago','Santa Cruz','Santa Felicidade','Santo Inácio','Santo Onofre','Santos Dumont','São Cristóvão','Tropical','Vila Tolentino','Cafelândia','Corbélia','Guaraniaçu','Catanduvas','Nova Aurora','Cascavel','Ibema','Lindoeste'];
    const nSA = q.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const CIDADES = ['Cafelândia','Corbélia','Guaraniaçu','Catanduvas','Nova Aurora','Ibema','Lindoeste'];
    const res = LOCAL.filter(l => l.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(nSA))
      .map(l => ({ nome:l, display: CIDADES.includes(l) ? 'Paraná, Brasil' : 'Cascavel, Paraná', tipo: CIDADES.includes(l) ? 'Cidade · PR' : 'Bairro · Cascavel' }));
    setSugestoes(res.slice(0,6)); setAberto(res.length > 0);
  };

  const adicionar = (nome) => {
    if (!tags.includes(nome)) onChange([...tags, nome].join(', '));
    setBusca(''); setSugestoes([]); setAberto(false);
  };
  const remover = (tag) => onChange(tags.filter(t => t !== tag).join(', '));
  const keyDown = (e) => {
    if ((e.key==='Enter'||e.key===',') && busca.trim()) { e.preventDefault(); adicionar(busca.trim()); }
    if (e.key==='Backspace' && !busca && tags.length) remover(tags[tags.length-1]);
    if (e.key==='Escape') setAberto(false);
  };

  return (
    <div style={{ position:'relative' }}>
      <div onClick={() => document.getElementById('reg-inp')?.focus()}
        style={{ display:'flex', flexWrap:'wrap', gap:5, padding:'6px 8px', border:`1px solid ${c.inputBorder}`, borderRadius:8, minHeight:42, background:c.inputBg, cursor:'text' }}>
        {tags.map(tag => (
          <span key={tag} style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px 2px 10px', background:c.tagBg, color:c.tagColor, borderRadius:20, fontSize:12, fontWeight:500 }}>
            {tag}
            <button type="button" onClick={e => { e.stopPropagation(); remover(tag); }}
              style={{ background:'none', border:'none', cursor:'pointer', color: dark ? '#93c5fd' : '#93c5fd', fontSize:15, lineHeight:1, padding:'0 1px' }}>×</button>
          </span>
        ))}
        <input id="reg-inp" value={busca}
          onChange={e => { setBusca(e.target.value); buscar(e.target.value); }}
          onKeyDown={keyDown} onBlur={() => setTimeout(() => setAberto(false), 200)}
          placeholder={tags.length === 0 ? 'Digite um bairro ou cidade...' : ''}
          style={{ border:'none', outline:'none', fontSize:13, flex:1, minWidth:140, background:'transparent', padding:'2px 2px', color:c.text }} />
        {loading && <span style={{ alignSelf:'center', fontSize:11, color:c.textMuted }}>...</span>}
      </div>
      {aberto && sugestoes.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:c.card, border:`1px solid ${c.cardBorder}`, borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,.2)', zIndex:200, overflow:'hidden' }}>
          {sugestoes.map((s, i) => (
            <div key={i} onMouseDown={() => adicionar(s.nome)}
              style={{ padding:'10px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, borderBottom: i < sugestoes.length-1 ? `1px solid ${c.cardBorder}` : 'none', background:c.card, transition:'background .1s' }}
              onMouseEnter={e => e.currentTarget.style.background=c.bg}
              onMouseLeave={e => e.currentTarget.style.background=c.card}>
              <span style={{ fontSize:18 }}>📍</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:c.text }}>{s.nome}</div>
                <div style={{ fontSize:11, color:c.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.display}</div>
              </div>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:600, flexShrink:0, background: s.tipo.includes('Bairro') ? c.tagBg : '#d1fae5', color: s.tipo.includes('Bairro') ? c.tagColor : '#065f46' }}>
                {s.tipo}
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop:4, fontSize:11, color:c.textMuted }}>
        Selecione da lista · Enter para adicionar · ✕ para remover
      </div>
    </div>
  );
}

export default function Tecnicos() {
  const { temRole } = useAuth();
  const dark = useDark();
  const c    = tk(dark);

  const [lista, setLista]   = useState([]);
  const [modal, setModal]   = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm]     = useState({ nome:'', codigo:'', telefone:'', regioes:'', status:'Disponível', lat:'', lng:'', raio:'' });
  const [erro, setErro]     = useState('');
  const [salvando, setSalv] = useState(false);

  useEffect(() => { carregar(); }, []);

  const carregar = () => {
    api.get('/tecnicos').then(r => setLista(r.data.length ? r.data : LOCAL)).catch(() => setLista(LOCAL));
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const abrirModal = (t = null) => {
    setEditId(t?.id || null);
    setForm(t ? {
      nome:t.nome, codigo:t.codigo, telefone:t.telefone||'',
      regioes:(t.regioes||[]).join(', '), status:t.status,
      lat:t.lat||'', lng:t.lng||'', raio:t.raio||'',
    } : { nome:'', codigo:'', telefone:'', regioes:'', status:'Disponível', lat:'', lng:'', raio:'' });
    setErro(''); setModal(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.codigo) { setErro('Nome e código obrigatórios'); return; }
    setSalv(true);
    const payload = {
      nome:form.nome.trim(), codigo:form.codigo.trim(), telefone:form.telefone||null,
      regioes:form.regioes.split(',').map(r=>r.trim()).filter(Boolean), status:form.status,
      lat:  form.lat  !== '' ? parseFloat(form.lat)  : null,
      lng:  form.lng  !== '' ? parseFloat(form.lng)  : null,
      raio: form.raio !== '' ? parseFloat(form.raio) : null,
    };
    try {
      if (editId) await api.put(`/tecnicos/${editId}`, payload);
      else        await api.post('/tecnicos', payload);
      setModal(false); carregar();
    } catch (err) { setErro(err.response?.data?.erro || err.response?.data?.detalhe || 'Erro ao salvar'); }
    finally { setSalv(false); }
  };

  const remover = async (id) => {
    if (!confirm('Remover técnico?')) return;
    try { await api.delete(`/tecnicos/${id}`); carregar(); }
    catch { alert('Erro ao remover'); }
  };

  const inp = { width:'100%', padding:'8px 11px', border:`1px solid ${c.inputBorder}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', background:c.inputBg, color:c.text };
  const lbl = { display:'block', fontSize:11, fontWeight:600, color:c.textSub, marginBottom:5, textTransform:'uppercase', letterSpacing:.4 };

  return (
    <div>
      {temRole('admin','gestor') && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
          <button onClick={() => abrirModal()} style={{ padding:'7px 16px', borderRadius:8, background:'#1a56db', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:500 }}>
            + Novo Técnico
          </button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
        {lista.map((t, i) => {
          const [abg, aco] = AV_CLS[i%AV_CLS.length];
          const [sbg, sco] = ST_BADGE[t.status]||['#f3f4f6','#374151'];
          return (
            <div key={t.id||i} style={{ background:c.card, border:`1px solid ${c.cardBorder}`, borderRadius:10, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
              <div style={{ display:'flex', gap:11, alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:abg, color:aco, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, flexShrink:0 }}>{ini(t.nome)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:c.text }}>{t.nome}</div>
                  <div style={{ fontSize:11, color:c.textMuted }}>{t.codigo}</div>
                  <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500, background:sbg, color:sco, marginTop:5 }}>{t.status}</span>
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
                {(t.regioes||[]).map(r => <span key={r} style={{ fontSize:11, padding:'2px 7px', background:c.tagBg, color:c.tagColor, borderRadius:20, fontWeight:500 }}>{r}</span>)}
              </div>
              {temRole('admin','gestor') && (
                <div style={{ display:'flex', gap:6, paddingTop:10, borderTop:`1px solid ${c.cardBorder}`, justifyContent:'flex-end' }}>
                  <button onClick={() => abrirModal(t)} style={{ background:'transparent', border:`1px solid ${c.cardBorder}`, borderRadius:7, padding:'5px 11px', fontSize:12, cursor:'pointer', color:c.text }}>Editar</button>
                  <button onClick={() => remover(t.id)} style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:7, padding:'5px 11px', fontSize:12, cursor:'pointer' }}>Remover</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <div onClick={e => e.target===e.currentTarget && setModal(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:c.card, borderRadius:14, width:500, maxWidth:'94vw', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding:'18px 22px 14px', borderBottom:`1px solid ${c.cardBorder}`, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:c.card, zIndex:1 }}>
              <span style={{ fontSize:15, fontWeight:600, color:c.text }}>{editId ? 'Editar Técnico' : 'Novo Técnico'}</span>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:c.textSub }}>×</button>
            </div>

            <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lbl}>Nome completo</label><input value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="Nome do técnico" style={inp}/></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Código</label><input value={form.codigo} onChange={e=>set('codigo',e.target.value)} placeholder="Ex: T001" style={inp}/></div>
                <div><label style={lbl}>Telefone</label><input value={form.telefone} onChange={e=>set('telefone',e.target.value)} placeholder="(45) 9 9999-9999" style={inp}/></div>
              </div>
              <div>
                <label style={lbl}>Regiões de Atuação</label>
                <RegiaoInput valor={form.regioes} onChange={v => set('regioes', v)} dark={dark} />
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)} style={inp}>
                  <option>Disponível</option><option>Em campo</option><option>Folga</option>
                </select>
              </div>
              <div style={{ background:c.sectionBg, border:`1px solid ${c.sectionBorder}`, borderRadius:10, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:c.text, marginBottom:12 }}>📍 Localização base (onde mora)</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div><label style={lbl}>Latitude</label><input value={form.lat} onChange={e=>set('lat',e.target.value)} placeholder="-24.928906" style={inp}/></div>
                  <div><label style={lbl}>Longitude</label><input value={form.lng} onChange={e=>set('lng',e.target.value)} placeholder="-53.405179" style={inp}/></div>
                </div>
                <div><label style={lbl}>Raio de cobertura (metros)</label><input value={form.raio} onChange={e=>set('raio',e.target.value)} placeholder="Ex: 3000" style={inp}/></div>
                <div style={{ marginTop:8, fontSize:11, color:c.textMuted }}>Google Maps → botão direito no local → clique nas coordenadas para copiar.</div>
              </div>
              {erro && <div style={{ background:'#fee2e2', color:'#991b1b', borderRadius:8, padding:'9px 12px', fontSize:13 }}>{erro}</div>}
            </div>

            <div style={{ padding:'12px 22px', borderTop:`1px solid ${c.cardBorder}`, display:'flex', justifyContent:'flex-end', gap:8, position:'sticky', bottom:0, background:c.card }}>
              <button onClick={() => setModal(false)} style={{ background:'transparent', border:`1px solid ${c.cardBorder}`, borderRadius:7, padding:'7px 14px', fontSize:13, cursor:'pointer', color:c.text }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{ background:'#1a56db', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:500, cursor:'pointer', opacity:salvando?0.7:1 }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const LOCAL = [
  { id:1, nome:'Bruno Guilherme Vieira', codigo:'T001', regioes:['Floresta','Periolo'], status:'Disponível', lat:-24.928906, lng:-53.405179, raio:3000 },
];