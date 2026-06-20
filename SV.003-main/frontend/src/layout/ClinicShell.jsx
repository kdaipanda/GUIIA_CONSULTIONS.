import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
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
  Menu,
} from "lucide-react";
import { Header } from "../components/Header";
import { NotificationBell } from "../components/clinic/NotificationBell";
import { dispatchOpenSupport } from "../lib/supportReadState";
import { fetchAdminSupportTickets, fetchAppointmentRequests, fetchInventorySummary } from "../lib/clinicApi";
import { useClinic } from "../context/ClinicContext";
import { useVet } from "../context/VetContext";
import { clinicNavIsHero, clinicNavThemeStyle } from "../lib/clinicNavTheme";
import { PlatformOnboarding } from "../components/PlatformOnboarding";
import { hasCompletedPlatformOnboarding } from "../lib/platformOnboarding";

const BASE_NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  {
    to: "/app/consultas/nueva",
    label: "GUIAA Diagnóstico",
    icon: Stethoscope,
    view: "new-consultation",
  },
  { to: "/app/clientes", label: "Dueño", icon: Users, view: "clients" },
  { to: "/app/pacientes", label: "Mascotas", icon: PawPrint, view: "patients" },
  { to: "/app/agenda", label: "Agenda", icon: CalendarDays, view: "agenda" },
  { to: "/app/inventario", label: "Inventario", icon: Package, view: "inventory" },
  { to: "/app/facturacion", label: "Ventas", icon: Receipt, view: "billing" },
  { to: "/app/reportes", label: "Reportes", icon: BarChart3, view: "reports" },
  { to: "/app/herramientas", label: "Herramientas", icon: Wrench, view: "tools" },
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  useEffect(() => {
    if (!veterinarian?.id || orgLoading) return undefined;
    if (hasCompletedPlatformOnboarding(veterinarian.id)) return undefined;

    const timer = window.setTimeout(() => {
      setShowOnboarding(true);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [veterinarian?.id, orgLoading]);

  const spacerRef = useRef(null);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const shell = document.querySelector(".clinic-shell");
    const header = shell?.querySelector(":scope > .header");
    if (!shell || !header) return undefined;

    const syncHeaderHeight = () => {
      const height = Math.ceil(header.getBoundingClientRect().height) + 6;
      shell.style.setProperty("--clinic-header-h", `${height}px`);
      document.documentElement.style.setProperty("--clinic-header-h", `${height}px`);
      if (spacerRef.current) {
        spacerRef.current.style.height = `${height}px`;
      }
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeaderHeight);
    window.addEventListener("scroll", syncHeaderHeight, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
      window.removeEventListener("scroll", syncHeaderHeight);
    };
  }, []);

  const closeMobileNav = () => setMobileNavOpen(false);

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
      <div ref={spacerRef} className="clinic-header-spacer" aria-hidden="true" />
      <div className="clinic-shell-body">
        <div className="clinic-mobile-toolbar">
          <button
            type="button"
            className="clinic-mobile-nav-toggle"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-expanded={mobileNavOpen}
            aria-controls="clinic-sidebar-nav"
          >
            <Menu size={20} aria-hidden />
            <span>{mobileNavOpen ? "Cerrar menú" : "Menú clínica"}</span>
          </button>
        </div>

        {mobileNavOpen && (
          <button
            type="button"
            className="clinic-sidebar-backdrop"
            aria-label="Cerrar menú"
            onClick={closeMobileNav}
          />
        )}

        <aside className={`clinic-sidebar${mobileNavOpen ? " mobile-open" : ""}`}>
          <div className="clinic-sidebar-head">
            <span className="clinic-sidebar-title">Clínica</span>
            {!orgLoading && organization?.name && (
              <span className="clinic-sidebar-org">{organization.name}</span>
            )}
          </div>
          <nav
            id="clinic-sidebar-nav"
            className="clinic-sidebar-nav"
            aria-label="Módulos clínicos"
          >
            {navItems.map(({ to, label, icon: Icon, view }, index) => (
              <NavLink
                key={to}
                to={to}
                style={{
                  ...clinicNavThemeStyle(view),
                  animationDelay: `${index * 0.12}s`,
                }}
                className={({ isActive }) =>
                  `clinic-sidebar-link nav-toned nav-pulse${clinicNavIsHero(view) ? " nav-hero" : ""}${isActive ? " active" : ""}`
                }
                onClick={() => {
                  setView?.(view);
                  closeMobileNav();
                }}
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
      <PlatformOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        veterinarianId={veterinarian?.id}
        setView={setView}
      />
    </div>
  );
}
