import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { safeRedirectPath } from '../../lib/safe-redirect';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { bootstrapSession } from './bootstrap';
import { BootError, BootScreen } from './BootScreen';

export function ProtectedRoute() {
  const status = useAppSelector((state) => state.auth.status);
  const dispatch = useAppDispatch();
  const location = useLocation();

  if (status === 'bootstrapping') return <BootScreen />;
  if (status === 'error') return <BootError onRetry={() => void bootstrapSession(dispatch)} />;
  if (status === 'anonymous') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}

/** Login and register pages: signed-in users are sent on to ?next= (validated) or /forms. */
export function GuestRoute() {
  const status = useAppSelector((state) => state.auth.status);
  const [params] = useSearchParams();

  if (status === 'authenticated') {
    return <Navigate to={safeRedirectPath(params.get('next'))} replace />;
  }
  return <Outlet />;
}