import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { GuiaaBrandLockup } from "../components/GuiaaBrandLockup";
import { AuthPageShell } from "../layout/AuthPageShell";
import { useVet } from "../context/VetContext";
import { BACKEND_URL } from "../lib/backendUrl";
import { getAuthHeaders } from "../lib/authHeaders";
import { trackMetaPurchaseOnce } from "../lib/metaPixel";
import "./membershipPage.css";

export function PaymentSuccessPage({ setView }) {
  const { t } = useTranslation("clinic");
  const { login, veterinarian } = useVet();
  const [paymentStatus, setPaymentStatus] = useState("checking");
  const [purchaseType, setPurchaseType] = useState(null);
  const [creditsPurchased, setCreditsPurchased] = useState(null);
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId =
      urlParams.get("session_id") ||
      (typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("guiaa_checkout_session_id")
        : "") ||
      "";

    if (!sessionId) {
      setPaymentStatus("error");
      return;
    }

    try {
      sessionStorage.setItem("guiaa_checkout_session_id", sessionId);
    } catch {
      /* ignore */
    }

    pollPaymentStatus(sessionId);
  }, []);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    setPollAttempt(attempts + 1);

    if (attempts >= maxAttempts) {
      setPaymentStatus("timeout");
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/payments/checkout/status/${sessionId}`,
        { headers: getAuthHeaders(veterinarian?.id) },
      );

      if (response.status === 401) {
        setView("login");
        return;
      }

      if (!response.ok) {
        throw new Error(t("paymentSuccess.verifyError"));
      }

      const data = await response.json();

      if (data.payment_status === "paid") {
        if (data?.veterinarian) {
          login(data.veterinarian);
        }
        try {
          sessionStorage.removeItem("guiaa_checkout_session_id");
        } catch {
          /* ignore */
        }
        setPurchaseType(data.purchase_type || null);
        setCreditsPurchased(data.credits || null);
        setPaymentStatus("success");
        trackMetaPurchaseOnce(sessionId, {
          purchaseType: data.purchase_type,
          packageId: data.package,
          value:
            data.amount ??
            (data.amount_total != null ? data.amount_total / 100 : undefined),
          currency: (data.currency || "mxn").toUpperCase(),
        });
        return;
      }

      if (data.activation_pending) {
        setPurchaseType(data.purchase_type || null);
        setPaymentStatus("pending");
        return;
      }

      if (data.status === "expired") {
        setPaymentStatus("expired");
        return;
      }

      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch (error) {
      console.error("Error checking payment:", error);
      setPaymentStatus("error");
    }
  };

  const renderContent = () => {
    if (paymentStatus === "checking") {
      return (
        <div className="payment-status-card">
          <span className="payment-status-icon payment-status-icon--loading">
            <Loader2 size={28} aria-hidden />
          </span>
          <h2>{t("paymentSuccess.checkingTitle")}</h2>
          <p>{t("paymentSuccess.checkingBody")}</p>
          {pollAttempt > 0 && (
            <p className="payment-status-note text-sm text-muted-foreground" role="status">
              {t("paymentSuccess.attempt", { current: pollAttempt, max: 5 })}
            </p>
          )}
        </div>
      );
    }

    if (paymentStatus === "success") {
      return (
        <div className="payment-status-card">
          <span className="payment-status-icon payment-status-icon--success">
            <CheckCircle2 size={30} aria-hidden />
          </span>
          <h2>{t("paymentSuccess.successTitle")}</h2>
          <p>
            {purchaseType === "consultation_credits"
              ? t("paymentSuccess.creditsAdded", { count: creditsPurchased || "" })
              : t("paymentSuccess.membershipActive")}
          </p>
          <div className="payment-status-actions">
            <Button type="button" onClick={() => setView("dashboard")} className="w-full sm:w-auto">
              {t("paymentSuccess.goDashboard")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setView("new-consultation")}
              className="w-full sm:w-auto"
            >
              {t("paymentSuccess.newConsultation")}
            </Button>
          </div>
        </div>
      );
    }

    if (paymentStatus === "pending") {
      return (
        <div className="payment-status-card">
          <span className="payment-status-icon payment-status-icon--loading">
            <Clock size={28} aria-hidden />
          </span>
          <h2>{t("paymentSuccess.pendingTitle")}</h2>
          <p>
            {purchaseType === "consultation_credits"
              ? t("paymentSuccess.pendingCredits")
              : t("paymentSuccess.pendingMembership")}
          </p>
          <p className="payment-status-note text-sm text-muted-foreground">
            {t("paymentSuccess.pendingNote")}
          </p>
          <div className="payment-status-actions">
            <Button type="button" onClick={() => setView("dashboard")} className="w-full sm:w-auto">
              {t("paymentSuccess.goDashboard")}
            </Button>
          </div>
        </div>
      );
    }

    if (paymentStatus === "expired") {
      return (
        <div className="payment-status-card">
          <span className="payment-status-icon payment-status-icon--error">
            <Clock size={28} aria-hidden />
          </span>
          <h2>{t("paymentSuccess.expiredTitle")}</h2>
          <p>{t("paymentSuccess.expiredBody")}</p>
          <div className="payment-status-actions">
            <Button type="button" onClick={() => setView("membership")} className="w-full sm:w-auto">
              {t("paymentSuccess.backMembership")}
            </Button>
          </div>
        </div>
      );
    }

    if (paymentStatus === "timeout") {
      return (
        <div className="payment-status-card">
          <span className="payment-status-icon payment-status-icon--error">
            <Clock size={28} aria-hidden />
          </span>
          <h2>{t("paymentSuccess.timeoutTitle")}</h2>
          <p>{t("paymentSuccess.timeoutBody")}</p>
          <div className="payment-status-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setView("dashboard")}
              className="w-full sm:w-auto"
            >
              {t("paymentSuccess.backDashboard")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="payment-status-card">
        <span className="payment-status-icon payment-status-icon--error">
          <AlertCircle size={28} aria-hidden />
        </span>
        <h2>{t("paymentSuccess.errorTitle")}</h2>
        <p>{t("paymentSuccess.errorBody")}</p>
        <div className="payment-status-actions">
          <Button type="button" onClick={() => setView("membership")} className="w-full sm:w-auto">
            {t("paymentSuccess.retry")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setView("dashboard")}
            className="w-full sm:w-auto"
          >
            {t("paymentSuccess.backDashboard")}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AuthPageShell setView={setView}>
      <GuiaaBrandLockup variant="auth" className="mb-6" />
      <div className="payment-status-shell">{renderContent()}</div>
    </AuthPageShell>
  );
}
