import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PrivateRoute() {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
