import { useState } from "react";
import { Gem } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useVet } from "../../context/VetContext";
import { BACKEND_URL } from "../../lib/backendUrl";
import { DEFAULT_CREDIT_PACKAGES, getMembershipQuota } from "../../lib/membershipPlans";
import { notifyError } from "../../lib/appToast";
import { trackMetaInitiateCheckout } from "../../lib/metaPixel";
import { trackGoogleAdsInitiateCheckout } from "../../lib/googleAds";
import "./dashboardCdsBalanceCard.css";

export function DashboardCdsBalanceCard({
  membershipPackages,
  onOpenMembership,
}) {
  const { t } = useTranslation("clinic");
  const { veterinarian } = useVet();
  const [buying, setBuying] = useState(false);

  const membershipStatus = getMembershipQuota(veterinarian, membershipPackages);
  const balancePct =
    membershipStatus.maxConsultations > 0
      ? (membershipStatus.consultations / membershipStatus.maxConsultations) * 100
      : 0;
  const tone =
    balancePct >= 60 ? "high" : balancePct >= 25 ? "medium" : "low";

  const handleBuy = async (packageId = "credits_10") => {
    if (!veterinarian?.id) return;
    setBuying(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/payments/consultations/checkout/session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            veterinarian_id: veterinarian.id,
            package_id: packageId,
            origin_url: window.location.origin,
            quantity: 1,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(t("dashLegacy.paymentSessionError"));
      }

      const data = await response.json();
      const creditPkg = DEFAULT_CREDIT_PACKAGES[packageId];
      trackMetaInitiateCheckout({
        packageId,
        value: creditPkg?.price,
        contentCategory: "consultation_credits",
      });
      trackGoogleAdsInitiateCheckout({
        value: creditPkg?.price,
        currency: "MXN",
      });
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error(error);
      notifyError(t("dashLegacy.paymentProcessError"));
    } finally {
      setBuying(false);
    }
  };

  return (
    <section className="dash-cds-balance" aria-label={t("dashLegacy.cdsPanelTitle")}>
      <div className="dash-cds-balance-head">
        <div>
          <h2>{t("dashLegacy.cdsPanelTitle")}</h2>
          <p>{t("dashLegacy.cdsPanelSub")}</p>
        </div>
      </div>

      <article className="dash-cds-balance-card">
        <div className="dash-cds-balance-main">
          <div className="dash-cds-balance-icon" aria-hidden>
            <Gem size={18} />
          </div>
          <div className="dash-cds-balance-copy">
            <div className="dash-cds-balance-value">
              {membershipStatus.consultations}
            </div>
            <p className="dash-cds-balance-plan">
              {t("dashLegacy.kpiPlan", { status: membershipStatus.status })}
            </p>
          </div>
        </div>

        {membershipStatus.maxConsultations > 0 && (
          <div className="dash-cds-balance-progress">
            <div className="dash-cds-balance-bar" aria-hidden>
              <div
                className={`dash-cds-balance-fill dash-cds-balance-fill--${tone}`}
                style={{ width: `${Math.min(balancePct, 100)}%` }}
              />
            </div>
            <span>
              {membershipStatus.consultations}/{membershipStatus.maxConsultations}{" "}
              {t("dashLegacy.consultationsLeft")}
            </span>
          </div>
        )}

        <div className="dash-cds-balance-actions">
          <p className="dash-cds-balance-reload">{t("dashLegacy.reloadConsultations")}</p>
          <div className="dash-cds-balance-ctas">
            <Button type="button" disabled={buying} onClick={() => handleBuy("credits_10")}>
              {buying ? t("dashLegacy.processing") : t("dashLegacy.buy10")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenMembership?.()}
            >
              {t("dashLegacy.viewMembershipPlans")}
            </Button>
          </div>
        </div>
      </article>
    </section>
  );
}
