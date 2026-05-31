import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { buildPathWithFrom, getSafeReturnPath, isExternalAppReturnPath } from '../utils/safeReturnPath';

export function PublicRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const returnPath = getSafeReturnPath(location.search);

  if (isAuthenticated) {
    if (user?.mustSetPassword) {
      return <Navigate to={buildPathWithFrom('/profile?forcePassword=1', returnPath)} replace />;
    }

    if (returnPath !== '/dashboard') {
      if (isExternalAppReturnPath(returnPath)) {
        window.location.assign(returnPath);
        return null;
      }

      return <Navigate to={returnPath} replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
