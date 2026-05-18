import { Route, Routes, Navigate } from 'react-router-dom';

import { Splash } from './pages/Splash';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Recuperar } from './pages/Recuperar';
import { RecuperarNuevaContrasena } from './pages/RecuperarNuevaContrasena';
import { Capitulo } from './pages/Capitulo';
import { Caso } from './pages/Caso';
import { Categoria } from './pages/Categoria';
import { MiCuenta } from './pages/MiCuenta';

import { Dashboard } from './pages/admin/Dashboard';
import { Solicitudes } from './pages/admin/Solicitudes';
import { CasoEdit } from './pages/admin/CasoEdit';
import { TestimoniosAdmin } from './pages/admin/Testimonios';
import { MapaBarrios } from './pages/admin/MapaBarrios';
import { PadrinosAdmin } from './pages/admin/Padrinos';
import { Usuarios } from './pages/admin/Usuarios';
import { Metricas } from './pages/admin/Metricas';
import { Ajustes } from './pages/admin/Ajustes';
import { BarriosLista } from './pages/admin/BarriosLista';
import { BarrioEditor } from './pages/admin/BarrioEditor';
import { CapitulosLista } from './pages/admin/CapitulosLista';
import { CapituloEditor } from './pages/admin/CapituloEditor';
import { CasosLista } from './pages/admin/CasosLista';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<Recuperar />} />
      <Route path="/recuperar/nueva-contrasena" element={<RecuperarNuevaContrasena />} />
      <Route path="/capitulo/:slug" element={<Capitulo />} />
      <Route path="/caso/:folio" element={<Caso />} />
      <Route path="/categoria/:codigo" element={<Categoria />} />
      <Route path="/mi-cuenta" element={<MiCuenta />} />

      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/solicitudes" element={<Solicitudes />} />
      <Route path="/admin/testimonios" element={<TestimoniosAdmin />} />
      <Route path="/admin/casos" element={<CasosLista />} />
      <Route path="/admin/caso" element={<CasoEdit />} />
      <Route path="/admin/caso/:folio" element={<CasoEdit />} />
      <Route path="/admin/mapa-barrios" element={<MapaBarrios />} />
      <Route path="/admin/padrinos" element={<PadrinosAdmin />} />
      <Route path="/admin/usuarios" element={<Usuarios />} />
      <Route path="/admin/metricas" element={<Metricas />} />
      <Route path="/admin/ajustes" element={<Ajustes />} />
      <Route path="/admin/barrios" element={<BarriosLista />} />
      <Route path="/admin/barrios/nuevo" element={<BarrioEditor />} />
      <Route path="/admin/barrios/:slug/editar" element={<BarrioEditor />} />
      <Route path="/admin/capitulos" element={<CapitulosLista />} />
      <Route path="/admin/capitulos/:id/editar" element={<CapituloEditor />} />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
