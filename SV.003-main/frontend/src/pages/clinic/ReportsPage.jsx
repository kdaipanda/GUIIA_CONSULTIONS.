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
import { ClinicReportsSkeleton } from "../../components/clinic/ClinicPageUi";
import { useVet } from "../../context/VetContext";
import { fetchReportsOverview } from "../../lib/clinicApi";
import { Button } from "../../components/ui/button";

const PERIOD_OPTIONS = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "month", label: "Este mes" },
];

const APPT_STATUS = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const INVOICE_STATUS = {
  draft: "Borrador",
  issued: "Emitido",
  paid: "Pagado",
  cancelled: "Cancelado",
};

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

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function downloadReportCsv(overview, periodLabel) {
  if (!overview) return;
  const totals = overview.totals || {};
  const lines = [
    ["Reporte GUIAA", periodLabel],
    ["Generado", new Date().toLocaleString("es-MX")],
    [],
    ["Métrica", "Valor"],
    ["Citas en periodo", totals.appointments ?? 0],
    ["Tasa completadas %", totals.occupancy_rate ?? 0],
    ["Ingresos cobrados", totals.revenue_paid ?? 0],
    ["Ingresos emitidos sin cobrar", (totals.revenue_issued ?? 0) - (totals.revenue_paid ?? 0)],
    ["Consultas CDS", totals.consultations_ai ?? 0],
    ["Dueño", totals.clients ?? 0],
    ["Mascotas", totals.patients ?? 0],
    ["Productos stock bajo", totals.low_stock_products ?? 0],
    [],
    ["Producto más vendido", "Cantidad", "Ingresos"],
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

function KpiCard({ icon: Icon, label, value, hint, chart, chartId, colorFrom, colorTo }) {
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
          ariaLabel={`Tendencia: ${label}`}
        />
      )}
    </div>
  );
}

export function ReportsPage() {
  const navigate = useNavigate();
  const { veterinarian } = useVet();
  const [period, setPeriod] = useState("30d");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!veterinarian?.id) return;
    setLoading(true);
    setError("");
    try {
      const { from, to } = getPeriodRange(period);
      const data = await fetchReportsOverview(veterinarian.id, from, to);
      setOverview(data.overview || null);
    } catch (err) {
      setError(err.message);
      setOverview(null);
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

  const periodLabel = PERIOD_OPTIONS.find((p) => p.id === period)?.label || period;

  const go = (path) => navigate(path);

  return (
    <div className="clinic-page clinic-page-guiaa clinic-reports-page">
      <div className="clinic-page-header">
        <div>
          <p className="clinic-page-eyebrow">Consultorio</p>
          <h1>Reportes</h1>
          <p>Indicadores de operación clínica, ingresos y actividad CDS.</p>
        </div>
        <div className="clinic-report-period">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant={period === opt.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setPeriod(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!overview}
            onClick={() => downloadReportCsv(overview, periodLabel)}
          >
            <FileDown size={14} className="mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {error && <p className="clinic-error">{error}</p>}

      {loading ? (
        <ClinicReportsSkeleton />
      ) : (
        <>
          <div className="clinic-report-kpi-grid">
            <KpiCard
              icon={CalendarDays}
              label="Citas en el periodo"
              value={totals.appointments ?? 0}
              hint={`${totals.occupancy_rate ?? 0}% completadas`}
              chart={apptSeries}
              chartId="report-appts"
              colorFrom="#265b93"
              colorTo="#93c5e8"
            />
            <KpiCard
              icon={DollarSign}
              label="Ingresos cobrados"
              value={formatMoney(totals.revenue_paid)}
              hint={`${totals.invoices ?? 0} recibos en periodo`}
              chart={revenueSeries}
              chartId="report-revenue"
              colorFrom="#3d9b8f"
              colorTo="#a7e0d8"
            />
            <KpiCard
              icon={Stethoscope}
              label="Consultas CDS"
              value={totals.consultations_ai ?? 0}
              chart={consSeries}
              chartId="report-cons"
              colorFrom="#0c2d4d"
              colorTo="#7ba3c4"
            />
            <KpiCard
              icon={Users}
              label="Dueños registrados"
              value={totals.clients ?? 0}
              hint={`${totals.patients ?? 0} mascotas`}
            />
            <KpiCard
              icon={PawPrint}
              label="Mascotas activas"
              value={totals.patients ?? 0}
            />
            <KpiCard
              icon={Package}
              label="Productos bajo mínimo"
              value={totals.low_stock_products ?? 0}
              hint={totals.low_stock_products > 0 ? "Revisar inventario" : "Stock OK"}
            />
          </div>

          <div className="clinic-report-panels">
            <section className="clinic-report-panel">
              <h2>
                <TrendingUp size={18} aria-hidden />
                Citas por estado
              </h2>
              {Object.keys(overview?.appointments_by_status || {}).length === 0 ? (
                <p className="clinic-report-empty">Sin citas en este periodo.</p>
              ) : (
                <ul className="clinic-report-breakdown">
                  {Object.entries(overview.appointments_by_status).map(([status, count]) => (
                    <li key={status}>
                      <span>{APPT_STATUS[status] || status}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="clinic-report-panel">
              <h2>
                <BarChart3 size={18} aria-hidden />
                Recibos por estado
              </h2>
              {Object.keys(overview?.invoices_by_status || {}).length === 0 ? (
                <p className="clinic-report-empty">Sin recibos en este periodo.</p>
              ) : (
                <ul className="clinic-report-breakdown">
                  {Object.entries(overview.invoices_by_status).map(([status, count]) => (
                    <li key={status}>
                      <span>{INVOICE_STATUS[status] || status}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
              {(totals.revenue_issued ?? 0) > (totals.revenue_paid ?? 0) && (
                <p className="clinic-report-note">
                  Emitido sin cobrar: {formatMoney((totals.revenue_issued || 0) - (totals.revenue_paid || 0))}
                </p>
              )}
            </section>
          </div>

          <div className="clinic-report-panels">
            <section className="clinic-report-panel">
              <div className="clinic-report-panel-head">
                <h2>
                  <Package size={18} aria-hidden />
                  Productos más vendidos
                </h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => go("/app/facturacion")}>
                  Ventas <ArrowRight size={14} />
                </Button>
              </div>
              {(overview?.top_products || []).length === 0 ? (
                <p className="clinic-report-empty">Sin ventas registradas en este periodo.</p>
              ) : (
                <ul className="clinic-report-breakdown">
                  {overview.top_products.map((p, idx) => (
                    <li key={`${p.description}-${idx}`}>
                      <span>{p.description}</span>
                      <strong>
                        {p.quantity} · {formatMoney(p.revenue)}
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
                  Movimientos de inventario
                </h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => go("/app/inventario")}>
                  Inventario <ArrowRight size={14} />
                </Button>
              </div>
              <ul className="clinic-report-breakdown">
                <li>
                  <span>Entradas</span>
                  <strong>{overview?.stock_movements?.in ?? 0}</strong>
                </li>
                <li>
                  <span>Salidas</span>
                  <strong>{overview?.stock_movements?.out ?? 0}</strong>
                </li>
                <li>
                  <span>Ajustes</span>
                  <strong>{overview?.stock_movements?.adjustment ?? 0}</strong>
                </li>
              </ul>
              {(overview?.low_stock_list || []).length > 0 && (
                <>
                  <h3 className="clinic-report-subtitle">Stock bajo actual</h3>
                  <ul className="clinic-report-breakdown">
                    {overview.low_stock_list.map((p) => (
                      <li key={p.name}>
                        <span>{p.name}</span>
                        <strong>
                          {p.stock_qty} / mín. {p.min_stock} {p.unit || "pza"}
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
