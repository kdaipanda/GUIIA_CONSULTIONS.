import React, { useEffect, useState } from "react";
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

const STAR_LABELS = [
  "Muy mala",
  "Mala",
  "Regular",
  "Buena",
  "Excelente",
];

export function TrialSurveyModal({
  open,
  onOpenChange,
  veterinarian,
  offer,
  onCompleted,
  onGoMembership,
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [phase, setPhase] = useState("survey");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [localOffer, setLocalOffer] = useState(offer || null);

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
      setError("Selecciona una calificación de 1 a 5 estrellas.");
      return;
    }
    if ((comment || "").trim().length < 5) {
      setError("Cuéntanos tu experiencia en al menos 5 caracteres.");
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
      setError(err.message || "No se pudo enviar la encuesta.");
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
        throw new Error(payload.detail || "No se pudo iniciar el pago");
      }

      const data = await response.json();
      if (!data.checkout_url) {
        throw new Error("No se recibió la URL de checkout.");
      }

      trackMetaInitiateCheckout({
        packageId: "premium",
        contentCategory: "membership",
      });

      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err.message || "Error al abrir el checkout.");
      setCheckoutLoading(false);
    }
  };

  const activeOffer = localOffer || offer;
  const promoCode = activeOffer?.promo_code;
  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="trial-survey-dialog sm:max-w-lg">
        {phase === "survey" ? (
          <form onSubmit={handleSubmitSurvey}>
            <DialogHeader>
              <DialogTitle>¿Cómo fue tu experiencia con GUIAA?</DialogTitle>
              <DialogDescription>
                Completaste tus 3 consultas de prueba. Tu opinión nos ayuda a mejorar
                la plataforma para veterinarios en México.
              </DialogDescription>
            </DialogHeader>

            <div className="trial-survey-stars" role="radiogroup" aria-label="Calificación">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`trial-survey-star${displayRating >= value ? " is-active" : ""}`}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${value} estrellas — ${STAR_LABELS[value - 1]}`}
                  aria-pressed={rating === value}
                >
                  ★
                </button>
              ))}
            </div>
            {displayRating > 0 ? (
              <p className="trial-survey-star-label">{STAR_LABELS[displayRating - 1]}</p>
            ) : null}

            <label className="trial-survey-label" htmlFor="trial-survey-comment">
              Comentarios
            </label>
            <textarea
              id="trial-survey-comment"
              className="trial-survey-textarea"
              rows={4}
              maxLength={2000}
              placeholder="¿Qué te gustó? ¿Qué mejorarías? ¿Recomendarías GUIAA a colegas?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {error ? <p className="trial-survey-error">{error}</p> : null}

            <DialogFooter className="trial-survey-footer">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange?.(false)}
                disabled={submitting}
              >
                Recordar después
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando…" : "Enviar encuesta"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>¡Gracias por tu retroalimentación!</DialogTitle>
              <DialogDescription asChild>
                <div className="trial-survey-offer-copy">
                  <p>{activeOffer?.message}</p>
                  {promoCode ? (
                    <div className="trial-survey-promo-pill" aria-label="Código promocional">
                      Cupón: <strong>{promoCode}</strong>
                      {activeOffer?.promo_auto_apply ? (
                        <span className="trial-survey-promo-note"> · se aplica al pagar</span>
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
                Cerrar
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
                Ver planes
              </Button>
              <Button
                type="button"
                onClick={handlePremiumCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? "Abriendo pago…" : "Contratar Premium con descuento"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
