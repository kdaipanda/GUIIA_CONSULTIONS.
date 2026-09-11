import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Building2,
  Calendar,
  ChevronRight,
  Gem,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useVet } from "../context/VetContext";
import { countryLabel } from "../lib/latamCountries";
import { BACKEND_URL } from "../lib/backendUrl";
import {
  DEFAULT_PACKAGES,
  getMembershipQuota,
  parseMembershipCatalogResponse,
} from "../lib/membershipPlans";
import "./profilePage.css";
import { useTranslation } from "react-i18next";
import { ModuleHelpTip } from "../components/clinic/ModuleHelpTip";
import "./clinic/helpCenterPage.css";

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="profile-detail-row">
      <div className="profile-detail-label">
        <Icon size={15} aria-hidden />
        {label}
      </div>
      <span className="profile-detail-value">{value}</span>
    </div>
  );
}

export function ProfilePage({ setView }) {
  const { t, i18n } = useTranslation("clinic");
  const locale = (i18n.language || "en").startsWith("es") ? "es-MX" : "en-US";
  const { veterinarian } = useVet();
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);

  const loadCatalog = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/membership/packages`);
      const data = response.ok ? await response.json() : null;
      setPackages(parseMembershipCatalogResponse(data).packages);
    } catch {
      setPackages(DEFAULT_PACKAGES);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const membershipSummary = useMemo(() => {
    if (!veterinarian) return null;

    const quota = getMembershipQuota(veterinarian, packages);
    const expiry = veterinarian.membership_expires
      ? new Date(veterinarian.membership_expires).toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

    return {
      planName: quota.planName,
      speciesScope: quota.speciesScope,
      remaining: quota.consultations,
      max: quota.maxConsultations || null,
      progress: quota.progress,
      expiry,
      hasPlan: Boolean(quota.planKey),
    };
  }, [veterinarian, packages, i18n.language]);

  if (!veterinarian) return null;

  const verified = Boolean(veterinarian.verified);

  return (
    <div className="profile-page-guiaa">
      <div className="container">
        <header className="profile-page-header">
          <p className="membership-eyebrow">{t("profile.eyebrow")}</p>
          <div className="clinic-page-title-row">
            <h1>{t("profile.title")}</h1>
            <ModuleHelpTip topicId="profile" setView={setView} />
          </div>
          <p>{t("profile.lead")}</p>
        </header>

        <div className="profile-page-grid">
          <article className="profile-card-guiaa">
            <div className="profile-card-guiaa-header">
              <div className="profile-avatar-guiaa" aria-hidden>
                {veterinarian.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{veterinarian.nombre}</h2>
                <p className="profile-specialty-guiaa">
                  {veterinarian.especialidad || t("profile.specialtyFallback")}
                </p>
                <span
                  className={`profile-verification-badge ${
                    verified
                      ? "profile-verification-badge--verified"
                      : "profile-verification-badge--pending"
                  }`}
                >
                  <ShieldCheck size={12} aria-hidden />
                  {verified ? t("profile.verified") : t("profile.pending")}
                </span>
              </div>
            </div>

            <div className="profile-details-guiaa">
              <DetailRow icon={Mail} label="Email" value={veterinarian.email} />
              <DetailRow
                icon={Phone}
                label={t("profile.phone")}
                value={veterinarian.telefono || t("profile.notRegistered")}
              />
              <DetailRow
                icon={Award}
                label={t("profile.license")}
                value={`${veterinarian.cedula_profesional || t("profile.notRegistered")}${
                  veterinarian.profesional_pais
                    ? ` · ${countryLabel(veterinarian.profesional_pais)}`
                    : ""
                }`}
              />
              <DetailRow
                icon={Stethoscope}
                label={t("profile.experience")}
                value={t("profile.years", {
                  count: veterinarian.años_experiencia || 0,
                })}
              />
              <DetailRow
                icon={Building2}
                label={t("profile.institution")}
                value={veterinarian.institucion || t("profile.notRegistered")}
              />
              <DetailRow
                icon={Calendar}
                label={t("profile.memberSince")}
                value={
                  veterinarian.created_at
                    ? new Date(veterinarian.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : t("profile.notAvailable")
                }
              />
            </div>
          </article>

          <aside className="profile-membership-card">
            <div className="profile-membership-card-head">
              <span className="profile-membership-card-icon" aria-hidden>
                <Gem size={18} />
              </span>
              <h3>{t("profile.yourMembership")}</h3>
            </div>
            <p className="profile-membership-plan">
              {membershipSummary?.hasPlan
                ? membershipSummary.planName
                : t("profile.noPlan")}
            </p>

            <div className="profile-membership-meta">
              {membershipSummary?.hasPlan && membershipSummary.max ? (
                <span>
                  <Gem size={14} aria-hidden />
                  {t("profile.remaining", {
                    remaining: membershipSummary.remaining,
                    max: membershipSummary.max,
                  })}
                </span>
              ) : null}
              {membershipSummary?.expiry && (
                <span>
                  <Calendar size={14} aria-hidden />
                  {t("profile.expires", { date: membershipSummary.expiry })}
                </span>
              )}
            </div>

            {membershipSummary?.hasPlan && membershipSummary.max > 0 && (
              <div className="profile-membership-progress">
                <div className="profile-membership-progress-bar">
                  <div
                    className="profile-membership-progress-fill"
                    style={{ width: `${membershipSummary.progress}%` }}
                  />
                </div>
                <p className="profile-membership-progress-label">
                  {t("profile.quotaLabel")}
                </p>
              </div>
            )}

            {membershipSummary?.speciesScope && (
              <p className="profile-species-note">
                {t("profile.speciesIncluded", {
                  scope: membershipSummary.speciesScope,
                })}
              </p>
            )}

            <div className="profile-membership-actions">
              <button
                type="button"
                className="profile-membership-btn profile-membership-btn--primary"
                onClick={() => setView("membership")}
              >
                {membershipSummary?.hasPlan
                  ? t("profile.managePlan")
                  : t("profile.buyPlan")}
                <ChevronRight size={14} aria-hidden />
              </button>
              <a
                href="mailto:soporte@guiaa.vet"
                className="profile-membership-btn profile-membership-btn--ghost"
              >
                <Mail size={14} aria-hidden />
                soporte@guiaa.vet
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
