import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  ClipboardList,
  Crown,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react";
import { useVet } from "../context/VetContext";
import { getPlanDisplayName } from "../lib/membershipPlans";
import { applyDocumentTheme, readStoredTheme } from "../lib/themeSync";
import { GuiaaBrandLockup } from "./GuiaaBrandLockup";
import { LanguageSwitcher } from "./LanguageSwitcher";
import "./headerToolbar.css";

const MENU_APP_VERSION = "v1.0";

export function Header({ setView, showAuth = true, actions }) {
  const { t } = useTranslation("clinic");
  const { veterinarian, logout } = useVet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [menuCoords, setMenuCoords] = useState(null);
  const [theme, setTheme] = useState(() => readStoredTheme());
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const membershipType = veterinarian?.membership_type?.toLowerCase() || "";
  const isPremium = membershipType === "premium";
  const membershipLabel = membershipType
    ? getPlanDisplayName(membershipType)
    : t("header.planFallback");

  useEffect(() => {
    applyDocumentTheme(theme);
    try {
      localStorage.setItem("sv_theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setThemeMode = useCallback((next) => {
    setTheme(next === "dark" ? "dark" : "light");
  }, []);

  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false);
    setMenuCoords(null);
  }, []);

  const goToView = useCallback(
    (view) => {
      setView(view);
      closeUserMenu();
      setIsMenuOpen(false);
    },
    [setView, closeUserMenu],
  );

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gutter = 12;
    const maxWidth = Math.min(300, window.innerWidth - gutter * 2);
    const spaceBelow = window.innerHeight - rect.bottom - gutter;
    const spaceAbove = rect.top - gutter;
    const preferBelow = spaceBelow >= 260 || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(
      180,
      Math.min(preferBelow ? spaceBelow : spaceAbove, window.innerHeight * 0.75),
    );

    let left = rect.right - maxWidth;
    left = Math.max(gutter, Math.min(left, window.innerWidth - maxWidth - gutter));

    if (preferBelow) {
      setMenuCoords({
        top: rect.bottom + 8,
        left,
        width: maxWidth,
        maxHeight,
      });
    } else {
      setMenuCoords({
        bottom: window.innerHeight - rect.top + 8,
        left,
        width: maxWidth,
        maxHeight,
      });
    }
  }, []);

  useEffect(() => {
    const getScrollY = () =>
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const handleScroll = () => {
      setIsAtTop(getScrollY() < 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    updateMenuPosition();

    const onReposition = () => updateMenuPosition();
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeUserMenu();
    };
    const handleClickOutside = (event) => {
      const inTrigger = triggerRef.current?.contains(event.target);
      const inDropdown = dropdownRef.current?.contains(event.target);
      if (!inTrigger && !inDropdown) closeUserMenu();
    };

    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen, updateMenuPosition, closeUserMenu]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        closeUserMenu();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen, closeUserMenu]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    if (isUserMenuOpen) {
      closeUserMenu();
      return;
    }
    updateMenuPosition();
    setIsUserMenuOpen(true);
  };

  const userDropdown =
    isUserMenuOpen &&
    veterinarian &&
    createPortal(
      <div
        ref={dropdownRef}
        className="user-dropdown-menu user-dropdown-menu--portal user-dropdown-menu--guiaa"
        role="menu"
        style={
          menuCoords
            ? {
                top: menuCoords.top != null ? menuCoords.top : "auto",
                bottom: menuCoords.bottom != null ? menuCoords.bottom : "auto",
                left: menuCoords.left,
                width: menuCoords.width,
                maxHeight: menuCoords.maxHeight,
              }
            : {
                top: 72,
                right: 12,
                left: "auto",
                width: Math.min(300, window.innerWidth - 24),
                maxHeight: "70dvh",
              }
        }
      >
        <div className="user-dropdown-header">
          <div className="user-avatar-large" aria-hidden>
            {veterinarian.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="user-dropdown-info">
            <span className="user-dropdown-name">{veterinarian.nombre}</span>
            <span className="user-dropdown-email">{veterinarian.email}</span>
            <span className="user-dropdown-membership">
              {t("header.plan", { plan: membershipLabel })}
            </span>
          </div>
        </div>

        <LanguageSwitcher variant="menu" />

        <div className="header-theme-menu" role="none">
          <span className="header-theme-menu-label" id="header-theme-label">
            {t("header.themeLabel")}
          </span>
          <div
            className="header-theme-toggle header-theme-toggle--menu"
            role="group"
            aria-labelledby="header-theme-label"
          >
            <button
              type="button"
              className={`header-theme-option${theme === "light" ? " is-active" : ""}`}
              onClick={() => setThemeMode("light")}
              aria-pressed={theme === "light"}
              title={t("dashLegacy.themeModeLight")}
            >
              <Sun size={14} strokeWidth={1.75} aria-hidden />
              <span className="header-theme-option-label">{t("dashLegacy.themeModeLight")}</span>
            </button>
            <button
              type="button"
              className={`header-theme-option${theme === "dark" ? " is-active" : ""}`}
              onClick={() => setThemeMode("dark")}
              aria-pressed={theme === "dark"}
              title={t("dashLegacy.themeModeDark")}
            >
              <Moon size={14} strokeWidth={1.75} aria-hidden />
              <span className="header-theme-option-label">{t("dashLegacy.themeModeDark")}</span>
            </button>
          </div>
        </div>

        <div className="user-dropdown-section" role="none">
          <button
            type="button"
            role="menuitem"
            onClick={() => goToView("consultation-history")}
            className="user-dropdown-item"
          >
            <ClipboardList size={16} strokeWidth={1.75} aria-hidden />
            <span className="user-dropdown-item-label">{t("header.activityLog")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => goToView("settings")}
            className="user-dropdown-item"
          >
            <Settings size={16} strokeWidth={1.75} aria-hidden />
            <span className="user-dropdown-item-label">{t("header.settings")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => goToView("profile")}
            className="user-dropdown-item"
          >
            <User size={16} strokeWidth={1.75} aria-hidden />
            <span className="user-dropdown-item-label">{t("header.myProfile")}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => goToView("membership")}
            className={`user-dropdown-item${!isPremium ? " user-dropdown-item--upgrade" : ""}`}
          >
            <Crown size={16} strokeWidth={1.75} aria-hidden />
            <span className="user-dropdown-item-label">
              {isPremium ? t("header.myMembership") : t("header.upgradePlan")}
            </span>
            {!isPremium ? (
              <span className="user-dropdown-upgrade-pill">{t("header.upgradeCta")}</span>
            ) : null}
          </button>
        </div>

        <div className="user-dropdown-divider" />

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            logout();
            goToView("landing");
          }}
          className="user-dropdown-item logout-item"
        >
          <LogOut size={16} strokeWidth={1.75} aria-hidden />
          <span className="user-dropdown-item-label">{t("header.logout")}</span>
        </button>

        <div className="user-dropdown-footer">
          <span className="user-dropdown-footer-brand">
            <span className="user-dropdown-footer-mark" aria-hidden />
            GUIAA
          </span>
          <span className="user-dropdown-footer-version">{MENU_APP_VERSION}</span>
        </div>
      </div>,
      document.body,
    );

  return (
    <header className={`header ${!isAtTop ? "scrolled" : ""}`}>
      <div className="container">
        <div
          className="nav-brand"
          onClick={() => setView(veterinarian ? "dashboard" : "landing")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setView(veterinarian ? "dashboard" : "landing");
            }
          }}
          role="button"
          tabIndex={0}
        >
          <GuiaaBrandLockup variant="header" />
        </div>

        {showAuth && (
          <div className="header-end">
            {veterinarian ? (
              <div className="header-toolbar-pair">
                {actions && (
                  <div className="header-actions-slot">{actions}</div>
                )}
                <nav className="nav-menu nav-menu--user-only">
                  <div className="user-menu-container">
                    <button
                      ref={triggerRef}
                      type="button"
                      className="user-menu-trigger user-menu-trigger--avatar"
                      onClick={toggleUserMenu}
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="menu"
                      aria-label={t("header.accountAria", {
                        name: veterinarian.nombre,
                      })}
                    >
                      <div className="user-avatar" aria-hidden>
                        {veterinarian.nombre.charAt(0).toUpperCase()}
                      </div>
                    </button>
                    {userDropdown}
                  </div>
                </nav>
              </div>
            ) : (
              actions && <div className="header-actions-slot">{actions}</div>
            )}
            {!veterinarian && (
              <>
                <button
                  type="button"
                  className="menu-toggle"
                  onClick={toggleMenu}
                  aria-expanded={isMenuOpen}
                  aria-label={
                    isMenuOpen
                      ? t("header.closeUserMenu")
                      : t("header.openUserMenu")
                  }
                >
                  {isMenuOpen ? (
                    <X size={20} strokeWidth={1.75} aria-hidden />
                  ) : (
                    <Menu size={20} strokeWidth={1.75} aria-hidden />
                  )}
                </button>
                <nav className={`nav-menu ${isMenuOpen ? "mobile-open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      setIsMenuOpen(false);
                    }}
                    className="nav-link"
                  >
                    {t("header.login")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setView("register");
                      setIsMenuOpen(false);
                    }}
                    className="btn btn-primary"
                  >
                    {t("header.register")}
                  </button>
                </nav>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
