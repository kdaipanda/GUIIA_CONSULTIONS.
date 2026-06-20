import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { BarChart3, CalendarDays, Gem, Sun, Cloud, CloudRain, CloudSun, Thermometer, Plus, ClipboardList, FlaskConical, Crown, Moon, Brain, FileDown } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import "./Custom.css";
import "./ThemeEnhancements.css";
import {
  createConsultationSupabase,
  listConsultationsSupabase,
  updateConsultationPayloadSupabase,
  uploadMedicalImageSupabase,
} from "./lib/supabaseApi";
import { BACKEND_URL } from "./lib/backendUrl";
import { friendlyFetchError } from "./lib/friendlyFetchError";
import { getAuthHeaders, storeAccessToken } from "./lib/authHeaders";
import { downloadConsultationPdf, cleanClinicalDisplayText } from "./lib/consultationPdf";
import { applyDocumentTheme, readStoredTheme } from "./lib/themeSync";
import { SupportChatWidget } from "./components/SupportChatWidget";
import { VetProvider, useVet } from "./context/VetContext";
import { LoadingScreen } from "./components/LoadingScreen";
import { PrivacyModal } from "./components/PrivacyModal";
import { LandingPage } from "./pages/LandingPage";
import { Header } from "./components/Header";
import { AppShell } from "./layout/AppShell";
import { ClinicShell } from "./layout/ClinicShell";
import { ClinicProvider } from "./context/ClinicContext";
import { ClientsPage } from "./pages/clinic/ClientsPage";
import { PatientsPage } from "./pages/clinic/PatientsPage";
import { AgendaPage } from "./pages/clinic/AgendaPage";
import { InventoryPage } from "./pages/clinic/InventoryPage";
import { BillingPage } from "./pages/clinic/BillingPage";
import { ReportsPage } from "./pages/clinic/ReportsPage";
import { ToolsPage } from "./pages/clinic/ToolsPage";
import { SettingsPage } from "./pages/clinic/SettingsPage";
import { AdminPage } from "./pages/clinic/AdminPage";
import { ClinicDashboardPage } from "./pages/clinic/ClinicDashboardPage";
import { AppointmentRequestPortal } from "./pages/clinic/AppointmentRequestPortal";
import { PatientSelector } from "./components/clinic/PatientSelector";
import { PatientAntecedents } from "./components/clinic/PatientAntecedents";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Checkbox } from "./components/ui/checkbox";
import { Textarea } from "./components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

console.log("Backend URL being used:", BACKEND_URL);

const isPremiumMember = (vet) =>
  vet?.membership_type?.toLowerCase() === "premium";

const VIEW_TO_PATH = {
  dashboard: "/app/dashboard",
  clients: "/app/clientes",
  patients: "/app/pacientes",
  agenda: "/app/agenda",
  inventory: "/app/inventario",
  billing: "/app/facturacion",
  reports: "/app/reportes",
  tools: "/app/herramientas",
  settings: "/app/configuracion",
  admin: "/app/admin",
  "new-consultation": "/app/consultas/nueva",
  "consultation-history": "/app/historial",
  "medical-images": "/app/imagenes",
  membership: "/app/membresia",
  profile: "/app/perfil",
};

const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([view, path]) => [path, view]),
);

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
const CommandPalette = ({ isOpen, onClose, setView, openExpertConsultation, veterinarian }) => {
  const { platformAdmin } = useVet();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Resumen operativo del consultorio",
      icon: "📊",
      shortcut: "",
      action: () => setView("dashboard"),
    },
    {
      id: "clients",
      title: "Dueño",
      description: "Dueño y contactos",
      icon: "👥",
      shortcut: "",
      action: () => setView("clients"),
    },
    {
      id: "patients",
      title: "Mascotas",
      description: "Mascotas registradas",
      icon: "🐾",
      shortcut: "",
      action: () => setView("patients"),
    },
    {
      id: "agenda",
      title: "Agenda",
      description: "Citas y solicitudes",
      icon: "📅",
      shortcut: "",
      action: () => setView("agenda"),
    },
    {
      id: "inventory",
      title: "Inventario",
      description: "Productos y stock",
      icon: "📦",
      shortcut: "",
      action: () => setView("inventory"),
    },
    {
      id: "billing",
      title: "Facturación",
      description: "Recibos clínicos",
      icon: "🧾",
      shortcut: "",
      action: () => setView("billing"),
    },
    {
      id: "reports",
      title: "Reportes",
      description: "KPIs e indicadores",
      icon: "📈",
      shortcut: "",
      action: () => setView("reports"),
    },
    {
      id: "tools",
      title: "Herramientas",
      description: "Calculadoras clínicas",
      icon: "🔧",
      shortcut: "",
      action: () => setView("tools"),
    },
    {
      id: "settings",
      title: "Configuración",
      description: "Consultorio y equipo",
      icon: "⚙️",
      shortcut: "",
      action: () => setView("settings"),
    },
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

  if (platformAdmin) {
    commands.splice(9, 0, {
      id: "admin",
      title: "Admin GUIAA",
      description: "Administración de plataforma",
      icon: "🛡️",
      shortcut: "",
      action: () => setView("admin"),
    });
  }

  if (isPremiumMember(veterinarian)) {
    const consultIdx = commands.findIndex((c) => c.id === "new-consultation");
    const insertAt = consultIdx >= 0 ? consultIdx + 1 : commands.length;
    commands.splice(insertAt, 0, {
      id: "expert-consultation",
      title: "Manejo Experto",
      description: "Ir directo al motivo de consulta; completa los datos del paciente después (Premium)",
      icon: "🧠",
      shortcut: "E",
      action: () => openExpertConsultation?.(),
    });
    commands.splice(insertAt + 1, 0, {
      id: "medical-images",
      title: "Interpretación de Análisis",
      description: "Interpretación de análisis de sangre y estudios clínicos (Premium)",
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

// Main App Component
function App() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    applyDocumentTheme(readStoredTheme());
  }, []);

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
      <ClinicProvider>
        <div className="App">
          <Router showToast={showToast} />
          <ToastContainer toasts={toasts} onClose={closeToast} />
          <SpeedInsights />
        </div>
      </ClinicProvider>
    </VetProvider>
  );
}

// Router Component
const Router = ({ showToast }) => {
  const { veterinarian, loading } = useVet();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState(
    veterinarian ? "dashboard" : "landing",
  );
  const [isCmdkOpen, setCmdkOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [consultationEntryMode, setConsultationEntryMode] = useState("standard");
  const [clinicalContext, setClinicalContext] = useState(null);
  const [cedulaFlow, setCedulaFlow] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const portalOrganizationId = (() => {
    const match = location.pathname.match(/^\/solicitar-cita\/([^/]+)/);
    return match ? match[1] : null;
  })();

  const navigateSetView = (view) => {
    handleSetView(view);
    const path = VIEW_TO_PATH[view];
    if (path) {
      navigate(path);
    } else if (view === "landing") {
      navigate("/");
    } else if (view === "login") {
      navigate("/login");
    } else if (view === "register") {
      navigate("/registro");
    }
  };

  const openConsultationWithPatient = (ctx) => {
    setClinicalContext(ctx);
    setSelectedConsultationId(null);
    setConsultationEntryMode("standard");
    setCurrentView("new-consultation");
    setIsInitialized(true);
    navigate(VIEW_TO_PATH["new-consultation"]);
  };

  // Helper to navigate to consultation with ID
  const openConsultation = (consultationId) => {
    setClinicalContext(null);
    setSelectedConsultationId(consultationId);
    setConsultationEntryMode("standard");
    setCurrentView("new-consultation");
    navigate(VIEW_TO_PATH["new-consultation"]);
  };

  const openExpertConsultation = () => {
    if (!isPremiumMember(veterinarian)) {
      setSelectedConsultationId(null);
      setConsultationEntryMode("standard");
      setCurrentView("membership");
      navigate(VIEW_TO_PATH.membership);
      return;
    }
    setClinicalContext(null);
    setSelectedConsultationId(null);
    setConsultationEntryMode("expert");
    setCurrentView("new-consultation");
    navigate(VIEW_TO_PATH["new-consultation"]);
  };

  // Clear consultation ID when leaving new-consultation view
  const handleSetView = (view) => {
    if (view !== "new-consultation") {
      setSelectedConsultationId(null);
      setConsultationEntryMode("standard");
      setClinicalContext(null);
    }
    setCurrentView(view);
    setIsInitialized(true);
  };

  useEffect(() => {
    if (portalOrganizationId) {
      setCurrentView("appointment-request");
      return;
    }
    const view = PATH_TO_VIEW[location.pathname];
    if (view && veterinarian) {
      setCurrentView(view);
    }
    if (location.pathname === "/" && veterinarian) {
      setCurrentView("dashboard");
      navigate(VIEW_TO_PATH.dashboard, { replace: true });
    }
    if (location.pathname === "/login") setCurrentView("login");
    if (location.pathname === "/registro") setCurrentView("register");
  }, [location.pathname, veterinarian, navigate, portalOrganizationId]);

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
      setIsInitialized(false); // Resetear cuando se cierra sesión
    }
  }, [veterinarian, loading]);

  // URL parameter handling for payment success - Solo ejecutar una vez al montar
  useEffect(() => {
    if (isInitialized) return; // No ejecutar si ya se inicializó la vista
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const view = urlParams.get("view");

    if (sessionId) {
      // Solo redirigir a payment-success si el usuario está autenticado
      if (veterinarian) {
      setCurrentView("payment-success");
        setIsInitialized(true);
      } else {
        // Si no está autenticado pero hay session_id, limpiar la URL y redirigir al login
        urlParams.delete("session_id");
        const query = urlParams.toString();
        const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
        window.history.replaceState(null, "", newUrl);
        setCurrentView("login");
        setIsInitialized(true);
      }
    } else if (view && view !== "profile") {
      setCurrentView(view);
      setIsInitialized(true);
    } else if (view === "profile") {
      urlParams.delete("view");
      const query = urlParams.toString();
      const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
      window.history.replaceState(null, "", newUrl);
      setIsInitialized(true);
    } else if (veterinarian && !isInitialized) {
      // Solo redirigir al dashboard si no se ha inicializado y hay un veterinarian
      // Esto solo ocurre al cargar la página inicialmente
      setCurrentView("dashboard");
      setIsInitialized(true);
    } else if (!veterinarian && !isInitialized) {
      setCurrentView("landing");
      setIsInitialized(true);
    }
  }, []); // Solo ejecutar una vez al montar, no cuando cambia veterinarian

  if (loading) {
    return <LoadingScreen />;
  }

  const views = {
    landing: <LandingPage setView={handleSetView} />,
    register: (
      <AppShell>
        <RegisterPage setView={handleSetView} setCedulaFlow={setCedulaFlow} />
      </AppShell>
    ),
    login: (
      <AppShell>
        <LoginPage setView={handleSetView} setCedulaFlow={setCedulaFlow} />
      </AppShell>
    ),
    "cedula-verification": (
      <AppShell>
        <CedulaVerificationPage
          setView={handleSetView}
          cedulaFlow={cedulaFlow}
          setCedulaFlow={setCedulaFlow}
        />
      </AppShell>
    ),
    dashboard: (
      <ClinicShell setView={navigateSetView}>
        <div className="clinic-page clinic-dashboard-unified">
          <ClinicDashboardPage
            setView={navigateSetView}
            onStartConsultation={openConsultationWithPatient}
          />
          <Dashboard
            embedded
            setView={navigateSetView}
            openConsultation={openConsultation}
            openExpertConsultation={openExpertConsultation}
          />
        </div>
      </ClinicShell>
    ),
    clients: (
      <ClinicShell setView={navigateSetView}>
        <ClientsPage />
      </ClinicShell>
    ),
    patients: (
      <ClinicShell setView={navigateSetView}>
        <PatientsPage
          onStartConsultation={openConsultationWithPatient}
          onViewConsultation={openConsultation}
        />
      </ClinicShell>
    ),
    agenda: (
      <ClinicShell setView={navigateSetView}>
        <AgendaPage onStartConsultation={openConsultationWithPatient} />
      </ClinicShell>
    ),
    inventory: (
      <ClinicShell setView={navigateSetView}>
        <InventoryPage />
      </ClinicShell>
    ),
    billing: (
      <ClinicShell setView={navigateSetView}>
        <BillingPage />
      </ClinicShell>
    ),
    reports: (
      <ClinicShell setView={navigateSetView}>
        <ReportsPage />
      </ClinicShell>
    ),
    tools: (
      <ClinicShell setView={navigateSetView}>
        <ToolsPage />
      </ClinicShell>
    ),
    settings: (
      <ClinicShell setView={navigateSetView}>
        <SettingsPage />
      </ClinicShell>
    ),
    admin: (
      <ClinicShell setView={navigateSetView}>
        <AdminPage />
      </ClinicShell>
    ),
    "new-consultation": (
      <ClinicShell setView={navigateSetView}>
        <NewConsultation
          setView={navigateSetView}
          existingConsultationId={selectedConsultationId}
          entryMode={consultationEntryMode}
          clinicalContext={clinicalContext}
          onClinicalContextChange={setClinicalContext}
        />
      </ClinicShell>
    ),
    "consultation-history": (
      <ClinicShell setView={navigateSetView}>
        <ConsultationHistory
          setView={navigateSetView}
          openConsultation={openConsultation}
        />
      </ClinicShell>
    ),
    "medical-images": (
      <ClinicShell setView={navigateSetView}>
        <MedicalImageInterpretation setView={navigateSetView} />
      </ClinicShell>
    ),
    membership: (
      <ClinicShell setView={navigateSetView}>
        <MembershipPage setView={navigateSetView} />
      </ClinicShell>
    ),
    "payment-success": (
      <AppShell>
        <PaymentSuccess setView={handleSetView} />
      </AppShell>
    ),
    profile: (
      <ClinicShell setView={navigateSetView}>
        <Profile setView={navigateSetView} />
      </ClinicShell>
    ),
  };

  return (
    <>
      <main id="main-content" className="app-main">
        {portalOrganizationId ? (
          <AppShell>
            <AppointmentRequestPortal organizationId={portalOrganizationId} />
          </AppShell>
        ) : (
          views[currentView] || <LandingPage setView={handleSetView} />
        )}
      </main>
      <SupportChatWidget currentView={currentView} />
      <CommandPalette
        isOpen={isCmdkOpen}
        onClose={() => setCmdkOpen(false)}
        setView={navigateSetView}
        openExpertConsultation={openExpertConsultation}
        veterinarian={veterinarian}
      />
    </>
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onAccept}
              disabled={!scrolledToBottom}
              className={!scrolledToBottom ? "opacity-50" : ""}
            >
              Acepto los Términos
            </Button>
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
    if (!formData.especialidad?.trim()) {
      setError("Selecciona una especialidad.");
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
                <Label htmlFor="reg-nombre">Nombre Completo *</Label>
                <Input
                  id="reg-nombre"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Dr. Juan Pérez"
                  className="mt-1.5 h-11 min-h-11 bg-background"
                />
              </div>
              <div className="form-group">
                <Label htmlFor="reg-email">Email *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="juan.perez@email.com"
                  className="mt-1.5 h-11 min-h-11 bg-background"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <Label htmlFor="reg-telefono">Teléfono *</Label>
                <Input
                  id="reg-telefono"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="+52 555 123 4567"
                  className="mt-1.5 h-11 min-h-11 bg-background"
                />
              </div>
              <div className="form-group">
                <Label htmlFor="reg-cedula">Cédula Profesional *</Label>
                <Input
                  id="reg-cedula"
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
                  className="mt-1.5 h-11 min-h-11 bg-background"
                />
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="reg-cedula-file">Documento de Cédula (PDF/JPG/PNG) *</Label>
              <Input
                id="reg-cedula-file"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                required
                className="mt-1.5 h-auto min-h-10 cursor-pointer border-dashed bg-background py-2 file:mr-3 file:cursor-pointer"
                onChange={(e) => setCedulaFile(e.target.files?.[0] || null)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Sube una foto o PDF legible. Máx. 10MB (configurable en backend).
              </p>
            </div>

            <div className="form-group">
              <Label htmlFor="reg-especialidad">Especialidad *</Label>
              <Select
                value={formData.especialidad || undefined}
                onValueChange={(v) =>
                  setFormData({ ...formData, especialidad: v })
                }
              >
                <SelectTrigger
                  id="reg-especialidad"
                  className="auth-select-trigger mt-1.5 h-11 w-full bg-background"
                >
                  <SelectValue placeholder="Seleccione una especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pequeñas Especies">
                    Pequeñas Especies
                  </SelectItem>
                  <SelectItem value="Animales de Producción">
                    Animales de Producción
                  </SelectItem>
                  <SelectItem value="Equinos">Equinos</SelectItem>
                  <SelectItem value="Animales Exóticos">
                    Animales Exóticos
                  </SelectItem>
                  <SelectItem value="Medicina Preventiva">
                    Medicina Preventiva
                  </SelectItem>
                  <SelectItem value="Patología">Patología</SelectItem>
                  <SelectItem value="Cirugía">Cirugía</SelectItem>
                  <SelectItem value="Medicina Interna">
                    Medicina Interna
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <Label htmlFor="reg-experiencia">Años de Experiencia *</Label>
                <Input
                  id="reg-experiencia"
                  type="number"
                  required
                  min={0}
                  max={50}
                  inputMode="numeric"
                  value={formData.años_experiencia}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      años_experiencia: e.target.value,
                    })
                  }
                  placeholder="5"
                  className="mt-1.5 h-11 min-h-11 bg-background"
                />
              </div>
              <div className="form-group">
                <Label htmlFor="reg-institucion">Institución *</Label>
                <Input
                  id="reg-institucion"
                  type="text"
                  required
                  value={formData.institucion}
                  onChange={(e) =>
                    setFormData({ ...formData, institucion: e.target.value })
                  }
                  placeholder="Hospital Veterinario ABC"
                  className="mt-1.5 h-11 min-h-11 bg-background"
                />
              </div>
            </div>

            <div className="form-group mt-5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="reg-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(v) => {
                    const next = v === true;
                    if (next && !acceptedTerms) {
                      setShowTermsModal(true);
                      return;
                    }
                    setAcceptedTerms(next);
                  }}
                  className="mt-1"
                  aria-describedby="reg-terms-desc"
                />
                <Label
                  htmlFor="reg-terms"
                  id="reg-terms-desc"
                  className="cursor-pointer text-sm font-normal leading-relaxed"
                >
                  He leído y acepto los{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                  >
                    Términos y Condiciones de Uso
                  </button>{" "}
                  de la Plataforma GUIAA
                  {acceptedTerms && (
                    <span className="ml-2 text-green-600 dark:text-green-400" aria-hidden>
                      ✓
                    </span>
                  )}
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </Button>
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
        if (vetData.access_token) {
          storeAccessToken(vetData.access_token);
        }
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
      setError(friendlyFetchError(err, BACKEND_URL));
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
      setError(friendlyFetchError(err, BACKEND_URL));
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
              src="/GuiaLogo-mark.png"
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
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="tu.email@ejemplo.com"
                  className="mt-1.5 h-11 min-h-11 bg-background"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="login-cedula">Cédula Profesional</Label>
                <Input
                  id="login-cedula"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.cedula_profesional}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cedula_profesional: e.target.value,
                    })
                  }
                  placeholder="12345678"
                  className="mt-1.5 h-11 min-h-11 bg-background"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="auth-form">
              <div className="form-group">
                <Label htmlFor="login-2fa">Código de Verificación</Label>
                <Input
                  id="login-2fa"
                  type="text"
                  required
                  inputMode="numeric"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Ingresa el código de 6 dígitos"
                  maxLength={6}
                  autoFocus
                  className="mt-1.5 h-11 min-h-11 bg-background tracking-widest"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Se ha enviado un código de verificación a tu email
                </p>
              </div>

              <Button
                type="submit"
                disabled={verifying2FA}
                className="w-full"
              >
                {verifying2FA ? "Verificando..." : "Verificar Código"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={resetToLogin}
                className="mt-2.5 w-full"
              >
                Volver al Login
              </Button>
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
            <Button className="w-full" onClick={() => setView("login")}>
              Ir a Login
            </Button>
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
          headers: getAuthHeaders(vetId),
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
        headers: getAuthHeaders(vetId),
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
              <Label htmlFor="cedula-nombre">
                Nombre completo (como aparece en SEP/DGP) *
              </Label>
              <Input
                id="cedula-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. JUAN PEREZ LOPEZ"
                autoComplete="name"
                className="mt-1.5 h-11 min-h-11"
              />
            </div>

            <div className="form-group">
              <Label htmlFor="cedula-archivo">
                Documento de cédula (PDF/JPG/PNG)
                {needsUpload ? " *" : ""}
              </Label>
              <Input
                id="cedula-archivo"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1.5 h-auto min-h-10 cursor-pointer border-dashed py-2 file:mr-3 file:cursor-pointer"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Puedes volver a subir el documento si fue rechazado.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleUploadAndVerify}
              disabled={loading}
            >
              {loading ? "Verificando..." : "Subir y verificar"}
            </Button>

            {verificationStatus && (
              <div style={{ marginTop: "10px", color: "var(--text-secondary)" }}>
                Estado actual: <strong>{verificationStatus}</strong>
              </div>
            )}

            {canSkip && remainingSkips > 0 && (
              <Button
                type="button"
                variant="secondary"
                className="mt-2.5 w-full"
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  try {
                    const response = await fetch(`${BACKEND_URL}/api/cedula/skip`, {
                      method: "POST",
                      headers: getAuthHeaders(vetId),
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
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              className="mt-2.5 w-full"
              onClick={() => {
                setCedulaFlow?.(null);
                setView("login");
              }}
            >
              Volver al Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard
const Dashboard = ({ setView, openConsultation, openExpertConsultation, embedded = false }) => {
  const { veterinarian } = useVet();
  const [stats, setStats] = useState({ consultations: 0, thisMonth: 0, lastMonth: 0, today: 0 });
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [buyingConsultations, setBuyingConsultations] = useState(false);

  useEffect(() => {
    if (veterinarian) {
      loadDashboardData();
      loadWeatherData();

      // Check privacy acceptance
      const privacyAccepted = localStorage.getItem("sv_privacy_accepted");
      setShowPrivacyModal(!privacyAccepted);
    }
  }, [veterinarian]);

  const handlePrivacyAccept = () => {
    localStorage.setItem("sv_privacy_accepted", "true");
    setShowPrivacyModal(false);
  };

  // Theme initialization (data-theme + clase dark para Tailwind/shadcn)
  useEffect(() => {
    const initial = readStoredTheme();
    setTheme(initial);
    applyDocumentTheme(initial);
  }, []);

  useEffect(() => {
    try {
      applyDocumentTheme(theme);
      localStorage.setItem("sv_theme", theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName,
      );
      if (isTyping) return;

      const key = e.key.toLowerCase();
      if (key === "n") setView("new-consultation");
      else if (key === "e" && isPremiumMember(veterinarian)) {
        openExpertConsultation?.();
      } else if (key === "h") setView("consultation-history");
      else if (key === "i" && isPremiumMember(veterinarian)) {
        setView("medical-images");
      } else if (key === "m") setView("membership");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setView, openExpertConsultation, veterinarian]);

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
      // Intentar usar la variable de entorno primero, si no existe usar la clave por defecto
      const apiKey = process.env.REACT_APP_WEATHER_API_KEY || "8149f4e566a3c8e71872e864ad6604ae";
      
      // Si no hay API key, no intentar cargar el clima
      if (!apiKey) {
        setWeatherLoading(false);
        return;
      }
      
      const lat = 19.4326;
      const lon = -99.1332;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`,
      );

      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      } else if (response.status === 401) {
        // API key inválida o expirada - manejar silenciosamente
        // No mostrar error en consola, simplemente no cargar el clima
        setWeatherData(null);
      }
    } catch (error) {
      // Manejar errores de red silenciosamente
      // No mostrar errores en consola para no molestar al usuario
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
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
    <div className={`dashboard-page dashboard-${timeOfDay}${embedded ? " dashboard-embedded" : ""}`}>
      <div className="container">
        {embedded ? (
          <div className="clinic-dashboard-section-head clinic-dashboard-cds-head">
            <h2>Panel CDS y membresía</h2>
            <button
              type="button"
              onClick={toggleTheme}
              className="clinic-dashboard-theme-btn"
              aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            >
              {theme === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
            </button>
          </div>
        ) : (
        <div className="dashboard-header">
          <div className="dashboard-header-row">
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
            <div
              className="hero-actions dashboard-header-toolbar"
              role="toolbar"
              aria-label="Acciones del panel"
            >
              <button
                type="button"
                onClick={toggleTheme}
                className="icon-btn"
                aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
              >
                {theme === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
              </button>
            </div>
          </div>
        </div>
        )}

        <div className={`today-summary-panel${embedded ? " clinic-settings-card clinic-dashboard-summary" : ""}`}>
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

        <div className={`dashboard-grid${embedded ? " clinic-dashboard-cds-grid" : ""}`}>
          {dashboardLoading ? (
            <div className={`stats-cards${embedded ? " clinic-report-kpi-grid" : ""}`}>
              <Card className="stat-card border-0 shadow-none"><div className="skeleton skeleton-text" style={{width:'40%'}}></div><div className="skeleton skeleton-text" style={{width:'20%'}}></div><div className="skeleton skeleton-card"></div></Card>
              <Card className="stat-card border-0 shadow-none"><div className="skeleton skeleton-text" style={{width:'40%'}}></div><div className="skeleton skeleton-text" style={{width:'20%'}}></div><div className="skeleton skeleton-card"></div></Card>
              <Card className="stat-card border-0 shadow-none"><div className="skeleton skeleton-text" style={{width:'40%'}}></div><div className="skeleton skeleton-text" style={{width:'20%'}}></div><div className="skeleton skeleton-card"></div></Card>
            </div>
          ) : (
          <div className={`stats-cards${embedded ? " clinic-report-kpi-grid" : ""}`}>
            <Card className={`stat-card border-0 shadow-none${embedded ? " clinic-report-kpi" : ""}`} data-tooltip="Total de consultas realizadas">
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
            </Card>

            <Card className={`stat-card border-0 shadow-none${embedded ? " clinic-report-kpi" : ""}`} data-tooltip="Consultas de este mes">
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
            </Card>

            <Card className={`stat-card border-0 shadow-none${embedded ? " clinic-report-kpi" : ""}`} data-tooltip="Tu plan de membresía actual">
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
                  <Button
                    disabled={buyingConsultations}
                    onClick={() => handleBuyConsultations("credits_10")}
                  >
                    {buyingConsultations ? "Procesando..." : "10 consultas - $350"}
                  </Button>
                </div>
              </div>
            </Card>

            {weatherLoading && (
              <Card className={`stat-card border-0 shadow-none${embedded ? " clinic-report-kpi" : ""}`}><div className="skeleton skeleton-card" style={{width:'100%'}}></div></Card>
            )}
            {weatherData && !weatherLoading && (
              <Card className={`stat-card border-0 shadow-none${embedded ? " clinic-report-kpi" : ""}`} data-tooltip="Clima actual en tu zona">
                <div className="stat-icon">
                  {weatherData.weather[0].main === 'Clear' ? <Sun /> :
                   weatherData.weather[0].main === 'Clouds' ? <Cloud /> :
                   weatherData.weather[0].main === 'Rain' ? <CloudRain /> : <CloudSun />}
                </div>
                <div className="stat-content">
                  <h3>{Math.round(weatherData.main.temp)}°C</h3>
                  <p>{weatherData.weather[0].description}</p>
                </div>
              </Card>
            )}
          </div>
          )}

          <section className={`dashboard-block dashboard-block-actions${embedded ? " clinic-settings-card" : ""}`}>
          <div className={`quick-actions${embedded ? " clinic-dashboard-quick-section" : ""}`}>
            <h2>Acciones Rápidas</h2>
            <div className={`action-cards${embedded ? " clinic-dashboard-quick-grid" : ""}`}>
              <Card
                role="button"
                tabIndex={0}
                className={`action-card cursor-pointer border-0 shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2${embedded ? " clinic-dashboard-quick-btn" : ""}`}
                onClick={() => setView("new-consultation")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setView("new-consultation");
                  }
                }}
              >
                <div className="action-icon"><Plus /></div>
                <h3>Nueva Consulta</h3>
                <p>Iniciar análisis especializado</p>
              </Card>

              <Card
                role="button"
                tabIndex={0}
                className={`action-card expert-feature cursor-pointer border-0 shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2${membershipType !== "premium" ? " premium-locked" : ""}${embedded ? " clinic-dashboard-quick-btn" : ""}`}
                onClick={() => {
                  if (membershipType !== "premium") {
                    setView("membership");
                    return;
                  }
                  openExpertConsultation?.();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (membershipType !== "premium") {
                      setView("membership");
                      return;
                    }
                    openExpertConsultation?.();
                  }
                }}
              >
                <div className="action-icon"><Brain /></div>
                <h3>Manejo Experto</h3>
                <p>
                  {membershipType === "premium"
                    ? "Ir al motivo de consulta y completar datos después"
                    : "Disponible con membresía Premium"}
                </p>
                <span className={membershipType === "premium" ? "expert-badge" : "premium-badge"}>
                  {membershipType === "premium" ? "RÁPIDO" : "PREMIUM"}
                </span>
              </Card>

              <Card
                role="button"
                tabIndex={0}
                className={`action-card cursor-pointer border-0 shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2${embedded ? " clinic-dashboard-quick-btn" : ""}`}
                onClick={() => setView("consultation-history")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setView("consultation-history");
                  }
                }}
              >
                <div className="action-icon"><ClipboardList /></div>
                <h3>Ver Historial</h3>
                <p>Consultas previas y resultados</p>
              </Card>

              {membershipType === "premium" && (
                <Card
                  role="button"
                  tabIndex={0}
                  className={`action-card premium-feature cursor-pointer border-0 shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2${embedded ? " clinic-dashboard-quick-btn" : ""}`}
                  onClick={() => setView("medical-images")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setView("medical-images");
                    }
                  }}
                >
                  <div className="action-icon"><FlaskConical /></div>
                  <h3>Interpretación de Análisis</h3>
                  <p>Interpretación de análisis de sangre y estudios clínicos</p>
                  <span className="premium-badge">PREMIUM</span>
                </Card>
              )}

              <Card
                role="button"
                tabIndex={0}
                className={`action-card cursor-pointer border-0 shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2${embedded ? " clinic-dashboard-quick-btn" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setView("membership");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setView("membership");
                  }
                }}
              >
                <div className="action-icon"><Crown /></div>
                <h3>Membresía</h3>
                <p>Actualizar plan o renovar</p>
              </Card>
            </div>
          </div>
          </section>

          <section className={`dashboard-block dashboard-block-activity${embedded ? " clinic-settings-card" : ""}`}>
          <div className="dashboard-block-head">
            <h2>Actividad clínica</h2>
            <p>Seguimiento de consultas, accesos rápidos y casos recientes.</p>
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
                    <Button
                      type="button"
                      variant="ghost"
                      className="view-all-btn h-auto px-2 font-semibold text-primary hover:text-primary/90"
                      onClick={() => setView("consultation-history")}
                    >
                      Ver todas →
                    </Button>
                  )}
                </div>
                {dashboardLoading ? (
                  <div className={`consultation-list${embedded ? " clinic-dashboard-list" : ""}`}>
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="consultation-item">
                        <div className="skeleton skeleton-text" style={{width:'30%'}}></div>
                        <div className="skeleton skeleton-text" style={{width:'60%'}}></div>
                      </div>
                    ))}
                  </div>
                ) : recentConsultations.length > 0 ? (
                  <div className={`consultation-list${embedded ? " clinic-dashboard-list" : ""}`}>
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
                          className={`consultation-item${embedded ? " clinic-dashboard-list-item" : ""}`}
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
                            <Button
                              type="button"
                              variant="guiaaPrimarySm"
                              size="compactGradient"
                              className="whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConsultation && openConsultation(consultation.id);
                              }}
                            >
                              {consultation.status === "draft" ? "Continuar" : "Ver"}
                            </Button>
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
                    <Button
                      type="button"
                      variant="guiaaPrimary"
                      size="consult"
                      onClick={() => setView("new-consultation")}
                    >
                      Crear Primera Consulta
                    </Button>
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
                <div><kbd>N</kbd> Nueva Consulta • <kbd>E</kbd> Manejo Experto (Premium) • <kbd>H</kbd> Historial • <kbd>I</kbd> Imágenes (Premium) • <kbd>M</kbd> Membresía</div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
          </section>
        </div>
      </div>
    </div>
  );
};

const CONSULTATION_CATEGORY_ICONS = {
  perros: "🐕",
  gatos: "🐈",
  conejos: "🐰",
  aves: "🦜",
  hamsters: "🐭",
  cuyos: "🐹",
  hurones: "🦡",
  erizos: "🦔",
  tortugas: "🐢",
  iguanas: "🦎",
  patos_pollos: "🐥",
};

const buildConsultationDataFromForm = (formData) => ({
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
});

// New Consultation Component
const NewConsultation = ({
  setView,
  existingConsultationId,
  entryMode = "standard",
  clinicalContext = null,
  onClinicalContextChange,
}) => {
  const { veterinarian } = useVet();
  const isExpertMode = entryMode === "expert";
  const [step, setStep] = useState(isExpertMode && !existingConsultationId ? 2 : 1);
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
  const [info, setInfo] = useState(
    isExpertMode && !existingConsultationId
      ? "Modo Manejo Experto: describe el caso clínico ahora. Podrás completar los datos del paciente (paso 1) después."
      : "",
  );
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

  useEffect(() => {
    if (!clinicalContext?.patient || existingConsultationId) return;
    const p = clinicalContext.patient;
    const owner = p.clients || {};
    setFormData((prev) => ({
      ...prev,
      nombre_mascota: p.name || prev.nombre_mascota,
      nombre_dueño: owner.name || prev.nombre_dueño,
      raza: p.breed || prev.raza,
      sexo: p.sex || prev.sexo,
      peso: p.weight_kg != null ? String(p.weight_kg) : prev.peso,
    }));
    if (p.species) {
      setSelectedCategory(p.species);
    }
  }, [clinicalContext, existingConsultationId]);

  // Load existing consultation if ID is provided
  useEffect(() => {
    if (existingConsultationId) {
      loadExistingConsultation(existingConsultationId);
    }
  }, [existingConsultationId]);

  const shouldRedirectToMembership = (status, errorDetail) =>
    status === 403 &&
    (errorDetail.includes("agotado") ||
      errorDetail.includes("consultas de prueba") ||
      errorDetail.includes("consultas gratuitas") ||
      errorDetail.includes("membresía activa") ||
      errorDetail.includes("TRIAL_EXHAUSTED"));

  const createStageOneConsultation = async () => {
    const response = await fetch(`${BACKEND_URL}/api/consultations`, {
      method: "POST",
      headers: getAuthHeaders(veterinarian.id),
      body: JSON.stringify({
        veterinarian_id: veterinarian.id,
        category: selectedCategory,
        consultation_data: buildConsultationDataFromForm(formData),
        patient_id: clinicalContext?.patientId || null,
        client_id: clinicalContext?.clientId || null,
        appointment_id: clinicalContext?.appointmentId || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorDetail =
        errorData.detail || `Error del servidor: ${response.status}`;
      if (shouldRedirectToMembership(response.status, errorDetail)) {
        setView("membership");
        return null;
      }
      throw new Error(errorDetail);
    }

    return response.json();
  };

  const renderCategorySelector = (title = "Categoría Animal") => (
    <div className="form-section">
      <h3>{title}</h3>
      <div className="category-grid">
        {Object.entries(categories).map(([key, category]) => (
          <div
            key={key}
            className={`category-card ${selectedCategory === key ? "selected" : ""}`}
            onClick={() => setSelectedCategory(key)}
          >
            <span className="category-icon">
              {CONSULTATION_CATEGORY_ICONS[key] || "🐾"}
            </span>
            <h4>{category.name}</h4>
          </div>
        ))}
      </div>
    </div>
  );

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
        
        // Extraer datos del payload si existe
        const payload = consultation.payload || {};
        const formDataFromPayload = payload.form_data || {};
        
        // Populate form data
        setFormData(prev => ({
          ...prev,
          fecha: consultation.fecha || formDataFromPayload.fecha || prev.fecha,
          nombre_mascota: consultation.nombre_mascota || formDataFromPayload.nombre_mascota || "",
          nombre_dueño: consultation.nombre_dueño || formDataFromPayload.nombre_dueño || "",
          raza: consultation.raza || formDataFromPayload.raza || "",
          mix: consultation.mix || formDataFromPayload.mix || "",
          edad: consultation.edad || formDataFromPayload.edad || "",
          peso: consultation.peso || formDataFromPayload.peso || "",
          condicion_corporal: consultation.condicion_corporal || formDataFromPayload.condicion_corporal || "3",
          sexo: consultation.sexo || formDataFromPayload.sexo || "",
          estado_reproductivo: consultation.estado_reproductivo || formDataFromPayload.estado_reproductivo || "",
          vacunas_vigentes: consultation.vacunas_vigentes || formDataFromPayload.vacunas_vigentes || "",
          vacunas_cual: consultation.vacunas_cual || formDataFromPayload.vacunas_cual || "",
          desparasitacion_interna: consultation.desparasitacion_interna || formDataFromPayload.desparasitacion_interna || "",
          desparasitacion_interna_cual: consultation.desparasitacion_interna_cual || formDataFromPayload.desparasitacion_interna_cual || "",
          desparasitacion_externa: consultation.desparasitacion_externa || formDataFromPayload.desparasitacion_externa || "",
          desparasitacion_externa_producto: consultation.desparasitacion_externa_producto || formDataFromPayload.desparasitacion_externa_producto || "",
          desparasitacion_externa_fecha: consultation.desparasitacion_externa_fecha || formDataFromPayload.desparasitacion_externa_fecha || "",
          habitat: consultation.habitat || formDataFromPayload.habitat || "",
          zona_geografica: consultation.zona_geografica || formDataFromPayload.zona_geografica || "",
          detalle_paciente: consultation.detalle_paciente || payload.detalle_paciente || "",
          // Campos adicionales del paso 2 (observaciones clínicas)
          parametros_vitales: consultation.parametros_vitales || payload.parametros_vitales || "",
          imagenes_videos: consultation.imagenes_videos || payload.imagenes_videos || [],
          laboratorio_estudios: consultation.laboratorio_estudios || payload.laboratorio_estudios || "",
          ambiente_manejo: consultation.ambiente_manejo || payload.ambiente_manejo || "",
          notas_adicionales: consultation.notas_adicionales || payload.notas_adicionales || "",
        }));
        
        // Set AI analysis if exists
        if (consultation.analysis || consultation.ai_analysis) {
          setAiAnalysis(cleanClinicalDisplayText(consultation.analysis || consultation.ai_analysis));
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
      const response = await fetch(`${BACKEND_URL}/api/animal-categories`, {
        headers: getAuthHeaders(veterinarian?.id),
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
    setInfo("");

    try {
      if (consultationId) {
        const resp = await fetch(
          `${BACKEND_URL}/api/consultations/${consultationId}/payload`,
          {
            method: "PUT",
            headers: getAuthHeaders(veterinarian.id),
            body: JSON.stringify({
              category: selectedCategory,
              form_data: formData,
            }),
          },
        );
        if (!resp.ok) {
          const raw = await resp.text().catch(() => "");
          throw new Error(raw || `Error actualizando consulta: ${resp.status}`);
        }
        setStep(2);
        if (isExpertMode) {
          setInfo(
            "Datos del paciente guardados. Puedes continuar con el motivo de consulta o volver más tarde para completar campos faltantes.",
          );
        }
        return;
      }

      const data = await createStageOneConsultation();
      if (!data) return;
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
    setInfo("");

    try {
      let activeConsultationId = consultationId;
      if (!activeConsultationId) {
        if (!selectedCategory) {
          throw new Error("Selecciona la especie del paciente para continuar.");
        }
        const created = await createStageOneConsultation();
        if (!created) return;
        activeConsultationId = created.id;
        setConsultationId(created.id);
      }

      const payloadUpdates = {
        category: selectedCategory,
        form_data: formData,
        detalle_paciente: formData.detalle_paciente,
        // Campos adicionales del paso 2 (observaciones clínicas)
        parametros_vitales: formData.parametros_vitales || null,
        imagenes_videos: formData.imagenes_videos || null,
        laboratorio_estudios: formData.laboratorio_estudios || null,
        ambiente_manejo: formData.ambiente_manejo || null,
        notas_adicionales: formData.notas_adicionales || null,
      };
      // Actualizar vía backend (evita errores "Failed to fetch" por Supabase directo)
      const resp = await fetch(`${BACKEND_URL}/api/consultations/${activeConsultationId}/payload`, {
        method: "PUT",
        headers: getAuthHeaders(veterinarian.id),
        body: JSON.stringify(payloadUpdates),
      });
      if (!resp.ok) {
        const raw = await resp.text().catch(() => "");
        throw new Error(raw || `Error actualizando consulta: ${resp.status}`);
      }

      setStep(3);
      setInfo(
        isExpertMode
          ? "Motivo de consulta guardado. Recuerda completar los datos del paciente (paso 1) cuando puedas."
          : "Observaciones guardadas",
      );
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

    // Verificar membresía Premium o consultas restantes
    const membershipType = veterinarian?.membership_type?.toLowerCase();
    const consultationsRemaining = veterinarian?.consultations_remaining || 0;
    const hasPremium = membershipType === "premium";
    const hasTrialConsultations = !membershipType && consultationsRemaining > 0;

    if (!hasPremium && !hasTrialConsultations) {
      // Determinar el nombre del plan actual
      let planName = "Sin membresía";
      if (membershipType) {
        planName = membershipType.charAt(0).toUpperCase() + membershipType.slice(1);
      }
      
      setError(
        `Los análisis avanzados solo están disponibles para miembros Premium. Tu plan actual es: ${planName}. Por favor, actualiza tu membresía para acceder a esta función.`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/consultations/${consultationId}/analyze`,
        {
          method: "POST",
          headers: getAuthHeaders(veterinarian?.id),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error en análisis");
      }

      const result = await response.json();
      setAiAnalysis(cleanClinicalDisplayText(result.analysis));
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

  if (isExpertMode && !isPremiumMember(veterinarian)) {
    return (
      <div className="consultation-page">
        <div className="container">
          <div className="premium-required">
            <div className="premium-icon">🔒</div>
            <h2>Manejo Experto — Premium</h2>
            <p>
              El modo Manejo Experto está disponible exclusivamente para miembros Premium.
            </p>
            <Button type="button" onClick={() => setView("membership")}>
              Ver Planes Premium
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="consultation-page">
        
        <div className="page-title-header">
          <div className="container">
            <div className="page-title-content">
              <div className="page-title-icon">🩺</div>
              <div className="page-title-text">
                <h1>
                  {isExpertMode ? "Completar Datos del Paciente" : "Nueva Consulta Veterinaria"}
                </h1>
                <p>
                  {isExpertMode
                    ? "Completa los campos faltantes del paciente. Puedes volver al motivo de consulta cuando termines."
                    : "Complete la información del paciente para iniciar el diagnóstico clínico"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {info && (
            <div className="info-message" style={{ marginBottom: "20px" }}>
              {info}
            </div>
          )}
          {error && (
            <div className="error-message" style={{ 
              padding: "20px", 
              borderRadius: "8px",
              marginBottom: "20px"
            }}>
              {error}
              {(error.includes("agotado") || error.includes("consultas de prueba") || error.includes("membresía activa")) && (
                <div style={{ marginTop: "15px" }}>
                  <Button
                    type="button"
                    onClick={() => setView("membership")}
                    className="mt-2.5"
                  >
                    Ver Planes de Membresía
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="consultation-layout">
            <div className="consultation-main">
              <div className="consultation-form-container">
                {renderStepper(1)}

                <form onSubmit={handleSubmitStep1} className="consultation-form">
                  {!existingConsultationId && onClinicalContextChange && (
                    <PatientSelector
                      value={clinicalContext?.patientId}
                      onChange={(ctx) => onClinicalContextChange(ctx)}
                    />
                  )}
                  {clinicalContext?.patientId && !existingConsultationId && (
                    <PatientAntecedents
                      veterinarianId={veterinarian?.id}
                      patientId={clinicalContext.patientId}
                      patient={clinicalContext.patient}
                    />
                  )}
                  {renderCategorySelector()}

                  {/* Renderizar el formulario específico según la categoría seleccionada */}
                  {renderSpeciesForm()}

                  <div className="form-actions">
                    <Button
                      type="button"
                      variant="guiaaSoft"
                      size="consult"
                      className="min-w-[140px]"
                      onClick={() => (isExpertMode ? setStep(2) : setView("dashboard"))}
                    >
                      {isExpertMode ? "Volver al motivo" : "Cancelar"}
                    </Button>
                    <Button
                      type="submit"
                      variant="guiaaPrimary"
                      size="consult"
                      disabled={loading || !selectedCategory}
                      className="group min-w-[140px] gap-2"
                    >
                      {loading
                        ? "Guardando..."
                        : isExpertMode
                          ? "Guardar y volver al motivo"
                          : "Continuar al Paso 2"}
                      {!loading && <span className="transition-transform group-hover:translate-x-1">→</span>}
                    </Button>
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

              <div className="sidebar-section mt-8 border-t border-border pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full text-sm"
                  onClick={() => setView("dashboard")}
                >
                  Guardar como Borrador
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="consultation-page">
        
        <div className="page-title-header">
          <div className="container">
            <div className="page-title-content">
              <div className="page-title-icon">📝</div>
              <div className="page-title-text">
                <h1>{isExpertMode ? "Manejo Experto" : "Motivo de Consulta"}</h1>
                <p>
                  {isExpertMode
                    ? "Describe el caso clínico ahora. Los datos estructurados del paciente pueden completarse después."
                    : "Describa detalladamente los síntomas y observaciones del paciente"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {info && (
            <div className="info-message" style={{ marginBottom: "20px" }}>
              {info}
            </div>
          )}
          {error && (
            <div className="error-message" style={{ 
              padding: "20px", 
              borderRadius: "8px",
              marginBottom: "20px"
            }}>
              {error}
              {(error.includes("agotado") || error.includes("consultas de prueba") || error.includes("membresía activa")) && (
                <div style={{ marginTop: "15px" }}>
                  <Button
                    type="button"
                    onClick={() => setView("membership")}
                    className="mt-2.5"
                  >
                    Ver Planes de Membresía
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="consultation-form-container">
            {renderStepper(2)}

            <form onSubmit={handleSubmitStep2} className="consultation-form">
              {isExpertMode && renderCategorySelector("Especie del paciente")}
              <div className="form-section">
                <h3>Detalle del Paciente</h3>
                <div className="form-group">
                  <label>
                    ANOTA CON EL MAYOR DETALLE LOS DATOS SOBRE EL PACIENTE.
                  </label>
                  <Textarea
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
                    className="min-h-[400px] resize-y p-5 text-base leading-relaxed"
                  />
                </div>
              </div>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="guiaaSoft"
                  size="consult"
                  className="mr-auto min-w-[140px]"
                  onClick={() => setStep(1)}
                >
                  {isExpertMode ? "← Completar datos del paciente" : "← Volver"}
                </Button>
                <Button
                  type="submit"
                  variant="guiaaPrimary"
                  size="consult"
                  disabled={loading || (isExpertMode && !selectedCategory)}
                  className="group min-w-[140px] gap-2"
                >
                  {loading ? "Guardando..." : "Continuar al Análisis"}
                  {!loading && <span className="transition-transform group-hover:translate-x-1">→</span>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="consultation-page">
        
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
          {info && (
            <div className="info-message" style={{ marginBottom: "20px" }}>
              {info}
              {isExpertMode && (
                <div style={{ marginTop: "12px" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    Completar datos del paciente
                  </Button>
                </div>
              )}
            </div>
          )}
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

                  {(veterinarian?.membership_type?.toLowerCase() === "premium" || 
                    (veterinarian?.consultations_remaining || 0) > 0) ? (
                    <div>
                    <Button
                      type="button"
                      variant="guiaaDiagnosis"
                      size="consultWide"
                      onClick={handleAIAnalysis}
                      disabled={loading}
                      className="group gap-2.5"
                    >
                      {loading ? "Procesando..." : "Obtener Análisis"}
                      {!loading && (
                        <span className="text-lg transition-transform group-hover:scale-110">✨</span>
                      )}
                    </Button>
                      {veterinarian?.membership_type?.toLowerCase() !== "premium" && 
                       (veterinarian?.consultations_remaining || 0) > 0 && (
                        <p style={{ 
                          marginTop: "12px", 
                          fontSize: "14px", 
                          color: "#64748b",
                          textAlign: "center" 
                        }}>
                          Consultas restantes: {veterinarian.consultations_remaining}
                        </p>
                      )}
                    </div>
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
                        Los análisis clínicos avanzados solo están disponibles para miembros Premium.
                        Actualiza tu plan para acceder a esta función exclusiva.
                      </p>
                      <Button
                        type="button"
                        onClick={() => setView("membership")}
                        className="mt-2.5"
                      >
                        Ver Planes Premium
                      </Button>
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
                    <Button
                      type="button"
                      onClick={() => setView("consultation-history")}
                    >
                      Ver en Historial
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
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
                    >
                      Nueva Consulta
                    </Button>
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
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [pdfError, setPdfError] = useState("");

  const handleDownloadPdf = async (consultationId) => {
    setPdfError("");
    setPdfLoadingId(consultationId);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/consultation/${consultationId}`,
      );
      if (!response.ok) {
        throw new Error("No se pudo cargar la consulta para exportar");
      }
      const consultation = await response.json();
      await downloadConsultationPdf(consultation, { veterinarian });
      setPdfError("");
    } catch (error) {
      console.error("Error generating consultation PDF:", error);
      setPdfError(error.message || "Error al generar el PDF");
    } finally {
      setPdfLoadingId(null);
    }
  };

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
                    {cleanClinicalDisplayText(selectedConsultation.analysis || "")}
                  </pre>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="clinical-actions clinical-actions-bar">
              <Button
                type="button"
                variant="guiaaSoft"
                className="clinical-action-btn"
                onClick={() => setSelectedConsultation(null)}
              >
                Cerrar ficha
              </Button>
              <Button
                type="button"
                variant="guiaaSoft"
                className="clinical-action-btn gap-2"
                disabled={pdfLoadingId === selectedConsultation.id}
                onClick={() => handleDownloadPdf(selectedConsultation.id)}
              >
                <FileDown size={16} aria-hidden="true" />
                <span>
                  {pdfLoadingId === selectedConsultation.id
                    ? "Generando PDF..."
                    : "Descargar PDF"}
                </span>
              </Button>
              {selectedConsultation.status !== 'completed' && openConsultation && (
                <Button
                  type="button"
                  variant="guiaaPrimary"
                  className="clinical-action-btn"
                  onClick={() => openConsultation(selectedConsultation.id)}
                >
                  Continuar consulta
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
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
          <Button
            type="button"
            onClick={() => setView("new-consultation")}
          >
            Nueva Consulta
          </Button>
        </div>

        {searching && <div className="searching-indicator">Buscando...</div>}

        {pdfError && (
          <div className="error-message" style={{ marginBottom: "20px" }}>
            {pdfError}
          </div>
        )}

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

              const categoryLabel = category
                ? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                : "Especie";

              return (
                <div key={consultation.id} className="history-card">
                  {/* Header con gradiente */}
                  <div className={`history-card-header ${status}`}>
                    <div className="history-card-top">
                      <span className="history-card-id" title={consultationNumber || "ID-N/A"}>
                        {consultationNumber || "ID-N/A"}
                      </span>
                      <span className={`history-status-badge ${status}`}>
                        {status === "completed" && "✓ "}
                        {statusLabel}
                      </span>
                    </div>
                    <div className="history-card-patient">
                      <div className="history-avatar" aria-hidden="true">
                        {icon}
                      </div>
                      <div className="history-patient-info">
                        <h3>{patientName}</h3>
                        <div className="history-patient-meta">
                          <span className="history-meta-item history-meta-species">
                            {categoryLabel}
                          </span>
                          {breed && (
                            <span className="history-meta-item">{breed}</span>
                          )}
                          {age && (
                            <span className="history-meta-item">{age}</span>
                          )}
                        </div>
                        {ratingValue > 0 && (
                          <div
                            className="history-rating"
                            aria-label={`Calificación ${ratingValue} de 5`}
                          >
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span
                                key={idx}
                                className={`paw-static ${idx < ratingValue ? "filled" : ""}`}
                              >
                                🐾
                              </span>
                            ))}
                          </div>
                        )}
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
                                const cleaned = cleanClinicalDisplayText(consultation.analysis || "");
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
                  <div className="history-card-footer history-card-footer-actions">
                    <Button
                      type="button"
                      variant="guiaaPrimary"
                      size="consult"
                      className="history-card-action-btn group gap-2.5"
                      onClick={() => handleViewConsultation(consultation.id)}
                    >
                      <span>Ver ficha clínica</span>
                      <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
                    </Button>
                    <Button
                      type="button"
                      variant="guiaaSoft"
                      size="consult"
                      className="history-card-action-btn gap-2"
                      disabled={pdfLoadingId === consultation.id}
                      onClick={() => handleDownloadPdf(consultation.id)}
                    >
                      <FileDown size={16} aria-hidden="true" />
                      <span>
                        {pdfLoadingId === consultation.id
                          ? "Generando PDF..."
                          : "Descargar PDF"}
                      </span>
                    </Button>
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
              <Button
                type="button"
                onClick={() => setView("new-consultation")}
              >
                Crear Primera Consulta
              </Button>
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
  const [imageClinicalContext, setImageClinicalContext] = useState(null);
  const [additionalContext, setAdditionalContext] = useState("");
  const [consultationId, setConsultationId] = useState("");
  const [pastedStudyData, setPastedStudyData] = useState("");  // Datos de estudio pegados
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
      const response = await fetch(
        `${BACKEND_URL}/api/medical-images/history?limit=50`,
        {
          headers: {
            "X-Veterinarian-Id": veterinarian.id,
          },
        },
      );
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          errText ? errText.slice(0, 200) : `Error del servidor: ${response.status}`,
        );
      }
      const json = await response.json();
      const rows = Array.isArray(json.images) ? json.images : [];
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
        patient_name: imageClinicalContext?.patient?.name || patientName || null,
        patient_id: imageClinicalContext?.patientId || null,
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
      setImageClinicalContext(null);
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
        <div className="container">
          <div className="premium-required">
            <div className="premium-icon">🔒</div>
            <h2>Función Premium Requerida</h2>
            <p>
              La interpretación de pruebas de laboratorio está disponible
              exclusivamente para miembros Premium.
            </p>
            <Button
              type="button"
              onClick={() => setView("membership")}
            >
              Ver Planes Premium
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-images-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>🔬 Pruebas de Laboratorio</h1>
            <p>
              Interpretación de análisis de sangre y estudios clínicos
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Nueva Interpretación" : "Ver Historial"}
          </Button>
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
                
                {/* Alerta de ayuda para copiar PDFs */}
                <div style={{
                  marginBottom: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>ℹ️</span>
                      <span>¿Cómo copiar texto de un PDF?</span>
                    </span>
                    <span style={{ fontSize: '18px' }}>{showHelp ? '▼' : '▶'}</span>
                  </button>
                  
                  {showHelp && (
                    <div style={{
                      padding: '16px',
                      borderTop: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'var(--text-primary)'
                    }}>
                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}>
                          Caso 1: PDF normal (no escaneado ni bloqueado)
                        </strong>
                        <div style={{ marginLeft: '12px', marginBottom: '12px' }}>
                          <strong>En un lector como Adobe Acrobat Reader:</strong>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            <li>Abre el PDF.</li>
                            <li>Haz clic con el botón derecho y elige la herramienta de selección (o simplemente intenta arrastrar sobre el texto).</li>
                            <li>Arrastra el cursor sobre el texto que quieras copiar.</li>
                            <li>Clic derecho → Copiar, o usa Ctrl+C y luego Ctrl+V donde lo quieras pegar.</li>
                          </ul>
                        </div>
                        <div style={{ marginLeft: '12px' }}>
                          <strong>En el navegador (Chrome, Edge, etc.):</strong>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            <li>Abre el PDF en una pestaña.</li>
                            <li>Selecciona el texto con el mouse.</li>
                            <li>Ctrl+C y luego Ctrl+V en tu editor (Word, Bloc de notas, etc.).</li>
                          </ul>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}>
                          Caso 2: PDF escaneado (es una imagen)
                        </strong>
                        <div style={{ marginLeft: '12px' }}>
                          <p style={{ marginBottom: '8px' }}>
                            Si al arrastrar el mouse no se selecciona texto, el PDF probablemente es una imagen y necesitas OCR.
                          </p>
                          <strong>Opciones fáciles y gratis:</strong>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            <li>Usar una web de OCR (por ejemplo iLovePDF "OCR PDF", PDF Candy "Extraer texto" o similares). Entra al sitio, sube tu PDF, descarga el TXT/Word resultante y copia el texto.</li>
                            <li>Convertir el PDF a Word/TXT en webs tipo Smallpdf, PDFgear, etc., y luego copiar el texto desde el archivo convertido.</li>
                          </ul>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}>
                          Caso 3: PDF protegido contra copia
                        </strong>
                        <div style={{ marginLeft: '12px' }}>
                          <p style={{ marginBottom: '8px' }}>
                            Si sí se ve el texto pero no te deja copiarlo, está protegido:
                          </p>
                          <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            <li>Si conoces la contraseña, ábrelo en Adobe Acrobat y usa la opción de eliminar seguridad para quitar las restricciones, luego copia normalmente.</li>
                            <li>Si no tienes la contraseña, algunas herramientas online ("desbloquear PDF") convierten el archivo a Word o lo dejan sin protección, y de ahí ya puedes copiar, siempre respetando derechos de autor.</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}>
                          Alternativa rápida: abrir en Word o Google Docs
                        </strong>
                        <ul style={{ marginTop: '4px', paddingLeft: '20px', marginLeft: '12px' }}>
                          <li>Abrir PDF en Microsoft Word: Word lo convierte a documento editable y ya puedes copiar el texto.</li>
                          <li>Subir el PDF a Google Drive, clic derecho → "Abrir con" → Documentos de Google, y luego copiar desde ahí.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Área para pegar datos del estudio */}
                <div className="form-group">
                  <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    📋 Copia y pega los datos de tu estudio
                  </label>
                  <Textarea
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
                    rows={6}
                    className="resize-y rounded-lg border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] font-mono text-[13px] leading-relaxed"
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

              <PatientSelector
                value={imageClinicalContext?.patientId}
                onChange={(ctx) => {
                  setImageClinicalContext(ctx);
                  if (ctx?.patient?.name) {
                    setPatientName(ctx.patient.name);
                  }
                }}
              />

              <div className="form-row">
                {!imageClinicalContext?.patientId && (
                  <div className="form-group">
                    <label>Nombre del Paciente (Opcional)</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Ej: Max, Luna, Rocky"
                    />
                  </div>
                )}

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
                <Textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Información adicional relevante para la interpretación..."
                  rows={4}
                  className="min-h-[100px] resize-y"
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setView("dashboard")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !pastedStudyData || !pastedStudyData.trim()}
                >
                  {loading ? "Analizando..." : "Interpretar Estudio"}
                </Button>
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
                      <pre style={{margin: 0, fontFamily: "inherit", fontSize: "14px", lineHeight: "1.6", color: "#1e293b"}}>{cleanClinicalDisplayText(result.analysis)}</pre>
                    ) : result.detailed_analysis ? (
                      <pre style={{margin: 0, fontFamily: "inherit", fontSize: "14px", lineHeight: "1.6", color: "#1e293b"}}>{cleanClinicalDisplayText(result.detailed_analysis)}</pre>
                    ) : (
                      <div style={{color: "#64748b", fontStyle: "italic"}}>No hay análisis disponible</div>
                    )}
                  </div>
                </div>

                <div className="result-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setResult(null)}
                  >
                    Nueva Interpretación
                  </Button>
                  <Button type="button" onClick={() => setShowHistory(true)}>
                    Ver Historial
                  </Button>
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
                      {(() => {
                        const preview = item.analysis
                          ? cleanClinicalDisplayText(item.analysis)
                          : item.findings && Array.isArray(item.findings)
                            ? item.findings.join(", ")
                            : item.findings
                              ? String(item.findings)
                              : item.detailed_analysis
                                ? cleanClinicalDisplayText(item.detailed_analysis)
                                : "Sin análisis disponible";
                        return preview.length > 150 ? `${preview.substring(0, 150)}...` : preview;
                      })()}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setResult(item);
                        setShowHistory(false);
                      }}
                    >
                      Ver Completo
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔬</div>
                <h3>No hay interpretaciones aún</h3>
                <p>Comienza pegando los datos de tu primer estudio</p>
                <Button type="button" onClick={() => setShowHistory(false)}>
                  Nueva Interpretación
                </Button>
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

  // Refrescar perfil al cargar la página de membresía para tener datos actualizados
  // Usar un timeout para evitar que el refresh cause redirecciones inmediatas
  useEffect(() => {
    if (veterinarian?.id) {
      // Usar setTimeout para que el refresh ocurra después de que la vista esté establecida
      const timeoutId = setTimeout(() => {
        refreshProfile();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, []); // Solo ejecutar al montar, no cuando cambia veterinarian

  // Si no está autenticado, mostrar mensaje y opción de login
  if (!veterinarian) {
    return (
      <div className="membership-page">
        <div className="container">
          <div className="auth-required-message" style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#fff3cd",
            border: "2px solid #ffc107",
            borderRadius: "8px",
            marginTop: "40px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔒</div>
            <h2 style={{ marginBottom: "15px", color: "#856404" }}>
              Inicia sesión para ver y comprar membresías
            </h2>
            <p style={{ marginBottom: "20px", color: "#856404" }}>
              Necesitas tener una cuenta para acceder a nuestros planes de membresía.
            </p>
            <Button
              type="button"
              onClick={() => setView("login")}
              className="mr-2.5"
            >
              Iniciar Sesión
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setView("register")}
            >
              Registrarse
            </Button>
          </div>
        </div>
      </div>
    );
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
      console.log("Veterinarian ID:", veterinarian.id);
      console.log("Veterinarian completo:", veterinarian);
      
      const headers = getAuthHeaders(veterinarian.id);
      console.log("Headers enviados:", headers);
      
      const response = await fetch(
        `${BACKEND_URL}/api/payments/checkout/session`,
        {
          method: "POST",
          headers: headers,
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
      console.error("Error completo:", error);
      // Mostrar mensaje más detallado en consola para debugging
      if (error.message) {
        console.error("Mensaje de error:", error.message);
      }
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
                <Button type="button" onClick={() => setView("dashboard")}>
                  Ir al Dashboard
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setView("new-consultation")}
                >
                  Nueva Consulta
                </Button>
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
                <Button type="button" onClick={() => setView("membership")}>
                  Intentar Nuevamente
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setView("dashboard")}
                >
                  Volver al Dashboard
                </Button>
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
                <Button type="button" onClick={() => setView("membership")}>
                  Volver a Membresías
                </Button>
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setView("dashboard")}
                >
                  Ir al Dashboard
                </Button>
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
