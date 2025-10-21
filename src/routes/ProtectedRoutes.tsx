import { Navigate } from "react-router-dom";
import { paths } from "./paths";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

interface ProtectedRoutesProps {
  children: ReactNode;
}

export default function ProtectedRoutes({ children }: ProtectedRoutesProps) {
  const { user, loading } = useAuth();

  if (!user) {
    return <Navigate to={paths.login} />;
  }

  if (loading) {
    return null;
  }

  return <>{children}</>;
}
