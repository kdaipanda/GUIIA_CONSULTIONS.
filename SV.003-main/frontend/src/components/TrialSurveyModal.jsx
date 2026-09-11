import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "../lib/backendUrl";
import { getAuthHeaders } from "../lib/authHeaders";
import { submitTrialSurvey } from "../lib/trialSurvey";
import { trackMetaInitiateCheckout } from "../lib/metaPixel";
import "../styles/trialSurvey.css";

export function TrialSurveyModal({
  open,
  mandatory = false,
  onOpenChange,
  veterinarian,
  offer,
  onCompleted,
  onGoMembership,
}) {
  const { t } = useTranslation("clinic");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [phase, setPhase] = useState("survey");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [localOffer, setLocalOffer] = useState(offer || null);

  const starLabels = useMemo(
    () => [1, 2, 3, 4, 5].map((value) => t(`trialSurvey.stars.${value}`)),
    [t],
  );

  useEffect(() => {
    if (!open) return;
    setPhase("survey");
    setRating(0);
    setHoverRating(0);
    setComment("");
    setError("");
    setLocalOffer(offer || null);
  }, [open, offer]);

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    if (!veterinarian?.id) return;
    if (rating < 1) {
      setError(t("trialSurvey.errors.rating"));
      return;
    }
    if ((comment || "").trim().length < 5) {
      setError(t("trialSurvey.errors.comment"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const data = await submitTrialSurvey(veterinarian.id, getAuthHeaders(veterinarian.id), {
        rating,
        comment: comment.trim(),
      });
      setLocalOffer(data.offer || localOffer);
      setPhase("offer");
      onCompleted?.(data);
    } catch (err) {
      setError(err.message || t("trialSurvey.errors.submit"));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePremiumCheckout = async () => {
    if (!veterinarian?.id) return;
    setCheckoutLoading(true);
    setError("");
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/payments/checkout/session`, {
        method: "POST",
        headers: getAuthHeaders(veterinarian.id),
        body: JSON.stringify({
          package_id: "premium",
          origin_url: window.location.origin,
          billing_cycle: "monthly",
          veterinarian_id: veterinarian.id,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || t("trialSurvey.errors.checkout"));
      }

      const data = await response.json();
      if (!data.checkout_url) {
        throw new Error(t("trialSurvey.errors.checkoutUrl"));
      }

      trackMetaInitiateCheckout({
        packageId: "premium",
        contentCategory: "membership",
      });

      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err.message || t("trialSurvey.errors.checkoutOpen"));
      setCheckoutLoading(false);
    }
  };

  const activeOffer = localOffer || offer;
  const promoCode = activeOffer?.promo_code;
  const displayRating = hoverRating || rating;
  const surveyMandatory = phase === "survey" && mandatory;

  return (
    <Dialog open={open} onOpenChange={surveyMandatory ? () => {} : onOpenChange}>
      <DialogContent
        className={`trial-survey-dialog sm:max-w-lg${surveyMandatory ? " [&>button.absolute]:hidden trial-survey-dialog--blocking" : ""}`}
        onPointerDownOutside={(e) => {
          if (surveyMandatory) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (surveyMandatory) e.preventDefault();
        }}
      >
        {phase === "survey" ? (
          <form onSubmit={handleSubmitSurvey}>
            <DialogHeader>
              <DialogTitle>{t("trialSurvey.surveyTitle")}</DialogTitle>
              <DialogDescription>{t("trialSurvey.surveyDesc")}</DialogDescription>
            </DialogHeader>

            <div className="trial-survey-stars" role="radiogroup" aria-label={t("trialSurvey.ratingAria")}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`trial-survey-star${displayRating >= value ? " is-active" : ""}`}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={t("trialSurvey.starAria", {
                    value,
                    label: starLabels[value - 1],
                  })}
                  aria-pressed={rating === value}
                >
                  ★
                </button>
              ))}
            </div>
            {displayRating > 0 ? (
              <p className="trial-survey-star-label">{starLabels[displayRating - 1]}</p>
            ) : null}

            <label className="trial-survey-label" htmlFor="trial-survey-comment">
              {t("trialSurvey.comments")}
            </label>
            <textarea
              id="trial-survey-comment"
              className="trial-survey-textarea"
              rows={4}
              maxLength={2000}
              placeholder={t("trialSurvey.commentPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {error ? <p className="trial-survey-error">{error}</p> : null}

            <DialogFooter className="trial-survey-footer">
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? t("trialSurvey.submitting") : t("trialSurvey.submit")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("trialSurvey.thanksTitle")}</DialogTitle>
              <DialogDescription asChild>
                <div className="trial-survey-offer-copy">
                  <p>{activeOffer?.message}</p>
                  {promoCode ? (
                    <div className="trial-survey-promo-pill" aria-label={t("trialSurvey.promoLabel")}>
                      {t("trialSurvey.promoLabel")} <strong>{promoCode}</strong>
                      {activeOffer?.promo_auto_apply ? (
                        <span className="trial-survey-promo-note">{t("trialSurvey.promoAuto")}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </DialogDescription>
            </DialogHeader>

            {error ? <p className="trial-survey-error">{error}</p> : null}

            <DialogFooter className="trial-survey-footer">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange?.(false)}
                disabled={checkoutLoading}
              >
                {t("trialSurvey.close")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange?.(false);
                  onGoMembership?.();
                }}
                disabled={checkoutLoading}
              >
                {t("trialSurvey.viewPlans")}
              </Button>
              <Button
                type="button"
                onClick={handlePremiumCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? t("trialSurvey.openingCheckout") : t("trialSurvey.premiumCheckout")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
