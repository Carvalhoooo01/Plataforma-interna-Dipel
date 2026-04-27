import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro]   = useState('');
  const [load, setLoad]   = useState(false);
  const { login }         = useAuth();
  const navigate          = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setErro(''); setLoad(true);
    try {
      const u = await login(email, senha);
      if (u.role === 'admin' || u.role === 'gestor') {
        navigate('/dashboard');
      } else {
        const perms = u.permissoes || {};
        const ORDEM = ['dashboard','guias','equipamentos','tecnicos','mapa','reciclagem','avisos'];
        const primeira = ORDEM.find(a => perms[a] === true) || 'guias';
        navigate('/' + primeira);
      }
    }
    catch (err) { setErro(err.response?.data?.erro || 'Erro ao fazer login'); }
    finally { setLoad(false); }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f1f5f9'}}>
      <div style={{background:'#fff',borderRadius:14,padding:'36px 40px',width:400,maxWidth:'90vw',boxShadow:'0 4px 24px rgba(0,0,0,.08)',border:'1px solid #e5e7eb'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:28}}>
          <div style={{width:38,height:38,borderRadius:9,background:'#1a56db',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16}}>D</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:'#111827'}}>Dipelnet</div>
            <div style={{fontSize:11,color:'#9ca3af',letterSpacing:1}}>SISTEMA INTERNO</div>
          </div>
        </div>

        <h2 style={{fontSize:18,fontWeight:600,marginBottom:22}}>Entrar na sua conta</h2>

        <form onSubmit={submit}>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.4}}>E-mail</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required autoFocus
              style={{width:'100%',padding:'9px 12px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box',color:'#111827'}}
              placeholder="admin@dipelnet.com.br" />
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:'#6b7280',marginBottom:5,textTransform:'uppercase',letterSpacing:.4}}>Senha</label>
            <input value={senha} onChange={e=>setSenha(e.target.value)} type="password" required
              style={{width:'100%',padding:'9px 12px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box',color:'#111827'}}
              placeholder="••••••••" />
          </div>
          {erro && <div style={{background:'#fee2e2',color:'#991b1b',borderRadius:8,padding:'9px 12px',fontSize:13,marginBottom:14}}>{erro}</div>}
          <button type="submit" disabled={load}
            style={{width:'100%',padding:10,background:'#1a56db',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',opacity:load?0.7:1}}>
            {load ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}