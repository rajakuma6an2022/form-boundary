import { Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { Placeholder } from './components/layout/Placeholder';
import { FormsPage } from './features/forms/FormsPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/forms" replace />} />
        <Route path="forms" element={<FormsPage />} />
        <Route path="dashboard" element={<Placeholder name="Dashboard" />} />
        <Route path="responses" element={<Placeholder name="Responses" />} />
        <Route path="settings" element={<Placeholder name="Settings" />} />
        <Route path="*" element={<Placeholder name="Page not found" />} />
      </Route>
    </Routes>
  );
}