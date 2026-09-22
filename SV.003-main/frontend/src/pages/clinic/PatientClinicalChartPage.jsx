import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  BedDouble,
  FileDown,
  FlaskConical,
  Link2,
  Paperclip,
  Stethoscope,
} from "lucide-react";
import { useVet } from "../../context/VetContext";
import {
  admitPatientHospitalization,
  addHospitalizationNote,
  fetchPatient,
  fetchUnlinkedMedicalImages,
  linkMedicalImagePatient,
  patchPatientClinicalChart,
  updateHospitalization,
} from "../../lib/clinicApi";
import { invalidateClinicRegistryCache } from "../../lib/clinicRegistryCache";
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
import { fileToBase64Payload, validateLabUploadFile } from "../../lib/labFileUtils";
import { getAuthHeaders } from "../../lib/authHeaders";
import { getBackendUrl } from "../../lib/backendUrl";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { ConfirmActionDialog } from "../../components/clinic/ConfirmActionDialog";
import { clinicDialogClass } from "../../components/clinic/ClinicPageUi";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { loadI18nNamespace } from "../../lib/loadI18nNamespace";
import "./clinicPageShared.css";
import "./patientClinicalChartPage.css";

function formatChartDate(value, emptyLabel = "—") {
  if (!value) return emptyLabel;
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

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
  const { confirm, dialogProps } = useConfirmAction();
  const fileInputRef = useRef(null);
  const speciesDirtyRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [chart, setChart] = useState(normalizeClinicalChart(null));
  const [historyPdfLoading, setHistoryPdfLoading] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [speciesFormOpen, setSpeciesFormOpen] = useState(false);
  const [speciesCategory, setSpeciesCategory] = useState("");
  const [speciesFormData, setSpeciesFormData] = useState({});
  const [savingSpeciesForm, setSavingSpeciesForm] = useState(false);

  const [admitOpen, setAdmitOpen] = useState(false);
  const [admitReason, setAdmitReason] = useState("");
  const [admitBusy, setAdmitBusy] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [dischargeBusy, setDischargeBusy] = useState(false);

  const [labAttachOpen, setLabAttachOpen] = useState(false);
  const [labLinkOpen, setLabLinkOpen] = useState(false);
  const [labContext, setLabContext] = useState("");
  const [labFile, setLabFile] = useState(null);
  const [labAttachBusy, setLabAttachBusy] = useState(false);
  const [unlinked, setUnlinked] = useState([]);
  const [unlinkedSearch, setUnlinkedSearch] = useState("");
  const [unlinkedLoading, setUnlinkedLoading] = useState(false);
  const [linkingId, setLinkingId] = useState(null);

  const setSpeciesFormDataTracked = useCallback((next) => {
    speciesDirtyRef.current = true;
    setSpeciesFormData(next);
  }, []);

  const applyPatientPayload = useCallback(
    (data, { hydrateForm = true } = {}) => {
      setDetail(data);
      const nextChart = normalizeClinicalChart(data?.patient?.clinical_chart);
      setChart(nextChart);
      if (!hydrateForm) return;
      const category = resolveChartFormCategory(nextChart, data?.patient);
      setSpeciesCategory(category || "perros");
      const hydrated = hydrateFormDataFromChart(
        category,
        nextChart,
        data?.patient,
        (data?.consultations || [])[0] || null,
      );
      setSpeciesFormData(hydrated);
      speciesDirtyRef.current = false;
    },
    [],
  );

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!veterinarian?.id || !patientId) return;
      if (!quiet) setLoading(true);
      try {
        const data = await fetchPatient(veterinarian.id, patientId);
        const hydrateForm = !quiet || !speciesDirtyRef.current;
        applyPatientPayload(data, { hydrateForm });
      } catch (err) {
        if (!quiet) {
          notifyError(err?.message || t("patientChart.loadError"));
          setDetail(null);
        }
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [veterinarian?.id, patientId, t, applyPatientPayload],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadI18nNamespace("speciesForms").catch(() => {});
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        load({ quiet: true });
      }
    };
    const onPageShow = () => load({ quiet: true });
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onVisible);
    };
  }, [load]);

  const patient = detail?.patient;
  const consultations = detail?.consultations || [];
  const medicalImages = detail?.medical_images || [];
  const hospitalization = detail?.hospitalization || null;
  const hospitalizationNotes = detail?.hospitalization_notes || [];
  const owner = patient?.clients || {};
  const currentWeight = patient?.weight_kg;
  const emptyDate = t("common.emDash");

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
      speciesDirtyRef.current = false;
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

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!veterinarian?.id || !patientId) return;
    setAdmitBusy(true);
    try {
      await admitPatientHospitalization(veterinarian.id, patientId, {
        reason: admitReason.trim() || null,
      });
      notifySuccess(t("patientChart.hospAdmitSuccess"));
      setAdmitOpen(false);
      setAdmitReason("");
      invalidateClinicRegistryCache(veterinarian.id);
      await load({ quiet: true });
    } catch (err) {
      notifyError(err?.message || t("patientChart.hospAdmitError"));
    } finally {
      setAdmitBusy(false);
    }
  };

  const handleDischarge = async () => {
    if (!veterinarian?.id || !hospitalization?.id) return;
    const ok = await confirm({
      title: t("patientChart.hospDischargeConfirmTitle"),
      description: t("patientChart.hospDischargeConfirmDesc"),
      confirmLabel: t("patientChart.hospDischarge"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!ok) return;
    setDischargeBusy(true);
    try {
      await updateHospitalization(veterinarian.id, hospitalization.id, {
        status: "discharged",
      });
      notifySuccess(t("patientChart.hospDischargeSuccess"));
      setNoteBody("");
      invalidateClinicRegistryCache(veterinarian.id);
      await load({ quiet: true });
    } catch (err) {
      notifyError(err?.message || t("patientChart.hospDischargeError"));
    } finally {
      setDischargeBusy(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!veterinarian?.id || !hospitalization?.id || !noteBody.trim()) return;
    setNoteBusy(true);
    try {
      await addHospitalizationNote(veterinarian.id, hospitalization.id, {
        body: noteBody.trim(),
      });
      notifySuccess(t("patientChart.hospNoteSuccess"));
      setNoteBody("");
      await load({ quiet: true });
    } catch (err) {
      notifyError(err?.message || t("patientChart.hospNoteError"));
    } finally {
      setNoteBusy(false);
    }
  };

  const openLabLinkDialog = async () => {
    setLabLinkOpen(true);
    setUnlinkedLoading(true);
    try {
      const data = await fetchUnlinkedMedicalImages(veterinarian.id, {
        search: unlinkedSearch,
      });
      setUnlinked(data?.medical_images || []);
    } catch (err) {
      notifyError(err?.message || t("patientChart.labLinkError"));
      setUnlinked([]);
    } finally {
      setUnlinkedLoading(false);
    }
  };

  const searchUnlinked = async () => {
    if (!veterinarian?.id) return;
    setUnlinkedLoading(true);
    try {
      const data = await fetchUnlinkedMedicalImages(veterinarian.id, {
        search: unlinkedSearch,
      });
      setUnlinked(data?.medical_images || []);
    } catch (err) {
      notifyError(err?.message || t("patientChart.labLinkError"));
    } finally {
      setUnlinkedLoading(false);
    }
  };

  const handleAttachLab = async (e) => {
    e.preventDefault();
    if (!veterinarian?.id || !patientId || !labFile) return;
    const validationError = validateLabUploadFile(labFile);
    if (validationError) {
      notifyError(validationError);
      return;
    }
    setLabAttachBusy(true);
    try {
      const isPdf =
        labFile.type === "application/pdf" ||
        labFile.name?.toLowerCase().endsWith(".pdf");
      const imageBase64 = await fileToBase64Payload(labFile);
      const response = await fetch(`${getBackendUrl()}/api/medical-images/interpret`, {
        method: "POST",
        headers: getAuthHeaders(veterinarian.id, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          veterinarian_id: veterinarian.id,
          image_base64: imageBase64,
          image_type: isPdf ? "pdf_report" : "lab_study",
          patient_name: patient?.name || null,
          patient_id: patientId,
          additional_context: labContext.trim() || null,
        }),
      });
      if (!response.ok) {
        let detail = t("patientChart.labAttachError");
        try {
          const errData = await response.json();
          detail = errData?.detail || detail;
        } catch {
          /* ignore */
        }
        throw new Error(typeof detail === "string" ? detail : t("patientChart.labAttachError"));
      }
      notifySuccess(t("patientChart.labAttachSuccess"));
      setLabAttachOpen(false);
      setLabFile(null);
      setLabContext("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load({ quiet: true });
    } catch (err) {
      notifyError(err?.message || t("patientChart.labAttachError"));
    } finally {
      setLabAttachBusy(false);
    }
  };

  const handleLinkStudy = async (imageId) => {
    if (!veterinarian?.id || !patientId) return;
    setLinkingId(imageId);
    try {
      await linkMedicalImagePatient(veterinarian.id, imageId, patientId);
      notifySuccess(t("patientChart.labLinkSuccess"));
      setLabLinkOpen(false);
      await load({ quiet: true });
    } catch (err) {
      notifyError(err?.message || t("patientChart.labLinkError"));
    } finally {
      setLinkingId(null);
    }
  };

  if (loading) {
    return (
      <main className="clinic-page clinic-page-guiaa patient-clinical-chart">
        <p className="clinic-muted" role="status">
          {t("common.loading")}
        </p>
      </main>
    );
  }

  if (!patient) {
    return (
      <main className="clinic-page clinic-page-guiaa patient-clinical-chart">
        <p className="clinic-muted">{t("patientChart.notFound")}</p>
        <Button
          type="button"
          variant="secondary"
          className="patient-chart-action-btn"
          onClick={() => navigate("/app/clientes")}
        >
          <ArrowLeft size={16} aria-hidden="true" className="mr-1" />{" "}
          {t("patientChart.backToClients")}
        </Button>
      </main>
    );
  }

  return (
    <main className="clinic-page clinic-page-guiaa patient-clinical-chart">
      <header className="clinic-page-header patient-chart-header">
        <div className="patient-chart-header-copy">
          <div className="patient-chart-title-row">
            <h1>{patient.name}</h1>
            {hospitalization && (
              <span className="patient-chart-hosp-badge" role="status">
                {t("patientChart.hospBadge")}
              </span>
            )}
          </div>
          <p>
            {[patient.species, patient.breed, owner.name]
              .filter(Boolean)
              .join(" · ") || emptyDate}
            {currentWeight != null ? ` · ${currentWeight} kg` : ""}
          </p>
        </div>
        <div className="patient-chart-actions">
          <div className="patient-chart-actions-primary">
            {onStartConsultation && (
              <Button
                type="button"
                className="patient-chart-action-btn"
                onClick={() =>
                  onStartConsultation({
                    patientId: patient.id,
                    clientId: patient.client_id,
                    patient,
                  })
                }
              >
                <Stethoscope size={16} aria-hidden="true" className="mr-1" />{" "}
                {t("clients.startConsultation")}
              </Button>
            )}
          </div>
          <div className="patient-chart-actions-secondary">
            <Button
              type="button"
              variant="secondary"
              className="patient-chart-action-btn"
              onClick={() => navigate("/app/clientes")}
            >
              <ArrowLeft size={16} aria-hidden="true" className="mr-1" />{" "}
              {t("patientChart.backToClients")}
            </Button>
            {onStartLabAnalysis && (
              <Button
                type="button"
                variant="secondary"
                className="patient-chart-action-btn"
                onClick={() =>
                  onStartLabAnalysis({
                    patientId: patient.id,
                    clientId: patient.client_id,
                    patient,
                  })
                }
              >
                <FlaskConical size={16} aria-hidden="true" className="mr-1" />{" "}
                {t("clients.interpretStudy")}
              </Button>
            )}
            {(consultations.length || medicalImages.length) > 0 && (
              <Button
                type="button"
                variant="secondary"
                className="patient-chart-action-btn"
                disabled={historyPdfLoading}
                onClick={handleDownloadHistoryPdf}
              >
                <FileDown size={16} aria-hidden="true" className="mr-1" />
                {historyPdfLoading
                  ? t("clients.generatingPdf")
                  : t("clients.downloadHistoryPdf")}
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="patient-chart-panel" aria-label={t("patientChart.hospTitle")}>
        <div className="patient-chart-panel-head">
          <div>
            <h2>
              <BedDouble size={18} aria-hidden="true" className="patient-chart-panel-icon" />
              {t("patientChart.hospTitle")}
            </h2>
          </div>
          {!hospitalization ? (
            <Button
              type="button"
              className="patient-chart-action-btn"
              onClick={() => setAdmitOpen(true)}
            >
              {t("patientChart.hospAdmit")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="patient-chart-action-btn"
              disabled={dischargeBusy}
              onClick={handleDischarge}
            >
              {t("patientChart.hospDischarge")}
            </Button>
          )}
        </div>
        {!hospitalization ? (
          <p className="clinic-muted">{t("patientChart.hospEmpty")}</p>
        ) : (
          <div className="patient-chart-hosp-active">
            <dl className="patient-chart-hosp-meta">
              <div>
                <dt>{t("patientChart.hospAdmittedAt")}</dt>
                <dd>{formatChartDate(hospitalization.admitted_at, emptyDate)}</dd>
              </div>
              {hospitalization.reason && (
                <div>
                  <dt>{t("patientChart.hospReason")}</dt>
                  <dd>{hospitalization.reason}</dd>
                </div>
              )}
            </dl>
            <h3>{t("patientChart.hospNotesTitle")}</h3>
            <form className="patient-chart-hosp-note-form" onSubmit={handleAddNote}>
              <Label htmlFor="hosp-note" className="sr-only">
                {t("patientChart.hospNotesTitle")}
              </Label>
              <Textarea
                id="hosp-note"
                name="hospitalization_note"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder={t("patientChart.hospNotePlaceholder")}
                rows={3}
                autoComplete="off"
              />
              <Button
                type="submit"
                className="patient-chart-action-btn"
                disabled={noteBusy || !noteBody.trim()}
              >
                {noteBusy ? t("common.saving") : t("patientChart.hospAddNote")}
              </Button>
            </form>
            {hospitalizationNotes.length === 0 ? (
              <p className="clinic-muted">{t("patientChart.hospNoteEmpty")}</p>
            ) : (
              <ul className="patient-chart-hosp-notes">
                {hospitalizationNotes.map((note) => (
                  <li key={note.id}>
                    <time dateTime={note.noted_at}>
                      {formatChartDate(note.noted_at, emptyDate)}
                    </time>
                    <p>{note.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="patient-chart-panel" aria-label={t("patientChart.labTitle")}>
        <div className="patient-chart-panel-head">
          <div>
            <h2>
              <FlaskConical size={18} aria-hidden="true" className="patient-chart-panel-icon" />
              {t("patientChart.labTitle")}
            </h2>
            <p className="clinic-muted">{t("patientChart.labHint")}</p>
            {medicalImages.length > 0 && (
              <p className="patient-chart-lab-count">
                {t("patientChart.labCount", { count: medicalImages.length })}
              </p>
            )}
          </div>
          <div className="patient-chart-panel-actions">
            <Button
              type="button"
              className="patient-chart-action-btn"
              onClick={() => setLabAttachOpen(true)}
            >
              <Paperclip size={16} aria-hidden="true" className="mr-1" />
              {t("patientChart.labAttach")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="patient-chart-action-btn"
              onClick={openLabLinkDialog}
            >
              <Link2 size={16} aria-hidden="true" className="mr-1" />
              {t("patientChart.labLink")}
            </Button>
          </div>
        </div>
        {medicalImages.length === 0 ? (
          <p className="clinic-muted">{t("patientChart.labEmpty")}</p>
        ) : (
          <p className="clinic-muted">{t("patientChart.labSeeTimeline")}</p>
        )}
      </section>

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
                onChange={(e) => {
                  speciesDirtyRef.current = true;
                  setSpeciesCategory(e.target.value);
                }}
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
              className="patient-chart-action-btn"
              onClick={() => setSpeciesFormOpen((v) => !v)}
            >
              {speciesFormOpen ? t("patientChart.hideSpeciesForm") : t("patientChart.showSpeciesForm")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="patient-chart-action-btn"
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
              setFormData={setSpeciesFormDataTracked}
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
          emptyMessage={t("timeline.empty")}
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

      <Dialog open={admitOpen} onOpenChange={setAdmitOpen}>
        <DialogContent className={clinicDialogClass("max-w-md")}>
          <DialogHeader>
            <DialogTitle>{t("patientChart.hospAdmit")}</DialogTitle>
          </DialogHeader>
          <form className="clinic-form" onSubmit={handleAdmit}>
            <div className="form-group">
              <Label htmlFor="admit-reason">{t("patientChart.hospReason")}</Label>
              <Textarea
                id="admit-reason"
                name="admission_reason"
                value={admitReason}
                onChange={(e) => setAdmitReason(e.target.value)}
                placeholder={t("patientChart.hospReasonPlaceholder")}
                rows={3}
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="patient-chart-action-btn" disabled={admitBusy}>
              {admitBusy ? t("common.saving") : t("patientChart.hospAdmit")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={labAttachOpen} onOpenChange={setLabAttachOpen}>
        <DialogContent className={clinicDialogClass("max-w-md")}>
          <DialogHeader>
            <DialogTitle>{t("patientChart.labAttach")}</DialogTitle>
          </DialogHeader>
          <p className="clinic-muted patient-chart-dialog-hint">{t("patientChart.labAttachHint")}</p>
          <form className="clinic-form" onSubmit={handleAttachLab}>
            <div className="form-group">
              <Label htmlFor="lab-file">{t("patientChart.labFileLabel")}</Label>
              <Input
                id="lab-file"
                name="lab_file"
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.pdf"
                onChange={(e) => setLabFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="form-group">
              <Label htmlFor="lab-context">{t("patientChart.labContext")}</Label>
              <Textarea
                id="lab-context"
                name="lab_context"
                value={labContext}
                onChange={(e) => setLabContext(e.target.value)}
                placeholder={t("patientChart.labContextPlaceholder")}
                rows={3}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              className="patient-chart-action-btn"
              disabled={labAttachBusy || !labFile}
            >
              {labAttachBusy ? t("patientChart.labAttaching") : t("patientChart.labAttachSubmit")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={labLinkOpen} onOpenChange={setLabLinkOpen}>
        <DialogContent className={clinicDialogClass("max-w-lg")}>
          <DialogHeader>
            <DialogTitle>{t("patientChart.labLink")}</DialogTitle>
          </DialogHeader>
          <div className="patient-chart-lab-link-search">
            <Label htmlFor="lab-search" className="sr-only">
              {t("patientChart.labSearchPlaceholder")}
            </Label>
            <Input
              id="lab-search"
              name="lab_search"
              value={unlinkedSearch}
              onChange={(e) => setUnlinkedSearch(e.target.value)}
              placeholder={t("patientChart.labSearchPlaceholder")}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchUnlinked();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={searchUnlinked}>
              {t("common.search")}
            </Button>
          </div>
          {unlinkedLoading ? (
            <p className="clinic-muted" role="status">
              {t("common.loading")}
            </p>
          ) : unlinked.length === 0 ? (
            <p className="clinic-muted">{t("patientChart.labUnlinkedEmpty")}</p>
          ) : (
            <ul className="patient-chart-lab-unlinked">
              {unlinked.map((img) => (
                <li key={img.id}>
                  <div>
                    <strong>{img.patient_name || t("patientChart.labTypeUnknown")}</strong>
                    <span>
                      {(img.image_type || t("patientChart.labTypeUnknown")) +
                        " · " +
                        formatChartDate(img.created_at, emptyDate)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="patient-chart-action-btn"
                    disabled={linkingId === img.id}
                    onClick={() => handleLinkStudy(img.id)}
                  >
                    {t("patientChart.labLinkConfirm")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog {...dialogProps} />
    </main>
  );
}
