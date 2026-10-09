import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Mail,
  FileText,
  ScrollText,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { useAdminAuth, type Permission } from "./AdminAuthProvider";
import { ThemeToggle } from "../components/public/ThemeToggle";
import { Logo } from "../components/public/Logo";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, permission: "content.read", end: true },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments.read" },
  { to: "/admin/contact", label: "Messages", icon: Mail, permission: "contact.read" },
  { to: "/admin/content", label: "Content", icon: FileText, permission: "content.read" },
  { to: "/admin/clients", label: "Clients", icon: Building2, permission: "users.manage" },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText, permission: "audit.read" },
  { to: "/admin/admins", label: "Administrators", icon: Users, permission: "admin.manage" },
];

export function AdminLayout() {
  const { admin, logout, can } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    await logout();
    navigate("/admin", { replace: true });
  }

  const visibleNav = NAV.filter((item) => can(item.permission));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-line px-4">
        <NavLink to="/admin" className="flex items-center gap-2">
          <Logo className="h-7" />
        </NavLink>
        <button
          type="button"
          className="rounded-lg p-1.5 text-muted hover:bg-surface-2 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-accent/10 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
              }`
            }
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl bg-surface-2/60 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{admin?.name}</p>
            <p className="truncate text-xs text-muted">{admin?.role}</p>
          </div>
        </div>
        <button type="button" onClick={onLogout} className="btn-ghost mt-2 w-full justify-start">
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-bg-elev/60 lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-line bg-bg-elev">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            className="rounded-lg border border-line bg-surface/60 p-2 text-ink lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <p className="text-sm font-semibold text-ink">SvapNora Admin</p>
          <span className="badge border-line bg-surface-2 text-muted">Private</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
