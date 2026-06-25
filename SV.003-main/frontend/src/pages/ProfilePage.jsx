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
      ? new Date(veterinarian.membership_expires).toLocaleDateString("es-MX", {
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
  }, [veterinarian, packages]);

  if (!veterinarian) return null;

  const verified = Boolean(veterinarian.verified);

  return (
    <div className="profile-page-guiaa">
      <div className="container">
        <header className="profile-page-header">
          <p className="membership-eyebrow">Cuenta MVZ</p>
          <h1>Perfil profesional</h1>
          <p>Datos de tu registro, verificación y plan clínico en GUIAA.</p>
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
                  {veterinarian.especialidad || "Medicina Veterinaria"}
                </p>
                <span
                  className={`profile-verification-badge ${
                    verified
                      ? "profile-verification-badge--verified"
                      : "profile-verification-badge--pending"
                  }`}
                >
                  <ShieldCheck size={12} aria-hidden />
                  {verified ? "MVZ verificado" : "Verificación pendiente"}
                </span>
              </div>
            </div>

            <div className="profile-details-guiaa">
              <DetailRow icon={Mail} label="Email" value={veterinarian.email} />
              <DetailRow
                icon={Phone}
                label="Teléfono"
                value={veterinarian.telefono || "No registrado"}
              />
              <DetailRow
                icon={Award}
                label="Registro profesional"
                value={`${veterinarian.cedula_profesional || "No registrado"}${
                  veterinarian.profesional_pais
                    ? ` · ${countryLabel(veterinarian.profesional_pais)}`
                    : ""
                }`}
              />
              <DetailRow
                icon={Stethoscope}
                label="Experiencia"
                value={`${veterinarian.años_experiencia || 0} años`}
              />
              <DetailRow
                icon={Building2}
                label="Institución"
                value={veterinarian.institucion || "No registrada"}
              />
              <DetailRow
                icon={Calendar}
                label="Miembro desde"
                value={
                  veterinarian.created_at
                    ? new Date(veterinarian.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No disponible"
                }
              />
            </div>
          </article>

          <aside className="profile-membership-card">
            <div className="profile-membership-card-head">
              <span className="profile-membership-card-icon" aria-hidden>
                <Gem size={18} />
              </span>
              <h3>Tu membresía</h3>
            </div>
            <p className="profile-membership-plan">
              {membershipSummary?.hasPlan ? membershipSummary.planName : "Sin plan activo"}
            </p>

            <div className="profile-membership-meta">
              {membershipSummary?.hasPlan && membershipSummary.max ? (
                <span>
                  <Gem size={14} aria-hidden />
                  {membershipSummary.remaining} de {membershipSummary.max} consultas restantes
                </span>
              ) : null}
              {membershipSummary?.expiry && (
                <span>
                  <Calendar size={14} aria-hidden />
                  Vence: {membershipSummary.expiry}
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
                  Saldo de consultas CDS del periodo actual
                </p>
              </div>
            )}

            {membershipSummary?.speciesScope && (
              <p className="profile-species-note">
                Especies incluidas: {membershipSummary.speciesScope}.
              </p>
            )}

            <div className="profile-membership-actions">
              <button
                type="button"
                className="profile-membership-btn profile-membership-btn--primary"
                onClick={() => setView("membership")}
              >
                {membershipSummary?.hasPlan ? "Administrar plan" : "Contratar membresía"}
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
