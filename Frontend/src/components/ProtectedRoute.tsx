
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from "lucide-react";
import { UserRole } from '@/types/user';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log('ProtectedRoute render:', {
      path: location.pathname,
      isLoading,
      userExists: !!user,
      userRole: user?.role,
      allowedRoles,
      normalizedUserRole: user?.role?.toLowerCase(),
      normalizedAllowedRoles: allowedRoles?.map(role => role.toLowerCase())
    });
  }, [user, isLoading, location.pathname, allowedRoles]);

  // Show loading state
  if (isLoading) {
    
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="cyber-grid-bg" />
        <div className="scan-line animate-scan-line" />
        <div className="glass-panel border-cyber-teal/30 p-8 flex flex-col items-center">
          <Loader className="h-8 w-8 text-cyber-teal animate-spin mb-4" />
          <div className="terminal-text text-lg">
            <span className="animate-pulse">Initializing secure connection...</span>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions if roles are specified - using case insensitive comparison
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleLower = user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    
    if (!normalizedAllowedRoles.includes(userRoleLower)) {
      console.log('ProtectedRoute redirecting - unauthorized role', {
        userRole: user.role,
        userRoleLower,
        allowedRoles,
        normalizedAllowedRoles
      });
      return <Navigate to={`/dashboard/${userRoleLower}`} replace />;
    }
  }

  // User is authenticated and authorized
  
  return <>{children}</>;
};

export default ProtectedRoute;
