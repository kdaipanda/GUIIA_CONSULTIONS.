import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Crown, LogOut, Menu, User, X } from "lucide-react";
import { useVet } from "../context/VetContext";
import { getPlanDisplayName } from "../lib/membershipPlans";
import { GuiaaBrandLockup } from "./GuiaaBrandLockup";
import { LanguageSwitcher } from "./LanguageSwitcher";
import "./headerToolbar.css";

export function Header({ setView, showAuth = true, actions }) {
  const { t } = useTranslation("clinic");
  const { veterinarian, logout } = useVet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  const membershipLabel = veterinarian?.membership_type
    ? getPlanDisplayName(veterinarian.membership_type.toLowerCase())
    : t("header.planFallback");

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
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest(".user-menu-container")) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

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
                <nav
                  className={`nav-menu ${isMenuOpen ? "mobile-open" : ""} nav-menu--user-only`}
                >
                  <div className="user-menu-container">
                    <button
                      type="button"
                      className="user-menu-trigger user-menu-trigger--avatar"
                      onClick={toggleUserMenu}
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="menu"
                      aria-label={t("header.accountAria", { name: veterinarian.nombre })}
                    >
                      <div className="user-avatar" aria-hidden>
                        {veterinarian.nombre.charAt(0).toUpperCase()}
                      </div>
                    </button>

                    {isUserMenuOpen && (
                      <div className="user-dropdown-menu" role="menu">
                        <div className="user-dropdown-header">
                          <div className="user-avatar-large" aria-hidden>
                            {veterinarian.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-dropdown-info">
                            <span className="user-dropdown-name">
                              {veterinarian.nombre}
                            </span>
                            <span className="user-dropdown-email">
                              {veterinarian.email}
                            </span>
                            <span className="user-dropdown-membership">
                              {t("header.plan", { plan: membershipLabel })}
                            </span>
                          </div>
                        </div>
                        <div className="user-dropdown-divider" />
                        <LanguageSwitcher variant="menu" />
                        <div className="user-dropdown-divider" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setView("profile");
                            setIsUserMenuOpen(false);
                            setIsMenuOpen(false);
                          }}
                          className="user-dropdown-item"
                        >
                          <User size={16} strokeWidth={1.75} aria-hidden />
                          {t("header.myProfile")}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setView("membership");
                            setIsUserMenuOpen(false);
                            setIsMenuOpen(false);
                          }}
                          className="user-dropdown-item"
                        >
                          <Crown size={16} strokeWidth={1.75} aria-hidden />
                          {t("header.myMembership")}
                        </button>
                        <div className="user-dropdown-divider" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            logout();
                            setView("landing");
                            setIsUserMenuOpen(false);
                            setIsMenuOpen(false);
                          }}
                          className="user-dropdown-item logout-item"
                        >
                          <LogOut size={16} strokeWidth={1.75} aria-hidden />
                          {t("header.logout")}
                        </button>
                      </div>
                    )}
                  </div>
                </nav>
              </div>
            ) : (
              actions && (
                <div className="header-actions-slot">{actions}</div>
              )
            )}
            <button
              type="button"
              className="menu-toggle"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-label={
                isMenuOpen ? t("header.closeUserMenu") : t("header.openUserMenu")
              }
            >
              {isMenuOpen ? (
                <X size={20} strokeWidth={1.75} aria-hidden />
              ) : (
                <Menu size={20} strokeWidth={1.75} aria-hidden />
              )}
            </button>
            {!veterinarian && (
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
            )}
          </div>
        )}
      </div>
    </header>
  );
}
