import React, { useEffect, useState } from "react";
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
  const { login, veterinarian } = useVet();
  const [paymentStatus, setPaymentStatus] = useState("checking");
  const [purchaseType, setPurchaseType] = useState(null);
  const [creditsPurchased, setCreditsPurchased] = useState(null);
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
      setPaymentStatus("error");
      return;
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

      if (!response.ok) {
        throw new Error("Error verificando pago");
      }

      const data = await response.json();

      if (data.payment_status === "paid") {
        if (data?.veterinarian) {
          login(data.veterinarian);
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
          <h2>Verificando pago</h2>
          <p>Estamos confirmando tu transacción. Esto puede tomar unos segundos.</p>
          {pollAttempt > 0 && (
            <p className="payment-status-note text-sm text-muted-foreground" role="status">
              Intento {pollAttempt} de 5…
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
          <h2>¡Pago exitoso!</h2>
          <p>
            {purchaseType === "consultation_credits"
              ? `Se agregaron ${creditsPurchased || ""} consultas a tu cuenta.`
              : "Tu membresía quedó activa. Ya puedes usar todas las funciones de GUIAA."}
          </p>
          <div className="payment-status-actions">
            <Button type="button" onClick={() => setView("dashboard")} className="w-full sm:w-auto">
              Ir al dashboard
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setView("new-consultation")}
              className="w-full sm:w-auto"
            >
              Nueva consulta
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
          <h2>Pago en proceso</h2>
          <p>
            {purchaseType === "consultation_credits"
              ? "Recibimos tu solicitud de recarga. Si pagaste con OXXO u otro método en efectivo, activaremos las consultas en cuanto Stripe confirme el pago (puede tardar hasta 3 días)."
              : "Recibimos tu solicitud de membresía. Si pagaste con OXXO u otro método en efectivo, activaremos tu plan en cuanto Stripe confirme el pago (puede tardar hasta 3 días)."}
          </p>
          <p className="payment-status-note text-sm text-muted-foreground">
            También te enviaremos la confirmación al correo de tu cuenta. Precios en MXN (pesos mexicanos).
          </p>
          <div className="payment-status-actions">
            <Button type="button" onClick={() => setView("dashboard")} className="w-full sm:w-auto">
              Ir al dashboard
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
          <h2>Sesión expirada</h2>
          <p>La sesión de pago expiró. Inicia el proceso nuevamente desde membresía.</p>
          <div className="payment-status-actions">
            <Button type="button" onClick={() => setView("membership")} className="w-full sm:w-auto">
              Volver a membresías
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
          <h2>Tiempo agotado</h2>
          <p>
            No pudimos verificar el pago a tiempo. Revisa tu correo o contacta a soporte@guiaa.vet.
          </p>
          <div className="payment-status-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setView("dashboard")}
              className="w-full sm:w-auto"
            >
              Ir al dashboard
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
        <h2>Error en el pago</h2>
        <p>Hubo un problema al procesar tu pago. Puedes intentarlo de nuevo.</p>
        <div className="payment-status-actions">
          <Button type="button" onClick={() => setView("membership")} className="w-full sm:w-auto">
            Intentar nuevamente
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setView("dashboard")}
            className="w-full sm:w-auto"
          >
            Volver al dashboard
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
