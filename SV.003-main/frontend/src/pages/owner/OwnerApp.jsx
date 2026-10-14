import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { OwnerShell } from "../../layout/OwnerShell";
import { useVet } from "../../context/VetContext";
import {
  analyzeOwnerConsultation,
  createOwnerCheckout,
  createOwnerConsultation,
  fetchOwnerCheckoutStatus,
  fetchOwnerConsultation,
  fetchOwnerConsultations,
  fetchOwnerMe,
  fetchOwnerPackages,
  canAccessOwnerConsulta,
  registerPetOwner,
} from "../../lib/ownerApi";
import { clearAccessToken, persistAuthFromResponse } from "../../lib/authHeaders";
import { getBackendUrl } from "../../lib/backendUrl";
import { notifyError, notifySuccess } from "../../lib/appToast";
import { TermsAndConditionsModal } from "../../components/TermsAndConditionsModal";
import { LazySpeciesForm } from "../../components/forms/LazySpeciesForm";
import { CONSULTATION_CATEGORY_LIST } from "../../lib/consultationCategories";
import { downloadOwnerConsultaPdf } from "../../lib/ownerConsultaPdf";
import "../../styles/consultationFlow.css";

function emptyOwnerForm() {
  return {
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
  };
}

function OwnerHome({ owner, sessions }) {
  const { t } = useTranslation("owner");
  return (
    <div className="owner-card">
      <h1>{t("home.title", { name: owner?.nombre ? `, ${owner.nombre}` : "" })}</h1>
      <p className="owner-lead">{t("home.lead")}</p>
      <div className="owner-disclaimer">{t("home.disclaimer")}</div>
      <div className="owner-actions">
        {sessions > 0 ? (
          <Link className="owner-btn owner-btn-primary" to="/consulta/nueva">
            {t("home.ctaNew")}
          </Link>
        ) : (
          <Link className="owner-btn owner-btn-primary" to="/consulta/pagar">
            {t("home.ctaPay")}
          </Link>
        )}
        <Link className="owner-btn owner-btn-secondary" to="/consulta/historial">
          {t("home.ctaHistory")}
        </Link>
      </div>
    </div>
  );
}

function OwnerAuth({ mode, onAuth }) {
  const { t } = useTranslation("owner");
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (isRegister && !acceptTerms) {
      setError(t("auth.mustAccept"));
      return;
    }
    if (isRegister) {
      const phoneDigits = String(telefono || "").replace(/\D/g, "");
      if (phoneDigits.length < 8) {
        setError(t("auth.phoneRequired"));
        return;
      }
    }
    setBusy(true);
    try {
      if (isRegister) {
        const profile = await registerPetOwner({
          nombre,
          email,
          password,
          telefono: telefono.trim(),
          accept_terms: acceptTerms,
        });
        onAuth(profile);
        notifySuccess(t("auth.registerOk"));
        navigate("/consulta/pagar");
      } else {
        const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const raw = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(raw.detail || t("auth.loginFailed"));
        }
        const profile = persistAuthFromResponse(raw);
        if (!canAccessOwnerConsulta(profile)) {
          clearAccessToken();
          throw new Error(t("auth.notOwner"));
        }
        onAuth(profile);
        notifySuccess(t("auth.loginOk"));
        navigate("/consulta");
      }
    } catch (err) {
      setError(err.message || t("auth.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="owner-card">
      <h1>{isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}</h1>
      <p className="owner-lead">
        {isRegister ? t("auth.registerLead") : t("auth.loginLead")}
      </p>
      <form className="owner-form" onSubmit={submit}>
        {isRegister ? (
          <label>
            {t("auth.name")}
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
        ) : null}
        <label>
          {t("auth.email")}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        {isRegister ? (
          <label>
            {t("auth.phone")}
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
              autoComplete="tel"
              inputMode="tel"
            />
          </label>
        ) : null}
        <label>
          {t("auth.password")}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={8}
          />
        </label>
        {isRegister ? (
          <>
            <div className="owner-privacy-notice" role="note">
              {t("auth.privacyNotice")}
            </div>
            <label className="owner-check">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  const next = e.target.checked;
                  if (next && !acceptTerms) {
                    setLegalModal("terms");
                    return;
                  }
                  setAcceptTerms(next);
                }}
              />
              <span>
                {t("auth.acceptBefore")}{" "}
                <button
                  type="button"
                  className="owner-legal-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setLegalModal("terms");
                  }}
                >
                  {t("auth.termsLink")}
                </button>{" "}
                {t("auth.acceptAnd")}{" "}
                <button
                  type="button"
                  className="owner-legal-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setLegalModal("privacy");
                  }}
                >
                  {t("auth.privacyLink")}
                </button>{" "}
                {t("auth.acceptAfter")}
                {acceptTerms ? (
                  <span className="owner-legal-ok" aria-hidden>
                    {" "}
                    ✓
                  </span>
                ) : null}
              </span>
            </label>
          </>
        ) : null}
        {error ? <p className="owner-error">{error}</p> : null}
        <div className="owner-actions">
          <button className="owner-btn owner-btn-primary" type="submit" disabled={busy}>
            {busy ? t("auth.busy") : isRegister ? t("auth.registerCta") : t("auth.loginCta")}
          </button>
          <Link
            className="owner-btn owner-btn-secondary"
            to={isRegister ? "/consulta/entrar" : "/consulta/registro"}
          >
            {isRegister ? t("auth.haveAccount") : t("auth.needAccount")}
          </Link>
        </div>
      </form>

      <TermsAndConditionsModal
        isOpen={legalModal === "terms"}
        variant="terms"
        onClose={() => setLegalModal(null)}
        onAccept={() => {
          setAcceptTerms(true);
          setLegalModal(null);
        }}
      />
      <TermsAndConditionsModal
        isOpen={legalModal === "privacy"}
        variant="privacy"
        readOnly
        onClose={() => setLegalModal(null)}
        onAccept={() => setLegalModal(null)}
      />
    </div>
  );
}

function formatMxn(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  const digits = Number.isInteger(amount) ? 0 : 2;
  return amount.toLocaleString("es-MX", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function OwnerPay({ ownerId, sessions, unlimited = false, onSessions }) {
  const { t } = useTranslation("owner");
  const [pkg, setPkg] = useState(null);
  const [firstOffer, setFirstOffer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [disclaimer, setDisclaimer] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchOwnerPackages()
      .then((data) => {
        if (cancelled) return;
        const first = data.packages?.[0] || null;
        setPkg(first);
        setDisclaimer(data.disclaimer || "");
      })
      .catch((err) => notifyError(err.message));
    if (ownerId) {
      fetchOwnerMe(ownerId)
        .then((me) => {
          if (!cancelled) setFirstOffer(me.first_consultation_offer || null);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const pay = async () => {
    setBusy(true);
    try {
      const origin = window.location.origin;
      const data = await createOwnerCheckout(ownerId, origin, pkg?.id);
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      throw new Error(t("pay.noUrl"));
    } catch (err) {
      notifyError(err.message || t("pay.error"));
      setBusy(false);
    }
  };

  return (
    <div className="owner-card">
      <h1>{t("pay.title")}</h1>
      <p className="owner-lead">{t("pay.lead")}</p>
      {!unlimited && sessions > 0 && sessions < 999999 ? (
        <p className="owner-muted">
          {sessions === 1
            ? t("pay.alreadyHaveOne")
            : t("pay.alreadyHave", { count: sessions })}
        </p>
      ) : null}
      {firstOffer ? (
        <div className="owner-offer">
          <div className="owner-offer-top">
            <p className="owner-offer-kicker">{t("pay.firstKicker")}</p>
            <span className="owner-offer-code">{firstOffer.code}</span>
          </div>
          <div className="owner-offer-prices">
            <span className="owner-offer-now">
              ${formatMxn(firstOffer.price_mxn)}
              <small>MXN</small>
            </span>
            <span className="owner-offer-was">${formatMxn(firstOffer.list_price_mxn)} MXN</span>
          </div>
          <p className="owner-offer-note">
            {t("pay.afterPrice", { list: formatMxn(firstOffer.list_price_mxn) })}
          </p>
        </div>
      ) : null}
      {pkg ? (
        <div className="owner-disclaimer">
          <strong>{pkg.name}</strong>
          <br />
          {pkg.description}
          {firstOffer ? null : (
            <>
              <br />
              <span>
                ${formatMxn(pkg.price)} {String(pkg.currency || "mxn").toUpperCase()}
              </span>
            </>
          )}
        </div>
      ) : null}
      <div className="owner-disclaimer">{disclaimer || t("pay.disclaimer")}</div>
      <div className="owner-actions">
        <button
          type="button"
          className="owner-btn owner-btn-primary"
          onClick={pay}
          disabled={busy || !pkg}
        >
          {busy ? t("pay.busy") : t("pay.cta")}
        </button>
        {sessions > 0 ? (
          <Link className="owner-btn owner-btn-secondary" to="/consulta/nueva">
            {t("pay.continue")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function OwnerPayOk({ ownerId, onSessions }) {
  const { t } = useTranslation("owner");
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId || !ownerId) {
      setStatus("error");
      setError(t("payOk.missing"));
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchOwnerCheckoutStatus(ownerId, sessionId);
        if (cancelled) return;
        if (data.payment_status === "paid" && data.fulfilled) {
          onSessions?.(data.owner_sessions_remaining ?? 1);
          setStatus("ok");
          notifySuccess(t("payOk.success"));
        } else {
          setStatus("pending");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err.message || t("payOk.error"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId, onSessions, t]);

  return (
    <div className="owner-card">
      <h1>{t("payOk.title")}</h1>
      {status === "checking" || status === "pending" ? (
        <p className="owner-lead">{t("payOk.checking")}</p>
      ) : null}
      {status === "ok" ? (
        <>
          <p className="owner-lead">{t("payOk.lead")}</p>
          <div className="owner-actions">
            <button
              type="button"
              className="owner-btn owner-btn-primary"
              onClick={() => navigate("/consulta/nueva")}
            >
              {t("payOk.cta")}
            </button>
          </div>
        </>
      ) : null}
      {status === "error" ? <p className="owner-error">{error}</p> : null}
    </div>
  );
}

function OwnerNew({ ownerId, ownerName, sessions, onSessions }) {
  const { t } = useTranslation("owner");
  const { t: tSpecies } = useTranslation("speciesForms");
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState(emptyOwnerForm);
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [record, setRecord] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const speciesLabel = category
    ? tSpecies(`categories.${category}`, {
        defaultValue: CONSULTATION_CATEGORY_LIST.find((item) => item.key === category)?.name || category,
      })
    : t("consultation.noSpecies", { defaultValue: "Sin especie" });

  const steps = [
    { number: 1, label: t("new.stepData"), icon: "🐾" },
    { number: 2, label: t("new.stepReason"), icon: "📝" },
    { number: 3, label: t("new.stepConsulta"), icon: "💬" },
  ];

  const goStep2 = (e) => {
    e.preventDefault();
    setError("");
    if (!category) {
      setError(t("new.pickSpecies"));
      return;
    }
    if (!String(formData.nombre_mascota || "").trim()) {
      setError(t("new.needName"));
      return;
    }
    setStep(2);
  };

  const goStep3 = (e) => {
    e.preventDefault();
    setError("");
    if (String(formData.detalle_paciente || "").trim().length < 8) {
      setError(t("new.needDetail"));
      return;
    }
    setStep(3);
  };

  const generate = async () => {
    setError("");
    if (!acceptDisclaimer) {
      setError(t("new.acceptDisclaimer"));
      return;
    }
    setBusy(true);
    try {
      const created = await createOwnerConsultation(ownerId, {
        category,
        pet_name: formData.nombre_mascota,
        species: category,
        form_data: { ...formData, especie: category },
        symptoms: formData.detalle_paciente,
        accept_disclaimer: true,
      });
      if (typeof created.owner_sessions_remaining === "number") {
        onSessions?.(created.owner_sessions_remaining);
      }
      const analyzed = await analyzeOwnerConsultation(ownerId, created.id);
      const next = {
        id: created.id,
        created_at: created.created_at,
        category,
        owner_name: ownerName || "",
        form_data: {
          ...(created.payload?.form_data || {}),
          ...formData,
          especie: category,
          nombre_dueño: ownerName || formData.nombre_dueño || "",
        },
        detalle_paciente: formData.detalle_paciente,
        analysis: analyzed.analysis || "",
      };
      setRecord(next);
      setAnalysis(next.analysis);
    } catch (err) {
      setError(err.message || t("new.error"));
    } finally {
      setBusy(false);
    }
  };

  if (sessions <= 0 && !analysis) {
    return (
      <div className="owner-card">
        <h1>{t("new.needPayTitle")}</h1>
        <p className="owner-lead">{t("new.needPayLead")}</p>
        <Link className="owner-btn owner-btn-primary" to="/consulta/pagar">
          {t("new.needPayCta")}
        </Link>
      </div>
    );
  }

  const stepper = (
    <div className="step-indicator">
      <div className="step-progress-line" style={{ width: `${(step - 1) * 50}%` }} />
      {steps.map((item) => (
        <div
          key={item.number}
          className={`step${step === item.number ? " active" : ""}${step > item.number ? " completed" : ""}`}
        >
          <div className="step-icon-wrapper" aria-hidden>
            {step > item.number ? <span className="check-icon">✓</span> : item.icon}
          </div>
          <div className="step-label">{item.label}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="owner-card owner-card--wide consultation-form-container">
      <h1>{step === 2 ? t("new.reasonTitle") : t("new.title")}</h1>
      <p className="owner-lead">
        {step === 1 ? t("new.lead") : step === 2 ? t("new.reasonLead") : t("new.readyLead", { species: speciesLabel })}
      </p>
      {stepper}
      <p className="owner-muted">{t("new.stepOf", { step })}</p>

      {step === 1 ? (
        <form className="owner-form consultation-form" onSubmit={goStep2}>
          <div className="form-section category-selector-wrap">
            <div className="category-selector-head">
              <h3>{tSpecies("speciesTitle")}</h3>
            </div>
            <div className="category-selector-panel">
              <div className="category-grid category-grid--chips" role="listbox">
                {CONSULTATION_CATEGORY_LIST.map((item) => (
                  <div
                    key={item.key}
                    role="option"
                    aria-selected={category === item.key}
                    tabIndex={0}
                    className={`category-card category-card--chip ${category === item.key ? "selected" : ""}`}
                    onClick={() => setCategory(item.key)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        setCategory(item.key);
                      }
                    }}
                  >
                    <span className="category-icon" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="category-label">
                      {tSpecies(`categories.${item.key}`, { defaultValue: item.name })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {category ? (
            <LazySpeciesForm category={category} formData={formData} setFormData={setFormData} />
          ) : null}
          {error ? <p className="owner-error">{error}</p> : null}
          <div className="owner-actions">
            <button className="owner-btn owner-btn-primary" type="submit" disabled={!category}>
              {t("new.continueStep2")}
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form className="owner-form consultation-form" onSubmit={goStep3}>
          <div className="form-section">
            <h3>{t("new.petDetailTitle")}</h3>
            <label>
              {t("new.detailLabel")}
              <textarea
                required
                rows={16}
                value={formData.detalle_paciente}
                onChange={(e) => setFormData({ ...formData, detalle_paciente: e.target.value })}
                placeholder={t("new.detailPlaceholder")}
              />
            </label>
          </div>
          {error ? <p className="owner-error">{error}</p> : null}
          <div className="owner-actions">
            <button className="owner-btn owner-btn-secondary" type="button" onClick={() => setStep(1)}>
              {t("new.back")}
            </button>
            <button className="owner-btn owner-btn-primary" type="submit">
              {t("new.continueStep3")}
            </button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <div className="owner-form">
          {!analysis ? (
            <>
              <h2>{t("new.readyTitle")}</h2>
              <ul>
                <li>{t("new.readyItem1")}</li>
                <li>{t("new.readyItem2")}</li>
                <li>{t("new.readyItem3")}</li>
              </ul>
              <label className="owner-check">
                <input
                  type="checkbox"
                  checked={acceptDisclaimer}
                  onChange={(e) => setAcceptDisclaimer(e.target.checked)}
                />
                <span>{t("new.acceptDisclaimer")}</span>
              </label>
              {error ? <p className="owner-error">{error}</p> : null}
              <div className="owner-actions">
                <button className="owner-btn owner-btn-secondary" type="button" onClick={() => setStep(2)} disabled={busy}>
                  {t("new.back")}
                </button>
                <button className="owner-btn owner-btn-primary" type="button" onClick={generate} disabled={busy}>
                  {busy ? t("new.busy") : t("new.generate")}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>{t("new.resultTitle")}</h2>
              <div className="owner-disclaimer">{t("new.disclaimer")}</div>
              <div className="owner-analysis">{analysis}</div>
              <div className="owner-actions">
                <button
                  className="owner-btn owner-btn-primary"
                  type="button"
                  disabled={pdfBusy || !record}
                  onClick={async () => {
                    setPdfBusy(true);
                    setError("");
                    try {
                      await downloadOwnerConsultaPdf(record);
                    } catch (err) {
                      setError(err.message || t("result.pdfError"));
                    } finally {
                      setPdfBusy(false);
                    }
                  }}
                >
                  {pdfBusy ? t("new.busy") : t("result.downloadPdf")}
                </button>
                <Link className="owner-btn owner-btn-secondary" to="/consulta/historial">
                  {t("result.history")}
                </Link>
                <button
                  className="owner-btn owner-btn-primary"
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setCategory("");
                    setFormData(emptyOwnerForm());
                    setRecord(null);
                    setAnalysis("");
                    setAcceptDisclaimer(false);
                  }}
                >
                  {t("home.ctaNew")}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function OwnerResult({ ownerId }) {
  const { t } = useTranslation("owner");
  const { id } = useParams();
  const location = useLocation();
  const [row, setRow] = useState(location.state?.consultation || null);
  const [analysis, setAnalysis] = useState(location.state?.analysis || "");
  const [error, setError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if ((analysis && row) || !ownerId || !id) return undefined;
    let cancelled = false;
    fetchOwnerConsultation(ownerId, id)
      .then((data) => {
        if (cancelled) return;
        setRow(data);
        setAnalysis(data.analysis || "");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || t("result.error"));
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId, id, analysis, row, t]);

  const petName = row?.payload?.form_data?.nombre_mascota || t("result.petFallback");

  return (
    <div className="owner-card">
      <h1>{t("result.title", { name: petName })}</h1>
      <div className="owner-disclaimer">{row?.disclaimer || t("result.disclaimer")}</div>
      {error ? <p className="owner-error">{error}</p> : null}
      {analysis ? <div className="owner-analysis">{analysis}</div> : <p className="owner-lead">{t("result.loading")}</p>}
      <div className="owner-actions">
        {analysis ? (
          <button
            className="owner-btn owner-btn-primary"
            type="button"
            disabled={pdfBusy}
            onClick={async () => {
              setPdfBusy(true);
              setError("");
              try {
                await downloadOwnerConsultaPdf({
                  ...row,
                  analysis,
                  form_data: row?.payload?.form_data,
                  category: row?.payload?.category,
                  detalle_paciente: row?.payload?.detalle_paciente,
                  owner_name: row?.payload?.form_data?.nombre_dueño,
                });
              } catch (err) {
                setError(err.message || t("result.pdfError"));
              } finally {
                setPdfBusy(false);
              }
            }}
          >
            {pdfBusy ? t("new.busy") : t("result.downloadPdf")}
          </button>
        ) : null}
        <Link className="owner-btn owner-btn-secondary" to="/consulta/historial">
          {t("result.history")}
        </Link>
        <Link className="owner-btn owner-btn-secondary" to="/consulta">
          {t("result.home")}
        </Link>
      </div>
    </div>
  );
}

function OwnerHistory({ ownerId }) {
  const { t } = useTranslation("owner");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [pdfId, setPdfId] = useState("");

  useEffect(() => {
    if (!ownerId) return undefined;
    let cancelled = false;
    fetchOwnerConsultations(ownerId)
      .then((data) => {
        if (!cancelled) setItems(data.consultations || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || t("history.error"));
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId, t]);

  return (
    <div className="owner-card">
      <h1>{t("history.title")}</h1>
      <p className="owner-lead">{t("history.lead")}</p>
      {error ? <p className="owner-error">{error}</p> : null}
      {!items.length && !error ? <p className="owner-muted">{t("history.empty")}</p> : null}
      <ul className="owner-history-list">
        {items.map((item) => {
          const name = item.payload?.form_data?.nombre_mascota || t("result.petFallback");
          const date = item.created_at
            ? new Date(item.created_at).toLocaleString()
            : "";
          const statusLabel =
            item.status === "completed"
              ? t("history.statusCompleted")
              : item.status === "draft"
                ? t("history.statusDraft")
                : item.status;
          const canDownload = Boolean(item.analysis || item.payload?.form_data?.nombre_mascota);
          return (
            <li key={item.id} className="owner-history-item">
              <Link to={`/consulta/resultado/${item.id}`}>
                <strong>{name}</strong>
                <div className="owner-muted">
                  {date} · {statusLabel}
                </div>
              </Link>
              {canDownload ? (
                <button
                  type="button"
                  className="owner-history-pdf"
                  disabled={pdfId === item.id}
                  onClick={async () => {
                    setPdfId(item.id);
                    setError("");
                    try {
                      await downloadOwnerConsultaPdf({
                        ...item,
                        analysis: item.analysis || "",
                        form_data: item.payload?.form_data,
                        category: item.payload?.category,
                        detalle_paciente: item.payload?.detalle_paciente,
                        owner_name: item.payload?.form_data?.nombre_dueño,
                      });
                    } catch (err) {
                      setError(err.message || t("result.pdfError"));
                    } finally {
                      setPdfId("");
                    }
                  }}
                >
                  {pdfId === item.id ? "…" : t("history.downloadPdf")}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RequireOwner({ owner, children }) {
  if (!owner) return <Navigate to="/consulta/entrar" replace />;
  return children;
}

export function OwnerApp() {
  const { veterinarian, login, logout, patchVeterinarian } = useVet();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(() => {
    if (veterinarian?.owner_unlimited) return 999999;
    return Number(veterinarian?.owner_sessions_remaining || 0);
  });

  const owner = useMemo(() => {
    if (canAccessOwnerConsulta(veterinarian)) return veterinarian;
    return null;
  }, [veterinarian]);

  const refreshMe = useCallback(async () => {
    if (!owner?.id) return;
    try {
      const me = await fetchOwnerMe(owner.id);
      setSessions(Number(me.owner_sessions_remaining || 0));
      patchVeterinarian?.({
        owner_sessions_remaining: me.owner_sessions_remaining,
        owner_unlimited: me.owner_unlimited,
        platform_admin: me.platform_admin,
        // No forzar account_kind=pet_owner: Carlos sigue siendo MVZ en /app.
      });
    } catch {
      /* ignore refresh errors */
    }
  }, [owner?.id, patchVeterinarian]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  // Vet normal sin acceso B2C → fuera de /consulta. Testers (Carlos) y dueños se quedan.
  useEffect(() => {
    if (veterinarian && !canAccessOwnerConsulta(veterinarian)) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [veterinarian, navigate]);

  const handleAuth = (profile) => {
    login?.(profile);
    setSessions(
      profile?.owner_unlimited
        ? 999999
        : Number(profile.owner_sessions_remaining || 0),
    );
  };

  const handleLogout = () => {
    clearAccessToken();
    logout?.();
    navigate("/consulta");
  };

  const path = location.pathname;
  let body = null;

  if (path === "/consulta/registro") {
    body = owner ? <Navigate to="/consulta" replace /> : <OwnerAuth mode="register" onAuth={handleAuth} />;
  } else if (path === "/consulta/entrar" || path === "/consulta/login") {
    body = owner ? <Navigate to="/consulta" replace /> : <OwnerAuth mode="login" onAuth={handleAuth} />;
  } else if (path === "/consulta/pagar") {
    body = (
      <RequireOwner owner={owner}>
        <OwnerPay
          ownerId={owner?.id}
          sessions={sessions}
          unlimited={Boolean(owner?.owner_unlimited)}
          onSessions={setSessions}
        />
      </RequireOwner>
    );
  } else if (path === "/consulta/pago-ok") {
    body = (
      <RequireOwner owner={owner}>
        <OwnerPayOk ownerId={owner?.id} onSessions={setSessions} />
      </RequireOwner>
    );
  } else if (path === "/consulta/nueva") {
    body = (
      <RequireOwner owner={owner}>
        <OwnerNew
          ownerId={owner?.id}
          ownerName={owner?.nombre}
          sessions={sessions}
          onSessions={setSessions}
        />
      </RequireOwner>
    );
  } else if (path.startsWith("/consulta/resultado/")) {
    body = (
      <RequireOwner owner={owner}>
        <OwnerResult ownerId={owner?.id} />
      </RequireOwner>
    );
  } else if (path === "/consulta/historial") {
    body = (
      <RequireOwner owner={owner}>
        <OwnerHistory ownerId={owner?.id} />
      </RequireOwner>
    );
  } else if (path === "/consulta" || path === "/consulta/") {
    body = owner ? (
      <OwnerHome owner={owner} sessions={sessions} />
    ) : (
      <div className="owner-card">
        <GuestHome />
      </div>
    );
  } else {
    body = <Navigate to="/consulta" replace />;
  }

  return (
    <OwnerShell
      owner={owner}
      sessionsRemaining={sessions}
      sessionsUnlimited={Boolean(owner?.owner_unlimited) || sessions >= 999999}
      onLogout={handleLogout}
      wide={path === "/consulta/nueva"}
    >
      {body}
    </OwnerShell>
  );
}

function GuestHome() {
  const { t } = useTranslation("owner");
  return (
    <>
      <h1>{t("guest.title")}</h1>
      <p className="owner-lead">{t("guest.lead")}</p>
      <div className="owner-disclaimer">{t("guest.disclaimer")}</div>
      <div className="owner-actions">
        <Link className="owner-btn owner-btn-primary" to="/consulta/registro">
          {t("guest.register")}
        </Link>
        <Link className="owner-btn owner-btn-secondary" to="/consulta/entrar">
          {t("guest.login")}
        </Link>
      </div>
    </>
  );
}
