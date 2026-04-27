import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

export default function Reciclagem() {
  const { temRole }             = useAuth();
  const [temPdf, setTemPdf]     = useState(false);
  const [carregando, setCarreg] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProg]    = useState(0);
  const [erro, setErro]         = useState('');
  const [ts, setTs]             = useState(Date.now());
  const inputRef                = useRef(null);
  const podeGerenciar           = temRole('admin', 'gestor');

  useEffect(() => {
    fetch(`${API}/api/config/reciclagem-pdf-proxy`, { method: 'HEAD' })
      .then(r => setTemPdf(r.ok))
      .catch(() => setTemPdf(false))
      .finally(() => setCarreg(false));
  }, [ts]);

  const enviar = async (file) => {
    if (!file || file.type !== 'application/pdf') { setErro('Selecione um arquivo PDF'); return; }
    setErro(''); setEnviando(true); setProg(0);
    try {
      const token  = sessionStorage.getItem('dp_token');
      const buffer = await file.arrayBuffer();
      const xhr    = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProg(Math.round(e.loaded / e.total * 100));
      };

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) resolve();
          else {
            try { reject(new Error(JSON.parse(xhr.responseText).erro)); }
            catch { reject(new Error('Erro no upload')); }
          }
        };
        xhr.onerror = () => reject(new Error('Erro de rede'));
        xhr.open('POST', `${API}/api/config/reciclagem-upload-local`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', 'application/pdf');
        xhr.send(buffer);
      });

      setTemPdf(true);
      setTs(Date.now());
    } catch(e) {
      setErro('Erro: ' + e.message);
    } finally { setEnviando(false); setProg(0); }
  };

  const remover = async () => {
    if (!confirm('Remover o PDF atual?')) return;
    try {
      const token = sessionStorage.getItem('dp_token');
      await fetch(`${API}/api/config/reciclagem-remover`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemPdf(false); setTs(Date.now());
    } catch { setErro('Erro ao remover'); }
  };

  if (carregando) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'#6b7280' }}>
      <div style={{ width:24, height:24, border:'3px solid #e5e7eb', borderTopColor:'#1a56db', borderRadius:'50%', animation:'spin 1s linear infinite', marginRight:10 }}/>
      Carregando...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 120px)' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexShrink:0 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, margin:0 }}>📋 Manual de Reciclagem</h2>
          <p style={{ fontSize:13, color:'#6b7280', margin:'4px 0 0' }}>
            {temPdf ? 'PDF disponível para todos os usuários' : 'Nenhum manual disponível ainda'}
          </p>
        </div>
        {podeGerenciar && (
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {temPdf && (
              <button onClick={remover}
                style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #fca5a5', background:'#fee2e2', color:'#991b1b', fontSize:13, cursor:'pointer' }}>
                🗑️ Remover
              </button>
            )}
            <button onClick={() => inputRef.current?.click()} disabled={enviando}
              style={{ padding:'8px 16px', background:'#1a56db', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:enviando?'wait':'pointer', opacity:enviando?.7:1, display:'flex', alignItems:'center', gap:6 }}>
              📁 {temPdf ? 'Trocar PDF' : 'Enviar PDF'}
            </button>
            <input ref={inputRef} type="file" accept="application/pdf"
              onChange={e => enviar(e.target.files?.[0])}
              style={{ display:'none' }} />
          </div>
        )}
      </div>

      {/* Progresso */}
      {enviando && (
        <div style={{ marginBottom:12, padding:'10px 14px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#1e40af', marginBottom:6 }}>
            <span>Enviando para o servidor...</span><span>{progresso}%</span>
          </div>
          <div style={{ background:'#bfdbfe', borderRadius:4, height:6 }}>
            <div style={{ width:progresso+'%', background:'#1a56db', borderRadius:4, height:6, transition:'width .3s' }}/>
          </div>
        </div>
      )}

      {erro && <div style={{ marginBottom:12, padding:'10px 14px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, fontSize:13, color:'#991b1b', flexShrink:0 }}>{erro}</div>}

      {/* Visualizador ou placeholder */}
      {!temPdf ? (
        <div
          onClick={() => podeGerenciar && !enviando && inputRef.current?.click()}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f9fafb', borderRadius:12, border:'2px dashed #e5e7eb', cursor:podeGerenciar?'pointer':'default' }}>
          <div style={{ fontSize:56, marginBottom:12 }}>📄</div>
          <div style={{ fontSize:16, fontWeight:600, color:'#374151', marginBottom:6 }}>
            {podeGerenciar ? 'Clique ou arraste o PDF aqui' : 'Nenhum manual disponível'}
          </div>
          <div style={{ fontSize:13, color:'#9ca3af' }}>
            {podeGerenciar ? 'O PDF será salvo no servidor e ficará disponível para todos' : 'Aguarde o administrador adicionar o manual'}
          </div>
        </div>
      ) : (
        <div style={{ flex:1, borderRadius:12, overflow:'hidden', border:'1px solid #e5e7eb', boxShadow:'0 4px 16px rgba(0,0,0,.08)' }}>
          <iframe
            key={ts}
            src={`${API}/api/config/reciclagem-pdf-proxy?t=${ts}`}
            width="100%" height="100%"
            style={{ display:'block', border:'none', width:'100%', height:'100%' }}
            title="Manual de Reciclagem"
          />
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
