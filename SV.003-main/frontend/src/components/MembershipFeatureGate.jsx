import React from "react";
import { Crown, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useVet } from "../context/VetContext";
import {
  canAccessFeature,
  getFeatureUpgradeMessage,
} from "../lib/membershipAccess";
import { Button } from "./ui/button";
import "../pages/clinic/clinicPageShared.css";

export function MembershipFeatureGate({ feature, setView, children }) {
  const { t } = useTranslation("clinic");
  const { veterinarian, platformAdmin } = useVet();
  const allowed = canAccessFeature(veterinarian, feature, { platformAdmin });

  if (allowed) {
    return children;
  }

  return (
    <div className="membership-feature-gate">
      <div className="membership-feature-gate-card">
        <div className="membership-feature-gate-icon" aria-hidden>
          <Lock size={22} />
        </div>
        <p className="membership-feature-gate-eyebrow">{t("featureGate.eyebrow")}</p>
        <h2>{t("featureGate.title")}</h2>
        <p>{getFeatureUpgradeMessage(feature)}</p>
        <Button
          type="button"
          className="membership-feature-gate-cta"
          onClick={() => setView?.("membership")}
        >
          <Crown size={16} aria-hidden />
          {t("featureGate.viewPlans")}
        </Button>
      </div>
    </div>
  );
}
