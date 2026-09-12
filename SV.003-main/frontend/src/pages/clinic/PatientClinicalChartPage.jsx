import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FileDown, FlaskConical, Stethoscope } from "lucide-react";
import { useVet } from "../../context/VetContext";
import { fetchPatient, patchPatientClinicalChart } from "../../lib/clinicApi";
import {
  normalizeClinicalChart,
  hydrateFormDataFromChart,
  buildSpeciesFormChartPatch,
  resolveChartFormCategory,
  parseWeightKg,
  SPECIES_FORM_CATEGORIES,
  mergeClinicalChart,
} from "../../lib/clinicalChartSync";
import { LazySpeciesForm } from "../../components/forms/LazySpeciesForm";
import { ClinicalTimelineList } from "../../components/clinical/ClinicalTimelineList";
import { ConsultationFormDataView } from "../../components/clinical/ConsultationFormDataView";
import { downloadConsultationPdf, downloadPatientHistoryPdf } from "../../lib/consultationPdf";
import { normalizePetSex } from "../../lib/petSex";
import { Button } from "../../components/ui/button";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { loadI18nNamespace } from "../../lib/loadI18nNamespace";
import "./clinicPageShared.css";
import "./patientClinicalChartPage.css";

export default function PatientClinicalChartPage({
  patientId,
  onStartConsultation,
  onStartLabAnalysis,
  onViewConsultation,
}) {
  const { t } = useTranslation("clinic");
  const { t: tSpecies } = useTranslation("speciesForms");
  const { veterinarian } = useVet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [chart, setChart] = useState(normalizeClinicalChart(null));
  const [historyPdfLoading, setHistoryPdfLoading] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [speciesFormOpen, setSpeciesFormOpen] = useState(true);
  const [speciesCategory, setSpeciesCategory] = useState("");
  const [speciesFormData, setSpeciesFormData] = useState({});
  const [savingSpeciesForm, setSavingSpeciesForm] = useState(false);

  const load = useCallback(async () => {
    if (!veterinarian?.id || !patientId) return;
    setLoading(true);
    try {
      const data = await fetchPatient(veterinarian.id, patientId);
      setDetail(data);
      const nextChart = normalizeClinicalChart(data?.patient?.clinical_chart);
      setChart(nextChart);
      const category = resolveChartFormCategory(nextChart, data?.patient);
      setSpeciesCategory(category || "perros");
      const hydrated = hydrateFormDataFromChart(
        category,
        nextChart,
        data?.patient,
        (data?.consultations || [])[0] || null,
      );
      setSpeciesFormData(hydrated);
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
  const owner = patient?.clients || {};
  const currentWeight = patient?.weight_kg;

  const saveSpeciesForm = async () => {
    if (!veterinarian?.id || !patientId || !speciesCategory) return;
    setSavingSpeciesForm(true);
    try {
      const patch = buildSpeciesFormChartPatch(speciesCategory, speciesFormData);
      const weight = parseWeightKg(speciesFormData?.peso);
      const res = await patchPatientClinicalChart(veterinarian.id, patientId, {
        ...patch,
        replace: false,
        weight_kg: weight,
        species: speciesCategory,
        breed: speciesFormData?.raza || undefined,
        sex: normalizePetSex(speciesFormData?.sexo) || undefined,
      });
      const nextChart = normalizeClinicalChart(
        res?.patient?.clinical_chart || mergeClinicalChart(chart, patch),
      );
      setChart(nextChart);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              patient: res?.patient || {
                ...prev.patient,
                clinical_chart: nextChart,
                species: speciesCategory,
                ...(weight != null ? { weight_kg: weight } : {}),
              },
            }
          : prev,
      );
      notifySuccess(t("patientChart.speciesFormSaved"));
    } catch (err) {
      notifyError(err?.message || t("patientChart.saveError"));
    } finally {
      setSavingSpeciesForm(false);
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

      <section className="patient-chart-species-form" aria-label={t("patientChart.speciesFormTitle")}>
        <div className="patient-chart-species-form-head">
          <div>
            <h2>{t("patientChart.speciesFormTitle")}</h2>
            <p className="clinic-muted">{t("patientChart.speciesFormHint")}</p>
          </div>
          <div className="patient-chart-species-form-actions">
            <label className="patient-chart-species-select">
              <span className="sr-only">{t("patientChart.speciesLabel")}</span>
              <select
                value={speciesCategory}
                onChange={(e) => setSpeciesCategory(e.target.value)}
                aria-label={t("patientChart.speciesLabel")}
              >
                {SPECIES_FORM_CATEGORIES.map((key) => (
                  <option key={key} value={key}>
                    {tSpecies(`categories.${key}`, { defaultValue: key })}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSpeciesFormOpen((v) => !v)}
            >
              {speciesFormOpen ? t("patientChart.hideSpeciesForm") : t("patientChart.showSpeciesForm")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={savingSpeciesForm || !speciesCategory}
              onClick={saveSpeciesForm}
            >
              {savingSpeciesForm ? t("common.saving") : t("patientChart.saveSpeciesForm")}
            </Button>
          </div>
        </div>
        {speciesFormOpen && (
          <div className="patient-chart-species-form-body">
            <LazySpeciesForm
              category={speciesCategory}
              formData={speciesFormData}
              setFormData={setSpeciesFormData}
              unknownMessage={t("patientChart.unknownSpecies")}
            />
          </div>
        )}
      </section>

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
