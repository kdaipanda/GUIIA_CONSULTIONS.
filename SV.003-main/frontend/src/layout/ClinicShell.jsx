import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PawPrint,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  Crown,
  User,
  Package,
  Receipt,
  BarChart3,
  Settings,
  Shield,
  Menu,
  FlaskConical,
  CircleHelp,
} from "lucide-react";
import { Header } from "../components/Header";
import { NotificationBell } from "../components/clinic/NotificationBell";
import { dispatchOpenSupport } from "../lib/supportReadState";
import { fetchAdminSupportTickets, fetchAppointmentRequests, fetchInventorySummary, sendPresenceHeartbeat } from "../lib/clinicApi";
import { useClinic } from "../context/ClinicContext";
import { useVet } from "../context/VetContext";
import { clinicNavIsHero, clinicNavThemeStyle } from "../lib/clinicNavTheme";
import { PlatformOnboarding } from "../components/PlatformOnboarding";
import { hasCompletedPlatformOnboarding } from "../lib/platformOnboarding";
import { OPEN_PLATFORM_ONBOARDING_EVENT } from "../lib/helpCenter";
import { ClinicMobileNavDrawer } from "./ClinicMobileNavDrawer";
import { PageEnter } from "../components/motion/PageEnter";
import { canAccessFeature, MEMBERSHIP_FEATURES } from "../lib/membershipAccess";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { warmClinicAppData } from "../lib/prefetchClinicApp";
import { clinicCacheKey, loadClinicData, readClinicDataCache } from "../lib/clinicDataCache";

const NAV_ITEM_DEFS = [
  { to: "/app/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, view: "dashboard" },
  {
    to: "/app/consultas/nueva",
    labelKey: "nav.diagnosis",
    icon: Stethoscope,
    view: "new-consultation",
  },
  { to: "/app/clientes", labelKey: "nav.clients", icon: PawPrint, view: "clients" },
  { to: "/app/agenda", labelKey: "nav.agenda", icon: CalendarDays, view: "agenda" },
  {
    to: "/app/inventario",
    labelKey: "nav.inventory",
    icon: Package,
    view: "inventory",
    feature: MEMBERSHIP_FEATURES.inventory,
  },
  {
    to: "/app/facturacion",
    labelKey: "nav.billing",
    icon: Receipt,
    view: "billing",
    feature: MEMBERSHIP_FEATURES.billing,
  },
  {
    to: "/app/reportes",
    labelKey: "nav.reports",
    icon: BarChart3,
    view: "reports",
    feature: MEMBERSHIP_FEATURES.reports,
  },
  {
    to: "/app/imagenes",
    labelKey: "nav.lab",
    icon: FlaskConical,
    view: "medical-images",
    feature: MEMBERSHIP_FEATURES.medicalImages,
  },
  { to: "/app/configuracion", labelKey: "nav.settings", icon: Settings, view: "settings" },
  { to: "/app/ayuda", labelKey: "nav.help", icon: CircleHelp, view: "help" },
  { to: "/app/historial", labelKey: "nav.history", icon: ClipboardList, view: "consultation-history" },
  { to: "/app/membresia", labelKey: "nav.membership", icon: Crown, view: "membership" },
  { to: "/app/perfil", labelKey: "nav.profile", icon: User, view: "profile" },
];

export function ClinicShell({ children, setView }) {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();
  const { veterinarian, platformAdmin } = useVet();
  const { organization, loading: orgLoading, role } = useClinic();
  const [adminSupportOpen, setAdminSupportOpen] = useState(0);
  const [pendingAgendaRequests, setPendingAgendaRequests] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const BASE_NAV_ITEMS = useMemo(
    () => NAV_ITEM_DEFS.map((item) => ({ ...item, label: t(item.labelKey) })),
    [t],
  );

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
    const key = clinicCacheKey(veterinarian.id, "appointment-requests", "pending");
    const cached = readClinicDataCache(key);
    if (cached) setPendingAgendaRequests((cached.requests || []).length);
    try {
      const data = await loadClinicData(key, () => fetchAppointmentRequests(veterinarian.id, "pending"), {
        ttlMs: 45_000,
      });
      setPendingAgendaRequests((data.requests || []).length);
    } catch {
      if (!cached) setPendingAgendaRequests(0);
    }
  }, [veterinarian?.id]);

  const loadLowStockCount = useCallback(async () => {
    if (!veterinarian?.id) {
      setLowStockCount(0);
      return;
    }
    if (!canAccessFeature(veterinarian, MEMBERSHIP_FEATURES.inventory, { platformAdmin })) {
      setLowStockCount(0);
      return;
    }
    try {
      const key = clinicCacheKey(veterinarian.id, "inventory-summary");
      const cached = readClinicDataCache(key);
      if (cached) setLowStockCount(cached.low_stock_count ?? 0);
      const data = await loadClinicData(key, () => fetchInventorySummary(veterinarian.id), {
        ttlMs: 60_000,
      });
      setLowStockCount(data.low_stock_count ?? 0);
    } catch {
      if (!readClinicDataCache(clinicCacheKey(veterinarian.id, "inventory-summary"))) {
        setLowStockCount(0);
      }
    }
  }, [veterinarian?.id, platformAdmin]);

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
    if (!veterinarian?.id) return undefined;

    let cancelled = false;
    const beat = async () => {
      if (cancelled || document.visibilityState === "hidden") return;
      try {
        await sendPresenceHeartbeat(veterinarian.id);
      } catch {
        // Silencioso: no interrumpir la sesión clínica
      }
    };

    beat();
    const interval = setInterval(beat, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [veterinarian?.id]);

  useEffect(() => {
    if (!veterinarian?.id) return;
    warmClinicAppData(veterinarian.id, { platformAdmin });
  }, [veterinarian?.id, platformAdmin]);

  useEffect(() => {
    if (!veterinarian?.id || orgLoading) return undefined;
    if (hasCompletedPlatformOnboarding(veterinarian.id)) return undefined;

    const timer = window.setTimeout(() => {
      setShowOnboarding(true);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [veterinarian?.id, orgLoading]);

  useEffect(() => {
    const onOpenTour = () => setShowOnboarding(true);
    window.addEventListener(OPEN_PLATFORM_ONBOARDING_EVENT, onOpenTour);
    return () => window.removeEventListener(OPEN_PLATFORM_ONBOARDING_EVENT, onOpenTour);
  }, []);

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

  const navItems = useMemo(() => {
    const items = BASE_NAV_ITEMS.filter((item) => {
      if (item.view === "new-consultation") {
        if (role === "receptionist") return false;
        if (role === "admin" && !String(veterinarian?.cedula_profesional || "").trim()) return false;
      }
      return true;
    }).map((item) => {
      if (!item.feature) return item;
      const allowed = canAccessFeature(veterinarian, item.feature, { platformAdmin });
      return { ...item, locked: !allowed };
    });
    if (platformAdmin) {
      items.push({
        to: "/app/admin",
        label: t("nav.admin"),
        icon: Shield,
        view: "admin",
      });
    }
    return items;
  }, [platformAdmin, veterinarian, BASE_NAV_ITEMS, t, role]);

  const handleBrandNav = (view) => {
    if (setView) setView(view);
    const item = navItems.find((n) => n.view === view);
    if (item) navigate(item.to);
  };

  const handleNotificationNavigate = (action, relatedId) => {
    if (action === "agenda") {
      setView?.("agenda");
      navigate("/app/agenda");
    } else if (action === "inventory") {
      setView?.("inventory");
      navigate("/app/inventario");
    } else if (action === "support") {
      dispatchOpenSupport(relatedId);
    } else if (action === "admin-support") {
      setView?.("admin");
      navigate(relatedId ? `/app/admin?ticket=${relatedId}` : "/app/admin");
    }
  };

  return (
    <div className="clinic-shell">
      <Header
        setView={handleBrandNav}
        actions={
          <>
            <LanguageSwitcher />
            <NotificationBell
              veterinarianId={veterinarian?.id}
              onNavigate={handleNotificationNavigate}
            />
          </>
        }
      />
      <div ref={spacerRef} className="clinic-header-spacer" aria-hidden="true" />
      <div className="clinic-shell-body">
        <div className="clinic-mobile-toolbar">
          <button
            type="button"
            className="clinic-mobile-nav-toggle"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-controls="clinic-mobile-drawer-nav"
          >
            <Menu size={20} aria-hidden />
            <span>{t("nav.menu")}</span>
          </button>
          {!orgLoading && organization?.name ? (
            <p className="clinic-mobile-org" title={organization.name}>
              {organization.name}
            </p>
          ) : null}
          <LanguageSwitcher className="ml-auto" />
        </div>

        <ClinicMobileNavDrawer
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          navItems={navItems}
          organizationName={organization?.name}
          orgLoading={orgLoading}
          setView={setView}
          adminSupportOpen={adminSupportOpen}
          pendingAgendaRequests={pendingAgendaRequests}
          lowStockCount={lowStockCount}
        />

        <aside className="clinic-sidebar clinic-sidebar--desktop">
          <div className="clinic-sidebar-head">
            <span className="clinic-sidebar-title">{t("shell.clinic")}</span>
            {!orgLoading && organization?.name && (
              <span className="clinic-sidebar-org">{organization.name}</span>
            )}
          </div>
        <nav
            id="clinic-sidebar-nav"
            className="clinic-sidebar-nav"
            aria-label={t("shell.navAria")}
          >
            {navItems.map(({ to, label, icon: Icon, view, locked }, index) => (
              <NavLink
                key={to}
                to={locked ? "/app/membresia" : to}
                style={{
                  ...clinicNavThemeStyle(view),
                  animationDelay: `${index * 0.12}s`,
                }}
                className={({ isActive }) =>
                  `clinic-sidebar-link nav-toned nav-pulse${clinicNavIsHero(view) ? " nav-hero" : ""}${isActive && !locked ? " active" : ""}${locked ? " clinic-sidebar-link--locked" : ""}`
                }
                onClick={(e) => {
                  if (locked) {
                    e.preventDefault();
                    setView?.("membership");
                    navigate("/app/membresia");
                    return;
                  }
                  setView?.(view);
                }}
              >
                <Icon size={18} aria-hidden />
                <span>{label}</span>
                {locked && <span className="clinic-sidebar-lock-badge">{t("shell.premiumBadge")}</span>}
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
        <main className="clinic-shell-main">
          <PageEnter>{children}</PageEnter>
        </main>
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
