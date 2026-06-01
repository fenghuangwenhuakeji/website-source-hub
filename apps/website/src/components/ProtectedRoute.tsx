import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { buildPathWithFrom } from '../utils/safeReturnPath';

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  if (!isAuthenticated) {
    return <Navigate to={buildPathWithFrom('/login', currentPath)} replace />;
  }

  if (user?.mustSetPassword && (location.pathname !== '/profile' || new URLSearchParams(location.search).get('forcePassword') !== '1')) {
    return <Navigate to={buildPathWithFrom('/profile?forcePassword=1', currentPath)} replace />;
  }

  return <Outlet />;
}
