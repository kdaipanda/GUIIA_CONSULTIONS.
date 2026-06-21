import React, { useState, useEffect } from "react";
import { useVet } from "../context/VetContext";
import { GuiaaBrandLockup } from "./GuiaaBrandLockup";

export function Header({ setView, showAuth = true, actions }) {
  const { veterinarian, logout } = useVet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

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
        >
          <GuiaaBrandLockup variant="header" />
        </div>

        {showAuth && (
          <div className="header-end">
            {actions && (
              <div className="header-actions-slot">{actions}</div>
            )}
            <button
              type="button"
              className="menu-toggle"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Cerrar menú de usuario" : "Abrir menú de usuario"}
            >
              {isMenuOpen ? "✕" : "☰"}
            </button>
            <nav className={`nav-menu ${isMenuOpen ? "mobile-open" : ""}`}>
              {veterinarian ? (
                <>
                  <div className="user-menu-container">
                    <button
                      className="user-menu-trigger"
                      onClick={toggleUserMenu}
                    >
                      <div className="user-avatar">
                        {veterinarian.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info-compact">
                        <span className="user-name-compact">
                          {veterinarian.nombre}
                        </span>
                        <span className="user-membership-compact">
                          {veterinarian.membership_type || "Básica"}
                        </span>
                      </div>
                      <span className="dropdown-arrow">
                        {isUserMenuOpen ? "▲" : "▼"}
                      </span>
                    </button>

                    {isUserMenuOpen && (
                      <div className="user-dropdown-menu">
                        <div className="user-dropdown-header">
                          <div className="user-avatar-large">
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
                              Plan: {veterinarian.membership_type || "Básica"}
                            </span>
                          </div>
                        </div>
                        <div className="user-dropdown-divider"></div>
                        <button
                          onClick={() => {
                            setView("profile");
                            setIsUserMenuOpen(false);
                            setIsMenuOpen(false);
                          }}
                          className="user-dropdown-item"
                        >
                          <span className="dropdown-icon">👤</span>
                          Mi Perfil
                        </button>
                        <button
                          onClick={() => {
                            setView("membership");
                            setIsUserMenuOpen(false);
                            setIsMenuOpen(false);
                          }}
                          className="user-dropdown-item"
                        >
                          <span className="dropdown-icon">⭐</span>
                          Mi Membresía
                        </button>
                        <div className="user-dropdown-divider"></div>
                        <button
                          onClick={() => {
                            logout();
                            setView("landing");
                            setIsUserMenuOpen(false);
                            setIsMenuOpen(false);
                          }}
                          className="user-dropdown-item logout-item"
                        >
                          <span className="dropdown-icon">🚪</span>
                          Cerrar Sesión
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setView("login");
                      setIsMenuOpen(false);
                    }}
                    className="nav-link"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => {
                      setView("register");
                      setIsMenuOpen(false);
                    }}
                    className="btn btn-primary"
                  >
                    Registrarse
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
