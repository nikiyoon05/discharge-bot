import { useRecoilValue } from 'recoil';
import { authUserState } from '@/store/atoms';
import { Navigate } from 'react-router-dom';

interface AuthRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function AuthRoute({ children, requiredRole = 'clinician' }: AuthRouteProps) {
  const authUser = useRecoilValue(authUserState);

  if (!authUser.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && authUser.role !== requiredRole && authUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="clinical-card text-center max-w-md">
          <h1 className="clinical-h1 text-destructive mb-4">Access Denied</h1>
          <p className="clinical-body text-muted-foreground">
            You don't have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}