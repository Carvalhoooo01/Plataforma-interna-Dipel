import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout        from './components/layout/Layout';
import Login         from './pages/auth/Login';
import Dashboard     from './pages/dashboard/Dashboard';
import Guias         from './pages/guias/Guias';
import Equipamentos  from './pages/equipamentos/Equipamentos';
import Tecnicos      from './pages/tecnicos/Tecnicos';
import Mapa          from './pages/mapa/Mapa';
import Avisos        from './pages/avisos/Avisos';
import Usuarios      from './pages/usuarios/Usuarios';
import Reciclagem    from './pages/guias/Reciclagem';
import Colaboradores from './pages/colaboradores/Colaboradores';

function ProtectedRoute() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#6b7280',fontSize:14}}>Carregando...</div>;
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { usuario, temRole } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!temRole('admin','gestor')) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"      element={<Dashboard />} />
              <Route path="/guias"          element={<Guias />} />
              <Route path="/equipamentos"   element={<Equipamentos />} />
              <Route path="/tecnicos"       element={<Tecnicos />} />
              <Route path="/mapa"           element={<Mapa />} />
              <Route path="/avisos"         element={<Avisos />} />
              <Route path="/colaboradores"  element={<Colaboradores />} />
              <Route element={<AdminRoute />}>
                <Route path="/usuarios"   element={<Usuarios />} />
                <Route path="/reciclagem" element={<Reciclagem />} />
              </Route>
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}