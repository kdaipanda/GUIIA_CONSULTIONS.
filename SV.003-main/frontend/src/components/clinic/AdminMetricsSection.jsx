import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, ExternalLink, Globe2, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { fetchAdminMetrics } from "../../lib/clinicApi";

const PERIODS = [7, 30, 90];

function formatCount(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  if (Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(Number(value));
}

function formatChange(change) {
  if (!change || change.percent == null) return null;
  const pct = Number(change.percent);
  if (Number.isNaN(pct)) return null;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

function changeClass(change) {
  const dir = (change?.direction || "").toLowerCase();
  if (dir.includes("up") || (typeof change?.percent === "number" && change.percent > 0)) {
    return "clinic-admin-metric-change is-up";
  }
  if (dir.includes("down") || (typeof change?.percent === "number" && change.percent < 0)) {
    return "clinic-admin-metric-change is-down";
  }
  return "clinic-admin-metric-change";
}

function MiniBars({ series, label }) {
  const max = useMemo(() => {
    const values = (series || []).map((p) => Number(p.count) || 0);
    return Math.max(1, ...values);
  }, [series]);

  if (!series?.length) {
    return <p className="clinic-muted clinic-admin-metrics-empty">{label}</p>;
  }

  return (
    <div className="clinic-admin-minibars" role="img" aria-label={label}>
      {series.map((point) => {
        const count = Number(point.count) || 0;
        const height = Math.max(4, Math.round((count / max) * 100));
        return (
          <div key={point.day} className="clinic-admin-minibar" title={`${point.day}: ${count}`}>
            <div className="clinic-admin-minibar-fill" style={{ height: `${height}%` }} />
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({ label, value, change, hint }) {
  const changeText = formatChange(change);
  return (
    <div className="clinic-report-kpi">
      <div className="clinic-report-kpi-head">
        <span className="clinic-report-kpi-label">{label}</span>
      </div>
      <div className="clinic-report-kpi-value">{formatCount(value)}</div>
      {changeText ? <div className={changeClass(change)}>{changeText}</div> : null}
      {hint ? <div className="clinic-muted clinic-admin-kpi-sub">{hint}</div> : null}
    </div>
  );
}

export function AdminMetricsSection({ veterinarianId, enabled }) {
  const { t } = useTranslation("clinic");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !veterinarianId) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminMetrics(veterinarianId, days);
      setData(result);
    } catch (err) {
      setData(null);
      setError(err?.message || t("admin.metricsLoadError"));
    } finally {
      setLoading(false);
    }
  }, [days, enabled, t, veterinarianId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!enabled) return null;

  const business = data?.business || {};
  const traffic = data?.traffic || {};
  const businessTotals = business.totals || {};
  const trafficTotals = traffic.totals || {};
  const trafficChanges = traffic.changes || {};

  return (
    <section className="clinic-settings-card clinic-admin-metrics">
      <div className="clinic-admin-users-head">
        <h2>
          <BarChart3 size={18} aria-hidden />
          {t("admin.metricsTitle")}
        </h2>
        <div className="clinic-admin-metrics-periods" role="group" aria-label={t("admin.metricsPeriodAria")}>
          {PERIODS.map((period) => (
            <Button
              key={period}
              type="button"
              size="sm"
              variant={days === period ? "default" : "outline"}
              onClick={() => setDays(period)}
              disabled={loading}
            >
              {t("admin.metricsDays", { count: period })}
            </Button>
          ))}
        </div>
      </div>
      <p className="clinic-muted clinic-tools-desc">{t("admin.metricsLead")}</p>

      {error ? (
        <div className="clinic-admin-metrics-error">
          <p>{error}</p>
          <Button type="button" size="sm" variant="outline" onClick={load}>
            {t("admin.retry")}
          </Button>
        </div>
      ) : null}

      {loading && !data ? (
        <p className="clinic-muted">{t("admin.metricsLoading")}</p>
      ) : (
        <>
          <div className="clinic-admin-metrics-block">
            <h3>
              <TrendingUp size={16} aria-hidden />
              {t("admin.metricsBusinessTitle")}
            </h3>
            <div className="clinic-report-kpi-grid">
              <MetricCard
                label={t("admin.metricsSignups")}
                value={businessTotals.signups}
                hint={t("admin.metricsLastDays", { count: days })}
              />
              <MetricCard
                label={t("admin.metricsCds")}
                value={businessTotals.consultations}
                hint={t("admin.metricsLastDays", { count: days })}
              />
              <MetricCard
                label={t("admin.metricsPaid")}
                value={businessTotals.paid_conversions}
                hint={t("admin.metricsPaidHint")}
              />
              <MetricCard
                label={t("admin.metricsConversion")}
                value={
                  businessTotals.signup_to_paid_rate != null
                    ? `${businessTotals.signup_to_paid_rate}%`
                    : null
                }
              />
            </div>
            <div className="clinic-admin-metrics-charts">
              <div>
                <h4>{t("admin.metricsChartSignups")}</h4>
                <MiniBars
                  series={business.series?.signups}
                  label={t("admin.metricsNoSeries")}
                />
              </div>
              <div>
                <h4>{t("admin.metricsChartCds")}</h4>
                <MiniBars
                  series={business.series?.consultations}
                  label={t("admin.metricsNoSeries")}
                />
              </div>
            </div>
          </div>

          <div className="clinic-admin-metrics-block">
            <div className="clinic-admin-users-head">
              <h3>
                <Globe2 size={16} aria-hidden />
                {t("admin.metricsTrafficTitle")}
              </h3>
              {traffic.dashboard_url ? (
                <a
                  className="clinic-admin-metrics-link"
                  href={traffic.dashboard_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("admin.metricsOpenPosthog")}
                  <ExternalLink size={14} aria-hidden />
                </a>
              ) : null}
            </div>

            {!traffic.configured ? (
              <div className="clinic-admin-metrics-setup">
                <Activity size={18} aria-hidden />
                <div>
                  <p>{t("admin.metricsPosthogSetup")}</p>
                  <p className="clinic-muted">{t("admin.metricsPosthogSetupHint")}</p>
                </div>
              </div>
            ) : traffic.error ? (
              <div className="clinic-admin-metrics-error">
                <p>{t("admin.metricsPosthogError", { error: traffic.error })}</p>
              </div>
            ) : (
              <>
                <div className="clinic-report-kpi-grid">
                  <MetricCard
                    label={t("admin.metricsVisitors")}
                    value={trafficTotals.visitors}
                    change={trafficChanges.visitors}
                  />
                  <MetricCard
                    label={t("admin.metricsPageviews")}
                    value={trafficTotals.pageviews}
                    change={trafficChanges.pageviews}
                  />
                  <MetricCard
                    label={t("admin.metricsSessions")}
                    value={trafficTotals.sessions}
                    change={trafficChanges.sessions}
                  />
                  <MetricCard
                    label={t("admin.metricsBounce")}
                    value={trafficTotals.bounce_rate}
                    change={trafficChanges.bounce_rate}
                    hint={
                      trafficTotals.avg_session_duration
                        ? t("admin.metricsAvgDuration", {
                            duration: trafficTotals.avg_session_duration,
                          })
                        : null
                    }
                  />
                </div>

                {traffic.series?.pageviews?.length ? (
                  <div className="clinic-admin-metrics-charts">
                    <div>
                      <h4>{t("admin.metricsChartPageviews")}</h4>
                      <MiniBars
                        series={traffic.series.pageviews}
                        label={t("admin.metricsNoSeries")}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="clinic-admin-metrics-lists">
                  <div>
                    <h4>{t("admin.metricsTopPages")}</h4>
                    {(traffic.top_pages || []).length === 0 ? (
                      <p className="clinic-muted">{t("admin.metricsNoList")}</p>
                    ) : (
                      <ul>
                        {traffic.top_pages.map((page) => (
                          <li key={`${page.host}${page.path}`}>
                            <span className="clinic-admin-metrics-path">{page.path}</span>
                            <strong>{formatCount(page.visitors)}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4>{t("admin.metricsTopSources")}</h4>
                    {(traffic.top_sources || []).length === 0 ? (
                      <p className="clinic-muted">{t("admin.metricsNoList")}</p>
                    ) : (
                      <ul>
                        {traffic.top_sources.map((source) => (
                          <li key={source.name}>
                            <span>{source.name}</span>
                            <strong>{formatCount(source.visitors)}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
