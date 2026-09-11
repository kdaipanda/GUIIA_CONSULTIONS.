import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  DollarSign,
  PawPrint,
  Stethoscope,
  Users,
  Package,
  TrendingUp,
  FileDown,
  ArrowRight,
} from "lucide-react";
import "./clinicPageShared.css";
import "./helpCenterPage.css";
import { ClinicReportsSkeleton } from "../../components/clinic/ClinicPageUi";
import { ModuleHelpTip } from "../../components/clinic/ModuleHelpTip";
import { useVet } from "../../context/VetContext";
import { fetchReportsOverview } from "../../lib/clinicApi";
import { clinicCacheKey, loadClinicData, readClinicDataCache } from "../../lib/clinicDataCache";
import { notifyError } from "../../lib/appToast";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { Button } from "../../components/ui/button";

const PERIOD_IDS = ["7d", "30d", "month"];

function getPeriodRange(periodId) {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (periodId === "7d") {
    from.setDate(from.getDate() - 6);
  } else if (periodId === "30d") {
    from.setDate(from.getDate() - 29);
  } else if (periodId === "month") {
    from.setDate(1);
  }

  return { from: from.toISOString(), to: to.toISOString() };
}

function formatMoney(value, locale = "es-MX") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function downloadReportCsv(overview, periodLabel, t) {
  if (!overview) return;
  const totals = overview.totals || {};
  const locale = (i18n.language || "en").startsWith("es") ? "es-MX" : "en-US";
  const lines = [
    [t("reports.csvTitle"), periodLabel],
    [t("reports.csvGenerated"), new Date().toLocaleString(locale)],
    [],
    [t("reports.csvMetric"), t("reports.csvValue")],
    [t("reports.csvAppointments"), totals.appointments ?? 0],
    [t("reports.csvCompletedRate"), totals.occupancy_rate ?? 0],
    [t("reports.csvRevenuePaid"), totals.revenue_paid ?? 0],
    [t("reports.csvRevenueUncollected"), (totals.revenue_issued ?? 0) - (totals.revenue_paid ?? 0)],
    [t("reports.csvCdsConsultations"), totals.consultations_ai ?? 0],
    [t("reports.csvOwners"), totals.clients ?? 0],
    [t("reports.csvPets"), totals.patients ?? 0],
    [t("reports.csvLowStock"), totals.low_stock_products ?? 0],
    [],
    [t("reports.csvTopProduct"), t("reports.csvQuantity"), t("reports.csvRevenue")],
    ...(overview.top_products || []).map((p) => [
      p.description,
      p.quantity,
      p.revenue,
    ]),
  ];
  const csv = lines.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-guiaa-${periodLabel.replace(/\s+/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function MiniAreaChart({ data, id, colorFrom, colorTo, ariaLabel }) {
  if (!data?.length) return null;

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
      className="kpi-chart clinic-report-chart"
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
      <polygon className="kpi-chart-area" fill={`url(#${id})`} points={areaPoints} />
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
}

function KpiCard({ icon: Icon, label, value, hint, chart, chartId, colorFrom, colorTo, trendAria }) {
  return (
    <div className="clinic-report-kpi">
      <div className="clinic-report-kpi-head">
        <span className="clinic-report-kpi-icon">
          <Icon size={18} aria-hidden />
        </span>
        <span className="clinic-report-kpi-label">{label}</span>
      </div>
      <div className="clinic-report-kpi-value">{value}</div>
      {hint && <div className="clinic-report-kpi-hint">{hint}</div>}
      {chart && (
        <MiniAreaChart
          data={chart}
          id={chartId}
          colorFrom={colorFrom}
          colorTo={colorTo}
          ariaLabel={trendAria}
        />
      )}
    </div>
  );
}

export function ReportsPage() {
  const { t, i18n } = useTranslation("clinic");
  const moneyLocale = (i18n.language || "en").startsWith("es") ? "es-MX" : "en-US";
  const navigate = useNavigate();
  const { veterinarian } = useVet();
  const [period, setPeriod] = useState("30d");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  const periodOptions = useMemo(
    () =>
      PERIOD_IDS.map((id) => ({
        id,
        label:
          id === "7d"
            ? t("reports.period7")
            : id === "30d"
              ? t("reports.period30")
              : t("reports.periodMonth"),
      })),
    [t],
  );

  const apptStatus = (status) =>
    t(`appointmentStatus.${status}`, { defaultValue: status });
  const invoiceStatus = (status) =>
    t(`invoiceStatus.${status}`, { defaultValue: status });

  const load = useCallback(async () => {
    if (!veterinarian?.id) {
      setLoading(false);
      return;
    }
    const { from, to } = getPeriodRange(period);
    const key = clinicCacheKey(veterinarian.id, "reports", period);
    const cached = readClinicDataCache(key);
    if (cached) {
      setOverview(cached.overview || null);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const data = await loadClinicData(
        key,
        () => fetchReportsOverview(veterinarian.id, from, to),
        { ttlMs: 120_000 },
      );
      setOverview(data.overview || null);
    } catch (err) {
      if (!cached) {
        notifyError(err.message);
        setOverview(null);
      }
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id, period]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = overview?.totals || {};
  const apptSeries = useMemo(
    () => (overview?.series?.appointments || []).map((d) => d.count),
    [overview],
  );
  const consSeries = useMemo(
    () => (overview?.series?.consultations || []).map((d) => d.count),
    [overview],
  );
  const revenueSeries = useMemo(
    () => (overview?.series?.revenue || []).map((d) => d.amount),
    [overview],
  );

  const periodLabel = periodOptions.find((p) => p.id === period)?.label || period;

  const go = (path) => navigate(path);

  return (
    <div className="clinic-page clinic-page-guiaa clinic-reports-page">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">{t("shell.eyebrow")}</p>
          <div className="clinic-page-title-row">
            <h1>{t("reports.title")}</h1>
            <ModuleHelpTip topicId="reports" />
          </div>
          <p>{t("reports.lead")}</p>
        </div>
        <div className="clinic-report-period clinic-reports-period">
          {periodOptions.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant={period === opt.id ? "default" : "secondary"}
              size="sm"
              className="min-h-11"
              onClick={() => setPeriod(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={!overview}
            onClick={() => downloadReportCsv(overview, periodLabel, t)}
          >
            <FileDown size={14} className="mr-1" />
            {t("reports.exportCsv")}
          </Button>
        </div>
      </div>

      {loading ? (
        <ClinicReportsSkeleton />
      ) : (
        <>
          <div className="clinic-report-kpi-grid">
            <KpiCard
              icon={CalendarDays}
              label={t("reports.kpiAppointments")}
              value={totals.appointments ?? 0}
              hint={t("reports.kpiAppointmentsHint", {
                pct: totals.occupancy_rate ?? 0,
              })}
              chart={apptSeries}
              chartId="report-appts"
              colorFrom="#265b93"
              colorTo="#93c5e8"
              trendAria={t("reports.chartTrendAria", { label: t("reports.kpiAppointments") })}
            />
            <KpiCard
              icon={DollarSign}
              label={t("reports.kpiRevenue")}
              value={formatMoney(totals.revenue_paid, moneyLocale)}
              hint={t("reports.kpiRevenueHint", {
                count: totals.invoices ?? 0,
              })}
              chart={revenueSeries}
              chartId="report-revenue"
              colorFrom="#3d9b8f"
              colorTo="#a7e0d8"
              trendAria={t("reports.chartTrendAria", { label: t("reports.kpiRevenue") })}
            />
            <KpiCard
              icon={Stethoscope}
              label={t("reports.kpiCds")}
              value={totals.consultations_ai ?? 0}
              chart={consSeries}
              chartId="report-cons"
              colorFrom="#0c2d4d"
              colorTo="#7ba3c4"
              trendAria={t("reports.chartTrendAria", { label: t("reports.kpiCds") })}
            />
            <KpiCard
              icon={Users}
              label={t("reports.kpiOwners")}
              value={totals.clients ?? 0}
              hint={t("reports.kpiOwnersHint", {
                count: totals.patients ?? 0,
              })}
            />
            <KpiCard
              icon={PawPrint}
              label={t("reports.kpiPets")}
              value={totals.patients ?? 0}
            />
            <KpiCard
              icon={Package}
              label={t("reports.kpiLowStock")}
              value={totals.low_stock_products ?? 0}
              hint={
                totals.low_stock_products > 0
                  ? t("reports.kpiLowHintWarn")
                  : t("reports.kpiLowHintOk")
              }
            />
          </div>

          <div className="clinic-report-panels">
            <section className="clinic-report-panel">
              <h2>
                <TrendingUp size={18} aria-hidden />
                {t("reports.byStatus")}
              </h2>
              {Object.keys(overview?.appointments_by_status || {}).length === 0 ? (
                <p className="clinic-report-empty">{t("reports.emptyAppointments")}</p>
              ) : (
                <ul className="clinic-report-breakdown">
                  {Object.entries(overview.appointments_by_status).map(([status, count]) => (
                    <li key={status}>
                      <span>{apptStatus(status)}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="clinic-report-panel">
              <h2>
                <BarChart3 size={18} aria-hidden />
                {t("billing.statReceipts")}
              </h2>
              {Object.keys(overview?.invoices_by_status || {}).length === 0 ? (
                <p className="clinic-report-empty">{t("reports.emptyReceipts")}</p>
              ) : (
                <ul className="clinic-report-breakdown">
                  {Object.entries(overview.invoices_by_status).map(([status, count]) => (
                    <li key={status}>
                      <span>{invoiceStatus(status)}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
              {(totals.revenue_issued ?? 0) > (totals.revenue_paid ?? 0) && (
                <p className="clinic-report-note">
                  {t("reports.issuedUncollected", {
                    amount: formatMoney(
                      (totals.revenue_issued || 0) - (totals.revenue_paid || 0),
                      moneyLocale,
                    ),
                  })}
                </p>
              )}
            </section>
          </div>

          <div className="clinic-report-panels">
            <section className="clinic-report-panel">
              <div className="clinic-report-panel-head">
                <h2>
                  <Package size={18} aria-hidden />
                  {t("reports.topProducts")}
                </h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => go("/app/facturacion")}>
                  {t("reports.salesLink")} <ArrowRight size={14} />
                </Button>
              </div>
              {(overview?.top_products || []).length === 0 ? (
                <p className="clinic-report-empty">{t("reports.emptySales")}</p>
              ) : (
                <ul className="clinic-report-breakdown">
                  {overview.top_products.map((p, idx) => (
                    <li key={`${p.description}-${idx}`}>
                      <span>{p.description}</span>
                      <strong>
                        {p.quantity} · {formatMoney(p.revenue, moneyLocale)}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="clinic-report-panel">
              <div className="clinic-report-panel-head">
                <h2>
                  <Package size={18} aria-hidden />
                  {t("reports.inventoryMovements")}
                </h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => go("/app/inventario")}>
                  {t("reports.inventoryLink")} <ArrowRight size={14} />
                </Button>
              </div>
              <ul className="clinic-report-breakdown">
                <li>
                  <span>{t("reports.stockIn")}</span>
                  <strong>{overview?.stock_movements?.in ?? 0}</strong>
                </li>
                <li>
                  <span>{t("reports.stockOut")}</span>
                  <strong>{overview?.stock_movements?.out ?? 0}</strong>
                </li>
                <li>
                  <span>{t("reports.stockAdjust")}</span>
                  <strong>{overview?.stock_movements?.adjustment ?? 0}</strong>
                </li>
              </ul>
              {(overview?.low_stock_list || []).length > 0 && (
                <>
                  <h3 className="clinic-report-subtitle">{t("reports.lowStockNow")}</h3>
                  <ul className="clinic-report-breakdown">
                    {overview.low_stock_list.map((p) => (
                      <li key={p.name}>
                        <span>{p.name}</span>
                        <strong>
                          {t("reports.stockMin", {
                            qty: p.stock_qty,
                            min: p.min_stock,
                            unit: p.unit || t("reports.unitPiece"),
                          })}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
