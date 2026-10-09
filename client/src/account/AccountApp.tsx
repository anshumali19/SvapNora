import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useUserAuth } from "./UserAuthProvider";
import { LoadingBlock } from "../components/ui/Spinner";
import Login from "./Login";
import Register from "./Register";
import VerifyEmail from "./VerifyEmail";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Dashboard from "./Dashboard";

function RequireUser({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUserAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container-x flex min-h-[50vh] items-center justify-center py-24">
        <LoadingBlock label="Checking your session…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/account/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
}

export default function AccountApp() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="verify" element={<VerifyEmail />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route
        index
        element={
          <RequireUser>
            <Dashboard />
          </RequireUser>
        }
      />
      <Route path="*" element={<Navigate to="/account" replace />} />
    </Routes>
  );
}
