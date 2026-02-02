import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import type { ReactNode } from "react";

export const RequireAuth = ({
  children,
}: { children: ReactNode }) => {
  const { loading, session } = useAuth();
  const location = useLocation();
  if (loading) return null; // Global Loading Screen handles this
  if (!session)
    return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};

export const RequireAdmin = ({
  children,
}: { children: ReactNode }) => {
  const { loading, session, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return null; // Global Loading Screen handles this
  if (!session)
    return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
};
