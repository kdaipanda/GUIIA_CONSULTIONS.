import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../components/ui/drawer";
import { clinicNavIsHero, clinicNavThemeStyle } from "../lib/clinicNavTheme";
import { CLINIC_COMPACT_MEDIA_QUERY } from "../lib/clinicBreakpoints";
import "./clinicMobileDrawer.css";

export function ClinicMobileNavDrawer({
  open,
  onOpenChange,
  navItems,
  organizationName,
  orgLoading,
  setView,
  adminSupportOpen,
  pendingAgendaRequests,
  lowStockCount,
}) {
  const { t } = useTranslation("clinic");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(CLINIC_COMPACT_MEDIA_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!isMobile) return null;

  const close = () => onOpenChange(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="clinic-mobile-drawer">
        <DrawerHeader className="clinic-mobile-drawer-head">
          <DrawerTitle className="clinic-mobile-drawer-title">
            {t("shell.clinic")}
          </DrawerTitle>
          {!orgLoading && organizationName && (
            <DrawerDescription className="clinic-mobile-drawer-org">
              {organizationName}
            </DrawerDescription>
          )}
        </DrawerHeader>
        <nav
          id="clinic-mobile-drawer-nav"
          className="clinic-sidebar-nav"
          aria-label={t("shell.navAriaMobile")}
        >
          {navItems.map(({ to, label, icon: Icon, view, locked }) => (
            <NavLink
              key={to}
              to={locked ? "/app/membresia" : to}
              style={clinicNavThemeStyle(view)}
              className={({ isActive }) =>
                `clinic-sidebar-link nav-toned${clinicNavIsHero(view) ? " nav-hero" : ""}${isActive && !locked ? " active" : ""}${locked ? " clinic-sidebar-link--locked" : ""}`
              }
              onClick={(e) => {
                if (locked) {
                  e.preventDefault();
                  setView?.("membership");
                  close();
                  return;
                }
                setView?.(view);
                close();
              }}
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
              {locked && (
                <span className="clinic-sidebar-lock-badge">
                  {t("shell.premiumBadge")}
                </span>
              )}
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
      </DrawerContent>
    </Drawer>
  );
}
