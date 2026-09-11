import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  FileDown,
  FlaskConical,
  Plus,
  Stethoscope,
  FolderOpen,
  X,
  Check,
} from "lucide-react";
import { useVet } from "../../context/VetContext";
import {
  fetchPatient,
  patchPatientClinicalChart,
} from "../../lib/clinicApi";
import {
  normalizeClinicalChart,
  openProblems,
  latestByDate,
} from "../../lib/clinicalChartSync";
import { ClinicalTimelineList } from "../../components/clinical/ClinicalTimelineList";
import { ConsultationFormDataView } from "../../components/clinical/ConsultationFormDataView";
import { downloadConsultationPdf, downloadPatientHistoryPdf } from "../../lib/consultationPdf";
import { formatConsultationDateShort } from "../../lib/consultationDisplay";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { loadI18nNamespace } from "../../lib/loadI18nNamespace";
import "./clinicPageShared.css";
import "./patientClinicalChartPage.css";

function WeightSparkline({ series }) {
  const points = (series || [])
    .filter((s) => s.weight_kg != null)
    .map((s) => Number(s.weight_kg));
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 160;
  const h = 36;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="patient-chart-sparkline" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChartListEditor({
  title,
  items,
  fields,
  onChange,
  addLabel,
  emptyLabel,
}) {
  const { t } = useTranslation("clinic");
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, ""])),
  );

  const add = () => {
    const row = {};
    let hasValue = false;
    for (const f of fields) {
      const v = String(draft[f.key] || "").trim();
      row[f.key] = v;
      if (v) hasValue = true;
    }
    if (!hasValue) return;
    if (fields.some((f) => f.key === "status") && !row.status) row.status = "active";
    if (fields.some((f) => f.key === "type") && !row.type) row.type = "internal";
    onChange([...(items || []), row]);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, ""])));
  };

  const removeAt = (idx) => {
    onChange((items || []).filter((_, i) => i !== idx));
  };

  return (
    <div className="patient-chart-list-editor">
      <h3>{title}</h3>
      {(items || []).length === 0 ? (
        <p className="clinic-muted">{emptyLabel}</p>
      ) : (
        <ul className="patient-chart-chip-list">
          {(items || []).map((item, idx) => (
            <li key={`${item.label || item.product || item.title || "item"}-${idx}`}>
              <span>
                {fields
                  .map((f) => item[f.key])
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <button type="button" className="patient-chart-icon-btn" onClick={() => removeAt(idx)} aria-label={t("common.delete")}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="patient-chart-add-row">
        {fields.map((f) => (
          <Input
            key={f.key}
            placeholder={f.placeholder}
            value={draft[f.key] || ""}
            onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
          />
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus size={14} className="mr-1" /> {addLabel}
        </Button>
      </div>
    </div>
  );
}

export default function PatientClinicalChartPage({
  patientId,
  onStartConsultation,
  onStartLabAnalysis,
  onViewConsultation,
}) {
  const { t } = useTranslation("clinic");
  const { veterinarian } = useVet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [chart, setChart] = useState(normalizeClinicalChart(null));
  const [saving, setSaving] = useState(false);
  const [historyPdfLoading, setHistoryPdfLoading] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [problemDraft, setProblemDraft] = useState("");

  const load = useCallback(async () => {
    if (!veterinarian?.id || !patientId) return;
    setLoading(true);
    try {
      const data = await fetchPatient(veterinarian.id, patientId);
      setDetail(data);
      setChart(normalizeClinicalChart(data?.patient?.clinical_chart));
    } catch (err) {
      notifyError(err?.message || t("patientChart.loadError"));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [veterinarian?.id, patientId, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadI18nNamespace("speciesForms").catch(() => {});
  }, []);

  const patient = detail?.patient;
  const consultations = detail?.consultations || [];
  const medicalImages = detail?.medical_images || [];
  const vitalsSeries = detail?.vitals_series || [];
  const owner = patient?.clients || {};

  const problemsOpen = useMemo(() => openProblems(chart), [chart]);
  const lastVaccine = latestByDate(chart.vaccines);
  const lastDeworm = latestByDate(chart.deworming);
  const currentWeight =
    patient?.weight_kg ??
    (vitalsSeries.length ? vitalsSeries[vitalsSeries.length - 1]?.weight_kg : null);

  const persistChart = async (nextChart, extra = {}) => {
    if (!veterinarian?.id || !patientId) return;
    setSaving(true);
    try {
      const normalized = normalizeClinicalChart(nextChart);
      const res = await patchPatientClinicalChart(veterinarian.id, patientId, {
        ...normalized,
        replace: true,
        ...extra,
      });
      setChart(normalizeClinicalChart(res?.patient?.clinical_chart || normalized));
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              patient: res?.patient || { ...prev.patient, clinical_chart: normalized },
            }
          : prev,
      );
      notifySuccess(t("patientChart.saved"));
    } catch (err) {
      notifyError(err?.message || t("patientChart.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadHistoryPdf = async () => {
    if (!patient) return;
    setHistoryPdfLoading(true);
    try {
      await downloadPatientHistoryPdf(patient, consultations, {
        veterinarian,
        medicalImages,
      });
    } catch (err) {
      notifyError(err?.message || t("common.historyPdfError"));
    } finally {
      setHistoryPdfLoading(false);
    }
  };

  const handleDownloadConsultationPdf = async (consultation) => {
    setPdfLoadingId(consultation.id);
    try {
      await downloadConsultationPdf(consultation, { veterinarian });
    } catch (err) {
      notifyError(err?.message || t("common.pdfError"));
    } finally {
      setPdfLoadingId(null);
    }
  };

  const addProblem = () => {
    const title = problemDraft.trim();
    if (!title) return;
    const next = {
      ...chart,
      problems: [
        ...(chart.problems || []),
        {
          id: `local_${Date.now()}`,
          title,
          status: "open",
          opened_at: new Date().toISOString().slice(0, 10),
          closed_at: "",
          source_consultation_id: null,
        },
      ],
    };
    setProblemDraft("");
    persistChart(next);
  };

  const toggleProblem = (problemId, close) => {
    const next = {
      ...chart,
      problems: (chart.problems || []).map((p) =>
        p.id === problemId
          ? {
              ...p,
              status: close ? "closed" : "open",
              closed_at: close ? new Date().toISOString().slice(0, 10) : "",
            }
          : p,
      ),
    };
    persistChart(next);
  };

  if (loading) {
    return (
      <div className="clinic-page clinic-page-guiaa patient-clinical-chart">
        <p className="clinic-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="clinic-page clinic-page-guiaa patient-clinical-chart">
        <p className="clinic-muted">{t("patientChart.notFound")}</p>
        <Button type="button" variant="secondary" onClick={() => navigate("/app/clientes")}>
          <ArrowLeft size={16} className="mr-1" /> {t("patientChart.backToClients")}
        </Button>
      </div>
    );
  }

  return (
    <div className="clinic-page clinic-page-guiaa patient-clinical-chart">
      <header className="clinic-page-header patient-chart-header">
        <div>
          <p className="clinic-page-eyebrow">{t("patientChart.eyebrow")}</p>
          <h1>{patient.name}</h1>
          <p>
            {[patient.species, patient.breed, owner.name]
              .filter(Boolean)
              .join(" · ") || t("common.emDash")}
            {currentWeight != null ? ` · ${currentWeight} kg` : ""}
          </p>
        </div>
        <div className="patient-chart-actions">
          <Button type="button" variant="secondary" onClick={() => navigate("/app/clientes")}>
            <ArrowLeft size={16} className="mr-1" /> {t("patientChart.backToClients")}
          </Button>
          {onStartConsultation && (
            <Button
              type="button"
              onClick={() =>
                onStartConsultation({
                  patientId: patient.id,
                  clientId: patient.client_id,
                  patient,
                })
              }
            >
              <Stethoscope size={16} className="mr-1" /> {t("clients.startConsultation")}
            </Button>
          )}
          {onStartLabAnalysis && (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onStartLabAnalysis({
                  patientId: patient.id,
                  clientId: patient.client_id,
                  patient,
                })
              }
            >
              <FlaskConical size={16} className="mr-1" /> {t("clients.interpretStudy")}
            </Button>
          )}
          {(consultations.length || medicalImages.length) > 0 && (
            <Button
              type="button"
              variant="secondary"
              disabled={historyPdfLoading}
              onClick={handleDownloadHistoryPdf}
            >
              <FileDown size={16} className="mr-1" />
              {historyPdfLoading ? t("clients.generatingPdf") : t("clients.downloadHistoryPdf")}
            </Button>
          )}
        </div>
      </header>

      <section className="patient-chart-summary" aria-label={t("patientChart.summaryTitle")}>
        <h2>{t("patientChart.summaryTitle")}</h2>
        <div className="clinic-stats-row">
          <div className="clinic-stat-pill">
            <span className="clinic-stat-value">{problemsOpen.length}</span>
            <span className="clinic-stat-label">{t("patientChart.openProblems")}</span>
          </div>
          <div className="clinic-stat-pill">
            <span className="clinic-stat-value">{(chart.allergies || []).length}</span>
            <span className="clinic-stat-label">{t("patientChart.allergies")}</span>
          </div>
          <div className="clinic-stat-pill">
            <span className="clinic-stat-value">
              {currentWeight != null ? `${currentWeight}` : t("common.emDash")}
            </span>
            <span className="clinic-stat-label">{t("patientChart.weightKg")}</span>
          </div>
          <div className="clinic-stat-pill">
            <span className="clinic-stat-value">{consultations.length}</span>
            <span className="clinic-stat-label">{t("patientChart.consultations")}</span>
          </div>
        </div>
        <div className="patient-chart-summary-meta">
          {lastVaccine && (
            <p>
              <strong>{t("patientChart.lastVaccine")}:</strong> {lastVaccine.label}
              {lastVaccine.date ? ` (${lastVaccine.date})` : ""}
            </p>
          )}
          {lastDeworm && (
            <p>
              <strong>{t("patientChart.lastDeworming")}:</strong>{" "}
              {lastDeworm.product || lastDeworm.type}
              {lastDeworm.date ? ` (${lastDeworm.date})` : ""}
            </p>
          )}
          {(chart.allergies || []).length > 0 && (
            <p>
              <strong>{t("patientChart.allergies")}:</strong>{" "}
              {chart.allergies.map((a) => a.label).filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </section>

      <div className="patient-chart-grid">
        <section className="patient-chart-panel">
          <ChartListEditor
            title={t("patientChart.allergies")}
            items={chart.allergies}
            emptyLabel={t("patientChart.emptyAllergies")}
            addLabel={t("patientChart.addItem")}
            fields={[
              { key: "label", placeholder: t("patientChart.placeholders.allergy") },
              { key: "severity", placeholder: t("patientChart.placeholders.severity") },
              { key: "noted_at", placeholder: t("patientChart.placeholders.date") },
            ]}
            onChange={(allergies) => {
              const next = { ...chart, allergies };
              setChart(next);
              persistChart(next);
            }}
          />
          <ChartListEditor
            title={t("patientChart.chronicConditions")}
            items={chart.chronic_conditions}
            emptyLabel={t("patientChart.emptyChronic")}
            addLabel={t("patientChart.addItem")}
            fields={[
              { key: "label", placeholder: t("patientChart.placeholders.condition") },
              { key: "status", placeholder: "active|resolved" },
              { key: "noted_at", placeholder: t("patientChart.placeholders.date") },
            ]}
            onChange={(chronic_conditions) => {
              const next = { ...chart, chronic_conditions };
              setChart(next);
              persistChart(next);
            }}
          />
          <ChartListEditor
            title={t("patientChart.vaccines")}
            items={chart.vaccines}
            emptyLabel={t("patientChart.emptyVaccines")}
            addLabel={t("patientChart.addItem")}
            fields={[
              { key: "label", placeholder: t("patientChart.placeholders.vaccine") },
              { key: "date", placeholder: t("patientChart.placeholders.date") },
              { key: "notes", placeholder: t("patientChart.placeholders.notes") },
            ]}
            onChange={(vaccines) => {
              const next = { ...chart, vaccines };
              setChart(next);
              persistChart(next);
            }}
          />
          <ChartListEditor
            title={t("patientChart.surgeries")}
            items={chart.surgeries}
            emptyLabel={t("patientChart.emptySurgeries")}
            addLabel={t("patientChart.addItem")}
            fields={[
              { key: "label", placeholder: t("patientChart.placeholders.surgery") },
              { key: "date", placeholder: t("patientChart.placeholders.date") },
              { key: "notes", placeholder: t("patientChart.placeholders.notes") },
            ]}
            onChange={(surgeries) => {
              const next = { ...chart, surgeries };
              setChart(next);
              persistChart(next);
            }}
          />
          <ChartListEditor
            title={t("patientChart.deworming")}
            items={chart.deworming}
            emptyLabel={t("patientChart.emptyDeworming")}
            addLabel={t("patientChart.addItem")}
            fields={[
              { key: "type", placeholder: "internal|external" },
              { key: "product", placeholder: t("patientChart.placeholders.product") },
              { key: "date", placeholder: t("patientChart.placeholders.date") },
            ]}
            onChange={(deworming) => {
              const next = { ...chart, deworming };
              setChart(next);
              persistChart(next);
            }}
          />
          {saving && <p className="clinic-muted">{t("common.saving")}</p>}
        </section>

        <section className="patient-chart-panel">
          <h3>{t("patientChart.problemList")}</h3>
          {(chart.problems || []).length === 0 ? (
            <p className="clinic-muted">{t("patientChart.emptyProblems")}</p>
          ) : (
            <ul className="patient-chart-problems">
              {(chart.problems || []).map((p) => (
                <li key={p.id} className={p.status === "closed" ? "is-closed" : ""}>
                  <div>
                    <strong>{p.title}</strong>
                    <span className="clinic-muted">
                      {" "}
                      · {p.status === "closed" ? t("patientChart.closed") : t("patientChart.open")}
                      {p.opened_at ? ` · ${p.opened_at}` : ""}
                    </span>
                  </div>
                  {p.status !== "closed" ? (
                    <button
                      type="button"
                      className="patient-chart-icon-btn"
                      onClick={() => toggleProblem(p.id, true)}
                      aria-label={t("patientChart.closeProblem")}
                    >
                      <Check size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="patient-chart-icon-btn"
                      onClick={() => toggleProblem(p.id, false)}
                      aria-label={t("patientChart.reopenProblem")}
                    >
                      <FolderOpen size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="patient-chart-add-row">
            <Input
              placeholder={t("patientChart.placeholders.problem")}
              value={problemDraft}
              onChange={(e) => setProblemDraft(e.target.value)}
            />
            <Button type="button" variant="secondary" size="sm" onClick={addProblem}>
              <Plus size={14} className="mr-1" /> {t("patientChart.addProblem")}
            </Button>
          </div>

          <h3 className="patient-chart-vitals-title">{t("patientChart.vitals")}</h3>
          <WeightSparkline series={vitalsSeries} />
          {vitalsSeries.filter((s) => s.weight_kg != null).length === 0 ? (
            <p className="clinic-muted">{t("patientChart.emptyVitals")}</p>
          ) : (
            <ul className="patient-chart-vitals-list">
              {[...vitalsSeries]
                .filter((s) => s.weight_kg != null)
                .reverse()
                .slice(0, 12)
                .map((s) => (
                  <li key={`${s.consultation_id}-${s.created_at}`}>
                    <span>{formatConsultationDateShort(s.created_at)}</span>
                    <strong>{s.weight_kg} kg</strong>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <section className="patient-chart-timeline clinic-timeline clinic-timeline-unified">
        <h2>{t("clients.clinicalHistory")}</h2>
        <p className="clinic-muted clinic-timeline-hint">{t("clients.clinicalHistoryHint")}</p>
        <ClinicalTimelineList
          consultations={consultations}
          medicalImages={medicalImages}
          onViewConsultation={onViewConsultation}
          onDownloadConsultationPdf={handleDownloadConsultationPdf}
          pdfLoadingId={pdfLoadingId}
          onSelectConsultation={setSelectedConsultation}
        />
        {selectedConsultation && (
          <div className="patient-chart-consultation-detail">
            <div className="patient-chart-consultation-detail-head">
              <h3>{t("patientChart.selectedConsultation")}</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedConsultation(null)}>
                {t("common.close")}
              </Button>
            </div>
            <ConsultationFormDataView
              category={selectedConsultation.category || selectedConsultation.especie}
              formData={selectedConsultation.form_data}
              defaultOpen
            />
          </div>
        )}
      </section>
    </div>
  );
}
