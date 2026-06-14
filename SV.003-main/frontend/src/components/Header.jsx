import React, { useState, useEffect } from "react";
import { useVet } from "../context/VetContext";

export function Header({ setView, showAuth = true }) {
  const { veterinarian, logout } = useVet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    return () => window.removeEventListener("scroll", handleScroll);
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
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <header className={`header ${!isAtTop ? "scrolled" : ""}`}>
      <div className="container">
        <div
          className="nav-brand"
          onClick={() => setView(veterinarian ? "dashboard" : "landing")}
        >
          <img src="/GuiaLogo-mark.png" alt="GUIAA" className="logo-image" />
          <div className="nav-brand-text">
            <h1>GUIAA</h1>
            <span className="nav-brand-subtitle">
              Gran universo de inteligencia animal.
            </span>
            <span className="nav-brand-subsubtitle">
              Soporte a la decisión clínica CDS avanzado grado L4 y L5.
            </span>
          </div>
        </div>

        {showAuth && (
          <>
            <button className="menu-toggle" onClick={toggleMenu}>
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
          </>
        )}
      </div>
    </header>
  );
}
