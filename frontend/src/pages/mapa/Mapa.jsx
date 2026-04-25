import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useDark } from '../../contexts/ThemeContext';
import { tk } from '../../utils/theme';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const API_URL  = import.meta.env.VITE_API_URL || '';

const ST = {
  'Disponível': { bg:'#059669', badge:'#d1fae5', text:'#065f46' },
  'Em campo':   { bg:'#d97706', badge:'#fef3c7', text:'#92400e' },
  'Folga':      { bg:'#9ca3af', badge:'#f3f4f6', text:'#374151' },
};
const CORES = ['#1a56db','#059669','#d97706','#7c3aed','#dc2626','#0891b2','#84cc16','#f59e0b'];
const ini   = n => (n||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

const geoCache   = {};
const geoPending = {};

const BAIRROS_CASCAVEL = new Set([
  '14 de Novembro','XIV de Novembro','Alto Alegre','Aroeira','Bairro São Cristóvão','Brasília',
  'Brasmadeira','Canadá','Cancelli','Cascavel Velho','Cataratas','Centro','Coqueiral','Country',
  'Esmeralda','Fag','Floresta','Guarujá','Interlagos','Maria Luiza','Morumbi','Neva','Pacaembu',
  'Parque São Paulo','Parque Verde','Periolo','Pioneiros Catarinenses','Recanto Tropical',
  'Região do Lago','Santa Cruz','Santa Felicidade','Santo Inácio','Santo Onofre','Santos Dumont',
  'São Cristóvão','Tropical','Universitário','Vila Tolentino','Vista Linda',
]);

let ibgeMunicipios = null;
async function buscarIBGE(nome) {
  try {
    if (!ibgeMunicipios) {
      const r = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/41/municipios');
      ibgeMunicipios = await r.json();
    }
    const nA  = nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const mun = ibgeMunicipios.find(m => m.nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase() === nA);
    if (!mun) return null;
    const r2   = await fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${mun.id}?formato=application/vnd.geo+json`);
    const data = await r2.json();
    const geom = data?.features?.[0]?.geometry;
    if (!geom) return null;
    const coords = geom.type==='Polygon' ? geom.coordinates[0] : geom.coordinates[0][0];
    return { geometry:geom, center_lat:coords.reduce((s,[,y])=>s+y,0)/coords.length, center_lng:coords.reduce((s,[x])=>s+x,0)/coords.length };
  } catch { return null; }
}

function buscarRegiao(nome) {
  if (geoCache[nome] !== undefined) return Promise.resolve(geoCache[nome]);
  if (geoPending[nome]) return geoPending[nome];
  const nSA      = nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const ehBairro = BAIRROS_CASCAVEL.has(nome) ||
    [...BAIRROS_CASCAVEL].some(b => b.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase() === nSA);
  const promise = (async () => {
    if (!ehBairro) { const r = await buscarIBGE(nome); if (r) { geoCache[nome]=r; return r; } }
    try {
      const token = localStorage.getItem('dp_token');
      const res   = await fetch(API_URL+'/api/geo/regiao?nome='+encodeURIComponent(nome), { headers:{Authorization:'Bearer '+token}, signal:AbortSignal.timeout(12000) });
      const data  = res.ok ? await res.json() : null;
      geoCache[nome] = data; return data;
    } catch { geoCache[nome]=null; return null; }
  })().finally(() => { delete geoPending[nome]; });
  geoPending[nome] = promise;
  return promise;
}

function geomToPath(g) {
  if (!g) return [];
  const p = c => c.map(([lng,lat]) => ({lat,lng}));
  if (g.type==='Polygon')      return [p(g.coordinates[0])];
  if (g.type==='MultiPolygon') return g.coordinates.map(r => p(r[0]));
  return [];
}

function buildTooltipHTML(reg, tecsDaRegiao) {
  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
  html += '<span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px">' + reg + '</span>';
  html += '<button data-action="close" style="background:rgba(255,255,255,.1);border:none;cursor:pointer;font-size:13px;color:#94a3b8;padding:3px 6px;border-radius:5px">&times;</button>';
  html += '</div>';
  tecsDaRegiao.forEach(function(item) {
    const tc = item.t, c = item.cor;
    const s = tc.status==='Disponível' ? {bg:'rgba(5,150,105,.25)',cl:'#6ee7b7'} : tc.status==='Em campo' ? {bg:'rgba(217,119,6,.25)',cl:'#fcd34d'} : {bg:'rgba(156,163,175,.2)',cl:'#d1d5db'};
    const nome2 = tc.nome.split(' ').slice(0,2).join(' ');
    html += '<button data-tecid="' + tc.id + '" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:8px;cursor:pointer;margin-bottom:5px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);text-align:left" onmouseover="this.style.background=\'rgba(255,255,255,.15)\';this.style.borderColor=\'' + c + '\'" onmouseout="this.style.background=\'rgba(255,255,255,.05)\';this.style.borderColor=\'rgba(255,255,255,.1)\'">';
    html += '<div style="width:11px;height:11px;border-radius:50%;background:' + c + ';flex-shrink:0;box-shadow:0 0 0 2px rgba(0,0,0,.3),0 0 0 4px ' + c + '44"></div>';
    html += '<span style="flex:1;font-size:13px;font-weight:600;color:#f1f5f9">' + nome2 + '</span>';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:' + s.bg + ';color:' + s.cl + ';font-weight:600">' + tc.status + '</span>';
    html += '</button>';
  });
  return html;
}

// ── Legenda ──────────────────────────────────────────────────────────────────
function Legenda({ tecs, sel, setSel, destacar, resetarDestaques, mapInst, dark }) {
  const c = tk(dark);
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <div style={{fontSize:11,fontWeight:700,color:c.textSub,textTransform:'uppercase',letterSpacing:.5}}>Técnicos</div>
        {sel && (
          <button
            onClick={() => { setSel(null); resetarDestaques(); }}
            style={{fontSize:10,background:c.badgeBg,border:'none',borderRadius:6,padding:'2px 7px',cursor:'pointer',color:c.textSub}}
          >
            Limpar
          </button>
        )}
      </div>

      {tecs.map((t, idx) => {
        const cor = CORES[idx%CORES.length], sc = ST[t.status]||ST['Folga'], ativo = sel?.id===t.id;
        return (
          <div
            key={t.id||idx}
            onClick={() => {
              if (ativo) { setSel(null); resetarDestaques(); }
              else {
                setSel(t); destacar(t.id);
                if (mapInst.current && t.lat && t.lng) {
                  mapInst.current.panTo({lat:parseFloat(t.lat),lng:parseFloat(t.lng)});
                  mapInst.current.setZoom(13);
                }
              }
            }}
            style={{display:'flex',alignItems:'center',gap:8,fontSize:12,marginBottom:6,cursor:'pointer',padding:'6px 7px',borderRadius:7,background:ativo?cor+'22':'transparent',border:'1px solid '+(ativo?cor:'transparent'),transition:'all .15s'}}
          >
            <div style={{width:10,height:10,borderRadius:'50%',background:cor,flexShrink:0,border:`2px solid ${c.card}`,boxShadow:'0 0 0 1.5px '+cor}}/>
            <span style={{fontWeight:ativo?700:400,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:c.text}}>{t.nome.split(' ')[0]}</span>
            <span style={{fontSize:10,padding:'1px 6px',borderRadius:10,background:sc.badge,color:sc.text,flexShrink:0}}>{t.status}</span>
          </div>
        );
      })}

      <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${c.cardBorder}`,fontSize:10,color:c.textMuted}}>
        Passe o mouse na área · Clique para destacar
      </div>
    </div>
  );
}

// ── Mapa ─────────────────────────────────────────────────────────────────────
export default function Mapa() {
  const dark = useDark();
  const c    = tk(dark);

  const [tecs, setTecs]     = useState([]);
  const [sel, setSel]       = useState(null);
  const [status, setStatus] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const mapRef      = useRef(null);
  const mapInst     = useRef(null);
  const polisMap    = useRef({});
  const objetos     = useRef([]);
  const tooltipEl   = useRef(null);
  const selRef      = useRef(null);
  const destacarRef = useRef(null);
  const resetarRef  = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { selRef.current = sel; }, [sel]);

  useEffect(() => {
    api.get('/tecnicos').then(r => setTecs(r.data.length ? r.data : LOCAL)).catch(() => setTecs(LOCAL));
  }, []);

  useEffect(() => {
    if (!tecs.length) return;
    const init = () => {
      if (!mapRef.current) return;
      if (!mapInst.current) {
        mapInst.current = new window.google.maps.Map(mapRef.current, {
          center:{lat:-24.9558,lng:-53.4548}, zoom:isMobile ? 11 : 12,
          mapTypeControl:true,
          mapTypeControlOptions:{
            style:window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position:window.google.maps.ControlPosition.TOP_LEFT,
            mapTypeIds:['roadmap','satellite','hybrid','terrain'],
          },
          streetViewControl:false, fullscreenControl:true,
          styles:[{featureType:'poi',elementType:'labels',stylers:[{visibility:'off'}]}],
        });
      }
      window.google.maps.event.addListenerOnce(mapInst.current, 'idle', () => desenhar(tecs));
    };
    if (window.google?.maps) { init(); }
    else if (!document.getElementById('gmaps-script')) {
      const s = document.createElement('script');
      s.id='gmaps-script'; s.src='https://maps.googleapis.com/maps/api/js?key='+MAPS_KEY+'&language=pt';
      s.async=true; s.onload=init; document.head.appendChild(s);
    }
  }, [tecs]);

  const hideTooltip = () => { if (tooltipEl.current) tooltipEl.current.style.display='none'; };

  const limpar = () => {
    objetos.current.forEach(o => { try { o.setMap(null); } catch {} });
    objetos.current = []; polisMap.current = {};
  };

  const destacar = (tecId) => {
    Object.entries(polisMap.current).forEach(([id, polis]) => {
      polis.forEach(p => {
        if (String(id) === String(tecId)) {
          p.setOptions({ visible:true, fillOpacity:0.45, strokeOpacity:1, strokeWeight:3.5, zIndex:20 });
        } else {
          p.setOptions({ visible:false });
        }
      });
    });
  };
  destacarRef.current = destacar;

  const resetarDestaques = () => {
    Object.values(polisMap.current).forEach(polis =>
      polis.forEach(p => p.setOptions({ visible:true, fillOpacity:0.1, strokeOpacity:0.85, strokeWeight:2.5, zIndex:1 }))
    );
  };
  resetarRef.current = resetarDestaques;

  const desenhar = async (lista) => {
    if (!mapInst.current) return;
    limpar(); hideTooltip();

    const regiaoTecs = {};
    for (let idx = 0; idx < lista.length; idx++) {
      const t = lista[idx], cor = CORES[idx%CORES.length];
      polisMap.current[t.id] = [];
      for (const reg of (t.regioes||[])) {
        if (!regiaoTecs[reg]) regiaoTecs[reg] = [];
        regiaoTecs[reg].push({ t, idx, cor });
      }
    }

    for (let idx = 0; idx < lista.length; idx++) {
      const t = lista[idx], cor = CORES[idx%CORES.length], sc = ST[t.status]||ST['Folga'];

      for (const reg of (t.regioes||[])) {
        setStatus('Buscando: '+reg+'...');
        const resultado = await buscarRegiao(reg);
        const paths     = geomToPath(resultado?.geometry||null);
        if (!paths.length) continue;

        const tecsDaRegiao = regiaoTecs[reg] || [];

        paths.forEach(path => {
          const poly = new window.google.maps.Polygon({
            paths:path, map:mapInst.current,
            fillColor:cor, fillOpacity:0.1,
            strokeColor:cor, strokeWeight:2.5, strokeOpacity:0.85,
            zIndex:idx+1, clickable:true,
          });

          poly.addListener('mouseover', (e) => {
            if (!tooltipEl.current || !mapRef.current) return;
            const el   = tooltipEl.current;
            const rect = mapRef.current.getBoundingClientRect();
            el.innerHTML = buildTooltipHTML(reg, tecsDaRegiao);
            clearTimeout(el._hideTimer);
            if (el._move) mapRef.current.removeEventListener('mousemove', el._move);
            if (e.domEvent) {
              const ev = e.domEvent;
              const x  = Math.min(ev.clientX - rect.left + 16, rect.width  - 270);
              const y  = Math.max(10, ev.clientY - rect.top - 160);
              el.style.left = x + 'px'; el.style.top = y + 'px';
            }
            el.style.display = 'block'; el._move = null;
            el.querySelectorAll('[data-tecid]').forEach(btn => {
              btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-tecid');
                const found = tecs.find(x => String(x.id) === String(id));
                if (found) { setSel(found); destacar(found.id); }
                el.style.display = 'none';
              });
            });
            const closeBtn = el.querySelector('[data-action="close"]');
            if (closeBtn) closeBtn.addEventListener('click', () => { el.style.display='none'; });
          });

          poly.addListener('mouseout', () => {
            if (!tooltipEl.current) return;
            clearTimeout(tooltipEl.current._hideTimer);
            tooltipEl.current._hideTimer = setTimeout(() => {
              if (tooltipEl.current && !tooltipEl.current._over) tooltipEl.current.style.display='none';
            }, 600);
          });

          poly.addListener('click', () => { setSel(t); destacar(t.id); });
          polisMap.current[t.id].push(poly);
          objetos.current.push(poly);
        });
      }

      if (t.lat && t.lng) {
        const marker = new window.google.maps.Marker({
          position:{lat:parseFloat(t.lat),lng:parseFloat(t.lng)}, map:mapInst.current, title:t.nome, zIndex:50,
          icon:{ path:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', fillColor:sc.bg, fillOpacity:1, strokeColor:'#fff', strokeWeight:1.5, scale:1.6, anchor:new window.google.maps.Point(12,22) },
        });
        marker.addListener('click', () => { setSel(t); destacar(t.id); });
        objetos.current.push(marker);
      }
    }
    setStatus('');
  };

  useEffect(() => {
    const el = tooltipEl.current;
    if (!el) return;
    const handler = (e) => {
      const item = e.target.closest('.tooltip-tec-item');
      if (!item) return;
      const t = tecs.find(x => String(x.id) === String(item.getAttribute('data-tecid')));
      if (!t) return;
      setSel(t); destacar(t.id); hideTooltip();
      if (mapInst.current && t.lat && t.lng) {
        mapInst.current.panTo({ lat:parseFloat(t.lat), lng:parseFloat(t.lng) });
        mapInst.current.setZoom(13);
      }
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [tecs]);

  useEffect(() => {
    if (!mapInst.current) return;
    const l = mapInst.current.addListener('click', () => {
      setSel(null);
      if (resetarRef.current) resetarRef.current();
      hideTooltip();
    });
    return () => window.google?.maps?.event?.removeListener(l);
  }, [mapInst.current]);

  const tecDisp  = tecs.filter(t => t.status==='Disponível').length;
  const tecCampo = tecs.filter(t => t.status==='Em campo').length;

  const legendaProps = { tecs, sel, setSel, destacar, resetarDestaques, mapInst, dark };

  return (
    <div>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:isMobile?8:12,marginBottom:12}}>
        {[
          {label:'Total técnicos', value:tecs.length, color:'#1a56db'},
          {label:'Disponíveis',    value:tecDisp,      color:'#059669'},
          {label:'Em campo',       value:tecCampo,     color:'#d97706'},
          {label:'Cidade base',    value:'Cascavel',   color:'#7c3aed', small:true},
        ].map(s => (
          <div key={s.label} style={{background:c.card,border:`1px solid ${c.cardBorder}`,borderRadius:10,padding:isMobile?'10px 12px':'12px 14px',boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
            <div style={{fontSize:10,color:c.textSub,fontWeight:500,textTransform:'uppercase',letterSpacing:.5,marginBottom:4,lineHeight:1.3}}>{s.label}</div>
            <div style={{fontSize:s.small?(isMobile?15:18):(isMobile?20:24),fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Mapa */}
      <div style={{position:'relative',borderRadius:12,overflow:'hidden',border:`1px solid ${c.cardBorder}`,boxShadow:'0 4px 16px rgba(0,0,0,.1)'}}>
        <div ref={mapRef} style={{height:isMobile?340:520,background:'#e5e7eb'}} />

        {status && (
          <div style={{position:'absolute',top:60,left:'50%',transform:'translateX(-50%)',background:c.card,padding:'7px 16px',borderRadius:20,fontSize:12,fontWeight:500,boxShadow:'0 2px 10px rgba(0,0,0,.15)',display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',zIndex:10,color:c.text}}>
            <div style={{width:12,height:12,border:'2px solid #1a56db',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
            {status}
          </div>
        )}

        {/* Tooltip — sempre escuro */}
        <div
          ref={tooltipEl}
          onMouseEnter={() => { if(tooltipEl.current){ tooltipEl.current._over=true; clearTimeout(tooltipEl.current._hideTimer); }}}
          onMouseLeave={() => { if(tooltipEl.current){ tooltipEl.current._over=false; tooltipEl.current.style.display='none'; }}}
          style={{position:'absolute',display:'none',background:'#1e293b',borderRadius:10,padding:'10px 14px',boxShadow:'0 8px 32px rgba(0,0,0,.35)',zIndex:30,minWidth:210,maxWidth:270,pointerEvents:'auto',cursor:'default'}}
        />

        {/* Legenda flutuante — desktop */}
        {!isMobile && (
          <div style={{position:'absolute',bottom:16,right:16,background: dark ? 'rgba(30,41,59,.97)' : 'rgba(255,255,255,.97)',borderRadius:10,padding:'12px 14px',boxShadow:'0 2px 12px rgba(0,0,0,.2)',minWidth:190,maxWidth:220,zIndex:5,maxHeight:400,overflowY:'auto',border:`1px solid ${c.cardBorder}`}}>
            <Legenda {...legendaProps} />
          </div>
        )}
      </div>

      {/* Legenda inline — mobile */}
      {isMobile && (
        <div style={{background:c.card,border:`1px solid ${c.cardBorder}`,borderRadius:10,padding:'12px 14px',marginTop:10,boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
          <Legenda {...legendaProps} />
        </div>
      )}

      {/* Cards dos técnicos */}
      <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}}>
        {tecs.map((t, idx) => {
          const sc  = ST[t.status]||ST['Folga'];
          const cor = CORES[idx%CORES.length];
          const ativo = sel?.id===t.id;
          return (
            <div
              key={t.id}
              onClick={() => {
                if (ativo) { setSel(null); resetarDestaques(); }
                else {
                  setSel(t); destacar(t.id);
                  if (mapInst.current && t.lat && t.lng) {
                    mapInst.current.panTo({lat:parseFloat(t.lat),lng:parseFloat(t.lng)});
                    mapInst.current.setZoom(13);
                  }
                }
              }}
              style={{background:c.card,border:'1px solid '+(ativo?cor:c.cardBorder),borderRadius:10,padding:'12px 14px',cursor:'pointer',boxShadow:ativo?'0 0 0 2px '+cor+'33':'0 1px 3px rgba(0,0,0,.08)',transition:'all .15s'}}
            >
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:sc.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:sc.text,flexShrink:0}}>{ini(t.nome)}</div>
                <div style={{flex:1,overflow:'hidden'}}>
                  <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:c.text}}>{t.nome}</div>
                  <span style={{fontSize:11,padding:'1px 7px',borderRadius:10,background:sc.badge,color:sc.text,fontWeight:500}}>{t.status}</span>
                </div>
              </div>
              {t.regioes?.length > 0 && (
                <div>
                  <div style={{fontSize:10,color:c.textMuted,marginBottom:4}}>ATENDE EM:</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                    {t.regioes.map(r => (
                      <span key={r} style={{fontSize:10,padding:'1px 6px',borderRadius:10,background:cor+'22',color:cor,fontWeight:500}}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const LOCAL = [
  {id:1,nome:'Bruno Guilherme Vieira',codigo:'T001',regioes:['Floresta','Periolo'],status:'Disponível',lat:-24.928906,lng:-53.405179},
];