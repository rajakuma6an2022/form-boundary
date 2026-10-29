import { Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { Placeholder } from './components/layout/Placeholder';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { GuestRoute, ProtectedRoute } from './features/auth/route-guard';
import { FormsPage } from './features/forms/FormsPage';

export function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/forms" replace />} />
          <Route path="forms" element={<FormsPage />} />
          <Route path="dashboard" element={<Placeholder name="Dashboard" />} />
          <Route path="responses" element={<Placeholder name="Responses" />} />
          <Route path="settings" element={<Placeholder name="Settings" />} />
          <Route path="*" element={<Placeholder name="Page not found" />} />
        </Route>
      </Route>
    </Routes>
  );
}