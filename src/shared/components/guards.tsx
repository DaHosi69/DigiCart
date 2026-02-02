import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import type { JSX } from "react";
import { LoadingScreen } from "./LoadingScreen";

export const RequireAuth: React.FC<{ children: JSX.Element }> = ({
  children,
}) => {
  const { loading, session } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!session)
    return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};

export const RequireAdmin: React.FC<{ children: JSX.Element }> = ({
  children,
}) => {
  const { loading, session, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!session)
    return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
};
