import React, { useMemo, useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  PawPrint,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  Crown,
  User,
  Package,
  Receipt,
  BarChart3,
  Wrench,
  Settings,
  Shield,
} from "lucide-react";
import { Header } from "../components/Header";
import { NotificationBell } from "../components/clinic/NotificationBell";
import { dispatchOpenSupport } from "../lib/supportReadState";
import { fetchAdminSupportTickets, fetchAppointmentRequests, fetchInventorySummary } from "../lib/clinicApi";
import { useClinic } from "../context/ClinicContext";
import { useVet } from "../context/VetContext";

const BASE_NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { to: "/app/clientes", label: "Dueño", icon: Users, view: "clients" },
  { to: "/app/pacientes", label: "Mascotas", icon: PawPrint, view: "patients" },
  { to: "/app/agenda", label: "Agenda", icon: CalendarDays, view: "agenda" },
  { to: "/app/inventario", label: "Inventario", icon: Package, view: "inventory" },
  { to: "/app/facturacion", label: "Facturación", icon: Receipt, view: "billing" },
  { to: "/app/reportes", label: "Reportes", icon: BarChart3, view: "reports" },
  { to: "/app/herramientas", label: "Herramientas", icon: Wrench, view: "tools" },
  { to: "/app/consultas/nueva", label: "Consultas", icon: Stethoscope, view: "new-consultation" },
  { to: "/app/historial", label: "Historial", icon: ClipboardList, view: "consultation-history" },
  { to: "/app/membresia", label: "Membresía", icon: Crown, view: "membership" },
  { to: "/app/perfil", label: "Perfil", icon: User, view: "profile" },
];

export function ClinicShell({ children, setView }) {
  const navigate = useNavigate();
  const { veterinarian, platformAdmin } = useVet();
  const { organization, loading: orgLoading, role } = useClinic();
  const [adminSupportOpen, setAdminSupportOpen] = useState(0);
  const [pendingAgendaRequests, setPendingAgendaRequests] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const loadAdminSupportCount = useCallback(async () => {
    if (!platformAdmin || !veterinarian?.id) {
      setAdminSupportOpen(0);
      return;
    }
    try {
      const data = await fetchAdminSupportTickets(veterinarian.id);
      setAdminSupportOpen(data.open_count ?? 0);
    } catch {
      setAdminSupportOpen(0);
    }
  }, [platformAdmin, veterinarian?.id]);

  const loadPendingAgendaRequests = useCallback(async () => {
    if (!veterinarian?.id) {
      setPendingAgendaRequests(0);
      return;
    }
    try {
      const data = await fetchAppointmentRequests(veterinarian.id, "pending");
      setPendingAgendaRequests((data.requests || []).length);
    } catch {
      setPendingAgendaRequests(0);
    }
  }, [veterinarian?.id]);

  const loadLowStockCount = useCallback(async () => {
    if (!veterinarian?.id) {
      setLowStockCount(0);
      return;
    }
    try {
      const data = await fetchInventorySummary(veterinarian.id);
      setLowStockCount(data.low_stock_count ?? 0);
    } catch {
      setLowStockCount(0);
    }
  }, [veterinarian?.id]);

  useEffect(() => {
    loadAdminSupportCount();
    loadPendingAgendaRequests();
    loadLowStockCount();
    const interval = setInterval(() => {
      loadAdminSupportCount();
      loadPendingAgendaRequests();
      loadLowStockCount();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAdminSupportCount, loadPendingAgendaRequests, loadLowStockCount]);

  const navItems = useMemo(() => {
    const items = [...BASE_NAV_ITEMS];
    if (role === "owner" || role === "admin") {
      items.splice(items.length - 2, 0, {
        to: "/app/configuracion",
        label: "Configuración",
        icon: Settings,
        view: "settings",
      });
    }
    if (platformAdmin) {
      items.push({
        to: "/app/admin",
        label: "Admin GUIAA",
        icon: Shield,
        view: "admin",
      });
    }
    return items;
  }, [role, platformAdmin]);

  const handleBrandNav = (view) => {
    if (setView) setView(view);
    const item = navItems.find((n) => n.view === view);
    if (item) navigate(item.to);
  };

  const handleNotificationNavigate = (action) => {
    if (action === "agenda") {
      setView?.("agenda");
      navigate("/app/agenda");
    } else if (action === "inventory") {
      setView?.("inventory");
      navigate("/app/inventario");
    } else if (action === "support") {
      dispatchOpenSupport();
    } else if (action === "admin-support") {
      setView?.("admin");
      navigate("/app/admin");
    }
  };

  return (
    <div className="clinic-shell">
      <Header
        setView={handleBrandNav}
        actions={
          <NotificationBell
            veterinarianId={veterinarian?.id}
            onNavigate={handleNotificationNavigate}
          />
        }
      />
      <div className="clinic-shell-body">
        <aside className="clinic-sidebar">
          <div className="clinic-sidebar-head">
            <span className="clinic-sidebar-title">Clínica</span>
            {!orgLoading && organization?.name && (
              <span className="clinic-sidebar-org">{organization.name}</span>
            )}
          </div>
          <nav className="clinic-sidebar-nav" aria-label="Módulos clínicos">
            {navItems.map(({ to, label, icon: Icon, view }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `clinic-sidebar-link${isActive ? " active" : ""}`
                }
                onClick={() => setView?.(view)}
              >
                <Icon size={18} aria-hidden />
                <span>{label}</span>
                {view === "admin" && adminSupportOpen > 0 && (
                  <span className="clinic-sidebar-badge">{adminSupportOpen}</span>
                )}
                {view === "agenda" && pendingAgendaRequests > 0 && (
                  <span className="clinic-sidebar-badge">{pendingAgendaRequests}</span>
                )}
                {view === "inventory" && lowStockCount > 0 && (
                  <span className="clinic-sidebar-badge">{lowStockCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="clinic-shell-main">{children}</main>
      </div>
    </div>
  );
}
