import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import { BarChart3, CalendarDays, Gem, Sun, Cloud, CloudRain, CloudSun, Thermometer, Plus, ClipboardList, FlaskConical, Crown, Bell, Moon } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import Lenis from "lenis";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./App.css";
import "./Custom.css";
import "./ThemeEnhancements.css";
import { supabase } from "./lib/supabaseClient";
import {
  createConsultationSupabase,
  listConsultationsSupabase,
  updateConsultationPayloadSupabase,
  uploadMedicalImageSupabase,
  listMedicalImagesSupabase,
} from "./lib/supabaseApi";

// Lenis Smooth Scroll Hook - Fast & Responsive
const useLenis = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.4, // duración corta = scroll rápido
      easing: (t) => 1 - Math.pow(1 - t, 4), // easing rápido
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2.5,
      wheelMultiplier: 1.8, // más distancia por scroll
      lerp: 0.15, // mayor lerp = respuesta más rápida
      infinite: false,
    });

    // Fast RAF loop
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cleanup
    return () => {
      lenis.destroy();
    };
  }, []);
};

const getBackendUrl = () => {
  const localUrl = "http://localhost:8000";
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  
  try {
    // 1. Parámetro URL (para debugging)
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get("backend_url");
    if (paramUrl) {
      try {
        new URL(paramUrl);
        localStorage.setItem("backend_url", paramUrl);
        return paramUrl;
      } catch (e) {}
    }
    
    // 2. Túnel trycloudflare: usar mismo origen
    if (window.location.hostname.endsWith("trycloudflare.com")) {
      return "";
    }
    
    // 3. Desarrollo local: usar localhost:8000
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return localUrl;
    }
    
    // 4. Producción: usar variable de entorno o dominio conocido
    if (envUrl) {
      return envUrl;
    }
    
    // 5. Fallback para guiaa.vet
    if (window.location.hostname.includes("guiaa.vet")) {
      return "https://api.guiaa.vet";
    }
    
    // 6. Fallback final
    const stored = localStorage.getItem("backend_url");
    if (stored) return stored;
  } catch (e) {}
  
  return envUrl || localUrl;
};

const BACKEND_URL = getBackendUrl();
console.log("Backend URL being used:", BACKEND_URL);
const DEV_AUTO_LOGIN = false;

// Importar formularios de especies
import {
  PerrosForm,
  GatosForm,
  TortugasForm,
  ErizosForm,
  HuronesForm,
  IguanasForm,
  HamstersForm,
  PatosPollosForm,
  AvesForm,
  ConejosForm,
  CuyosForm,
} from "./components/forms";

// Context for veterinarian authentication
const VetContext = createContext();

const useVet = () => {
  const context = useContext(VetContext);
  if (!context) {
    throw new Error("useVet must be used within a VetProvider");
  }
  return context;
};

const VetProvider = ({ children }) => {
  const [veterinarian, setVeterinarian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    // Check for stored veterinarian data
    const storedVet = localStorage.getItem("veterinarian");
    if (storedVet) {
      try {
        const parsedVet = JSON.parse(storedVet);
        const isDevCarlos =
          parsedVet?.id === "dev-carlos-hernandez" ||
          parsedVet?.email === "carlos.hernandez@vetmed.com";
        if (isDevCarlos) {
          localStorage.removeItem("veterinarian");
        } else {
          setVeterinarian(parsedVet);
        }
      } catch (e) {
        localStorage.removeItem("veterinarian");
      }
    } else if (DEV_AUTO_LOGIN) {
      const devVet = {
        id: "dev-carlos-hernandez",
        nombre: "Carlos Hernandez",
        email: "carlos.hernandez@vetmed.com",
        telefono: "5555555555",
        cedula_profesional: "87654321",
        especialidad: "Medicina General",
        años_experiencia: 5,
        institucion: "UNAM",
        membership_type: "premium",
        consultations_remaining: 150,
        membership_expires: new Date("2099-12-31").toISOString(),
      };
      setVeterinarian(devVet);
      localStorage.setItem("veterinarian", JSON.stringify(devVet));
    }
  }, []);

  // Supabase auth session listener
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const vetFromSupabase = {
          id: sessionUser.id,
          nombre: sessionUser.email?.split("@")[0] || "usuario",
          email: sessionUser.email,
          membership_type: "basic",
        };
        setAuthUser(sessionUser);
        setVeterinarian((prev) => prev || vetFromSupabase);
        localStorage.setItem("veterinarian", JSON.stringify(vetFromSupabase));
      }
      setLoading(false);
    });

    const {
      data: subscription,
    } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      if (user) {
        const vetFromSupabase = {
          id: user.id,
          nombre: user.email?.split("@")[0] || "usuario",
          email: user.email,
          membership_type: "basic",
        };
        setVeterinarian(vetFromSupabase);
        localStorage.setItem("veterinarian", JSON.stringify(vetFromSupabase));
      } else {
        setVeterinarian(null);
        localStorage.removeItem("veterinarian");
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const login = (vetData) => {
    setVeterinarian(vetData);
    localStorage.setItem("veterinarian", JSON.stringify(vetData));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setVeterinarian(null);
    localStorage.removeItem("veterinarian");
  };

  const loginWithEmailPassword = async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data?.user;
  };

  const loginWithMagicLink = async (email) => {
    const { error, data } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
    return data;
  };

  const refreshProfile = async () => {
    if (!veterinarian?.id) return;
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}/api/auth/profile`, {
        headers: {
          "x-veterinarian-id": veterinarian.id,
        },
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        setVeterinarian(updatedProfile);
        localStorage.setItem("veterinarian", JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error("Error refrescando perfil:", error);
      // Silenciar errores para no interrumpir la experiencia del usuario
    }
  };

  return (
    <VetContext.Provider
      value={{
        veterinarian,
        login,
        logout,
        loading,
        authUser,
        loginWithEmailPassword,
        loginWithMagicLink,
        refreshProfile,
      }}
    >
      {children}
    </VetContext.Provider>
  );
};

// Toast Component
const Toast = ({ toast, onClose }) => {
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-icon">{icons[toast.type] || icons.info}</div>
      <div className="toast-message">{toast.message}</div>
      <button className="toast-close" onClick={() => onClose(toast.id)}>
        ✕
      </button>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Command Palette Component
const CommandPalette = ({ isOpen, onClose, setView, veterinarian }) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    {
      id: "new-consultation",
      title: "Nueva Consulta",
      description: "Iniciar una nueva consulta veterinaria",
      icon: "➕",
      shortcut: "N",
      action: () => setView("new-consultation"),
    },
    {
      id: "consultation-history",
      title: "Historial",
      description: "Ver historial de consultas",
      icon: "📋",
      shortcut: "H",
      action: () => setView("consultation-history"),
    },
    {
      id: "membership",
      title: "Membresía",
      description: "Gestionar tu membresía",
      icon: "⭐",
      shortcut: "M",
      action: () => setView("membership"),
    },
    {
      id: "profile",
      title: "Perfil",
      description: "Ver y editar tu perfil",
      icon: "👤",
      shortcut: "",
      action: () => setView("profile"),
    },
  ];

  if (veterinarian?.membership_type?.toLowerCase() === "premium") {
    commands.splice(3, 0, {
      id: "medical-images",
      title: "Interpretar Imágenes",
      description: "Análisis de laboratorio (Premium)",
      icon: "🔬",
      shortcut: "I",
      action: () => setView("medical-images"),
    });
  }

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1,
        );
      } else if (e.key === "Enter" && filteredCommands[activeIndex]) {
        e.preventDefault();
        filteredCommands[activeIndex].action();
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Buscar comandos..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
          />
        </div>
        <div className="command-palette-results">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`command-palette-item ${index === activeIndex ? "active" : ""}`}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
              >
                <div className="command-palette-item-icon">{cmd.icon}</div>
                <div className="command-palette-item-content">
                  <div className="command-palette-item-title">{cmd.title}</div>
                  <div className="command-palette-item-description">
                    {cmd.description}
                  </div>
                </div>
                {cmd.shortcut && (
                  <div className="command-palette-item-shortcut">
                    <kbd>{cmd.shortcut}</kbd>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="command-palette-empty">
              No se encontraron comandos
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Privacy Modal Component
const PrivacyModal = ({ isOpen, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="privacy-modal-overlay">
      <div className="privacy-modal">
        <div className="privacy-modal-header">
          <div className="privacy-modal-icon">🔒</div>
          <h2>Privacidad y Uso de Datos</h2>
        </div>
        <div className="privacy-modal-body">
          <p>
            GUIAA se compromete a proteger tu privacidad y la de tus
            pacientes. Al usar esta plataforma:
          </p>
          <ul>
            <li>
              Los datos de las consultas se almacenan de forma segura y
              encriptada
            </li>
            <li>Solo tú tienes acceso a la información de tus pacientes</li>
            <li>
              No compartimos información con terceros sin tu consentimiento
            </li>
            <li>Cumplimos con todas las normativas de protección de datos</li>
            <li>
              Puedes solicitar la eliminación de tus datos en cualquier momento
            </li>
          </ul>
          <p>
            Para más información, consulta nuestra{" "}
            <a href="#" style={{ color: "var(--accent-primary)" }}>
              Política de Privacidad
            </a>
            .
          </p>
        </div>
        <div className="privacy-modal-footer">
          <button className="btn btn-primary" onClick={onAccept}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [toasts, setToasts] = useState([]);
  
  // Activar Lenis smooth scroll
  useLenis();

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const closeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <VetProvider>
      <div className="App">
        <Router showToast={showToast} />
        <ToastContainer toasts={toasts} onClose={closeToast} />
        <SpeedInsights />
      </div>
    </VetProvider>
  );
}

// Router Component
const Router = ({ showToast }) => {
  const { veterinarian, loading } = useVet();
  const [currentView, setCurrentView] = useState(
    veterinarian ? "dashboard" : "landing",
  );
  const [isCmdkOpen, setCmdkOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [cedulaFlow, setCedulaFlow] = useState(null);

  // Helper to navigate to consultation with ID
  const openConsultation = (consultationId) => {
    setSelectedConsultationId(consultationId);
    setCurrentView("new-consultation");
  };

  // Clear consultation ID when leaving new-consultation view
  const handleSetView = (view) => {
    if (view !== "new-consultation") {
      setSelectedConsultationId(null);
    }
    setCurrentView(view);
  };

  // Command Palette (Ctrl/Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCmdkOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Redirigir a landing cuando se cierre sesión
  useEffect(() => {
    if (!veterinarian && !loading) {
      setCurrentView("landing");
    }
  }, [veterinarian, loading]);

  // URL parameter handling for payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const view = urlParams.get("view");

    if (sessionId) {
      // Solo redirigir a payment-success si el usuario está autenticado
      if (veterinarian) {
        setCurrentView("payment-success");
      } else {
        // Si no está autenticado pero hay session_id, limpiar la URL y redirigir al login
        urlParams.delete("session_id");
        const query = urlParams.toString();
        const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
        window.history.replaceState(null, "", newUrl);
        setCurrentView("login");
      }
    } else if (view && view !== "profile") {
      setCurrentView(view);
    } else if (view === "profile") {
      urlParams.delete("view");
      const query = urlParams.toString();
      const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    } else if (veterinarian) {
      setCurrentView("dashboard");
    }
  }, [veterinarian]);

  if (loading) {
    return <LoadingScreen />;
  }

  const views = {
    landing: <LandingPage setView={handleSetView} />,
    register: <RegisterPage setView={handleSetView} setCedulaFlow={setCedulaFlow} />,
    login: <LoginPage setView={handleSetView} setCedulaFlow={setCedulaFlow} />,
    "cedula-verification": (
      <CedulaVerificationPage
        setView={handleSetView}
        cedulaFlow={cedulaFlow}
        setCedulaFlow={setCedulaFlow}
      />
    ),
    dashboard: <Dashboard setView={handleSetView} openConsultation={openConsultation} />,
    "new-consultation": <NewConsultation setView={handleSetView} existingConsultationId={selectedConsultationId} />,
    "consultation-history": <ConsultationHistory setView={handleSetView} openConsultation={openConsultation} />,
    "medical-images": <MedicalImageInterpretation setView={handleSetView} />,
    membership: <MembershipPage setView={handleSetView} />,
    "payment-success": <PaymentSuccess setView={handleSetView} />,
    profile: <Profile setView={handleSetView} />,
  };

  return (
    <>
      {views[currentView] || <LandingPage setView={handleSetView} />}
      <CommandPalette
        isOpen={isCmdkOpen}
        onClose={() => setCmdkOpen(false)}
        setView={handleSetView}
        veterinarian={veterinarian}
      />
    </>
  );
};

// Loading Screen
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>Cargando GUIAA...</p>
  </div>
);

// Navigation Header
const Header = ({ setView, showAuth = true }) => {
  const { veterinarian, logout } = useVet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Update if at top for transparency effect
      setIsAtTop(currentScrollY < 50);
    };

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
          <img src="/GuiaLogo12.png" alt="GUIAA" className="logo-image" />
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
};

// Landing Page - Estilo iVET360
const LandingPage = ({ setView }) => {
  return (
    <div className="landing-page">
      <Header setView={setView} />

      {/* Hero Section */}
      <section className="hero-ivet">
        {/* Aurora borealis effect */}
        <div className="aurora-bg">
          <div className="aurora-layer"></div>
        </div>
        
        {/* Morphing shape */}
        <div className="morph-shape" style={{top: '20%', right: '10%'}}></div>
        
        {/* Spotlight */}
        <div className="spotlight" style={{top: '30%', left: '20%'}}></div>
        
        {/* Blobs animados */}
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>
        <div className="hero-blob hero-blob-3"></div>
        
        {/* Partículas animadas */}
        <div className="hero-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Plataforma exclusiva para veterinarios
            </div>
            
            <h1 className="hero-title">
              Diagnósticos<br />
              <span className="highlight">Profesionales</span>
            </h1>
            
            <p className="hero-subtitle">
              Plataforma de soporte a la decisión clínica que integra anamnesis, hallazgos clínicos 
              y antecedentes para proponer planes diagnósticos y terapéuticos basados en evidencia.
              Diseñada exclusivamente para médicos veterinarios certificados.
            </p>
            <p className="hero-subtitle hero-subtitle-secondary">
              Única plataforma en el mundo de diagnóstico médico veterinario con soporte CDS avanzado
              de nivel L4 y L5.
            </p>
            
            <div className="hero-cta">
              <button 
                onClick={() => setView("register")}
                className="btn-hero-primary"
              >
                🩺 Registrarme como Veterinario
              </button>
              <button 
                onClick={() => setView("login")}
                className="btn-hero-secondary"
              >
                Iniciar Sesión
              </button>
            </div>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-icon">🩺</div>
                <div className="hero-stat-number" data-target="500">500+</div>
                <div className="hero-stat-label">Veterinarios activos</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-icon">📋</div>
                <div className="hero-stat-number" data-target="10000">10K+</div>
                <div className="hero-stat-label">Consultas realizadas</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-icon">⭐</div>
                <div className="hero-stat-number" data-target="98">98%</div>
                <div className="hero-stat-label">Satisfacción</div>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            {/* Floating badges */}
            <div className="video-floating-badge top-left">🔬 Análisis Clínico</div>
            <div className="video-floating-badge top-right">⚡ Tiempo Real</div>
            <div className="video-floating-badge bottom-left">✓ Verificado</div>
            
            <div className="hero-video-container">
              <div className="hero-video-inner">
                {/* Browser bar mockup */}
                <div className="video-browser-bar">
                  <div className="browser-dot red"></div>
                  <div className="browser-dot yellow"></div>
                  <div className="browser-dot green"></div>
                  <div className="browser-url">guia.vet/dashboard</div>
                </div>
                
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="hero-video"
                >
                  <source src="/VG1.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-scroll-indicator">
          <span className="scroll-label">Desliza para descubrir más</span>
          <span className="scroll-mouse">
            <span className="scroll-wheel"></span>
          </span>
        </div>
      </section>

      {/* Trust Badges - Carrusel */}
      <section className="trust-badges">
        <div className="trust-badges-track">
          <div className="trust-badge">
            <div className="trust-badge-icon">🔒</div>
            <span>Datos Encriptados</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">✓</div>
            <span>Veterinarios Verificados</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">🏥</div>
            <span>Cumple NORMA Oficial</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">⚡</div>
            <span>Respuesta Inmediata</span>
          </div>

          {/* Duplicado para scroll continuo */}
          <div className="trust-badge">
            <div className="trust-badge-icon">🔒</div>
            <span>Datos Encriptados</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">✓</div>
            <span>Veterinarios Verificados</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">🏥</div>
            <span>Cumple NORMA Oficial</span>
          </div>
          <div className="trust-badge">
            <div className="trust-badge-icon">⚡</div>
            <span>Respuesta Inmediata</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Características</span>
            <h2>Herramientas clínicas integradas para tu práctica</h2>
            <p>Suite de soporte clínico diseñada para estructurar la anamnesis, el razonamiento diagnóstico y el plan terapéutico en cada consulta.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔬</div>
              <h3>Análisis Especializado</h3>
              <p>Motor de análisis clínico que integra signos, antecedentes, comorbilidades y literatura actualizada para priorizar hipótesis diagnósticas y estudios complementarios.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Historial Completo</h3>
              <p>Registro clínico longitudinal con búsqueda avanzada, filtros por especie y exportación de reportes para auditoría o seguimiento.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💊</div>
              <h3>Planes de Tratamiento</h3>
              <p>Generación de esquemas terapéuticos sugeridos con dosis, frecuencia, duración y recordatorios de reevaluación según la presentación clínica.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🐾</div>
              <h3>Multi-Especies</h3>
              <p>Protocolos adaptados para perros, gatos, aves, reptiles y pequeños mamíferos, con parámetros fisiológicos y rangos de referencia específicos por especie.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Acceso 24/7</h3>
              <p>Acceso seguro desde cualquier dispositivo, con sesiones cifradas y alta disponibilidad en la nube para consultas en guardias y urgencias.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Seguro y Privado</h3>
              <p>Datos encriptados en tránsito y en reposo, controles de acceso por usuario y alineación con buenas prácticas de protección de información médica.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge" style={{background: 'rgba(59,130,246,0.2)', color: '#93c5fd'}}>Testimonios</span>
            <h2>Lo que dicen nuestros usuarios</h2>
            <p>Veterinarios de todo México confían en GUIAA</p>
          </div>
          
          <div className="testimonials-wrapper">
            <div className="testimonial-card">
              <div className="testimonial-rating">
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
              </div>
              <p className="testimonial-quote">
                "GUIAA me ha ahorrado horas de análisis cada semana. El soporte a la decisión clínica 
                es consistente y las recomendaciones terapéuticas están sólidamente justificadas."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">DG</div>
                <div className="testimonial-info">
                  <h4>Dr. García Mendoza</h4>
                  <p>Clínica Veterinaria Central, CDMX</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-rating">
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
              </div>
              <p className="testimonial-quote">
                "La mejor inversión para mi clínica. El análisis de pruebas de laboratorio 
                es muy completo y me ayuda a dar mejores diagnósticos."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">ML</div>
                <div className="testimonial-info">
                  <h4>Dra. López Ramírez</h4>
                  <p>Hospital Veterinario Sur, Monterrey</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-rating">
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
                <span className="testimonial-star">⭐</span>
              </div>
              <p className="testimonial-quote">
                "Excelente para casos de especies exóticas. Los protocolos específicos 
                y la base de conocimiento me dan confianza en mis diagnósticos."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">CR</div>
                <div className="testimonial-info">
                  <h4>Dr. Rodríguez Sánchez</h4>
                  <p>Clínica de Exóticos, Guadalajara</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos Marquee - Especies soportadas */}
      <section className="logos-marquee">
        <p className="logos-marquee-title">Especies que puedes consultar con GUIAA</p>
        <div className="logos-marquee-track">
          <div className="logo-marquee-item"><span>🐕</span> Perros</div>
          <div className="logo-marquee-item"><span>🐈</span> Gatos</div>
          <div className="logo-marquee-item"><span>🦜</span> Aves</div>
          <div className="logo-marquee-item"><span>🐰</span> Conejos y roedores</div>
          <div className="logo-marquee-item"><span>🐢</span> Tortugas y reptiles</div>
          <div className="logo-marquee-item"><span>🦎</span> Iguanas y exóticos pequeños</div>
          <div className="logo-marquee-item"><span>🐭</span> Pequeños mamíferos</div>
          <div className="logo-marquee-item"><span>🐾</span> Otros casos especiales</div>
          {/* Duplicados para el efecto infinito */}
          <div className="logo-marquee-item"><span>🐕</span> Perros</div>
          <div className="logo-marquee-item"><span>🐈</span> Gatos</div>
          <div className="logo-marquee-item"><span>🦜</span> Aves</div>
          <div className="logo-marquee-item"><span>🐰</span> Conejos y roedores</div>
          <div className="logo-marquee-item"><span>🐢</span> Tortugas y reptiles</div>
          <div className="logo-marquee-item"><span>🦎</span> Iguanas y exóticos pequeños</div>
          <div className="logo-marquee-item"><span>🐭</span> Pequeños mamíferos</div>
          <div className="logo-marquee-item"><span>🐾</span> Otros casos especiales</div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-preview">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Precios</span>
            <h2>Planes simples y transparentes</h2>
            <p>Elige el plan que se adapte a tu práctica</p>
          </div>
          
          <div className="pricing-preview-cards">
            <div className="pricing-preview-card">
              <div className="plan-name">Básico</div>
              <div className="plan-price">$950<span>/mes</span></div>
              <div className="plan-feature">30C (consultas mensuales)</div>
            </div>
            
            <div className="pricing-preview-card popular">
              <div className="popular-tag">⭐ Más Popular</div>
              <div className="plan-name">Premium</div>
              <div className="plan-price">$2200<span>/mes</span></div>
              <div className="plan-feature">150C (consultas mensuales)</div>
            </div>
            
            <div className="pricing-preview-card">
              <div className="plan-name">Profesional</div>
              <div className="plan-price">$1250<span>/mes</span></div>
              <div className="plan-feature">35C (consultas mensuales)</div>
            </div>
          </div>
          
          <div style={{textAlign: 'center', marginTop: '40px'}}>
            <button 
              onClick={() => setView("membership")}
              className="btn-hero-secondary"
              style={{background: '#0f172a', borderColor: '#334155'}}
            >
              Ver todos los planes →
            </button>
          </div>
          
          <p style={{
            textAlign: 'center', 
            marginTop: '24px', 
            fontSize: '14px', 
            color: 'var(--text-secondary)',
            fontStyle: 'italic'
          }}>
            * Si requieres factura, será más IVA sobre el costo del plan.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">FAQ</span>
            <h2>Preguntas Frecuentes</h2>
            <p>Todo lo que necesitas saber sobre GUIAA</p>
          </div>
          
          <div className="faq-grid">
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Qué tipo de veterinarios pueden usar GUIAA?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>GUIAA está diseñado exclusivamente para médicos veterinarios titulados y con cédula profesional vigente, que realizan práctica clínica de pequeños animales y exóticos.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Cómo funciona el análisis clínico?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>El sistema estructura los datos de la consulta (síntomas, hallazgos físicos y antecedentes), los compara con una base de casos anonimizados y aplica algoritmos clínicos y guías actualizadas para sugerir hipótesis diagnósticas y estudios a considerar.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Qué significa diagnóstico médico veterinario nivel L4 y L5?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>Hace referencia a niveles avanzados de soporte a la decisión clínica (Clinical Decision Support). En L4 y L5 el sistema no solo presenta información, sino que integra múltiples variables clínicas, aplica protocolos y guías, y propone cursos de acción sugeridos para apoyar decisiones médicas más seguras y consistentes.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Mis datos están seguros?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>Sí, todos los datos están encriptados y cumplimos con las normativas de protección de datos. Tú controlas toda tu información.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={(e) => e.currentTarget.parentElement.classList.toggle('open')}>
                ¿Puedo cancelar mi membresía?
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <p>Sí, puedes cancelar en cualquier momento sin penalizaciones. Tu acceso continuará hasta el fin del período pagado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2>¿Listo para transformar tu práctica?</h2>
            <p>Únete a cientos de veterinarios que ya confían en GUIAA</p>
            <button 
              onClick={() => setView("register")}
              className="btn-cta"
            >
              Comenzar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* WhatsApp Float Button */}
      <a 
        href="https://wa.me/5215512345678?text=Hola,%20me%20interesa%20GUIAA" 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-float"
      >
        💬
        <span className="whatsapp-tooltip">¿Necesitas ayuda?</span>
      </a>
      
      {/* Back to Top Button */}
      <button 
        className="back-to-top visible"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>

      {/* Footer */}
      <footer className="footer-modern">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>GUIAA</h3>
              <p>
                Plataforma profesional de consultoría veterinaria. 
                Diseñada exclusivamente para médicos veterinarios certificados en México.
              </p>
              <div className="footer-social">
                <a href="#">📘</a>
                <a href="#">🐦</a>
                <a href="#">📷</a>
                <a href="#">💼</a>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>Producto</h4>
              <ul>
                <li><a href="#" onClick={() => setView("register")}>Consultas Veterinarias</a></li>
                <li><a href="#" onClick={() => setView("membership")}>Planes y Membresías</a></li>
                <li><a href="#" onClick={() => setView("register")}>Recursos Clínicos</a></li>
                <li><a href="#" onClick={() => setView("register")}>Centro de Ayuda</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Empresa</h4>
              <ul>
                <li><a href="#" onClick={() => setView("landing")}>Quiénes Somos</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Noticias y Actualizaciones</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Nuestro Equipo</a></li>
                <li><a href="https://wa.me/5215512345678?text=Hola,%20me%20interesa%20GUIAA" target="_blank" rel="noopener noreferrer">Contacto</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li><a href="#" onClick={() => setView("landing")}>Política de Privacidad</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Términos de Uso</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Política de Cookies</a></li>
                <li><a href="#" onClick={() => setView("landing")}>Aviso Legal</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-badges">
            <div className="footer-badge">
              <span className="badge-icon">🔒</span>
              <span>SSL Seguro</span>
            </div>
            <div className="footer-badge">
              <span className="badge-icon">🛡️</span>
              <span>Datos Protegidos</span>
            </div>
            <div className="footer-badge">
              <span className="badge-icon">✓</span>
              <span>HIPAA Compliant</span>
            </div>
            <div className="footer-badge">
              <span className="badge-icon">🇲🇽</span>
              <span>Hecho en México</span>
            </div>
          </div>
          
          <div className="footer-bottom-modern">
            <p>© 2025 GUIAA. Todos los derechos reservados.</p>
            <p>Hecho con ❤️ para veterinarios mexicanos</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Términos y Condiciones Component
const TermsAndConditionsModal = ({ isOpen, onClose, onAccept }) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const contentRef = useRef(null);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal-content terms-modal" 
        style={{ 
          maxWidth: "900px", 
          maxHeight: "90vh", 
          display: "flex", 
          flexDirection: "column",
          margin: "20px",
          position: "relative",
          zIndex: 1000000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Términos y Condiciones de Uso</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="modal-body terms-content" 
          style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "30px",
            fontSize: "15px",
            lineHeight: "1.7"
          }}
        >
          <div style={{ 
            textAlign: "center", 
            marginBottom: "30px",
            padding: "20px",
            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            borderRadius: "12px",
            border: "1px solid #bae6fd"
          }}>
            <h2 style={{ 
              color: "#0369a1", 
              fontSize: "1.3rem", 
              fontWeight: "700",
              marginBottom: "8px"
            }}>
              Plataforma GUIAA - Soporte a la Decisión Clínica (CDS)
            </h2>
            <p style={{ color: "#0c4a6e", fontWeight: "600", marginBottom: "4px" }}>
              Avanzado Grado L4 y L5
            </p>
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
              Última actualización: 28 de diciembre de 2025 | Vigencia: A partir del 1 de enero de 2026
            </p>
          </div>

          <h3>1. ACEPTACIÓN DE LOS TÉRMINOS</h3>
          <p>Al acceder y utilizar la Plataforma GUIAA (en adelante, "la Plataforma"), usted acepta estar legalmente vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la Plataforma.</p>

          <h3>2. DEFINICIONES</h3>
          <ul>
            <li><strong>Plataforma GUIAA:</strong> Sistema de Soporte a la Decisión Clínica (CDS) de grado avanzado L4 y L5 para profesionales veterinarios.</li>
            <li><strong>Usuario:</strong> Médico veterinario zootecnista con cédula profesional válida y vigente.</li>
            <li><strong>CDS L4-L5:</strong> Sistema de soporte a la decisión clínica de nivel 4 y 5, que proporciona recomendaciones basadas en análisis de datos clínicos.</li>
            <li><strong>Datos Clínicos:</strong> Información relacionada con pacientes animales ingresada en la Plataforma.</li>
          </ul>

          <h3>3. ELEGIBILIDAD Y REGISTRO</h3>
          <h4>3.1 Requisitos de Elegibilidad</h4>
          <p>Para utilizar la Plataforma, usted debe:</p>
          <ul>
            <li>Ser médico veterinario zootecnista titulado</li>
            <li>Poseer cédula profesional válida y vigente emitida por la autoridad competente</li>
            <li>Estar legalmente autorizado para ejercer la medicina veterinaria en su jurisdicción</li>
            <li>Ser mayor de edad según las leyes aplicables</li>
            <li>Tener capacidad legal para celebrar contratos vinculantes</li>
          </ul>

          <h4>3.2 Proceso de Verificación</h4>
          <ul>
            <li>Durante el registro, deberá proporcionar su número de cédula profesional</li>
            <li>La Plataforma verificará la autenticidad de su cédula profesional</li>
            <li>Nos reservamos el derecho de solicitar documentación adicional</li>
            <li>El acceso será otorgado únicamente tras la verificación exitosa</li>
            <li>La verificación puede tardar hasta 72 horas hábiles</li>
          </ul>

          <h4>3.3 Responsabilidad del Usuario</h4>
          <p>Usted es responsable de:</p>
          <ul>
            <li>Mantener la confidencialidad de sus credenciales de acceso</li>
            <li>Todas las actividades realizadas bajo su cuenta</li>
            <li>Notificar inmediatamente cualquier uso no autorizado</li>
            <li>Actualizar su información profesional cuando sea necesario</li>
          </ul>

          <h3>4. NATURALEZA DEL SERVICIO</h3>
          <h4>4.1 Herramienta de Apoyo</h4>
          <p>La Plataforma GUIAA es una herramienta de SOPORTE a la decisión clínica que:</p>
          <ul>
            <li>Proporciona información basada en evidencia científica</li>
            <li>Ofrece recomendaciones algorítmicas</li>
            <li>Facilita el análisis de datos clínicos</li>
            <li><strong>NO sustituye el juicio clínico profesional del veterinario</strong></li>
          </ul>

          <h4>4.2 Limitaciones</h4>
          <ul>
            <li>Las recomendaciones son orientativas, no prescriptivas</li>
            <li>El veterinario usuario es el único responsable de las decisiones clínicas finales</li>
            <li>La Plataforma no establece relación veterinario-paciente</li>
            <li>No proporciona diagnósticos definitivos ni tratamientos específicos sin evaluación profesional</li>
          </ul>

          <h4>4.3 Responsabilidad Profesional</h4>
          <p>El usuario veterinario:</p>
          <ul>
            <li>Mantiene la responsabilidad exclusiva sobre sus decisiones clínicas</li>
            <li>Debe verificar toda información antes de aplicarla clínicamente</li>
            <li>Debe considerar las circunstancias individuales de cada caso</li>
            <li>Es responsable del cumplimiento de las normas profesionales y éticas aplicables</li>
          </ul>

          <h3>5. PROTECCIÓN DE DATOS Y PRIVACIDAD</h3>
          <h4>5.1 Marco Legal Aplicable</h4>
          <p>La Plataforma cumple con:</p>
          <ul>
            <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</li>
            <li>Reglamento General de Protección de Datos (GDPR) para usuarios en la Unión Europea</li>
            <li>Normativa de protección de datos de salud aplicable</li>
            <li>Estándares internacionales de seguridad de información (ISO 27001, ISO 27799)</li>
          </ul>

          <h4>5.2 Datos Recopilados</h4>
          <p>Recopilamos:</p>
          <ul>
            <li>Datos de identificación profesional (nombre, cédula, institución)</li>
            <li>Datos de contacto (correo electrónico, teléfono)</li>
            <li>Datos de uso de la Plataforma</li>
            <li>Datos clínicos anonimizados con fines de mejora del sistema</li>
          </ul>

          <h4>5.3 Uso de Datos</h4>
          <p>Los datos se utilizan para:</p>
          <ul>
            <li>Proporcionar y mejorar el servicio</li>
            <li>Verificación de credenciales profesionales</li>
            <li>Análisis estadístico y mejora de algoritmos</li>
            <li>Cumplimiento de obligaciones legales</li>
            <li>Comunicaciones relacionadas con el servicio</li>
          </ul>

          <h4>5.4 Seguridad</h4>
          <p>Implementamos medidas de seguridad que incluyen:</p>
          <ul>
            <li>Encriptación de datos en tránsito y en reposo (TLS 1.3, AES-256)</li>
            <li>Autenticación multifactor</li>
            <li>Controles de acceso basados en roles</li>
            <li>Auditorías de seguridad periódicas</li>
            <li>Protocolos de respuesta a incidentes</li>
          </ul>

          <h4>5.5 Derechos del Usuario</h4>
          <p>Usted tiene derecho a:</p>
          <ul>
            <li>Acceder a sus datos personales</li>
            <li>Rectificar datos inexactos</li>
            <li>Cancelar su cuenta y datos</li>
            <li>Oponerse al tratamiento de datos</li>
            <li>Portabilidad de datos</li>
            <li>Revocar consentimientos otorgados</li>
          </ul>
          <p>Para ejercer sus derechos, contacte a: <strong>privacidad@guiaa.com</strong></p>

          <h3>6. PROPIEDAD INTELECTUAL</h3>
          <h4>6.1 Derechos de la Plataforma</h4>
          <p>Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo software, código fuente, algoritmos, diseño, contenido, textos, gráficos, materiales, marcas comerciales y logotipos son propiedad exclusiva de GUIAA o sus licenciantes.</p>

          <h4>6.2 Licencia de Uso</h4>
          <p>Se otorga una licencia limitada, no exclusiva, no transferible y revocable para acceder y utilizar la Plataforma conforme a estos términos, con fines profesionales legítimos exclusivamente.</p>

          <h4>6.3 Restricciones</h4>
          <p>Queda estrictamente prohibido:</p>
          <ul>
            <li>Copiar, modificar o crear obras derivadas</li>
            <li>Realizar ingeniería inversa del software</li>
            <li>Extraer datos mediante web scraping o técnicas similares</li>
            <li>Comercializar o revender el acceso a la Plataforma</li>
            <li>Remover avisos de propiedad intelectual</li>
          </ul>

          <h3>7. USO ACEPTABLE</h3>
          <h4>7.1 Conductas Permitidas</h4>
          <p>La Plataforma debe utilizarse exclusivamente para:</p>
          <ul>
            <li>Apoyo en la toma de decisiones clínicas veterinarias</li>
            <li>Consulta de información científica actualizada</li>
            <li>Análisis de casos clínicos con fines profesionales</li>
            <li>Educación y formación profesional continua</li>
          </ul>

          <h4>7.2 Conductas Prohibidas</h4>
          <p>Está estrictamente prohibido:</p>
          <ul>
            <li>Compartir credenciales de acceso con terceros no autorizados</li>
            <li>Utilizar la Plataforma para fines no veterinarios</li>
            <li>Ingresar información falsa o engañosa</li>
            <li>Interferir con el funcionamiento de la Plataforma</li>
            <li>Realizar actividades que violen leyes aplicables</li>
            <li>Automatizar el acceso mediante bots o scripts no autorizados</li>
          </ul>

          <h3>8. SISTEMA DE SOPORTE A LA DECISIÓN CLÍNICA</h3>
          <h4>8.1 Funcionamiento del CDS L4-L5</h4>
          <p>La Plataforma utiliza:</p>
          <ul>
            <li>Algoritmos computacionales entrenados con datos veterinarios</li>
            <li>Modelos de procesamiento de información clínica</li>
            <li>Sistemas de recomendación basados en evidencia científica</li>
            <li>Análisis predictivo de patrones clínicos</li>
          </ul>

          <h4>8.2 Limitaciones del Sistema</h4>
          <p>El usuario reconoce que:</p>
          <ul>
            <li>Los sistemas computacionales pueden cometer errores</li>
            <li>Las recomendaciones se basan en datos históricos y pueden no aplicar a todos los casos</li>
            <li>La tecnología está en constante evolución y mejora</li>
            <li>Existe un margen de incertidumbre en las predicciones</li>
          </ul>

          <h3>9. RESPONSABILIDAD Y GARANTÍAS</h3>
          <h4>9.1 Exclusión de Garantías</h4>
          <p>La Plataforma se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías de ningún tipo.</p>

          <h4>9.2 Limitación de Responsabilidad</h4>
          <p>GUIAA no será responsable por:</p>
          <ul>
            <li>Decisiones clínicas tomadas por el usuario</li>
            <li>Daños derivados del uso o incapacidad de usar la Plataforma</li>
            <li>Pérdida de datos, beneficios o información</li>
            <li>Interrupciones del servicio por causas de fuerza mayor</li>
          </ul>

          <h3>10. CUMPLIMIENTO REGULATORIO</h3>
          <p>El usuario debe cumplir con:</p>
          <ul>
            <li>Ley Federal de Sanidad Animal (México)</li>
            <li>Normas Oficiales Mexicanas aplicables</li>
            <li>Regulaciones estatales y locales de práctica veterinaria</li>
            <li>Códigos de ética profesional</li>
          </ul>

          <h3>11. TARIFAS Y PAGOS</h3>
          <ul>
            <li>La Plataforma opera bajo modelo de suscripción</li>
            <li>Las tarifas se especifican en el sitio web</li>
            <li>Periodo de garantía de satisfacción: 14 días</li>
          </ul>

          <h3>12. DURACIÓN Y TERMINACIÓN</h3>
          <p>El usuario puede cancelar su suscripción en cualquier momento. GUIAA puede suspender o terminar el acceso por violación de estos términos.</p>

          <h3>13. DISPOSICIONES GENERALES</h3>
          <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia se someterá a la jurisdicción exclusiva de los tribunales de Ciudad de México.</p>

          <h3>14. CONTACTO</h3>
          <p>
            <strong>Plataforma GUIAA</strong><br/>
            Correo electrónico: soporte@guiaa.com<br/>
            Privacidad y datos: privacidad@guiaa.com<br/>
            Legal: legal@guiaa.com
          </p>

          <div style={{ 
            marginTop: "30px", 
            padding: "20px", 
            backgroundColor: "var(--bg-secondary)", 
            borderRadius: "8px",
            border: "2px solid var(--primary-color)"
          }}>
            <h3 style={{ marginTop: 0 }}>CONSENTIMIENTO</h3>
            <p>Al marcar la casilla de aceptación y/o utilizar la Plataforma GUIAA, usted declara que:</p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li>✓ Ha leído y comprendido estos Términos y Condiciones</li>
              <li>✓ Es un veterinario con cédula profesional válida</li>
              <li>✓ Acepta estar legalmente vinculado por estos términos</li>
              <li>✓ Utilizará la Plataforma de manera responsable y ética</li>
              <li>✓ Comprende que es el único responsable de sus decisiones clínicas</li>
              <li>✓ Ha sido informado sobre el tratamiento de sus datos personales</li>
            </ul>
          </div>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "var(--text-secondary)" }}>
            Fecha de última actualización: 28 de diciembre de 2025<br/>
            Versión: 1.0 - 2026<br/>
            © 2026 Plataforma GUIAA. Todos los derechos reservados.
          </p>
        </div>

        <div className="modal-footer" style={{ 
          borderTop: "1px solid var(--border-color)", 
          padding: "15px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px"
        }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {!scrolledToBottom && "↓ Desplázate para leer todos los términos"}
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              className="btn btn-primary" 
              onClick={onAccept}
              disabled={!scrolledToBottom}
              style={{ opacity: scrolledToBottom ? 1 : 0.5 }}
            >
              Acepto los Términos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Register Page
const RegisterPage = ({ setView, setCedulaFlow }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cedula_profesional: "",
    especialidad: "",
    años_experiencia: "",
    institucion: "",
  });
  const [cedulaFile, setCedulaFile] = useState(null);
                const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleAcceptTerms = () => {
    setAcceptedTerms(true);
    setShowTermsModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError(
        "Debes aceptar los términos y la política de privacidad para registrarte.",
      );
      return;
    }
    if (!cedulaFile) {
      setError("Debes subir el documento de tu cédula profesional (PDF/JPG/PNG).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          años_experiencia: parseInt(formData.años_experiencia),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error en el registro");
      }

      const vetData = await response.json();
      // Redirigir a flujo obligatorio de cédula (upload + verificación)
      setCedulaFlow?.({
        source: "register",
        veterinarian_id: vetData?.id,
        email: formData.email,
        cedula_profesional: formData.cedula_profesional,
        expected_nombre: formData.nombre,
        needs_upload: false,
        file: cedulaFile,
      });
      setView("cedula-verification");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Header setView={setView} showAuth={false} />

      <div className="auth-container">
        <div className="auth-card">
          <h2>Registro Profesional</h2>
          <p>Complete sus datos profesionales para acceder a la plataforma</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Dr. Juan Pérez"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="juan.perez@email.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Teléfono *</label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="+52 555 123 4567"
                />
              </div>
              <div className="form-group">
                <label>Cédula Profesional *</label>
                <input
                  type="text"
                  required
                  value={formData.cedula_profesional}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cedula_profesional: e.target.value,
                    })
                  }
                  placeholder="12345678"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Documento de Cédula (PDF/JPG/PNG) *</label>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                required
                onChange={(e) => setCedulaFile(e.target.files?.[0] || null)}
              />
              <small style={{ color: "var(--text-secondary)" }}>
                Sube una foto o PDF legible. Máx. 10MB (configurable en backend).
              </small>
            </div>

            <div className="form-group">
              <label>Especialidad *</label>
              <select
                required
                value={formData.especialidad}
                onChange={(e) =>
                  setFormData({ ...formData, especialidad: e.target.value })
                }
              >
                <option value="">Seleccione una especialidad</option>
                <option value="Pequeñas Especies">Pequeñas Especies</option>
                <option value="Animales de Producción">
                  Animales de Producción
                </option>
                <option value="Equinos">Equinos</option>
                <option value="Animales Exóticos">Animales Exóticos</option>
                <option value="Medicina Preventiva">Medicina Preventiva</option>
                <option value="Patología">Patología</option>
                <option value="Cirugía">Cirugía</option>
                <option value="Medicina Interna">Medicina Interna</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Años de Experiencia *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="50"
                  value={formData.años_experiencia}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      años_experiencia: e.target.value,
                    })
                  }
                  placeholder="5"
                />
              </div>
              <div className="form-group">
                <label>Institución *</label>
                <input
                  type="text"
                  required
                  value={formData.institucion}
                  onChange={(e) =>
                    setFormData({ ...formData, institucion: e.target.value })
                  }
                  placeholder="Hospital Veterinario ABC"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    if (!acceptedTerms && e.target.checked) {
                      setShowTermsModal(true);
                      e.target.checked = false;
                    } else {
                      setAcceptedTerms(e.target.checked);
                    }
                  }}
                  style={{
                    marginRight: "10px",
                    marginTop: "3px",
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
                  He leído y acepto los{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                    style={{ color: "var(--primary-color)", textDecoration: "underline", fontWeight: "500" }}
                  >
                    Términos y Condiciones de Uso
                  </a>{" "}
                  de la Plataforma GUIAA
                  {acceptedTerms && (
                    <span style={{ color: "#4CAF50", marginLeft: "8px" }}>✓</span>
                  )}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="btn btn-primary btn-full"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>

          <div className="auth-footer">
            ¿Ya tienes una cuenta?{" "}
            <button onClick={() => setView("login")} className="link-btn">
              Inicia Sesión
            </button>
          </div>
        </div>
      </div>

      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleAcceptTerms}
      />
    </div>
  );
};

// Login Page
const LoginPage = ({ setView, setCedulaFlow }) => {
  const { login, loginWithEmailPassword, loginWithMagicLink } = useVet();
  const [formData, setFormData] = useState({
    email: "",
    cedula_profesional: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending2FA, setPending2FA] = useState(false);
  const [challengeNonce, setChallengeNonce] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [supaEmail, setSupaEmail] = useState("");
  const [supaPassword, setSupaPassword] = useState("");
  const [supaInfo, setSupaInfo] = useState("");

  const handlePrivacyAccept = () => {
    localStorage.setItem("sv_privacy_accepted", "true");
    setShowPrivacyModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting login to:", `${BACKEND_URL}/api/auth/login`);
      console.log("Form data being sent:", formData);
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => "");
        let errorData = {};
        try {
          errorData = raw ? JSON.parse(raw) : {};
        } catch (e) {}
        const detail =
          errorData?.detail ||
          (raw ? raw.slice(0, 140) : null) ||
          `Error del servidor: ${response.status}`;
        throw new Error(detail);
      }

      const raw = await response.text().catch(() => "");
      let vetData = null;
      try {
        vetData = raw ? JSON.parse(raw) : null;
      } catch (e) {}
      if (!vetData) {
        throw new Error("Respuesta inválida del servidor");
      }

      // Check if 2FA is required
      if (vetData.status === "pending_2fa" && vetData.nonce) {
        setChallengeNonce(vetData.nonce);
        setPending2FA(true);
        setLoading(false);
        return;
      }

      // Gating: requiere flujo de cédula
      if (vetData.status === "requires_cedula_flow") {
        setCedulaFlow?.({
          source: "login",
          veterinarian_id: vetData?.veterinarian_id,
          email: formData.email,
          cedula_profesional: formData.cedula_profesional,
          expected_nombre: "",
          needs_upload: !!vetData?.needs_upload,
          verification_status: vetData?.verification_status,
          message: vetData?.message,
        });
        setView("cedula-verification");
        return;
      }

      login(vetData);
      setView("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!challengeNonce) {
      setError(
        "No se encontró el reto de 2FA. Intenta iniciar sesión de nuevo.",
      );
      return;
    }

    setVerifying2FA(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: challengeNonce, code: twoFactorCode }),
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => "");
        let errorData = {};
        try {
          errorData = raw ? JSON.parse(raw) : {};
        } catch (e) {}
        const detail =
          errorData?.detail ||
          (raw ? raw.slice(0, 140) : null) ||
          `Error del servidor: ${response.status}`;
        throw new Error(detail);
      }

      const raw = await response.text().catch(() => "");
      let vetData = null;
      try {
        vetData = raw ? JSON.parse(raw) : null;
      } catch (e) {}
      if (!vetData) {
        throw new Error("Respuesta inválida del servidor");
      }
      login(vetData);
      setView("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying2FA(false);
      setTwoFactorCode("");
    }
  };

  const resetToLogin = () => {
    setPending2FA(false);
    setChallengeNonce(null);
    setTwoFactorCode("");
    setError("");
  };

  const handleSupabaseLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSupaInfo("");
    if (!supaEmail || !supaPassword) {
      setError("Ingresa email y contraseña");
      return;
    }
    try {
      setLoading(true);
      await loginWithEmailPassword(supaEmail, supaPassword);
      setSupaInfo("Login con Supabase exitoso");
      setView("dashboard");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión con Supabase");
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseMagicLink = async () => {
    setError("");
    setSupaInfo("");
    if (!supaEmail) {
      setError("Ingresa el email para enviar el magic link");
      return;
    }
    try {
      setLoading(true);
      await loginWithMagicLink(supaEmail);
      setSupaInfo("Revisa tu correo: se envió un enlace de acceso.");
    } catch (err) {
      setError(err.message || "Error al enviar magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Header setView={setView} showAuth={false} />

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-branding">
            <img
              src="/GuiaLogo12.png"
              alt="GUIAA"
              className="auth-logo"
            />
            <div className="auth-brand-text">
              <div className="auth-app-name">GUIAA</div>
              <div className="auth-tagline">
                <div>Gran universo de inteligencia animal.</div>
                <div>Soporte a la decisión clínica CDS avanzado grado L4 y L5.</div>
              </div>
            </div>
          </div>
          <h2>Iniciar Sesión</h2>
          <p>Ingresa con tu email y cédula profesional</p>

          {error && <div className="error-message">{error}</div>}

          {!pending2FA ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="tu.email@ejemplo.com"
                />
              </div>

              <div className="form-group">
                <label>Cédula Profesional</label>
                <input
                  type="text"
                  required
                  value={formData.cedula_profesional}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cedula_profesional: e.target.value,
                    })
                  }
                  placeholder="12345678"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-full"
              >
                {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="auth-form">
              <div className="form-group">
                <label>Código de Verificación</label>
                <input
                  type="text"
                  required
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Ingresa el código de 6 dígitos"
                  maxLength={6}
                  autoFocus
                />
                <small>
                  Se ha enviado un código de verificación a tu email
                </small>
              </div>

              <button
                type="submit"
                disabled={verifying2FA}
                className="btn btn-primary btn-full"
              >
                {verifying2FA ? "Verificando..." : "Verificar Código"}
              </button>

              <button
                type="button"
                onClick={resetToLogin}
                className="btn btn-secondary btn-full"
                style={{ marginTop: "10px" }}
              >
                Volver al Login
              </button>
            </form>
          )}

          <div className="auth-footer">
            ¿No tienes una cuenta?{" "}
            <button onClick={() => setView("register")} className="link-btn">
              Regístrate
            </button>
          </div>
        </div>
      </div>
      <PrivacyModal isOpen={showPrivacyModal} onAccept={handlePrivacyAccept} />
    </div>
  );
};

// Cédula Verification Page (bloquea acceso hasta status=verified)
const CedulaVerificationPage = ({ setView, cedulaFlow, setCedulaFlow }) => {
  const { login } = useVet();
  const [nombre, setNombre] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    setError("");
    setInfo("");
    setVerificationStatus(cedulaFlow?.verification_status || "");
    setNombre(cedulaFlow?.expected_nombre || "");
    setFile(cedulaFlow?.file || null);
  }, [cedulaFlow]);

  if (!cedulaFlow?.veterinarian_id) {
    return (
      <div className="auth-page">
        <Header setView={setView} showAuth={false} />
        <div className="auth-container">
          <div className="auth-card">
            <h2>Verificación requerida</h2>
            <p>No hay una sesión de verificación activa. Vuelve a iniciar sesión.</p>
            <button className="btn btn-primary btn-full" onClick={() => setView("login")}>
              Ir a Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const vetId = cedulaFlow.veterinarian_id;
  const email = cedulaFlow.email;
  const cedula_profesional = cedulaFlow.cedula_profesional;
  const needsUpload = !!cedulaFlow.needs_upload;
  const canSkip = cedulaFlow?.can_skip !== false; // Por defecto true si no se especifica
  const skipCount = cedulaFlow?.cedula_skip_count || 0;
  const remainingSkips = 3 - skipCount;

  const handleUploadAndVerify = async () => {
    setError("");
    setInfo("");

    if (!cedula_profesional) {
      setError("Falta la cédula profesional. Regresa al login/registro.");
      return;
    }
    if (!nombre?.trim()) {
      setError("Ingresa tu nombre completo tal como aparece en SEP/DGP.");
      return;
    }
    if (needsUpload && !file) {
      setError("Debes subir el documento de tu cédula (PDF/JPG/PNG).");
      return;
    }

    setLoading(true);
    try {
      // 1) Upload (si hay archivo)
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(`${BACKEND_URL}/api/cedula/upload`, {
          method: "POST",
          headers: { "x-veterinarian-id": vetId },
          body: fd,
        });
        if (!up.ok) {
          const raw = await up.text().catch(() => "");
          throw new Error(raw || "Error subiendo documento");
        }
      }

      // 2) Verify (SEP/DGP)
      const vr = await fetch(`${BACKEND_URL}/api/cedula/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-veterinarian-id": vetId,
        },
        body: JSON.stringify({
          veterinarian_id: vetId,
          cedula_profesional,
          expected_nombre: nombre,
        }),
      });
      if (!vr.ok) {
        const raw = await vr.text().catch(() => "");
        throw new Error(raw || "Error verificando cédula");
      }
      const verifyData = await vr.json().catch(() => ({}));
      const status = verifyData?.verification_status || "";
      setVerificationStatus(status);
      setInfo(verifyData?.message || "Verificación procesada.");

      // 3) Si verified (o queda pending por caída SEP/DGP), reintentar login y entrar
      if (status === "verified" || status === "pending") {
        const resp = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, cedula_profesional }),
        });
        if (!resp.ok) {
          const raw = await resp.text().catch(() => "");
          throw new Error(raw || "Error iniciando sesión tras verificación");
        }
        const vetData = await resp.json();
        if (vetData?.status === "requires_cedula_flow") {
          throw new Error(vetData?.message || "La cédula aún no está verificada.");
        }
        login(vetData);
        setCedulaFlow?.(null);
        setView("dashboard");
      }
    } catch (e) {
      setError(e?.message || "Error en verificación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Header setView={setView} showAuth={false} />
      <div className="auth-container">
        <div className="auth-card">
          <h2>Verificación de Cédula Profesional</h2>
          <p>
            Para continuar, necesitamos validar tu cédula contra el registro público SEP/DGP.
          </p>

          {cedulaFlow?.message && (
            <div className="info-message" style={{ marginBottom: "10px" }}>
              {cedulaFlow.message}
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
          {info && <div className="success-message">{info}</div>}

          <div className="auth-form">
            <div className="form-group">
              <label>Nombre completo (como aparece en SEP/DGP) *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. JUAN PEREZ LOPEZ"
              />
            </div>

            <div className="form-group">
              <label>Documento de cédula (PDF/JPG/PNG){needsUpload ? " *" : ""}</label>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <small style={{ color: "var(--text-secondary)" }}>
                Puedes volver a subir el documento si fue rechazado.
              </small>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleUploadAndVerify}
              disabled={loading}
            >
              {loading ? "Verificando..." : "Subir y verificar"}
            </button>

            {verificationStatus && (
              <div style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                Estado actual: <strong>{verificationStatus}</strong>
              </div>
            )}

            {canSkip && remainingSkips > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-full"
                style={{ marginTop: "10px" }}
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  try {
                    const response = await fetch(`${BACKEND_URL}/api/cedula/skip`, {
                      method: "POST",
                      headers: {
                        "x-veterinarian-id": vetId,
                      },
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({}));
                      throw new Error(errorData.detail || "Error al posponer verificación");
                    }
                    
                    const skipData = await response.json();
                    
                    // Hacer login para entrar al dashboard
                    const resp = await fetch(`${BACKEND_URL}/api/auth/login`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, cedula_profesional }),
                    });
                    
                    if (!resp.ok) {
                      throw new Error("Error iniciando sesión");
                    }
                    
                    const vetData = await resp.json();
                    if (vetData?.status === "requires_cedula_flow") {
                      // Si aún requiere verificación pero ya usó los 3 skips, mostrar error
                      if (skipData.remaining_skips === 0) {
                        setError("Has alcanzado el límite de 3 posposiciones. Debes verificar tu cédula ahora.");
                        setLoading(false);
                        return;
                      }
                      // Actualizar el flow con el nuevo skip count
                      setCedulaFlow({
                        ...cedulaFlow,
                        cedula_skip_count: skipData.cedula_skip_count,
                        can_skip: skipData.remaining_skips > 0,
                      });
                      setInfo(skipData.message);
                      setLoading(false);
                      return;
                    }
                    
                    login(vetData);
                    setCedulaFlow?.(null);
                    setView("dashboard");
                  } catch (e) {
                    setError(e?.message || "Error al posponer verificación");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? "Procesando..." : `Ir al Dashboard y verificar después (${remainingSkips} restantes)`}
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-full"
              style={{ marginTop: "10px" }}
              onClick={() => {
                setCedulaFlow?.(null);
                setView("login");
              }}
            >
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard
const Dashboard = ({ setView, openConsultation }) => {
  const { veterinarian } = useVet();
  const [stats, setStats] = useState({ consultations: 0, thisMonth: 0, lastMonth: 0, today: 0 });
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [buyingConsultations, setBuyingConsultations] = useState(false);
  const notificationPanelRef = useRef(null);
  const notificationToggleRef = useRef(null);

  useEffect(() => {
    if (veterinarian) {
      loadDashboardData();
      loadWeatherData();
      loadNotifications();

      // Check privacy acceptance
      const privacyAccepted = localStorage.getItem("sv_privacy_accepted");
      setShowPrivacyModal(!privacyAccepted);
    }
  }, [veterinarian]);

  const handlePrivacyAccept = () => {
    localStorage.setItem("sv_privacy_accepted", "true");
    setShowPrivacyModal(false);
  };

  // Theme initialization
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sv_theme");
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = stored || (prefersDark ? "dark" : "light");
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("sv_theme", theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  // Close notifications panel on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isNotificationPanelOpen) return;
      if (
        notificationPanelRef.current &&
        notificationToggleRef.current &&
        !notificationPanelRef.current.contains(event.target) &&
        !notificationToggleRef.current.contains(event.target)
      ) {
        setNotificationPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationPanelOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName,
      );
      if (isTyping) return;

      const key = e.key.toLowerCase();
      if (key === "n") setView("new-consultation");
      else if (key === "h") setView("consultation-history");
      else if (
        key === "i" &&
        veterinarian?.membership_type?.toLowerCase() === "premium"
      ) {
        setView("medical-images");
      } else if (key === "m") setView("membership");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setView, veterinarian]);

  const loadDashboardData = async () => {
    try {
      console.log("Loading consultations for veterinarian ID:", veterinarian.id);
      // Cargar desde MongoDB directamente
      const response = await fetch(`${BACKEND_URL}/api/consultations/${veterinarian.id}/history`);
      let consultations = [];
      
      if (response.ok) {
        const data = await response.json();
        consultations = data.consultations || [];
        console.log("Consultations loaded from MongoDB:", consultations);
      } else {
        console.warn("Error loading consultations from MongoDB");
      }
      const now = new Date();

      const thisMonth = consultations.filter((c) => {
        const date = new Date(c.created_at);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }).length;

      const lastMonth = consultations.filter((c) => {
        const date = new Date(c.created_at);
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          date.getMonth() === prevMonth.getMonth() &&
          date.getFullYear() === prevMonth.getFullYear()
        );
      }).length;

      const todayCount = consultations.filter((c) => {
        if (!c.created_at) return false;
        const date = new Date(c.created_at);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }).length;

      setStats({
        consultations: consultations.length,
        thisMonth,
        lastMonth,
        today: todayCount,
      });

      // Series de actividad para los KPIs (últimos 7 días y últimos 6 meses)
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      const weekly = new Array(7).fill(0);
      const monthly = new Array(6).fill(0);

      consultations.forEach((c) => {
        if (!c.created_at) return;
        const date = new Date(c.created_at);
        const dateOnly = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );

        const diffDays = Math.floor(
          (startOfToday.getTime() - dateOnly.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (diffDays >= 0 && diffDays < 7) {
          // 0 = hace 6 días, 6 = hoy
          weekly[6 - diffDays] += 1;
        }

        const monthDiff =
          (now.getFullYear() - date.getFullYear()) * 12 +
          (now.getMonth() - date.getMonth());

        if (monthDiff >= 0 && monthDiff < 6) {
          // 0 = hace 5 meses, 5 = mes actual
          monthly[5 - monthDiff] += 1;
        }
      });

      setWeeklyActivity(weekly);
      setMonthlyActivity(monthly);

      setRecentConsultations(consultations.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setWeeklyActivity(new Array(7).fill(0));
      setMonthlyActivity(new Array(6).fill(0));
    }
    setDashboardLoading(false);
  };

  const loadWeatherData = async () => {
    setWeatherLoading(true);
    try {
      const apiKey = "8149f4e566a3c8e71872e864ad6604ae";
      const lat = 19.4326;
      const lon = -99.1332;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`,
      );

      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      }
    } catch (error) {
      console.error("Error loading weather:", error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadNotifications = () => {
    // Mock notifications
    setNotifications([
      {
        id: "1",
        title: "Consulta pendiente",
        description: "Tienes una consulta esperando revisión",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: "reminder",
        read: false,
      },
      {
        id: "2",
        title: "Membresía activa",
        description: "Tu plan Premium está activo",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        type: "info",
        read: true,
      },
    ]);
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };
  const getMembershipStatus = () => {
    if (!veterinarian || !veterinarian.membership_type) {
      return {
        status: "Sin membresía",
        color: "red",
        consultations: 0,
        maxConsultations: 0,
      };
    }

    const membershipKey = veterinarian.membership_type.toLowerCase();
    const maxConsultations =
      membershipKey === "basic"
        ? 30
        : membershipKey === "professional"
          ? 35
          : membershipKey === "premium"
            ? 150
            : 0;

    const rawRemaining =
      veterinarian.consultations_remaining != null
        ? veterinarian.consultations_remaining
        : maxConsultations;
    const remaining =
      maxConsultations > 0
        ? Math.min(rawRemaining, maxConsultations)
        : rawRemaining || 0;

    const statusLabel =
      membershipKey === "basic"
        ? "Básica"
        : membershipKey === "professional"
          ? "Profesional"
          : membershipKey === "premium"
            ? "Premium"
            : veterinarian.membership_type;

    const color =
      maxConsultations === 0
        ? "red"
        : remaining > maxConsultations * 0.3
          ? "green"
          : remaining > 0
            ? "orange"
            : "red";

    return {
      status: statusLabel,
      color,
      consultations: remaining,
      maxConsultations,
    };
  };

  const membershipStatus = getMembershipStatus();

  const vetName = veterinarian?.nombre || "Doctor/a";
  const membershipType = veterinarian?.membership_type?.toLowerCase();

  const handleBuyConsultations = async (packageId) => {
    if (!veterinarian?.id) return;
    setBuyingConsultations(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/payments/consultations/checkout/session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            veterinarian_id: veterinarian.id,
            package_id: packageId,
            origin_url: window.location.origin,
            quantity: 1,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Error creando sesión de pago");
      }

      const data = await response.json();
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Error:", error);
      alert("Error procesando el pago. Inténtalo de nuevo.");
    } finally {
      setBuyingConsultations(false);
    }
  };
  const currentHour = new Date().getHours();
  const timeOfDay =
    currentHour < 12 ? "morning" : currentHour < 19 ? "afternoon" : "night";

  const todayLabel = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const shiftLabel =
    currentHour < 12
      ? "Turno matutino"
      : currentHour < 19
        ? "Turno vespertino"
        : "Turno nocturno";

  const membershipConsultationsLabel =
    !membershipStatus.maxConsultations ||
    membershipStatus.maxConsultations <= 0
      ? "Sin consultas asignadas"
      : `${membershipStatus.consultations}/${membershipStatus.maxConsultations} consultas restantes`;

  const followUpCases = recentConsultations.filter(
    (c) => c.status === "in_progress",
  );

  const MiniAreaChart = ({ data, id, colorFrom, colorTo, ariaLabel }) => {
    if (!data || data.length === 0) return null;

    const rawMax = Math.max(...data);
    const max = rawMax > 0 ? rawMax : 1;
    const isFlatZero = rawMax === 0;
    const denominator = Math.max(data.length - 1, 1);

    const points = data
      .map((value, index) => {
        const x = (index / denominator) * 100;
        const normalized = isFlatZero ? 0.3 : value / max;
        const y = 90 - normalized * 70;
        return `${x},${y}`;
      })
      .join(" ");

    const areaPoints = `0,100 ${points} 100,100`;

    return (
      <svg
        className="kpi-chart"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorFrom} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colorTo} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <polygon
          className="kpi-chart-area"
          fill={`url(#${id})`}
          points={areaPoints}
        />
        <polyline
          className="kpi-chart-line"
          fill="none"
          stroke={colorFrom}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className={`dashboard-page dashboard-${timeOfDay}`}>
      <Header setView={setView} />

      <div className="container">
        <div className="dashboard-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="hero-welcome">
              <div className="hero-greeting">
                <h1>
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour < 12) return `Buenos días, ${vetName}`;
                    if (hour < 19) return `Buenas tardes, ${vetName}`;
                    return `Buenas noches, ${vetName}`;
                  })()}
                </h1>
                <span className="greeting-icon">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour < 12) return <Sun size={18} />;
                    if (hour < 19) return <CloudSun size={18} />;
                    return <Moon size={18} />;
                  })()}
                </span>
              </div>
              <div className="hero-divider"></div>
              <div className="hero-summary">
                <span className="hero-summary-item">
                  <BarChart3 className="icon" size={16} />
                  {stats.consultations} consultas
                </span>
                <span className="hero-summary-divider">•</span>
                <span className={`hero-badge ${membershipType === 'premium' ? 'premium' : 'basic'}`}>
                  {membershipType === 'premium' ? '⭐ Premium' : '💎 Básico'}
                </span>
                {weatherData && (
                  <>
                    <span className="hero-summary-divider">•</span>
                    <span className="hero-summary-item">
                      <Thermometer className="icon" size={16} /> {Math.round(weatherData.main.temp)}°C
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="hero-actions">
              <button
                ref={notificationToggleRef}
                onClick={() => setNotificationPanelOpen(!isNotificationPanelOpen)}
                className="icon-btn"
              >
                <Bell size={18} />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="notification-badge">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              <button onClick={toggleTheme} className="icon-btn">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {isNotificationPanelOpen && (
            <div ref={notificationPanelRef} className="notification-panel">
              <div className="notification-panel-header">
                <h3>Notificaciones</h3>
              </div>
              {notifications.length === 0 ? (
                <div className="notification-empty">No hay notificaciones</div>
              ) : (
                <div className="notification-panel-body">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`notification-item ${notif.read ? "" : "unread"}`}
                    >
                      <div className="notification-title">{notif.title}</div>
                      <div className="notification-description">{notif.description}</div>
                      <div className="notification-timestamp">
                        {new Date(notif.timestamp).toLocaleString("es-MX")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="today-summary-panel">
          <div className="today-summary-left">
            <div className="today-title">Hoy en tu consulta</div>
            <div className="today-subtitle">
              {todayLabel} · {shiftLabel}
            </div>
          </div>
          <div className="today-summary-metrics">
            <div className="today-pill">
              <span className="pill-label">Consultas hoy</span>
              <span className="pill-value">{stats.today || 0}</span>
            </div>
            <div className="today-pill">
              <span className="pill-label">Este mes</span>
              <span className="pill-value">{stats.thisMonth}</span>
            </div>
            <div className="today-pill">
              <span className="pill-label">Membresía</span>
              <span className="pill-value">
                {membershipStatus.status} · {membershipConsultationsLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {dashboardLoading ? (
            <div className="stats-cards">
              <div className="stat-card"><div className="skeleton skeleton-text" style={{width:'40%'}}></div><div className="skeleton skeleton-text" style={{width:'20%'}}></div><div className="skeleton skeleton-card"></div></div>
              <div className="stat-card"><div className="skeleton skeleton-text" style={{width:'40%'}}></div><div className="skeleton skeleton-text" style={{width:'20%'}}></div><div className="skeleton skeleton-card"></div></div>
              <div className="stat-card"><div className="skeleton skeleton-text" style={{width:'40%'}}></div><div className="skeleton skeleton-text" style={{width:'20%'}}></div><div className="skeleton skeleton-card"></div></div>
            </div>
          ) : (
          <div className="stats-cards">
            <div className="stat-card" data-tooltip="Total de consultas realizadas">
              <div className="stat-icon"><BarChart3 /></div>
              <div className="stat-content">
                <h3>
                  {stats.consultations}
                  {stats.consultations > 0 && (
                    <span className="trend-indicator up">
                      ↑
                    </span>
                  )}
                </h3>
                <p>Consultas Totales</p>
                <MiniAreaChart
                  data={weeklyActivity}
                  id="kpi-weekly-activity"
                  colorFrom="#3b82f6"
                  colorTo="#bfdbfe"
                  ariaLabel="Actividad semanal de consultas"
                />
              </div>
            </div>

            <div className="stat-card" data-tooltip="Consultas de este mes">
              <div className="stat-icon"><CalendarDays /></div>
              <div className="stat-content">
                <h3>
                  {stats.thisMonth}
                  {stats.thisMonth > 0 && (
                    <span className="trend-indicator up">
                      ↑
                    </span>
                  )}
                </h3>
                <p>Este Mes</p>
                <MiniAreaChart
                  data={monthlyActivity}
                  id="kpi-monthly-activity"
                  colorFrom="#22c55e"
                  colorTo="#bbf7d0"
                  ariaLabel="Actividad mensual de consultas"
                />
                <div className={`stat-trend ${stats.thisMonth - stats.lastMonth > 0 ? 'positive' : stats.thisMonth - stats.lastMonth < 0 ? 'negative' : ''}`}>
                  <span className="stat-trend-icon">{stats.thisMonth - stats.lastMonth > 0 ? '▲' : stats.thisMonth - stats.lastMonth < 0 ? '▼' : '•'}</span>
                  <span className="stat-trend-percentage">{Math.abs(stats.thisMonth - stats.lastMonth)} vs mes anterior</span>
                </div>
              </div>
            </div>

            <div className="stat-card" data-tooltip="Tu plan de membresía actual">
              <div className="stat-icon"><Gem /></div>
              <div className="stat-content">
                <h3>{membershipStatus.consultations}</h3>
                <p>Plan: {membershipStatus.status}</p>
                {membershipType !== 'premium' && (
                  <div className="membership-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${Math.min((stats.consultations / 10) * 100, 100)}%` }} 
                      />
                    </div>
                    <span className="progress-text">{stats.consultations}/10 consultas usadas</span>
                  </div>
                )}
                <div className="buy-consultations-label">Recargar consultas</div>
                <div className="buy-consultations-group">
                  <button
                    className="btn btn-primary"
                    disabled={buyingConsultations}
                    onClick={() => handleBuyConsultations("credits_10")}
                  >
                    {buyingConsultations ? "Procesando..." : "10 consultas - $350"}
                  </button>
                </div>
              </div>
            </div>

            {weatherLoading && (
              <div className="stat-card"><div className="skeleton skeleton-card" style={{width:'100%'}}></div></div>
            )}
            {weatherData && !weatherLoading && (
              <div className="stat-card" data-tooltip="Clima actual en tu zona">
                <div className="stat-icon">
                  {weatherData.weather[0].main === 'Clear' ? <Sun /> :
                   weatherData.weather[0].main === 'Clouds' ? <Cloud /> :
                   weatherData.weather[0].main === 'Rain' ? <CloudRain /> : <CloudSun />}
                </div>
                <div className="stat-content">
                  <h3>{Math.round(weatherData.main.temp)}°C</h3>
                  <p>{weatherData.weather[0].description}</p>
                </div>
              </div>
            )}
          </div>
          )}

          <div className="quick-actions">
            <h2>Acciones Rápidas</h2>
            <div className="action-cards">
              <button
                onClick={() => setView("new-consultation")}
                className="action-card"
              >
                <div className="action-icon"><Plus /></div>
                <h3>Nueva Consulta</h3>
                <p>Iniciar análisis especializado</p>
              </button>

              <button
                onClick={() => setView("consultation-history")}
                className="action-card"
              >
                <div className="action-icon"><ClipboardList /></div>
                <h3>Ver Historial</h3>
                <p>Consultas previas y resultados</p>
              </button>

              {membershipType === "premium" && (
                <button
                  onClick={() => setView("medical-images")}
                  className="action-card premium-feature"
                >
                  <div className="action-icon"><FlaskConical /></div>
                  <h3>Interpretar Imágenes</h3>
                  <p>Análisis de laboratorio</p>
                  <span className="premium-badge">PREMIUM</span>
                </button>
              )}

              <button
                onClick={() => setView("membership")}
                className="action-card"
              >
                <div className="action-icon"><Crown /></div>
                <h3>Membresía</h3>
                <p>Actualizar plan o renovar</p>
              </button>
            </div>
          </div>

          <Tabs.Root className="tabs-root" defaultValue="activity">
            <Tabs.List className="tabs-list" aria-label="Secciones del dashboard">
              <Tabs.Trigger className="tabs-trigger" value="activity">Actividad</Tabs.Trigger>
              <Tabs.Trigger className="tabs-trigger" value="shortcuts">Atajos</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content className="tabs-content" value="activity">
              <div className="recent-consultations">
                <div className="section-header">
                  <h2>
                    <span className="section-icon"><ClipboardList size={20} /></span>
                    Consultas Recientes
                  </h2>
                  {recentConsultations.length > 0 && (
                    <button 
                      className="view-all-btn"
                      onClick={() => setView("consultation-history")}
                    >
                      Ver todas →
                    </button>
                  )}
                </div>
                {dashboardLoading ? (
                  <div className="consultation-list">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="consultation-item">
                        <div className="skeleton skeleton-text" style={{width:'30%'}}></div>
                        <div className="skeleton skeleton-text" style={{width:'60%'}}></div>
                      </div>
                    ))}
                  </div>
                ) : recentConsultations.length > 0 ? (
                  <div className="consultation-list">
                    {recentConsultations.map((consultation) => {
                      const speciesIcons = {
                        perro: '🐕', perros: '🐕',
                        gato: '🐈', gatos: '🐈',
                        ave: '🦜', aves: '🦜',
                        tortuga: '🐢', tortugas: '🐢',
                        conejo: '🐰', conejos: '🐰',
                        hamster: '🐭', hamsters: '🐭',
                        huron: '🦡', hurones: '🦡',
                        erizo: '🦔', erizos: '🦔',
                        iguana: '🦎', iguanas: '🦎',
                        cuyo: '🐹', cuyos: '🐹',
                      };
                      const icon = speciesIcons[consultation.category?.toLowerCase()] || speciesIcons[consultation.especie?.toLowerCase()] || '🐾';
                      
                      return (
                        <div 
                          key={consultation.id} 
                          className="consultation-item"
                          onClick={() => {
                            console.log('Opening consultation:', consultation.id);
                            openConsultation && openConsultation(consultation.id);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="consultation-info">
                            <div className="consultation-species-icon">{icon}</div>
                            <div className="consultation-details">
                              <h4>{consultation.nombre_mascota || consultation.especie || 'Paciente'} - {consultation.raza || consultation.category}</h4>
                              <p>{consultation.motivo_consulta || consultation.detalle_paciente?.substring(0, 50) || 'Sin descripción'}</p>
                              <span className="consultation-date">
                                <CalendarDays size={14} style={{marginRight:4}} /> {new Date(consultation.created_at).toLocaleDateString('es-ES', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="consultation-actions">
                            <span className={`status-badge ${consultation.status}`}>
                              {consultation.status === "completed"
                                ? "Completada"
                                : consultation.status === "in_progress"
                                  ? "En Progreso"
                                  : "Borrador"}
                            </span>
                            <button 
                              className="btn-continue"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConsultation && openConsultation(consultation.id);
                              }}
                            >
                              {consultation.status === "draft" ? "Continuar" : "Ver"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon"><ClipboardList size={48} /></div>
                    <h3>Sin consultas aún</h3>
                    <p>Comienza creando tu primera consulta veterinaria</p>
                    <button
                      onClick={() => setView("new-consultation")}
                      className="btn"
                    >
                      Crear Primera Consulta
                    </button>
                  </div>
                )}
                {followUpCases.length > 0 && (
                  <div className="followup-section">
                    <div className="followup-header">
                      <h3>Casos en seguimiento</h3>
                      <span className="followup-count">{followUpCases.length}</span>
                    </div>
                    <div className="followup-list">
                      {followUpCases.map((c) => (
                        <div key={c.id} className="followup-item">
                          <div className="followup-main">
                            <span className="followup-dot" />
                            <div className="followup-text">
                              <div className="followup-line">
                                <strong>{c.especie || "Caso"}</strong>
                                {c.nombre_mascota && (
                                  <span className="followup-patient"> · {c.nombre_mascota}</span>
                                )}
                              </div>
                              <div className="followup-sub">
                                {c.motivo_consulta || "Seguimiento clínico en curso"}
                              </div>
                            </div>
                          </div>
                          <div className="followup-date">
                            {c.created_at &&
                              new Date(c.created_at).toLocaleDateString("es-MX", {
                                day: "2-digit",
                                month: "short",
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content className="tabs-content" value="shortcuts">
              <div className="keyboard-hints">
                <strong>Atajos del Teclado</strong>
                <div><kbd>N</kbd> Nueva Consulta • <kbd>H</kbd> Historial • <kbd>I</kbd> Imágenes (Premium) • <kbd>M</kbd> Membresía</div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
};

// New Consultation Component
const NewConsultation = ({ setView, existingConsultationId }) => {
  const { veterinarian } = useVet();
  const [step, setStep] = useState(1);
  // Estado inicial: solo perros y gatos (membresía básica)
  // El backend agregará más categorías si el usuario tiene membresía premium
  const [categories, setCategories] = useState({
    perros: { id: "perros", name: "Perros", icon: "🐕" },
    gatos: { id: "gatos", name: "Gatos", icon: "🐈" },
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [consultationId, setConsultationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending2FA, setPending2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [challengeNonce, setChallengeNonce] = useState(null);

  // Form data for all steps
  const [formData, setFormData] = useState({
    // Step 1: Complete pet information
    fecha: new Date().toISOString().split("T")[0],
    nombre_mascota: "",
    nombre_dueño: "",
    raza: "",
    mix: "",
    edad: "",
    peso: "",
    condicion_corporal: "3",
    sexo: "",
    estado_reproductivo: "",
    vacunas_vigentes: "",
    vacunas_cual: "",
    desparasitacion_interna: "",
    desparasitacion_interna_cual: "",
    desparasitacion_externa: "",
    desparasitacion_externa_producto: "",
    desparasitacion_externa_fecha: "",
    habitat: "",
    zona_geografica: "",
    alimentacion_seco: "",
    alimentacion_humedo: "",
    alimentacion_casero: "",
    alimentacion_frecuencia: "",
    paseos: "",
    paseos_frecuencia: "",
    baños_estetica: "",
    baños_fecha: "",
    cirugias_previas: "",
    cirugias_cual: "",
    aspecto_pelaje: "",
    aspecto_piel: "",
    aspecto_oidos: "",
    aspecto_ojos: "",
    aspecto_otros: "",

    // Historial reportado
    vomito: "NO",
    vomito_color: "",
    vomito_aspecto: "",
    diarrea: "NO",
    diarrea_color: "",
    diarrea_aspecto: "",
    orina: "NO",
    orina_color: "",
    orina_olor: "",
    secrecion_nasal: "NO",
    secrecion_nasal_color: "",
    secrecion_nasal_aspecto: "",
    secrecion_ocular: "NO",
    secrecion_ocular_color: "",
    dientes: "limpios",
    dientes_otros: "",
    piel_condicion: "normal",
    ultima_comida: "",
    ultima_comida_fecha: "",
    liquidos: "",
    liquidos_cantidad: "",
    actividad_general: "ACTIVO",
    medicamentos: "NO",
    medicamentos_cual: "",

    // Stage 2: Detailed patient information
    detalle_paciente: "",
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [rating, setRating] = useState(null);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);

  const safeReadJson = async (response) => {
    const text = await response.text();
    if (!text) {
      return { data: null, text: "" };
    }
    try {
      return { data: JSON.parse(text), text };
    } catch (e) {
      return { data: null, text };
    }
  };

  useEffect(() => {
    loadCategories();
  }, [veterinarian?.id, veterinarian?.membership_type]);

  // Load existing consultation if ID is provided
  useEffect(() => {
    if (existingConsultationId) {
      loadExistingConsultation(existingConsultationId);
    }
  }, [existingConsultationId]);

  const loadExistingConsultation = async (id) => {
    setLoadingExisting(true);
    setError("");
    console.log('Loading existing consultation:', id);
    try {
      const response = await fetch(`${BACKEND_URL}/api/consultation/${id}`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const { data: consultation, text } = await safeReadJson(response);
        if (!consultation) {
          throw new Error(text || `Respuesta inválida del servidor (${response.status})`);
        }
        
        // Set consultation ID
        setConsultationId(consultation.id);
        setSelectedCategory(consultation.category);
        
        // Populate form data
        setFormData(prev => ({
          ...prev,
          fecha: consultation.fecha || prev.fecha,
          nombre_mascota: consultation.nombre_mascota || "",
          nombre_dueño: consultation.nombre_dueño || "",
          raza: consultation.raza || "",
          mix: consultation.mix || "",
          edad: consultation.edad || "",
          peso: consultation.peso || "",
          condicion_corporal: consultation.condicion_corporal || "3",
          sexo: consultation.sexo || "",
          estado_reproductivo: consultation.estado_reproductivo || "",
          vacunas_vigentes: consultation.vacunas_vigentes || "",
          vacunas_cual: consultation.vacunas_cual || "",
          desparasitacion_interna: consultation.desparasitacion_interna || "",
          desparasitacion_interna_cual: consultation.desparasitacion_interna_cual || "",
          desparasitacion_externa: consultation.desparasitacion_externa || "",
          desparasitacion_externa_producto: consultation.desparasitacion_externa_producto || "",
          desparasitacion_externa_fecha: consultation.desparasitacion_externa_fecha || "",
          habitat: consultation.habitat || "",
          zona_geografica: consultation.zona_geografica || "",
          detalle_paciente: consultation.detalle_paciente || "",
        }));
        
        // Set AI analysis if exists
        if (consultation.analysis || consultation.ai_analysis) {
          setAiAnalysis(consultation.analysis || consultation.ai_analysis);
        }

        if (consultation.rating) {
          setRating(consultation.rating);
          setRatingSaved(true);
        }
        
        // Determine which step to show based on status
        if (consultation.status === "completed" && (consultation.analysis || consultation.ai_analysis)) {
          setStep(3); // Show results
        } else if (consultation.status === "in_progress" || consultation.detalle_paciente) {
          setStep(2); // Show step 2
        } else {
          setStep(2); // Draft - go to step 2 to continue
        }
      } else {
        const { data: errorData, text } = await safeReadJson(response);
        console.error('Error response:', response.status, errorData || text);
        setError(
          errorData?.detail ||
            text ||
            `Error cargando la consulta (${response.status})`
        );
      }
    } catch (error) {
      console.error("Error loading consultation:", error);
      setError("Error cargando la consulta: " + error.message);
    } finally {
      setLoadingExisting(false);
    }
  };

  const loadCategories = async () => {
    // Categorías por defecto como fallback
    // Fallback: solo perros y gatos (seguro para membresía básica)
    const defaultCategories = {
      perros: { id: "perros", name: "Perros", icon: "🐕" },
      gatos: { id: "gatos", name: "Gatos", icon: "🐈" },
    };

    try {
      console.log("Loading categories from:", BACKEND_URL);
      const headers = {};
      if (veterinarian?.id) {
        headers["x-veterinarian-id"] = veterinarian.id;
      }
      const response = await fetch(`${BACKEND_URL}/api/animal-categories`, {
        headers,
      });
      console.log("Categories response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Categories data:", data);
        const normalized = {};

        const rawCategories = data.categories || [];

        if (Array.isArray(rawCategories)) {
          rawCategories.forEach((cat) => {
            if (cat.id) {
              normalized[cat.id] = cat;
            }
          });
        } else {
          Object.entries(rawCategories).forEach(([id, cat]) => {
            if (id) {
              normalized[id] = { id, ...cat };
            }
          });
        }

        // Ya no agregamos categorías extra - el backend filtra según membresía
        setCategories(Object.keys(normalized).length > 0 ? normalized : defaultCategories);
      } else {
        console.log("Using default categories (response not ok)");
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      console.log("Using default categories (error)");
      setCategories(defaultCategories);
    }
  };

  // Función para renderizar el formulario correcto según la categoría
  const renderSpeciesForm = () => {
    if (!selectedCategory) {
      return (
        <div className="form-section">
          <p className="info-message">
            Por favor, selecciona una categoría de animal para continuar.
          </p>
        </div>
      );
    }

    const formProps = {
      formData,
      setFormData,
    };

    switch (selectedCategory) {
      case "perros":
        return <PerrosForm {...formProps} />;
      case "gatos":
        return <GatosForm {...formProps} />;
      case "tortugas":
        return <TortugasForm {...formProps} />;
      case "erizos":
        return <ErizosForm {...formProps} />;
      case "hurones":
        return <HuronesForm {...formProps} />;
      case "iguanas":
        return <IguanasForm {...formProps} />;
      case "hamsters":
        return <HamstersForm {...formProps} />;
      case "patos_pollos":
      case "aves_corral":
        return <PatosPollosForm {...formProps} />;
      case "aves":
      case "aves_ornamentales":
        return <AvesForm {...formProps} />;
      case "conejos":
        return <ConejosForm {...formProps} />;
      case "cuyos":
        return <CuyosForm {...formProps} />;
      default:
        return (
          <div className="form-section">
            <p className="error-message">
              Categoría no reconocida. Por favor, selecciona una categoría
              válida.
            </p>
          </div>
        );
    }
  };

  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Usar el backend en lugar de Supabase directamente
      const response = await fetch(`${BACKEND_URL}/api/consultations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-veterinarian-id": veterinarian.id,
        },
        body: JSON.stringify({
          veterinarian_id: veterinarian.id,
          category: selectedCategory,
          consultation_data: {
          fecha: formData.fecha,
          nombre_mascota: formData.nombre_mascota,
          nombre_dueño: formData.nombre_dueño,
          raza: formData.raza,
          mix: formData.mix,
          edad: formData.edad,
          peso: formData.peso,
          condicion_corporal: formData.condicion_corporal,
          sexo: formData.sexo,
          estado_reproductivo: formData.estado_reproductivo,
          vacunas_vigentes: formData.vacunas_vigentes,
          vacunas_cual: formData.vacunas_cual,
          desparasitacion_interna: formData.desparasitacion_interna,
          desparasitacion_interna_cual: formData.desparasitacion_interna_cual,
          desparasitacion_externa: formData.desparasitacion_externa,
          desparasitacion_externa_producto: formData.desparasitacion_externa_producto,
          desparasitacion_externa_fecha: formData.desparasitacion_externa_fecha,
          habitat: formData.habitat,
          zona_geografica: formData.zona_geografica,
          alimentacion_seco: formData.alimentacion_seco,
          alimentacion_humedo: formData.alimentacion_humedo,
          alimentacion_casero: formData.alimentacion_casero,
          alimentacion_frecuencia: formData.alimentacion_frecuencia,
          paseos: formData.paseos,
          paseos_frecuencia: formData.paseos_frecuencia,
          baños_estetica: formData.baños_estetica,
          baños_fecha: formData.baños_fecha,
          cirugias_previas: formData.cirugias_previas,
          cirugias_cual: formData.cirugias_cual,
          aspecto_pelaje: formData.aspecto_pelaje,
          aspecto_piel: formData.aspecto_piel,
          aspecto_oidos: formData.aspecto_oidos,
          aspecto_ojos: formData.aspecto_ojos,
          aspecto_otros: formData.aspecto_otros,
          vomito: formData.vomito,
          vomito_color: formData.vomito_color,
          vomito_aspecto: formData.vomito_aspecto,
          diarrea: formData.diarrea,
          diarrea_color: formData.diarrea_color,
          diarrea_aspecto: formData.diarrea_aspecto,
          orina: formData.orina,
          orina_color: formData.orina_color,
          orina_olor: formData.orina_olor,
          secrecion_nasal: formData.secrecion_nasal,
          secrecion_nasal_color: formData.secrecion_nasal_color,
          secrecion_nasal_aspecto: formData.secrecion_nasal_aspecto,
          secrecion_ocular: formData.secrecion_ocular,
          secrecion_ocular_color: formData.secrecion_ocular_color,
          dientes: formData.dientes,
          dientes_otros: formData.dientes_otros,
          piel_condicion: formData.piel_condicion,
          ultima_comida: formData.ultima_comida,
          ultima_comida_fecha: formData.ultima_comida_fecha,
          liquidos: formData.liquidos,
          liquidos_cantidad: formData.liquidos_cantidad,
          actividad_general: formData.actividad_general,
          medicamentos: formData.medicamentos,
          medicamentos_cual: formData.medicamentos_cual,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorDetail = errorData.detail || `Error del servidor: ${response.status}`;
        
        // Si se agotaron las consultas de prueba, redirigir directamente a planes
        if (errorDetail === "TRIAL_EXHAUSTED" || errorDetail.includes("consultas gratuitas")) {
          setView("membership");
          return;
        }
        
        throw new Error(errorDetail);
      }

      const data = await response.json();
      setConsultationId(data.id);
      setStep(2);
    } catch (err) {
      setError(err.message || "Error al crear la consulta");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStep2 = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payloadUpdates = {
        category: selectedCategory,
        form_data: formData,
        detalle_paciente: formData.detalle_paciente,
      };
      // Actualizar vía backend (evita errores "Failed to fetch" por Supabase directo)
      const resp = await fetch(`${BACKEND_URL}/api/consultations/${consultationId}/payload`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-veterinarian-id": veterinarian.id,
        },
        body: JSON.stringify(payloadUpdates),
      });
      if (!resp.ok) {
        const raw = await resp.text().catch(() => "");
        throw new Error(raw || `Error actualizando consulta: ${resp.status}`);
      }

      setStep(3);
      // No hay sistema de toast global aquí; usamos el banner de info existente
      setInfo("Observaciones guardadas");
    } catch (err) {
      setError(err?.message || "Error guardando observaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSetRating = async (value) => {
    if (!consultationId || savingRating) return;

    setRating(value);
    setSavingRating(true);
    setRatingSaved(false);
    setError("");

    try {
      const { error } = await supabase
        .from("consultations")
        .update({ rating: value, rated_at: new Date().toISOString() })
        .eq("id", consultationId);
      if (error) throw error;

      setRatingSaved(true);
    } catch (err) {
      setError(err.message);
      setRatingSaved(false);
    } finally {
      setSavingRating(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!consultationId) {
      setError("No hay consulta seleccionada");
      return;
    }

    // Verificar membresía Premium
    const membershipType = veterinarian?.membership_type?.toLowerCase();
    if (membershipType !== "premium") {
      setError(
        `Los análisis avanzados solo están disponibles para miembros Premium. Tu plan actual es: ${membershipType?.charAt(0).toUpperCase() + membershipType?.slice(1) || "Básica"}. Por favor, actualiza tu membresía para acceder a esta función.`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (veterinarian?.id) {
        headers["x-veterinarian-id"] = veterinarian.id;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/consultations/${consultationId}/analyze`,
        {
          method: "POST",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error en análisis");
      }

      const result = await response.json();
      setAiAnalysis(result.analysis);
    } catch (err) {
      setError(err.message || "Error generando análisis");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'Datos', icon: '🐾' },
    { number: 2, label: 'Motivo', icon: '📝' },
    { number: 3, label: 'Diagnóstico', icon: '🔬' }
  ];

  const renderStepper = (currentStep) => (
    <div className="step-indicator">
      <div className="step-progress-line" style={{ width: `${(currentStep - 1) * 50}%` }}></div>
      {steps.map((s) => (
        <div key={s.number} className={`step ${currentStep === s.number ? 'active' : ''} ${currentStep > s.number ? 'completed' : ''}`}>
          <div className="step-icon-wrapper">
            {currentStep > s.number ? <span className="check-icon">✓</span> : s.icon}
          </div>
          <div className="step-label">{s.label}</div>
        </div>
      ))}
    </div>
  );

  if (step === 1) {
    return (
      <div className="consultation-page" style={{ marginTop: "-64px", paddingTop: "20px" }}>
        
        <div className="page-title-header">
          <div className="container">
            <div className="page-title-content">
              <div className="page-title-icon">🩺</div>
              <div className="page-title-text">
                <h1>Nueva Consulta Veterinaria</h1>
                <p>Complete la información del paciente para iniciar el diagnóstico clínico</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {error && <div className="error-message">{error}</div>}

          <div className="consultation-layout">
            <div className="consultation-main">
              <div className="consultation-form-container">
                {renderStepper(1)}

                <form onSubmit={handleSubmitStep1} className="consultation-form">
                  <div className="form-section">
                    <h3>Categoría Animal</h3>
                    <div className="category-grid">
                      {Object.entries(categories).map(([key, category]) => {
                        const categoryIcons = {
                          perros: '🐕',
                          gatos: '🐈',
                          conejos: '🐰',
                          aves: '🦜',
                          hamsters: '🐭',
                          cuyos: '🐹',
                          hurones: '🦡',
                          erizos: '🦔',
                          tortugas: '🐢',
                          iguanas: '🦎',
                          patos_pollos: '🐥',
                        };
                        return (
                          <div
                            key={key}
                            className={`category-card ${selectedCategory === key ? "selected" : ""}`}
                            onClick={() => setSelectedCategory(key)}
                          >
                            <span className="category-icon">{categoryIcons[key] || '🐾'}</span>
                            <h4>{category.name}</h4>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Renderizar el formulario específico según la categoría seleccionada */}
                  {renderSpeciesForm()}

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setView("dashboard")}
                      className="btn-nav btn-nav-prev"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !selectedCategory}
                      className="btn-nav btn-nav-next"
                    >
                      {loading ? "Guardando..." : "Continuar al Paso 2"}
                      {!loading && <span className="btn-icon">→</span>}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <aside className="consultation-sidebar">
              <div className="sidebar-section">
                <div className="sidebar-label">Paciente</div>
                <div className="sidebar-value">
                  {formData.nombre_mascota || "Sin nombre"}
                </div>
              </div>
              
              <div className="sidebar-section">
                <div className="sidebar-label">Especie</div>
                <div className="sidebar-value">
                  {selectedCategory ? categories[selectedCategory]?.name : "Seleccionar"}
                </div>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-label">Progreso (1/3)</div>
                <div className="sidebar-progress-container">
                  <div className="sidebar-progress-bar" style={{ width: '33%' }}></div>
                </div>
              </div>

              <div className="sidebar-section" style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', fontSize: '14px' }}
                  onClick={() => setView("dashboard")}
                >
                  Guardar como Borrador
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="consultation-page" style={{ marginTop: "-64px", paddingTop: "20px" }}>
        
        <div className="page-title-header">
          <div className="container">
            <div className="page-title-content">
              <div className="page-title-icon">📝</div>
              <div className="page-title-text">
                <h1>Motivo de Consulta</h1>
                <p>Describa detalladamente los síntomas y observaciones del paciente</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {error && <div className="error-message">{error}</div>}

          <div className="consultation-form-container">
            {renderStepper(2)}

            <form onSubmit={handleSubmitStep2} className="consultation-form">
              <div className="form-section">
                <h3>Detalle del Paciente</h3>
                <div className="form-group">
                  <label>
                    ANOTA CON EL MAYOR DETALLE LOS DATOS SOBRE EL PACIENTE.
                  </label>
                  <textarea
                    required
                    rows={20}
                    value={formData.detalle_paciente}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        detalle_paciente: e.target.value,
                      })
                    }
                    placeholder="Escriba aquí todos los detalles sobre el paciente, motivo de consulta, síntomas, observaciones clínicas, signos vitales, tratamientos previos, historia clínica, estudios realizados, comportamiento, y cualquier otra información relevante para el diagnóstico..."
                    style={{
                      minHeight: "400px",
                      fontSize: "16px",
                      lineHeight: "1.6",
                      padding: "20px",
                    }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-nav btn-nav-next"
                >
                  {loading ? "Guardando..." : "Continuar al Análisis"}
                  {!loading && <span className="btn-icon">→</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="consultation-page" style={{ marginTop: "-64px", paddingTop: "20px" }}>
        
        <div className="page-title-header">
          <div className="container">
            <div className="page-title-content">
              <div className="page-title-icon">🔬</div>
              <div className="page-title-text">
                <h1>Análisis Diagnóstico</h1>
                <p>Resultados del análisis clínico especializado</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {error && <div className="error-message">{error}</div>}

          <div className="consultation-form-container">
            {renderStepper(3)}

            <div className="diagnosis-results">
              {!aiAnalysis ? (
                <div className="analysis-prompt">
                  <div className="analysis-icon">📋</div>
                  <h3>¿Listo para el análisis clínico?</h3>
                  <p>
                    Nuestro sistema especializado en{" "}
                    {categories[selectedCategory]?.name}{" "}
                    procesará toda la información proporcionada para generar:
                  </p>
                  <ul>
                    <li>Análisis clínico detallado</li>
                    <li>Plan de tratamiento detallado</li>
                    <li>Estudios complementarios recomendados</li>
                    <li>Pronóstico</li>
                    <li>Referencias bibliográficas</li>
                  </ul>

                  {veterinarian?.membership_type?.toLowerCase() === "premium" ? (
                    <button
                      onClick={handleAIAnalysis}
                      disabled={loading}
                      className="btn-generate-diagnosis"
                    >
                      {loading ? "Procesando..." : "Obtener Análisis"}
                      {!loading && <span className="sparkle">✨</span>}
                    </button>
                  ) : (
                    <div className="premium-required-message" style={{
                      padding: "20px",
                      backgroundColor: "#fff3cd",
                      border: "2px solid #ffc107",
                      borderRadius: "8px",
                      marginTop: "20px",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "48px", marginBottom: "10px" }}>⭐</div>
                      <h4 style={{ marginBottom: "10px", color: "#856404" }}>
                        Análisis Avanzado - Solo Premium
                      </h4>
                      <p style={{ marginBottom: "15px", color: "#856404" }}>
                        Los análisis clínicos avanzados con IA solo están disponibles para miembros Premium.
                        Actualiza tu plan para acceder a esta función exclusiva.
                      </p>
                      <button
                        onClick={() => setView("pricing")}
                        className="btn btn-primary"
                        style={{ marginTop: "10px" }}
                      >
                        Ver Planes Premium
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="analysis-result">
                  <h3>Análisis Veterinario Especializado</h3>
                  <div className="analysis-content">
                    <pre className="analysis-text">{aiAnalysis}</pre>
                  </div>

                  <div className="consultation-rating">
                    <div className="consultation-rating-title">Califica la consulta</div>
                    <div className="consultation-rating-paws" aria-label="Calificación">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const value = idx + 1;
                        const selected = (rating || 0) >= value;
                        return (
                          <button
                            key={value}
                            type="button"
                            className={`paw-btn ${selected ? "selected" : ""}`}
                            onClick={() => handleSetRating(value)}
                            disabled={savingRating}
                            aria-label={`Calificar ${value} de 5`}
                          >
                            🐾
                          </button>
                        );
                      })}
                      {ratingSaved && <span className="consultation-rating-saved">Guardado</span>}
                    </div>
                  </div>

                  <div className="analysis-actions">
                    <button
                      onClick={() => setView("consultation-history")}
                      className="btn btn-primary"
                    >
                      Ver en Historial
                    </button>
                    <button
                      onClick={() => {
                        setStep(1);
                        setConsultationId(null);
                        setAiAnalysis(null);
                        setRating(null);
                        setRatingSaved(false);
                        setFormData({
                          fecha: new Date().toISOString().split("T")[0],
                          nombre_mascota: "",
                          nombre_dueño: "",
                          raza: "",
                          mix: "",
                          edad: "",
                          peso: "",
                          condicion_corporal: "3",
                          sexo: "",
                          estado_reproductivo: "",
                          vacunas_vigentes: "",
                          vacunas_cual: "",
                          desparasitacion_interna: "",
                          desparasitacion_interna_cual: "",
                          desparasitacion_externa: "",
                          desparasitacion_externa_producto: "",
                          desparasitacion_externa_fecha: "",
                          habitat: "",
                          zona_geografica: "",
                          alimentacion_seco: "",
                          alimentacion_humedo: "",
                          alimentacion_casero: "",
                          alimentacion_frecuencia: "",
                          paseos: "",
                          paseos_frecuencia: "",
                          baños_estetica: "",
                          baños_fecha: "",
                          cirugias_previas: "",
                          cirugias_cual: "",
                          aspecto_pelaje: "",
                          aspecto_piel: "",
                          aspecto_oidos: "",
                          aspecto_ojos: "",
                          aspecto_otros: "",
                          vomito: "NO",
                          vomito_color: "",
                          vomito_aspecto: "",
                          diarrea: "NO",
                          diarrea_color: "",
                          diarrea_aspecto: "",
                          orina: "NO",
                          orina_color: "",
                          orina_olor: "",
                          secrecion_nasal: "NO",
                          secrecion_nasal_color: "",
                          secrecion_nasal_aspecto: "",
                          secrecion_ocular: "NO",
                          secrecion_ocular_color: "",
                          dientes: "limpios",
                          dientes_otros: "",
                          piel_condicion: "normal",
                          ultima_comida: "",
                          ultima_comida_fecha: "",
                          liquidos: "",
                          liquidos_cantidad: "",
                          actividad_general: "ACTIVO",
                          medicamentos: "NO",
                          medicamentos_cual: "",
                          detalle_paciente: "",
                        });
                        setSelectedCategory("");
                      }}
                      className="btn btn-secondary"
                    >
                      Nueva Consulta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

// Consultation History
const ConsultationHistory = ({ setView, openConsultation }) => {
  const { veterinarian } = useVet();
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadConsultations();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredConsultations(consultations);
      setSearching(false);
      return;
    }

    setSearching(true);
    const filtered = consultations.filter((consultation) => {
      const formData = consultation.form_data || {};
      const consultationNumber =
        consultation.consultation_number ||
        (consultation.id
          ? `CONS-${consultation.id.slice(0, 8).toUpperCase()}`
          : "");
      const candidateValues = [
        consultationNumber,
        consultation.id,
        formData.nombre_mascota,
        consultation.nombre_mascota,
        formData.nombre_dueño,
        formData.nombre_dueno,
        consultation.nombre_dueño,
        consultation.nombre_dueno,
        formData.raza,
        consultation.raza,
        consultation.category,
        consultation.especie,
        formData.sintomas,
        consultation.sintomas,
        consultation.detalle_paciente,
        formData.motivo_consulta,
        consultation.motivo_consulta,
      ];
      return candidateValues
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(query));
    });
    setFilteredConsultations(filtered);
    setSearching(false);
  }, [searchQuery, consultations]);

  const loadConsultations = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/consultations/${veterinarian.id}/history`,
      );
      if (response.ok) {
        const data = await response.json();
        setConsultations(data.consultations || []);
        setFilteredConsultations(data.consultations || []);
      }
    } catch (error) {
      console.error("Error loading consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewConsultation = async (consultationId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/consultation/${consultationId}`,
      );
      if (response.ok) {
        const consultation = await response.json();
        setSelectedConsultation(consultation);
      }
    } catch (error) {
      console.error("Error loading consultation details:", error);
    }
  };

  if (selectedConsultation) {
    // Extraer datos del form_data para facilitar acceso
    const formData = selectedConsultation.form_data || {};
    const speciesIcons = {
      perro: '🐕', perros: '🐕',
      gato: '🐈', gatos: '🐈',
      ave: '🦜', aves: '🦜',
      tortuga: '🐢', tortugas: '🐢',
      conejo: '🐰', conejos: '🐰',
      hamster: '🐭', hamsters: '🐭',
      huron: '🦡', hurones: '🦡',
      erizo: '🦔', erizos: '🦔',
      iguana: '🦎', iguanas: '🦎',
      cuyo: '🐹', cuyos: '🐹',
    };
    const speciesIcon = speciesIcons[selectedConsultation.category?.toLowerCase()] || '🐾';
    const statusClass = selectedConsultation.status || 'draft';
    const statusLabel = statusClass === 'completed' ? 'Completada' : statusClass === 'in_progress' ? 'En Progreso' : 'Borrador';
    const ratingValue = selectedConsultation.rating || 0;

    return (
      <div className="consultation-detail-page">
        <Header setView={setView} />

        <div className="container">
          {/* Header tipo ficha clínica */}
          <div className="clinical-file-header">
            <div className="clinical-file-top">
              <button
                onClick={() => setSelectedConsultation(null)}
                className="back-btn-clinical"
              >
                <span>←</span> Volver al Historial
              </button>
              <div className="clinical-file-id">
                {selectedConsultation.id ? `CONS-${selectedConsultation.id.slice(0, 8).toUpperCase()}` : "N/A"}
              </div>
            </div>
            
            <div className="clinical-file-main">
              <div className="clinical-file-patient">
                <div className="clinical-file-avatar">
                  {speciesIcon}
                </div>
                <div className="clinical-file-info">
                  <h1>{formData.nombre_mascota || 'Paciente'}</h1>
                  <div className="clinical-file-meta">
                    <span className="meta-pill species">{selectedConsultation.category || 'Especie'}</span>
                    <span className="meta-pill breed">{formData.raza || 'Raza'}</span>
                    {formData.edad && <span className="meta-pill age">{formData.edad}</span>}
                    {formData.peso && <span className="meta-pill weight">{formData.peso}</span>}
                  </div>
                </div>
              </div>
              <div className="clinical-file-status">
                <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
                <div className="clinical-rating" aria-label="Calificación">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`paw-static ${idx < ratingValue ? "filled" : ""}`}
                    >
                      🐾
                    </span>
                  ))}
                </div>
                <span className="clinical-file-date">
                  {new Date(selectedConsultation.created_at).toLocaleDateString("es-MX", {
                    weekday: 'short',
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Contenido de la ficha */}
          <div className="clinical-file-content">
            {/* Datos del paciente */}
            <div className="clinical-section">
              <div className="clinical-section-header">
                <span className="clinical-section-icon">🩺</span>
                <h2>Datos Clínicos</h2>
              </div>
              <div className="clinical-data-grid">
                <div className="clinical-data-card">
                  <span className="data-label">Propietario</span>
                  <span className="data-value">{formData.nombre_dueño || formData.nombre_dueno || '—'}</span>
                </div>
                <div className="clinical-data-card">
                  <span className="data-label">Sexo</span>
                  <span className="data-value">{formData.sexo || '—'}</span>
                </div>
                <div className="clinical-data-card">
                  <span className="data-label">Estado Reproductivo</span>
                  <span className="data-value">{formData.estado_reproductivo || '—'}</span>
                </div>
                <div className="clinical-data-card">
                  <span className="data-label">Condición Corporal</span>
                  <span className="data-value">{formData.condicion_corporal || '—'}</span>
                </div>
                <div className="clinical-data-card">
                  <span className="data-label">Vacunas</span>
                  <span className="data-value">{formData.vacunas_vigentes || '—'}</span>
                </div>
                <div className="clinical-data-card">
                  <span className="data-label">Síntomas</span>
                  <span className="data-value">{formData.sintomas || '—'}</span>
                </div>
              </div>
            </div>

            {/* Motivo de consulta */}
            <div className="clinical-section">
              <div className="clinical-section-header">
                <span className="clinical-section-icon">📝</span>
                <h2>Motivo de Consulta</h2>
              </div>
              <div className="clinical-text-block">
                {selectedConsultation.detalle_paciente || 'Sin información adicional'}
              </div>
            </div>

            {/* Análisis */}
            {selectedConsultation.analysis && (
              <div className="clinical-section analysis">
                <div className="clinical-section-header">
                  <span className="clinical-section-icon">🧠</span>
                  <h2>Análisis Clínico</h2>
                </div>
                <div className="clinical-analysis-content">
                  <pre className="clinical-analysis-text">
                    {String(selectedConsultation.analysis || "").replace(
                      /AN[ÁA]LISIS\s+CL[ÍI]NICO\s+IA/gi,
                      "ANÁLISIS CLÍNICO",
                    )}
                  </pre>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="clinical-actions">
              <button 
                onClick={() => setSelectedConsultation(null)}
                className="btn btn-secondary"
              >
                Cerrar Ficha
              </button>
              {selectedConsultation.status !== 'completed' && openConsultation && (
                <button 
                  onClick={() => openConsultation(selectedConsultation.id)}
                  className="btn btn-primary"
                >
                  Continuar Consulta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <Header setView={setView} />

      <div className="container">
        <div className="page-header">
          <h1>Historial de Consultas</h1>
          <p>Todas tus consultas veterinarias realizadas</p>
        </div>

        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por ID (CONS-0001), nombre de mascota, propietario o raza..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setView("new-consultation")}
            className="btn btn-primary"
          >
            Nueva Consulta
          </button>
        </div>

        {searching && <div className="searching-indicator">Buscando...</div>}

        {loading ? (
          <div className="loading-state">Cargando historial...</div>
        ) : filteredConsultations.length > 0 ? (
          <div className="history-grid">
            {filteredConsultations.map((consultation) => {
              const speciesIcons = {
                perro: "🐕",
                perros: "🐕",
                gato: "🐈",
                gatos: "🐈",
                ave: "🦜",
                aves: "🦜",
                tortuga: "🐢",
                tortugas: "🐢",
                conejo: "🐰",
                conejos: "🐰",
                hamster: "🐭",
                hamsters: "🐭",
                huron: "🦡",
                hurones: "🦡",
                erizo: "🦔",
                erizos: "🦔",
                iguana: "🦎",
                iguanas: "🦎",
                cuyo: "🐹",
                cuyos: "🐹",
              };

              const formData = consultation.form_data || {};
              const category = consultation.category || consultation.especie || "";
              const icon = speciesIcons[category?.toLowerCase?.() || ""] || "🐾";

              const consultationNumber =
                consultation.consultation_number ||
                (consultation.id
                  ? `CONS-${consultation.id.slice(0, 8).toUpperCase()}`
                  : null);
              const patientName =
                formData.nombre_mascota || consultation.nombre_mascota || "Sin nombre";
              const ownerName =
                formData.nombre_dueño ||
                formData.nombre_dueno ||
                consultation.nombre_dueño ||
                consultation.nombre_dueno ||
                "No especificado";
              const breed = formData.raza || consultation.raza || "";
              const age = formData.edad || consultation.edad || "";
              const ratingValue = consultation.rating || 0;
              const sex = formData.sexo || consultation.sexo || "";
              const weight = formData.peso || consultation.peso || "";
              const reproductiveStatus =
                formData.estado_reproductivo ||
                consultation.estado_reproductivo ||
                "";
              const bodyCondition =
                formData.condicion_corporal || consultation.condicion_corporal || "";
              const diet =
                formData.alimentacion ||
                formData.dieta ||
                consultation.alimentacion ||
                consultation.dieta ||
                "";
              const vaccines =
                formData.vacunas_vigentes || consultation.vacunas_vigentes || "";
              const symptoms =
                formData.sintomas || consultation.sintomas || consultation.motivo_consulta;
              const medicalImages = consultation.medical_images || [];

              const status = consultation.status || "completed";
              const statusLabel =
                status === "completed"
                  ? "Completada"
                  : status === "in_progress"
                  ? "En Progreso"
                  : status === "draft"
                  ? "Borrador"
                  : "Registrada";

              return (
                <div key={consultation.id} className="history-card">
                  {/* Header con gradiente */}
                  <div className={`history-card-header ${status}`}>
                    <div className="history-card-top">
                      <span className="history-card-id">
                        {consultationNumber || "ID-N/A"}
                      </span>
                      <span className="history-rating" aria-label="Calificación">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`paw-static ${idx < ratingValue ? "filled" : ""}`}
                          >
                            🐾
                          </span>
                        ))}
                      </span>
                      <span className={`history-status-badge ${status}`}>
                        {status === 'completed' && '✓ '}{statusLabel}
                      </span>
                    </div>
                    <div className="history-card-patient">
                      <div className="history-avatar">{icon}</div>
                      <div className="history-patient-info">
                        <h3>{patientName}</h3>
                        <div className="history-patient-meta">
                          <span className="history-meta-item">
                            <strong>{category || 'Especie'}</strong>
                          </span>
                          {breed && (
                            <span className="history-meta-item">{breed}</span>
                          )}
                          {age && (
                            <span className="history-meta-item">{age}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="history-card-body">
                    <div className="history-info-grid">
                      <div className="history-info-item">
                        <span className="history-info-icon">👤</span>
                        <div className="history-info-content">
                          <span className="history-info-label">Propietario</span>
                          <span className="history-info-value">{ownerName}</span>
                        </div>
                      </div>
                      <div className="history-info-item">
                        <span className="history-info-icon">📅</span>
                        <div className="history-info-content">
                          <span className="history-info-label">Fecha</span>
                          <span className="history-info-value">
                            {new Date(consultation.created_at || formData.fecha || consultation.fecha).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {(sex || weight || reproductiveStatus || bodyCondition || diet || vaccines) && (
                      <div className="history-data-pills">
                        {sex && (
                          <span className="history-pill">
                            <strong>Sexo:</strong> {sex}
                          </span>
                        )}
                        {weight && (
                          <span className="history-pill">
                            <strong>Peso:</strong> {weight}
                          </span>
                        )}
                        {reproductiveStatus && (
                          <span className="history-pill">
                            <strong>Estado Reproductivo:</strong> {reproductiveStatus}
                          </span>
                        )}
                        {bodyCondition && (
                          <span className="history-pill">
                            <strong>Condición:</strong> {bodyCondition}
                          </span>
                        )}
                        {diet && (
                          <span className="history-pill">
                            <strong>Dieta:</strong> {diet}
                          </span>
                        )}
                        {vaccines && (
                          <span className="history-pill">
                            <strong>Vacunas:</strong> {vaccines}
                          </span>
                        )}
                      </div>
                    )}
                    {consultation.detalle_paciente && (
                      <div className="history-motivo">
                        <span className="history-motivo-label">📝 Motivo de consulta</span>
                        <p className="history-motivo-text">{consultation.detalle_paciente}</p>
                      </div>
                    )}
                    {(symptoms || consultation.analysis) && (
                      <div className="history-extra">
                        {symptoms && (
                          <div className="history-extra-card">
                            <span className="history-extra-label">Síntomas reportados</span>
                            <p>{symptoms}</p>
                          </div>
                        )}
                        {consultation.analysis && (
                          <div className="history-extra-card highlight">
                            <span className="history-extra-label">Análisis clínico</span>
                            <p>
                              {(() => {
                                const txt = String(consultation.analysis || "");
                                // Quitar encabezados tipo "ANÁLISIS CLÍNICO IA" dentro del texto
                                const cleaned = txt.replace(/AN[ÁA]LISIS\\s+CL[ÍI]NICO\\s+IA/gi, "ANÁLISIS CLÍNICO");
                                return cleaned.length > 220 ? `${cleaned.slice(0, 220)}…` : cleaned;
                              })()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {medicalImages.length > 0 && (
                      <div className="history-attachment-pill">
                        📷 {medicalImages.length} interpretación
                        {medicalImages.length > 1 ? "es" : ""} asociad
                        {medicalImages.length > 1 ? "as" : "a"}
                      </div>
                    )}
                  </div>

                  {/* Footer con acciones */}
                  <div className="history-card-footer">
                    <button
                      onClick={() => handleViewConsultation(consultation.id)}
                      className="history-view-btn"
                    >
                      <span>Ver Ficha Clínica</span>
                      <span className="btn-arrow">→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>
              {searchQuery
                ? "No se encontraron consultas"
                : "No hay consultas aún"}
            </h3>
            <p>
              {searchQuery
                ? "Intenta con otro término de búsqueda"
                : "Comienza creando tu primera consulta veterinaria"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setView("new-consultation")}
                className="btn btn-primary"
              >
                Crear Primera Consulta
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Medical Image Interpretation Component (Premium Only)
const MedicalImageInterpretation = ({ setView }) => {
  const { veterinarian } = useVet();
  const [imageType, setImageType] = useState("blood_test");
  const [patientName, setPatientName] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [consultationId, setConsultationId] = useState("");
  const [pastedStudyData, setPastedStudyData] = useState("");  // Datos de estudio pegados
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const typeMeta = {
    blood_test: {
      label: "Análisis de Sangre",
      icon: "🩸",
      hint: "Especifica tipo de estudio (hemograma, bioquímica, etc.) y valores relevantes.",
    },
    urinalysis: {
      label: "Urianálisis",
      icon: "🧪",
      hint: "Indica método de recolección y hallazgos previos en tira reactiva o sedimento.",
    },
  };

  const imageMeta = typeMeta[imageType] || typeMeta.blood_test;

  useEffect(() => {
    if (veterinarian.membership_type?.toLowerCase() !== "premium") {
      setError("Esta función es exclusiva para miembros Premium");
    } else {
      console.log("useEffect: Cargando historial para veterinario:", veterinarian.id);
      loadHistory();
    }
  }, [veterinarian]);

  const loadHistory = async () => {
    try {
      console.log("Cargando historial para veterinario:", veterinarian.id);
      const rows = await listMedicalImagesSupabase(veterinarian.id, 50);
      console.log("Historial cargado:", rows);
      console.log("Número de registros:", rows?.length || 0);
      setHistory(rows || []);
    } catch (error) {
      console.error("Error loading history:", error);
      setHistory([]); // Asegurar que history sea un array vacío en caso de error
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      const maxSizeLabel = '10MB';
      
      if (file.size > maxSize) {
        setError(`El archivo es demasiado grande. Máximo ${maxSizeLabel}.`);
        return;
      }

      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pastedStudyData || !pastedStudyData.trim()) {
      setError("Por favor pega los datos del estudio");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const requestData = {
        veterinarian_id: veterinarian.id,
        image_base64: null,  // Enviar explícitamente como null (campo opcional en backend)
        image_type: imageType,
        patient_name: patientName || null,
        consultation_id: consultationId || null,
        additional_context: additionalContext || null,
        pasted_study_data: pastedStudyData || null,  // Datos de estudio pegados
      };

      const response = await fetch(
        `${BACKEND_URL}/api/medical-images/interpret`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        let errorMessage = `Error del servidor: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log("Error data recibido:", errorData);
          
          // Extraer el mensaje de error de diferentes formatos posibles
          if (errorData) {
            if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (typeof errorData === 'object') {
              // Intentar diferentes campos comunes para mensajes de error
              errorMessage = errorData.detail || 
                           errorData.message || 
                           errorData.error || 
                           (errorData.error?.message) ||
                           JSON.stringify(errorData);
            }
          }
        } catch (parseError) {
          console.log("Error al parsear respuesta de error:", parseError);
          // Si no se puede parsear como JSON, usar el texto de la respuesta
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            console.log("Error al obtener texto de respuesta:", textError);
            // Si todo falla, usar el mensaje por defecto
          }
        }
        // Asegurar que errorMessage sea siempre un string
        const finalErrorMessage = typeof errorMessage === 'string' 
          ? errorMessage 
          : JSON.stringify(errorMessage);
        throw new Error(finalErrorMessage);
      }

      const data = await response.json();
      console.log("Resultado recibido del backend:", data);
      console.log("Campo 'analysis' presente:", !!data.analysis);
      console.log("Longitud de 'analysis':", data.analysis ? data.analysis.length : 0);
      setResult(data);
      // Recargar historial después de crear un nuevo análisis
      await loadHistory();

      // Clear form
      setPastedStudyData("");
      setPatientName("");
      setAdditionalContext("");
      setConsultationId("");
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      // Asegurar que el error siempre sea un string
      let errorMessage = "Error al procesar el estudio";
      
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        // Si es un objeto, intentar extraer el mensaje
        errorMessage = err.message || err.detail || err.error || JSON.stringify(err);
      }
      
      // Asegurar que sea string y no esté vacío
      errorMessage = String(errorMessage || "Error desconocido");
      setError(errorMessage);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (veterinarian.membership_type?.toLowerCase() !== "premium") {
    return (
      <div className="medical-images-page">
        <Header setView={setView} />
        <div className="container">
          <div className="premium-required">
            <div className="premium-icon">🔒</div>
            <h2>Función Premium Requerida</h2>
            <p>
              La interpretación de pruebas de laboratorio está disponible
              exclusivamente para miembros Premium.
            </p>
            <button
              onClick={() => setView("membership")}
              className="btn btn-primary"
            >
              Ver Planes Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-images-page">
      <Header setView={setView} />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>🔬 Pruebas de Laboratorio</h1>
            <p>
              Interpretación de análisis de sangre y estudios clínicos
            </p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-secondary"
          >
            {showHistory ? "Nueva Interpretación" : "Ver Historial"}
          </button>
        </div>

        {!showHistory ? (
          <div className="image-interpretation-layout">
            <div className="image-interpretation-form">
              <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Tipo de Estudio</h3>
                <div className="image-type-selector">
                  <label
                    className={`type-option ${imageType === "blood_test" ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      value="blood_test"
                      checked={imageType === "blood_test"}
                      onChange={(e) => setImageType(e.target.value)}
                    />
                    <div className="type-content">
                      <div className="type-icon">🩸</div>
                      <span>Análisis de Sangre</span>
                    </div>
                  </label>
                  <label
                    className={`type-option ${imageType === "urinalysis" ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      value="urinalysis"
                      checked={imageType === "urinalysis"}
                      onChange={(e) => setImageType(e.target.value)}
                    />
                    <div className="type-content">
                      <div className="type-icon">🧪</div>
                      <span>Urianálisis</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Cargar Estudio</h3>
                
                {/* Área para pegar datos del estudio */}
                <div className="form-group">
                  <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    📋 Copia y pega los datos de tu estudio
                  </label>
                  <textarea
                    value={pastedStudyData}
                    onChange={(e) => setPastedStudyData(e.target.value)}
                    placeholder={`Pega aquí los resultados del análisis, por ejemplo:

BIOMETRÍA HEMÁTICA
Eritrocitos: 6.5 x10^6/µL (Ref: 5.5-8.5)
Hemoglobina: 14.2 g/dL (Ref: 12-18)
Leucocitos: 12,500/µL (Ref: 6,000-17,000)

QUÍMICA SANGUÍNEA
Glucosa: 95 mg/dL (Ref: 74-143)
BUN: 18 mg/dL (Ref: 7-27)
Creatinina: 1.2 mg/dL (Ref: 0.5-1.8)
...`}
                    rows="6"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '2px dashed var(--border-color)',
                      borderRadius: '8px',
                      lineHeight: '1.5',
                    }}
                  />
                  <small style={{
                    color: 'var(--text-secondary)', 
                    display: 'block', 
                    marginTop: '8px'
                  }}>
                    💡 Copia los resultados del laboratorio y pégalos aquí para su análisis.
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre del Paciente (Opcional)</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Ej: Max, Luna, Rocky"
                  />
                </div>

                <div className="form-group">
                  <label>ID de Consulta Previa (Opcional)</label>
                  <input
                    type="text"
                    value={consultationId}
                    onChange={(e) => setConsultationId(e.target.value)}
                    placeholder="Para incluir historial del paciente"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contexto Adicional (Opcional)</label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Información adicional relevante para la interpretación..."
                  rows="4"
                />
              </div>

              {error && (
                <div className="error-message">
                  {typeof error === 'string' 
                    ? error 
                    : typeof error === 'object' && error !== null
                      ? (error.message || error.detail || JSON.stringify(error))
                      : String(error || 'Error desconocido')}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setView("dashboard")}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !pastedStudyData || !pastedStudyData.trim()}
                  className="btn btn-primary"
                >
                  {loading ? "Analizando..." : "Interpretar Estudio"}
                </button>
              </div>
            </form>

            {result && (
              <div className="interpretation-result">
                <h2>Resultado de la Interpretación</h2>

                <div className="result-section">
                  <h3>🔍 Hallazgos Principales</h3>
                  <div className="result-content">
                    {result.findings && Array.isArray(result.findings) && result.findings.length > 0
                      ? result.findings.map((finding, idx) => <div key={idx}>• {finding}</div>)
                      : result.findings && !Array.isArray(result.findings)
                        ? result.findings
                        : result.analysis
                          ? <div style={{color: '#64748b', fontStyle: 'italic'}}>Ver análisis detallado abajo para hallazgos completos</div>
                          : <div style={{color: '#64748b', fontStyle: 'italic'}}>No hay hallazgos disponibles</div>}
                  </div>
                </div>

                <div className="result-section">
                  <h3>💊 Recomendaciones</h3>
                  <div className="result-content">
                    {result.recommendations && Array.isArray(result.recommendations) && result.recommendations.length > 0
                      ? result.recommendations.map((rec, idx) => <div key={idx}>• {rec}</div>)
                      : result.recommendations && !Array.isArray(result.recommendations)
                        ? result.recommendations
                        : result.analysis
                          ? <div style={{color: '#64748b', fontStyle: 'italic'}}>Ver análisis detallado abajo para recomendaciones completas</div>
                          : <div style={{color: '#64748b', fontStyle: 'italic'}}>No hay recomendaciones disponibles</div>}
                  </div>
                </div>

                <div className="result-section detailed">
                  <h3>📊 Análisis Detallado</h3>
                  <div className="result-content detailed-analysis" style={{whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "600px", overflowY: "auto", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0"}}>
                    {result.analysis ? (
                      <pre style={{margin: 0, fontFamily: "inherit", fontSize: "14px", lineHeight: "1.6", color: "#1e293b"}}>{result.analysis}</pre>
                    ) : result.detailed_analysis ? (
                      <pre style={{margin: 0, fontFamily: "inherit", fontSize: "14px", lineHeight: "1.6", color: "#1e293b"}}>{result.detailed_analysis}</pre>
                    ) : (
                      <div style={{color: "#64748b", fontStyle: "italic"}}>No hay análisis disponible</div>
                    )}
                  </div>
                </div>

                <div className="result-actions">
                  <button
                    onClick={() => setResult(null)}
                    className="btn btn-secondary"
                  >
                    Nueva Interpretación
                  </button>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="btn btn-primary"
                  >
                    Ver Historial
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="image-side-panel">
            <div className="side-panel-header">
              <span className="side-panel-pill">Panel clínico</span>
              <h3>Resumen del estudio</h3>
              <p>
                Verifica que la información clave del caso esté completa antes de
                enviar el estudio a interpretación.
              </p>
            </div>

            <div className="side-panel-section">
              <div className="side-panel-label">Tipo de estudio</div>
              <div className="side-panel-main">
                <span className="side-panel-icon">{imageMeta.icon}</span>
                <span className="side-panel-text">{imageMeta.label}</span>
              </div>
              <p className="side-panel-hint">{imageMeta.hint}</p>
            </div>

            <div className="side-panel-section">
              <div className="side-panel-label">Paciente</div>
              <div className="side-panel-chip">
                {patientName || "Sin nombre asignado"}
              </div>
              {consultationId && (
                <div className="side-panel-sub">
                  Consulta asociada: <span>#{consultationId}</span>
                </div>
              )}
            </div>

            <div className="side-panel-section">
              <div className="side-panel-label">Estado</div>
              <div
                className={`side-panel-status ${loading ? "loading" : result ? "done" : "idle"}`}
              >
                {loading
                  ? "Analizando imagen..."
                  : result
                    ? "Resultado disponible"
                    : "Listo para enviar"}
              </div>
            </div>
          </aside>
        </div>
        ) : (
          <div className="interpretation-history">
            <h2>Historial de Interpretaciones</h2>
            {history.length > 0 ? (
              <div className="history-grid">
                {history.map((item) => (
                  <div key={item.id} className="history-card">
                    <div className="history-header">
                      <div className="history-type">
                        {item.image_type === "blood_test" &&
                          "🩸 Análisis de Sangre"}
                        {item.image_type === "urinalysis" && "🧪 Urianálisis"}
                        {item.image_type === "xray" && "📷 Imagen médica"}
                      </div>
                      <div className="history-date">
                        {new Date(item.created_at).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    {item.patient_name && (
                      <div className="history-patient">
                        <strong>Paciente:</strong> {item.patient_name}
                      </div>
                    )}
                    <div className="history-preview">
                      {item.analysis
                        ? item.analysis.substring(0, 150) + "..."
                        : item.findings && Array.isArray(item.findings)
                          ? item.findings.join(", ").substring(0, 150) + "..."
                          : item.findings
                            ? String(item.findings).substring(0, 150) + "..."
                            : item.detailed_analysis
                              ? item.detailed_analysis.substring(0, 150) + "..."
                              : "Sin análisis disponible"}
                    </div>
                    <button
                      onClick={() => {
                        setResult(item);
                        setShowHistory(false);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Ver Completo
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔬</div>
                <h3>No hay interpretaciones aún</h3>
                <p>Comienza pegando los datos de tu primer estudio</p>
                <button
                  onClick={() => setShowHistory(false)}
                  className="btn btn-primary"
                >
                  Nueva Interpretación
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Membership Page
const MembershipPage = ({ setView }) => {
  const { veterinarian, refreshProfile } = useVet();
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly"); // 'monthly' or 'annual'
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (!veterinarian) {
      setView("login");
    } else {
      // Refrescar perfil al cargar la página de membresía para tener datos actualizados
      refreshProfile();
    }
  }, [veterinarian, setView, refreshProfile]);

  // No renderizar nada si no está autenticado (evita flash de contenido)
  if (!veterinarian) {
    return null;
  }

  const defaultPackages = {
    basic: {
      name: "Básico",
      price_monthly: 950,
      price_annual: 950 * 10, // 2 meses de cortesía aprox.
      consultations: 30,
    },
    professional: {
      name: "Profesional",
      price_monthly: 1250,
      price_annual: 1250 * 10,
      consultations: 35,
    },
    premium: {
      name: "Premium",
      price_monthly: 2200,
      price_annual: 2200 * 10,
      consultations: 150,
    },
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/membership/packages`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.packages && Object.keys(data.packages).length > 0) {
          setPackages(data.packages);
        } else {
          setPackages(defaultPackages);
        }
      } else {
        setPackages(defaultPackages);
      }
    } catch (error) {
      console.error("Error loading packages:", error);
      setPackages(defaultPackages);
    }
  };

  const handlePurchase = async (packageId) => {
    // Validar que el usuario esté autenticado antes de intentar comprar
    if (!veterinarian || !veterinarian.id) {
      alert("Debes estar registrado e iniciar sesión para contratar una membresía");
      setView("login");
      return;
    }

    setLoading(true);

    try {
      console.log("Iniciando checkout para paquete:", packageId);
      const response = await fetch(
        `${BACKEND_URL}/api/payments/checkout/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-veterinarian-id": veterinarian.id, // Incluir header de autenticación
          },
          body: JSON.stringify({
            package_id: packageId,
            origin_url: window.location.origin,
            billing_cycle: billingCycle,
            veterinarian_id: veterinarian.id,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error del servidor:", response.status, errorText);
        let errorMessage = "Error creando sesión de pago";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);
      
      if (!data.checkout_url) {
        console.error("No se recibió checkout_url en la respuesta:", data);
        throw new Error("No se recibió la URL de checkout. Por favor, intenta de nuevo.");
      }

      console.log("Redirigiendo a:", data.checkout_url);
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Error en handlePurchase:", error);
      const errorMessage = error.message || "Error procesando el pago. Inténtalo de nuevo.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMembershipStatus = () => {
    if (!veterinarian || !veterinarian.membership_type) {
      return { text: "Sin membresía activa", color: "red" };
    }

    const expiry = veterinarian.membership_expires
      ? new Date(veterinarian.membership_expires)
      : null;

    if (expiry && expiry < new Date()) {
      return { text: "Membresía expirada", color: "red" };
    }

    const remaining = veterinarian.consultations_remaining || 0;
    const packageName =
      packages[veterinarian.membership_type]?.name ||
      veterinarian.membership_type;

    return {
      text: `${packageName} - ${remaining >= 150 ? "150 consultas" : remaining} consultas`,
      color:
        remaining > 5 || remaining >= 150
          ? "green"
          : remaining > 0
            ? "orange"
            : "red",
    };
  };

  const status = getMembershipStatus();

  return (
    <div className="membership-page">
      <Header setView={setView} />

      <div className="container">
        <div className="membership-hero">
          <h1>Elige tu Plan</h1>
          <p>Selecciona la membresía que mejor se adapte a tu práctica veterinaria</p>
          {status.text !== "Sin membresía activa" && (
            <div className="current-membership-badge" style={{ 
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: status.color === "#48bb78" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
              borderRadius: "50px",
              marginTop: "16px",
              fontSize: "14px",
              fontWeight: "600",
              color: status.color
            }}>
              <span style={{ fontSize: "18px" }}>{status.color === "#48bb78" ? "✓" : "⏳"}</span>
              {status.text}
            </div>
          )}
        </div>

        <div className="billing-toggle-container">
          <div className="billing-toggle-wrapper">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`billing-toggle-btn ${billingCycle === "monthly" ? "active" : ""}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`billing-toggle-btn ${billingCycle === "annual" ? "active" : ""}`}
            >
              Anual
              <span className="billing-badge">Ahorra 2 meses</span>
            </button>
          </div>
        </div>

        <div className="pricing-grid">
          {Object.entries(packages).map(([key, pkg]) => {
            const price =
              billingCycle === "annual" ? pkg.price_annual : pkg.price_monthly;
            const periodText =
              billingCycle === "annual" ? "MXN/año" : "MXN/mes";
            const monthlyEquivalent =
              billingCycle === "annual"
                ? (pkg.price_annual / 12).toFixed(2)
                : null;

            const consultationsLabel =
              key === "basic"
                ? "30C (consultas mensuales)"
                : key === "professional"
                  ? "35C (consultas mensuales)"
                  : key === "premium"
                    ? "150C (consultas mensuales)"
                    : pkg.consultations === "unlimited"
                      ? "Consultas ilimitadas"
                      : `${pkg.consultations} consultas/mes`;

            return (
              <div
                key={key}
                className={`pricing-card ${veterinarian?.membership_type === key ? "current" : ""}`}
              >
                <div className="pricing-header">
                  <h3>{pkg.name}</h3>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">{price}</span>
                    <span className="period">{periodText} + IVA</span>
                  </div>
                  {billingCycle === "annual" && (
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#4CAF50",
                        marginTop: "5px",
                      }}
                    >
                      ≈ ${monthlyEquivalent} MXN/mes
                    </div>
                  )}
                  {veterinarian?.membership_type === key && (
                    <div className="current-plan-pill">Plan actual</div>
                  )}
                </div>

                <div className="pricing-features">
                  <div className="feature">
                    ✅ {consultationsLabel}
                  </div>
                  <div className="feature">
                    ✅ {key === "basic"
                      ? "Consultas para perros y gatos"
                      : key === "professional"
                        ? "Consultas para perros,gatos y especies exoticas"
                        : key === "premium"
                          ? "Todas las especies"
                          : "Sistema especializado por categoría"}
                  </div>
                  <div className="feature">✅ Diagnósticos clínicos asistidos</div>
                  <div className="feature">✅ Planes de tratamiento</div>
                  <div className="feature">✅ Referencias bibliográficas</div>
                  {key === "professional" && (
                    <>
                      <div className="feature">✅ Soporte prioritario</div>
                      <div className="feature">✅ Historial extendido</div>
                    </>
                  )}
                  {key === "premium" && (
                    <>
                      <div className="feature">✅ Soporte 24/7</div>
                      <div className="feature">✅ 150 consultas mensuales</div>
                      <div className="feature">✅ Contenido exclusivo</div>
                      <div className="feature">✅ Análisis avanzados</div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handlePurchase(key)}
                  disabled={loading || veterinarian?.membership_type === key}
                  className={`btn ${key === "premium" ? "btn-primary" : "btn-secondary"} btn-full`}
                >
                  {veterinarian?.membership_type === key
                    ? "Plan Actual"
                    : loading
                      ? "Procesando..."
                      : "Seleccionar Plan"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="membership-info">
          <h2>¿Por qué elegir una membresía?</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🔬</div>
              <h3>Sistema Especializado</h3>
              <p>
                Análisis especializados entrenados específicamente para cada
                categoría animal
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">⚡</div>
              <h3>Resultados Rápidos</h3>
              <p>Análisis completo en minutos, no en horas</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📚</div>
              <h3>Basado en Evidencia</h3>
              <p>
                Recomendaciones respaldadas por literatura científica
                actualizada
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔄</div>
              <h3>Actualización Continua</h3>
              <p>Sistema en constante mejora con nuevos avances veterinarios</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Payment Success Page
const PaymentSuccess = ({ setView }) => {
  const { login } = useVet();
  const [paymentStatus, setPaymentStatus] = useState("checking");
  const [sessionId, setSessionId] = useState(null);
  const [purchaseType, setPurchaseType] = useState(null);
  const [creditsPurchased, setCreditsPurchased] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("session_id");

    if (id) {
      setSessionId(id);
      pollPaymentStatus(id);
    } else {
      setPaymentStatus("error");
    }
  }, []);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;

    if (attempts >= maxAttempts) {
      setPaymentStatus("timeout");
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/payments/checkout/status/${sessionId}`,
      );

      if (!response.ok) {
        throw new Error("Error verificando pago");
      }

      const data = await response.json();

      if (data.payment_status === "paid") {
        if (data?.veterinarian) {
          login(data.veterinarian);
        }
        setPurchaseType(data.purchase_type || null);
        setCreditsPurchased(data.credits || null);
        setPaymentStatus("success");
        return;
      } else if (data.status === "expired") {
        setPaymentStatus("expired");
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch (error) {
      console.error("Error checking payment:", error);
      setPaymentStatus("error");
    }
  };

  return (
    <div className="payment-success-page">
      <Header setView={setView} />

      <div className="container">
        <div className="payment-status-container">
          {paymentStatus === "checking" && (
            <div className="status-card">
              <div className="status-icon loading">⏳</div>
              <h2>Verificando Pago</h2>
              <p>
                Estamos procesando tu pago, esto puede tomar unos momentos...
              </p>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="status-card success">
              <div className="status-icon">✅</div>
              <h2>¡Pago Exitoso!</h2>
              <p>
                {purchaseType === "consultation_credits"
                  ? `Se han agregado ${creditsPurchased || ""} consultas a tu cuenta.`
                  : "Tu membresía ha sido activada correctamente. Ya puedes comenzar\n                a usar todas las funciones de GUIAA."}
              </p>
              <div className="status-actions">
                <button
                  onClick={() => setView("dashboard")}
                  className="btn btn-primary"
                >
                  Ir al Dashboard
                </button>
                <button
                  onClick={() => setView("new-consultation")}
                  className="btn btn-secondary"
                >
                  Nueva Consulta
                </button>
              </div>
            </div>
          )}

          {paymentStatus === "error" && (
            <div className="status-card error">
              <div className="status-icon">❌</div>
              <h2>Error en el Pago</h2>
              <p>
                Hubo un problema procesando tu pago. Por favor, intenta
                nuevamente.
              </p>
              <div className="status-actions">
                <button
                  onClick={() => setView("membership")}
                  className="btn btn-primary"
                >
                  Intentar Nuevamente
                </button>
                <button
                  onClick={() => setView("dashboard")}
                  className="btn btn-secondary"
                >
                  Volver al Dashboard
                </button>
              </div>
            </div>
          )}

          {paymentStatus === "expired" && (
            <div className="status-card error">
              <div className="status-icon">⌛</div>
              <h2>Sesión Expirada</h2>
              <p>
                La sesión de pago ha expirado. Por favor, inicia el proceso
                nuevamente.
              </p>
              <div className="status-actions">
                <button
                  onClick={() => setView("membership")}
                  className="btn btn-primary"
                >
                  Volver a Membresías
                </button>
              </div>
            </div>
          )}

          {paymentStatus === "timeout" && (
            <div className="status-card error">
              <div className="status-icon">⏰</div>
              <h2>Tiempo Agotado</h2>
              <p>
                No pudimos verificar el estado del pago. Revisa tu email para
                confirmación o contacta soporte.
              </p>
              <div className="status-actions">
                <button
                  onClick={() => setView("dashboard")}
                  className="btn btn-secondary"
                >
                  Ir al Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Profile Page
const Profile = ({ setView }) => {
  const { veterinarian } = useVet();

  return (
    <div className="profile-page">
      <Header setView={setView} />

      <div className="container">
        <div className="page-header">
          <h1>Perfil Profesional</h1>
          <p>Información de tu cuenta veterinaria</p>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar">
                  {veterinarian.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="profile-avatar-ring"></div>
              </div>
              <div className="profile-info">
                <h2>{veterinarian.nombre}</h2>
                <p className="profile-specialty">{veterinarian.especialidad || "Medicina Veterinaria"}</p>
                <div className="verification-badge-wrapper">
                  <span
                    className={`verification-status ${veterinarian.verified ? "verified" : "pending"}`}
                  >
                    <span className="verification-icon">
                      {veterinarian.verified ? "✓" : "⏳"}
                    </span>
                    <span className="verification-text">
                      {veterinarian.verified
                        ? "Verificado"
                        : "Pendiente de verificación"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-row">
                <div className="detail-label">
                  <span className="detail-icon">📧</span>
                  <strong>Email</strong>
                </div>
                <span className="detail-value">{veterinarian.email}</span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <span className="detail-icon">📱</span>
                  <strong>Teléfono</strong>
                </div>
                <span className="detail-value">{veterinarian.telefono || "No registrado"}</span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <span className="detail-icon">🆔</span>
                  <strong>Cédula Profesional</strong>
                </div>
                <span className="detail-value">{veterinarian.cedula_profesional || "No registrada"}</span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <span className="detail-icon">⭐</span>
                  <strong>Años de Experiencia</strong>
                </div>
                <span className="detail-value">{veterinarian.años_experiencia || 0} años</span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <span className="detail-icon">🏛️</span>
                  <strong>Institución</strong>
                </div>
                <span className="detail-value">{veterinarian.institucion || "No registrada"}</span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <span className="detail-icon">📅</span>
                  <strong>Miembro desde</strong>
                </div>
                <span className="detail-value">
                  {veterinarian.created_at
                    ? new Date(veterinarian.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No disponible"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
