import React, { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { useVet } from "../../context/VetContext";
import { useClinic } from "../../context/ClinicContext";
import { fetchDashboardOverview } from "../../lib/clinicApi";
import { Button } from "../../components/ui/button";

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

export function ClinicDashboardPage({ setView, onStartConsultation }) {
  const navigate = useNavigate();
  const { veterinarian } = useVet();
  const { organization } = useClinic();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchDashboardOverview(veterinarian.id);
      setDashboard(data.dashboard || null);
    } catch (err) {
      setError(err.message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id]);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <div className="clinic-dashboard-page">
      <div className="clinic-page-header">
        <div>
          <h1>Hola, {greetingName}</h1>
          <p>
            {organization?.name
              ? `Resumen operativo de ${organization.name}`
              : "Resumen operativo de tu consultorio"}
          </p>
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

      {error && <p className="clinic-error">{error}</p>}

      {loading ? (
        <p className="clinic-muted">Cargando dashboard...</p>
      ) : (
        <>
          <div className="clinic-report-kpi-grid">
            <div className="clinic-report-kpi">
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
            </div>
            <div className="clinic-report-kpi">
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
            </div>
            <div className="clinic-report-kpi">
              <div className="clinic-report-kpi-head">
                <span className="clinic-report-kpi-icon">
                  <Stethoscope size={18} aria-hidden />
                </span>
                <span className="clinic-report-kpi-label">Consultas CDS hoy</span>
              </div>
              <div className="clinic-report-kpi-value">{today.consultations ?? 0}</div>
              <div className="clinic-report-kpi-hint">{week.consultations ?? 0} esta semana</div>
            </div>
            <div className="clinic-report-kpi">
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
            </div>
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
                <p className="clinic-muted">No hay citas activas para hoy.</p>
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
                        <span className="clinic-badge">{STATUS_LABELS[appt.status] || appt.status}</span>
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
                <p className="clinic-muted">No hay solicitudes pendientes.</p>
              ) : (
                <ul className="clinic-dashboard-list">
                  {pendingRequests.map((req) => (
                    <li key={req.id} className="clinic-dashboard-list-item">
                      <div>
                        <strong>{req.client_name}</strong>
                        <span className="clinic-muted"> — {req.patient_name}</span>
                        {req.preferred_starts_at && (
                          <div className="clinic-muted">
                            Prefiere: {formatDate(req.preferred_starts_at)} {formatTime(req.preferred_starts_at)}
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
                <p className="clinic-muted">Inventario dentro de niveles normales.</p>
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
                <button type="button" className="clinic-dashboard-quick-btn" onClick={() => go("clients", "/app/clientes")}>
                  <Users size={20} aria-hidden />
                  Dueño
                </button>
                <button type="button" className="clinic-dashboard-quick-btn" onClick={() => go("patients", "/app/pacientes")}>
                  <PawPrint size={20} aria-hidden />
                  Mascotas
                </button>
                <button type="button" className="clinic-dashboard-quick-btn" onClick={() => go("billing", "/app/facturacion")}>
                  <DollarSign size={20} aria-hidden />
                  Ventas
                </button>
                <button type="button" className="clinic-dashboard-quick-btn" onClick={() => go("reports", "/app/reportes")}>
                  <CalendarDays size={20} aria-hidden />
                  Reportes
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
