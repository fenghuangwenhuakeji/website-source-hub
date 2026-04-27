import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { buildPathWithFrom } from '../utils/safeReturnPath';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={buildPathWithFrom('/login', `${location.pathname}${location.search}${location.hash}`)} replace />;
  }

  return <Outlet />;
}
