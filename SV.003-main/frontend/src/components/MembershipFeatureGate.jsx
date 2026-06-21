import React from "react";
import { Crown, Lock } from "lucide-react";
import { useVet } from "../context/VetContext";
import {
  canAccessFeature,
  getFeatureUpgradeMessage,
} from "../lib/membershipAccess";
import { Button } from "./ui/button";
import "../pages/clinic/clinicPageShared.css";

export function MembershipFeatureGate({ feature, setView, children }) {
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
        <p className="membership-feature-gate-eyebrow">Función no incluida en tu plan</p>
        <h2>Actualiza tu membresía</h2>
        <p>{getFeatureUpgradeMessage(feature)}</p>
        <Button
          type="button"
          className="membership-feature-gate-cta"
          onClick={() => setView?.("membership")}
        >
          <Crown size={16} aria-hidden />
          Ver planes
        </Button>
      </div>
    </div>
  );
}
