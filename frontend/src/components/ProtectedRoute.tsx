import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN_GERAL' | 'ADMINISTRADOR' | 'PADRE' | 'COLABORADOR';
  requireAdmin?: boolean;
  requireManagement?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  requireAdmin,
  requireManagement 
}) => {
  const { user, isAdminGeral, canEdit, isOconomo, isSuperior, isRegional, isPadre, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Prevent REGISTRO_REGIONAL and ADMIN_GERAL from accessing extratos-mensais
  if ((user?.role === 'REGISTRO_REGIONAL' || user?.role === 'ADMIN_GERAL') && location.pathname.startsWith('/extratos-mensais')) {
    return <Navigate to="/home" replace />;
  }

  // Admin check (ADMIN_GERAL or ADMINISTRADOR)
  if (requireAdmin && !isAdminGeral && !canEdit) {
    return <Navigate to="/home" replace />;
  }

  // Management check (Admin, Oconomo, Superior or Padre)
  if (requireManagement && !isAdminGeral && !canEdit && !isOconomo && !isSuperior && !isPadre && !isRegional) {
    return <Navigate to="/home" replace />;
  }

  // Specific role check
  if (requiredRole && user?.role !== requiredRole && !isAdminGeral) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
