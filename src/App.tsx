import { HashRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireAdmin, RequireAuth } from './components/Protected'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Prospects from './pages/Prospects'
import ProspectDetail from './pages/ProspectDetail'
import Pipeline from './pages/Pipeline'
import Sweeps from './pages/Sweeps'
import Settings from './pages/Settings'
import AdminUsers from './pages/admin/Users'

// HashRouter is deliberate: GitHub Pages serves static files with no
// server-side rewrite, so a BrowserRouter deep link (e.g. a refresh on
// /prospects/123) would 404. Hash routes (#/prospects/123) always
// resolve to index.html first, so it just works with zero extra config.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/prospects" element={<Prospects />} />
              <Route path="/prospects/:id" element={<ProspectDetail />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/sweeps" element={<Sweeps />} />
              <Route path="/settings" element={<Settings />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin/users" element={<AdminUsers />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
