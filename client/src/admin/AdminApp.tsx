import { Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuthProvider";
import { AdminLayout } from "./AdminLayout";
import { Login } from "./Login";
import { LoadingBlock } from "../components/ui/Spinner";
import Overview from "./Overview";
import Payments from "./Payments";
import PaymentDetail from "./PaymentDetail";
import ContactSubmissions from "./ContactSubmissions";
import Content from "./Content";
import AuditLog from "./AuditLog";
import Admins from "./Admins";
import Clients from "./Clients";

function AdminRoutes() {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="Checking session…" />
      </div>
    );
  }

  if (!admin) return <Login />;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Overview />} />
        <Route path="/admin/payments" element={<Payments />} />
        <Route path="/admin/payments/:id" element={<PaymentDetail />} />
        <Route path="/admin/contact" element={<ContactSubmissions />} />
        <Route path="/admin/content" element={<Content />} />
        <Route path="/admin/clients" element={<Clients />} />
        <Route path="/admin/audit" element={<AuditLog />} />
        <Route path="/admin/admins" element={<Admins />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminRoutes />
    </AdminAuthProvider>
  );
}
