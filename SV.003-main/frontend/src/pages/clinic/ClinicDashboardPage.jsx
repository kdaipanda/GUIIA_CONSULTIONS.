import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  DollarSign,
  Stethoscope,
  PawPrint,
  Package,
  Plus,
  ArrowRight,
  AlertCircle,
  Gem,
  BarChart3,
  User,
  Zap,
} from "lucide-react";
import { useVet } from "../../context/VetContext";
import { useClinic } from "../../context/ClinicContext";
import { fetchDashboardOverview } from "../../lib/clinicApi";
import { clinicCacheKey, loadClinicData, readClinicDataCache } from "../../lib/clinicDataCache";
import { loadMembershipCatalog, readMembershipCatalogCache } from "../../lib/membershipCatalogCache";
import { DEFAULT_PACKAGES, getMembershipQuota } from "../../lib/membershipPlans";
import { notifyError, notifyQuotaError } from "../../lib/appToast";
import {
  canAccessFeature,
  MEMBERSHIP_FEATURES,
  canCreateConsultation,
  getTrialExhaustedMessage,
} from "../../lib/membershipAccess";
import { Button } from "../../components/ui/button";
import { QuickClientPatientDialog } from "../../components/clinic/QuickClientPatientDialog";
import { ModuleHelpTip } from "../../components/clinic/ModuleHelpTip";
import { useTranslation } from "react-i18next";
import "./clinicDashboardPage.css";
import "./clinicPageShared.css";
import "./helpCenterPage.css";

function localeTag(lang) {
  return (lang || "en").startsWith("es") ? "es-MX" : "en-US";
}

function formatMoney(value, lang) {
  return new Intl.NumberFormat(localeTag(lang), {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatTime(iso, lang) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(localeTag(lang), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso, lang) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(localeTag(lang), {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getTimeGreeting(t) {
  const hour = new Date().getHours();
  if (hour < 12) return t("dashboard.greetingMorning");
  if (hour < 19) return t("dashboard.greetingAfternoon");
  return t("dashboard.greetingEvening");
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
  const { t, i18n } = useTranslation("clinic");
  const lang = i18n.language;
  const navigate = useNavigate();
  const { veterinarian, platformAdmin } = useVet();
  const { organization, role } = useClinic();
  const [dashboard, setDashboard] = useState(() => {
    const cached = readClinicDataCache(clinicCacheKey(veterinarian?.id, "dashboard"));
    return cached?.dashboard ?? null;
  });
  const [loading, setLoading] = useState(() => !readClinicDataCache(clinicCacheKey(veterinarian?.id, "dashboard")));
  const [membershipPackages, setMembershipPackages] = useState(
    () => readMembershipCatalogCache() || DEFAULT_PACKAGES,
  );
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!veterinarian?.id) {
      setLoading(false);
      return;
    }
    const key = clinicCacheKey(veterinarian.id, "dashboard");
    const cached = readClinicDataCache(key);
    if (!cached) setLoading(true);
    try {
      const data = await loadClinicData(key, () => fetchDashboardOverview(veterinarian.id), {
        ttlMs: 90_000,
      });
      setDashboard(data.dashboard || null);
    } catch (err) {
      if (!cached) {
        notifyError(err.message);
        setDashboard(null);
      }
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void loadMembershipCatalog().then((packages) => {
      if (!cancelled) setMembershipPackages(packages);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const membershipQuota = useMemo(
    () => getMembershipQuota(veterinarian, membershipPackages),
    [veterinarian, membershipPackages],
  );

  const accessOptions = useMemo(
    () => ({ platformAdmin, orgRole: role }),
    [platformAdmin, role],
  );
  const canUseInventory = canAccessFeature(
    veterinarian,
    MEMBERSHIP_FEATURES.inventory,
    accessOptions,
  );
  const canUseBilling = canAccessFeature(
    veterinarian,
    MEMBERSHIP_FEATURES.billing,
    accessOptions,
  );
  const canUseReports = canAccessFeature(
    veterinarian,
    MEMBERSHIP_FEATURES.reports,
    accessOptions,
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

  const greetingName = veterinarian?.nombre?.split(" ")[0] || t("common.doctorFallback");
  const todayLabel = new Date().toLocaleDateString(localeTag(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const membershipPillLabel = membershipQuota.trialExhausted
    ? t("dashboard.trialExhaustedPill")
    : membershipQuota.planKey && membershipQuota.maxConsultations > 0
      ? t("dashboard.planCds", {
          plan: membershipQuota.planName,
          used: membershipQuota.consultations,
          max: membershipQuota.maxConsultations,
        })
      : membershipQuota.planKey
        ? membershipQuota.planName
        : t("dashboard.noPlan");

  const startNewConsultation = () => {
    if (!canCreateConsultation(veterinarian, accessOptions)) {
      notifyQuotaError(getTrialExhaustedMessage(), () => go("membership", "/app/membresia"));
      return;
    }
    go("new-consultation", "/app/consultas/nueva");
  };

  const appointmentStatus = (status) =>
    t(`appointmentStatus.${status}`, { defaultValue: status });

  return (
    <div className="clinic-page clinic-page-guiaa clinic-dashboard-page" aria-busy={loading}>
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">{t("shell.eyebrow")}</p>
          <div className="clinic-page-title-row">
            <h1 className="clinic-dashboard-greeting">
              {getTimeGreeting(t)}, {greetingName}
            </h1>
            <ModuleHelpTip topicId="dashboard" setView={setView} />
          </div>
          <p>
            {organization?.name
              ? t("dashboard.summaryNamed", { name: organization.name })
              : t("dashboard.summaryDefault")}
          </p>
          <div className="clinic-dashboard-meta">
            <span className="clinic-dashboard-date-pill">
              <CalendarDays size={13} aria-hidden />
              {todayLabel}
            </span>
            <button
              type="button"
              className={`clinic-dashboard-plan-pill${
                membershipQuota.planKey && !membershipQuota.trialExhausted
                  ? ""
                  : " clinic-dashboard-plan-pill--empty"
              }`}
              onClick={() => go("membership", "/app/membresia")}
            >
              <Gem size={13} aria-hidden />
              {membershipPillLabel}
            </button>
          </div>
        </div>
        <div className="clinic-dashboard-actions">
          <Button type="button" variant="secondary" onClick={() => setQuickDialogOpen(true)}>
            <Zap size={16} aria-hidden />
            {t("dashboard.quickOwnerPet")}
          </Button>
          <Button type="button" onClick={() => go("agenda", "/app/agenda")}>
            <Plus size={16} aria-hidden />
            {t("dashboard.newAppointment")}
          </Button>
          <Button type="button" variant="secondary" onClick={startNewConsultation}>
            <Stethoscope size={16} aria-hidden />
            {t("dashboard.newConsultation")}
          </Button>
        </div>
      </div>

      {membershipQuota.trialExhausted && (
        <div className="clinic-dashboard-trial-banner" role="alert">
          <div>
            <strong>{t("dashboard.trialBannerTitle")}</strong>
            <p>
              {t("dashboard.trialBannerBody", { message: getTrialExhaustedMessage() })}
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => go("membership", "/app/membresia")}>
            {t("dashboard.viewPlans")}
          </Button>
        </div>
      )}

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
              aria-label={t("dashboard.kpiAppointmentsAria", {
                upcoming: today.appointments_upcoming ?? 0,
                total: today.appointments_total ?? 0,
              })}
            >
              <div className="clinic-report-kpi-head">
                <span className="clinic-report-kpi-icon">
                  <CalendarDays size={18} aria-hidden />
                </span>
                <span className="clinic-report-kpi-label">{t("dashboard.kpiAppointments")}</span>
              </div>
              <div className="clinic-report-kpi-value">{today.appointments_upcoming ?? 0}</div>
              <div className="clinic-report-kpi-hint">
                {t("dashboard.kpiAppointmentsHint", {
                  total: today.appointments_total ?? 0,
                  week: week.appointments ?? 0,
                })}
              </div>
            </button>

            {canUseBilling && (
            <button
              type="button"
              className="clinic-report-kpi clinic-dashboard-kpi-btn"
              onClick={() => go("billing", "/app/facturacion")}
              aria-label={t("dashboard.kpiRevenueAria", {
                amount: formatMoney(today.revenue_paid, lang),
              })}
            >
              <div className="clinic-report-kpi-head">
                <span className="clinic-report-kpi-icon">
                  <DollarSign size={18} aria-hidden />
                </span>
                <span className="clinic-report-kpi-label">{t("dashboard.kpiRevenue")}</span>
              </div>
              <div className="clinic-report-kpi-value">{formatMoney(today.revenue_paid, lang)}</div>
              <div className="clinic-report-kpi-hint">
                {t("dashboard.kpiRevenueHint", {
                  week: formatMoney(week.revenue_paid, lang),
                })}
              </div>
            </button>
            )}

            <button
              type="button"
              className="clinic-report-kpi clinic-dashboard-kpi-btn"
              onClick={() => {
                scrollToCdsPanel();
              }}
              aria-label={t("dashboard.kpiCdsAria", {
                count: today.consultations ?? 0,
              })}
            >
              <div className="clinic-report-kpi-head">
                <span className="clinic-report-kpi-icon">
                  <Stethoscope size={18} aria-hidden />
                </span>
                <span className="clinic-report-kpi-label">{t("dashboard.kpiCds")}</span>
              </div>
              <div className="clinic-report-kpi-value">{today.consultations ?? 0}</div>
              <div className="clinic-report-kpi-hint">
                {t("dashboard.kpiCdsHint", { week: week.consultations ?? 0 })}
              </div>
            </button>

            {(canUseInventory || canUseReports) && (
            <button
              type="button"
              className="clinic-report-kpi clinic-dashboard-kpi-btn"
              onClick={() => {
                if ((today.pending_requests ?? 0) > 0) {
                  go("agenda", "/app/agenda");
                } else if (canUseInventory && (today.low_stock_count ?? 0) > 0) {
                  go("inventory", "/app/inventario");
                } else if (canUseReports) {
                  go("reports", "/app/reportes");
                } else {
                  go("agenda", "/app/agenda");
                }
              }}
            >
              <div className="clinic-report-kpi-head">
                <span className="clinic-report-kpi-icon">
                  <AlertCircle size={18} aria-hidden />
                </span>
                <span className="clinic-report-kpi-label">{t("dashboard.kpiPending")}</span>
              </div>
              <div className="clinic-report-kpi-value">
                {(today.pending_requests ?? 0) + (canUseInventory ? (today.low_stock_count ?? 0) : 0)}
              </div>
              <div className="clinic-report-kpi-hint">
                {t("dashboard.kpiPendingHint", {
                  requests: today.pending_requests ?? 0,
                  stock: canUseInventory
                    ? t("dashboard.kpiPendingStock", {
                        count: today.low_stock_count ?? 0,
                      })
                    : "",
                })}
              </div>
            </button>
            )}
          </div>

          <div className="clinic-dashboard-grid">
            <section className="clinic-settings-card">
              <div className="clinic-dashboard-section-head">
                <h2>
                  <CalendarDays size={18} aria-hidden />
                  {t("dashboard.upcomingTitle")}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => go("agenda", "/app/agenda")}
                >
                  {t("dashboard.viewAgenda")}
                  <ArrowRight size={14} aria-hidden />
                </Button>
              </div>
              {upcoming.length === 0 ? (
                <p className="clinic-dashboard-empty">{t("dashboard.noAppointments")}</p>
              ) : (
                <ul className="clinic-dashboard-list">
                  {upcoming.map((appt) => (
                    <li key={appt.id} className="clinic-dashboard-list-item">
                      <div>
                        <strong>{formatTime(appt.starts_at, lang)}</strong>
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
                          {appointmentStatus(appt.status)}
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
                            {t("dashboard.consultation")}
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
                <h2>{t("dashboard.requestsTitle")}</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => go("agenda", "/app/agenda")}
                >
                  {t("dashboard.manage")}
                  <ArrowRight size={14} aria-hidden />
                </Button>
              </div>
              {pendingRequests.length === 0 ? (
                <p className="clinic-dashboard-empty">{t("dashboard.noRequests")}</p>
              ) : (
                <ul className="clinic-dashboard-list">
                  {pendingRequests.map((req) => (
                    <li key={req.id} className="clinic-dashboard-list-item">
                      <div>
                        <strong>{req.client_name}</strong>
                        <span className="clinic-muted"> — {req.patient_name}</span>
                        {req.preferred_starts_at && (
                          <div className="clinic-muted">
                            {t("dashboard.prefers")} {formatDate(req.preferred_starts_at, lang)}{" "}
                            {formatTime(req.preferred_starts_at, lang)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {canUseInventory && (
            <section className="clinic-settings-card">
              <div className="clinic-dashboard-section-head">
                <h2>
                  <Package size={18} aria-hidden />
                  {t("dashboard.lowStockTitle")}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => go("inventory", "/app/inventario")}
                >
                  {t("dashboard.inventory")}
                  <ArrowRight size={14} aria-hidden />
                </Button>
              </div>
              {lowStock.length === 0 ? (
                <p className="clinic-dashboard-empty">{t("dashboard.stockOk")}</p>
              ) : (
                <ul className="clinic-dashboard-list">
                  {lowStock.map((product) => (
                    <li key={product.id} className="clinic-dashboard-list-item">
                      <div>
                        <strong>{product.name}</strong>
                        <div className="clinic-muted">
                          {t("dashboard.stockMin", {
                            qty: product.stock_qty,
                            min: product.min_stock,
                            unit: product.unit || t("dashboard.unitDefault"),
                          })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            )}

            <section className="clinic-settings-card clinic-dashboard-quick">
              <h2>{t("dashboard.quickAccess")}</h2>
              <div className="clinic-dashboard-quick-grid premium-stagger">
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn clinic-dashboard-quick-btn--accent"
                  onClick={() => setQuickDialogOpen(true)}
                >
                  <Zap size={20} aria-hidden />
                  {t("dashboard.quickRegister")}
                </button>
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("clients", "/app/clientes")}
                >
                  <PawPrint size={20} aria-hidden />
                  {t("dashboard.quickClients")}
                </button>
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("agenda", "/app/agenda")}
                >
                  <CalendarDays size={20} aria-hidden />
                  {t("dashboard.quickAgenda")}
                </button>
                {canUseBilling && (
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("billing", "/app/facturacion")}
                >
                  <DollarSign size={20} aria-hidden />
                  {t("dashboard.quickBilling")}
                </button>
                )}
                {canUseReports && (
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("reports", "/app/reportes")}
                >
                  <BarChart3 size={20} aria-hidden />
                  {t("dashboard.quickReports")}
                </button>
                )}
                <button
                  type="button"
                  className="clinic-dashboard-quick-btn"
                  onClick={() => go("profile", "/app/perfil")}
                >
                  <User size={20} aria-hidden />
                  {t("dashboard.quickProfile")}
                </button>
              </div>
            </section>
          </div>
        </>
      )}

      <QuickClientPatientDialog
        open={quickDialogOpen}
        onOpenChange={setQuickDialogOpen}
        veterinarianId={veterinarian?.id}
        onSuccess={load}
      />
    </div>
  );
}
