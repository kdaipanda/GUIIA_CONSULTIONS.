import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  DollarSign,
  Stethoscope,
  Users,
  PawPrint,
  Package,
  Plus,
  ArrowRight,
  AlertCircle,
  Gem,
  BarChart3,
  User,
} from "lucide-react";
import { useVet } from "../../context/VetContext";
import { useClinic } from "../../context/ClinicContext";
import { fetchDashboardOverview } from "../../lib/clinicApi";
import { notifyError } from "../../lib/appToast";
import { BACKEND_URL } from "../../lib/backendUrl";
import {
  DEFAULT_PACKAGES,
  getMembershipQuota,
  parseMembershipCatalogResponse,
} from "../../lib/membershipPlans";
import { Button } from "../../components/ui/button";
import "./clinicDashboardPage.css";
import "./clinicPageShared.css";

const STATUS_LABELS = {
  scheduled: "Programada",
  confirmed: "Confirmada",
};

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function scrollToCdsPanel() {
  document.getElementById("dashboard-cds-panel")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function DashboardKpiSkeleton() {
  return (
    <div className="clinic-report-kpi-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="clinic-report-kpi clinic-dashboard-kpi-skeleton">
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text medium" />
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="clinic-dashboard-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="clinic-dashboard-section-skeleton">
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-text long" />
          <div className="skeleton skeleton-text medium" />
        </div>
      ))}
    </div>
  );
}

export function ClinicDashboardPage({ setView, onStartConsultation }) {
  const navigate = useNavigate();
  const { veterinarian } = useVet();
  const { organization } = useClinic();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membershipPackages, setMembershipPackages] = useState(DEFAULT_PACKAGES);

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    try {
      const data = await fetchDashboardOverview(veterinarian.id);
      setDashboard(data.dashboard || null);
    } catch (err) {
      notifyError(err.message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/membership/packages`);
        if (!response.ok || cancelled) return;
        const data = await response.json();
        setMembershipPackages(parseMembershipCatalogResponse(data).packages);
      } catch {
        /* fallback */
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const membershipQuota = useMemo(
    () => getMembershipQuota(veterinarian, membershipPackages),
    [veterinarian, membershipPackages],
  );

  const go = (view, path) => {
    setView?.(view);
    navigate(path);
  };

  const today = dashboard?.today || {};
  const week = dashboard?.week || {};
  const upcoming = dashboard?.upcoming_appointments || [];
  const pendingRequests = dashboard?.pending_requests || [];
  const lowStock = dashboard?.low_stock_products || [];

  const greetingName = veterinarian?.nombre?.split(" ")[0] || "Doctor";
  const todayLabel = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const membershipPillLabel =
    membershipQuota.planKey && membershipQuota.maxConsultations > 0
      ? `${membershipQuota.planName} · ${membershipQuota.consultations}/${membershipQuota.maxConsultations} CDS`
      : membershipQuota.planKey
        ? membershipQuota.planName
        : "Sin plan activo";

  return (
    <div className="clinic-page clinic-page-guiaa clinic-dashboard-page">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>
            {getTimeGreeting()}, {greetingName}
          </h1>
          <p>
            {organization?.name
              ? `Resumen operativo de ${organization.name}`
              : "Resumen operativo de tu consultorio"}
          </p>
          <div className="clinic-dashboard-meta">
            <span className="clinic-dashboard-date-pill">
              <CalendarDays size={13} aria-hidden />
              {todayLabel}
            </span>
            <button
              type="button"
              className={`clinic-dashboard-plan-pill${
                membershipQuota.planKey ? "" : " clinic-dashboard-plan-pill--empty"
              }`}
              onClick={() => go("membership", "/app/membresia")}
            >
              <Gem size={13} aria-hidden />
              {membershipPillLabel}
            </button>
          </div>
        </div>
        <div className="clinic-dashboard-actions">
          <Button type="button" onClick={() => go("agenda", "/app/agenda")}>
            <Plus size={16} aria-hidden />
            Nueva cita
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => go("new-consultation", "/app/consultas/nueva")}
          >
            <Stethoscope size={16} aria-hidden />
            Nueva consulta
          </Button>
        </div>
      </div>

      {loading ? (
        <>
          <DashboardKpiSkeleton />
          <SectionSkeleton />
        </>
      ) : (
        <>
          <div className="clinic-report-kpi-grid premium-stagger">
            <button
              type="button"
              className="clinic-report-kpi clinic-dashboard-kpi-btn"
              onClick={() => go("agenda", "/app/agenda")}
            >
              <div className="clinic-report-kpi-head">
                <span className="clinic-report-kpi-icon">
                  <CalendarDays size={18} aria-hidden />
                </span>
                <span className="clinic-report-kpi-label">Citas hoy</span>
              </div>
              <div className="clinic-report-kpi-value">{today.appointments_upcoming ?? 0}</div>
              <div className="clinic-report-kpi-hint">
                {today.appointments_total ?? 0} en total · {week.appointments ?? 0} esta semana
              </div>
            </button>

            <button
              type="button"
              className="clinic-report-kpi clinic-dashboard-kpi-btn"
              onClick={() => go("billing", "/app/facturacion")}
            >
              <div className="clinic-report-kpi-head">
                <span className="clinic-report-kpi-icon">
                  <DollarSign size={18} aria-hidden />
                </span>
                <span className="clinic-report-kpi-label">Ingresos hoy</span>
              </div>
              <div className="clinic-report-kpi-value">{formatMoney(today.revenue_paid)}</div>
              <div className="clinic-report-kpi-hint">
                {formatMoney(week.revenue_paid)} en 7 días
              </div>
            </button>

            <button
              type="button"
              className="clinic-report-kpi clinic-dashboard-kpi-btn"
              onClick={() => {
                scrollToCdsPanel();
              }}
            >
              <div className="clinic-report-kpi-head">
                <span className="clinic-report-kpi-icon">
                  <Stethoscope size={18} aria-hidden />
                </span>
                <span className="clinic-report-kpi-label">Consultas CDS hoy</span>
              </div>
              <div className="clinic-report-kpi-value">{today.consultations ?? 0}</div>
              <div className="clinic-report-kpi-hint">
                {week.consultations ?? 0} esta semana · ver panel CDS
              </div>
            </button>

            <button
              type="button"
              className="clinic-report-kpi clinic-dashboard-kpi-btn"
              onClick={() => {
                if ((today.pending_requests ?? 0) > 0) {
                  go("agenda", "/app/agenda");
                } else if ((today.low_stock_count ?? 0) > 0) {
                  go("inventory", "/app/inventario");
                } else {
                  go("reports", "/app/reportes");
                }
              }}
            >
              <div className="clinic-report-kpi-head">
                <span className="clinic-report-kpi-icon">
                  <AlertCircle size={18} aria-hidden />
                </span>
                <span className="clinic-report-kpi-label">Pendientes</span>
              </div>
              <div className="clinic-report-kpi-value">
                {(today.pending_requests ?? 0) + (today.low_stock_count ?? 0)}
              </div>
              <div className="clinic-report-kpi-hint">
                {today.pending_requests ?? 0} solicitudes · {today.low_stock_count ?? 0} stock bajo
              </div>
            </button>
          </div>

          <div className="clinic-dashboard-grid">
            <section className="clinic-settings-card">
              <div className="clinic-dashboard-section-head">
                <h2>
                  <CalendarDays size={18} aria-hidden />
                  Próximas citas de hoy
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => go("agenda", "/app/agenda")}
                >
                  Ver agenda
                  <ArrowRight size={14} aria-hidden />
                </Button>
              </div>
              {upcoming.length === 0 ? (
                <p className="clinic-dashboard-empty">No hay citas activas para hoy.</p>
              ) : (
                <ul className="clinic-dashboard-list">
                  {upcoming.map((appt) => (
                    <li key={appt.id} className="clinic-dashboard-list-item">
                      <div>
                        <strong>{formatTime(appt.starts_at)}</strong>
                        <span>{appt.patient_name}</span>
                        {appt.client_name && (
                          <span className="clinic-muted"> · {appt.client_name}</span>
                        )}
                        {appt.reason && (
                          <div className="clinic-muted clinic-dashboard-reason">{appt.reason}</div>
                        )}
                      </div>
                      <div className="clinic-dashboard-list-actions">
                        <span className="clinic-badge">
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                        {onStartConsultation && appt.patient_id && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              onStartConsultation({
                                patientId: appt.patient_id,
                                patientName: appt.patient_name,
                              })
                            }
                          >
                            Consulta
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="clinic-settings-card">
              <div className="clinic-dashboard-section-head">
                <h2>Solicitudes de cita</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => go("agenda", "/app/agenda")}
                >
                  Gestionar
                  <ArrowRight size={14} aria-hidden />
                </Button>
              </div>
              {pendingRequests.length === 0 ? (
                <p className="clinic-dashboard-empty">No hay solicitudes pendientes.</p>
              ) : (
                <ul className="clinic-dashboard-list">
                  {pendingRequests.map((req) => (
                    <li key={req.id} className="clinic-dashboard-list-item">
                      <div>
                        <strong>{req.client_name}</strong>
                        <span className="clinic-muted"> — {req.patient_name}</span>
                        {req.preferred_starts_at && (
                          <div className="clinic-muted">
                            Prefiere: {formatDate(req.preferred_starts_at)}{" "}
                            {formatTime(req.preferred_starts_at)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="clinic-settings-card">
              <div className="clinic-dashboard-section-head">
                <h2>
                  <Package size={18} aria-hidden />
                  Stock bajo
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => go("inventory", "/app/inventario")}
                >
                  Inventario
                  <ArrowRight size={14} aria-hidden />
                </Button>
              </div>
              {lowStock.length === 0 ? (
                <p className="clinic-dashboard-empty">Inventario dentro de niveles normales.</p>
              ) : (
                <ul className="clinic-dashboard-list">
                  {lowStock.map((product) => (
                    <li key={product.id} className="clinic-dashboard-list-item">
                      <div>
                        <strong>{product.name}</strong>
                        <div className="clinic-muted">
                          {product.stock_qty} / mín. {product.min_stock} {product.unit || "pza"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="clinic-settings-card clinic-dashboard-quick">
              <h2>Accesos rápidos</h2>
              <div className="clinic-dashboard-quick-grid">
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("clients", "/app/clientes")}
                >
                  <Users size={20} aria-hidden />
                  Dueños
                </button>
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("patients", "/app/pacientes")}
                >
                  <PawPrint size={20} aria-hidden />
                  Mascotas
                </button>
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("agenda", "/app/agenda")}
                >
                  <CalendarDays size={20} aria-hidden />
                  Agenda
                </button>
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("billing", "/app/facturacion")}
                >
                  <DollarSign size={20} aria-hidden />
                  Ventas
                </button>
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("reports", "/app/reportes")}
                >
                  <BarChart3 size={20} aria-hidden />
                  Reportes
                </button>
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("profile", "/app/perfil")}
                >
                  <User size={20} aria-hidden />
                  Perfil
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
