import React, { useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { TermsAndConditionsModal } from "../../components/TermsAndConditionsModal";
import { scrollToLandingProduct, scrollToLandingSection } from "./landingScroll";
import {
  LANDING_NEWSLETTER_EMAIL,
  LANDING_SOCIAL_LINKS,
} from "./landingBrandAssets";

const FOOTER_NAV = [
  { label: "Producto", action: () => scrollToLandingProduct("species") },
  { label: "Características", action: () => scrollToLandingSection("#features") },
  { label: "Precios", action: () => scrollToLandingSection("#pricing") },
  { label: "FAQ", action: () => scrollToLandingSection("#faq") },
];

function SocialIcon({ id }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
  };

  switch (id) {
    case "instagram":
      return (
        <svg {...common}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M16.5 3h3.2c.2 1.6 1.1 3.1 2.5 4 1.6 1 3.5 1.4 5.3 1.2v3.4c-2.1.1-4.1-.5-5.8-1.6v7.5c0 4.8-3.5 8.5-8.7 8.5-4.3 0-7.8-3.1-7.8-7.4 0-4.2 3.3-7.6 7.5-7.6.8 0 1.5.1 2.2.4v3.6a4.2 4.2 0 0 0-2-.5c-1.4 0-2.6 1.2-2.6 2.8 0 1.7 1.1 2.9 2.7 2.9 1.7 0 2.8-1.1 2.8-3.1V3z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3.4l.6-4H13v-3c0-1.1.9-2 2-2z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M6 9H2v13h4V9zm2-4a2.3 2.3 0 1 0 0 4.6A2.3 2.3 0 0 0 8 5zM22 22h-4v-6.5c0-1.5-.6-2.5-1.9-2.5-1 0-1.6.7-1.9 1.4-.1.2-.1.5-.1.8V22h-4s.1-11 0-13h4v1.8c.5-.8 1.5-2 3.6-2 2.6 0 4.6 1.7 4.6 5.4V22z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.6.6a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.8.6 7.6.6 7.6.6s5.8 0 7.6-.6a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .4-4.8 29 29 0 0 0-.4-4.8zM10 15.5V8.5l6 3.5-6 3.5z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    default:
      return null;
  }
}

export function LandingFooter() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [newsletterState, setNewsletterState] = useState("idle");
  const [legalModal, setLegalModal] = useState(null);

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setNewsletterState("error");
      return;
    }

    const subject = encodeURIComponent("Suscripción newsletter GUIAA");
    const body = encodeURIComponent(
      `Hola equipo GUIAA,\n\nDeseo recibir novedades clínicas y del producto.\n\nCorreo: ${trimmed}\n`,
    );
    window.location.href = `mailto:${LANDING_NEWSLETTER_EMAIL}?subject=${subject}&body=${body}`;
    setNewsletterState("sent");
    setEmail("");
  };

  return (
    <footer className="landing-footer-v2">
      <div className="landing-footer-v2-inner mx-auto max-w-6xl px-3 sm:px-8 lg:px-10">
        <div className="landing-footer-v2-panel">
          <header className="landing-footer-v2-hero">
            <span className="landing-footer-v2-eyebrow">Comunidad GUIAA</span>
            <h2 className="landing-footer-v2-headline">
              ¡Impulsando la práctica veterinaria con{" "}
              <span className="landing-footer-v2-accent">inteligencia clínica</span>!
            </h2>
          </header>

          <div className="landing-footer-v2-grid">
            <section className="landing-footer-v2-connect" aria-labelledby="footer-social-title">
              <h3 id="footer-social-title" className="landing-footer-v2-label">
                Síguenos en redes
              </h3>
              <div className="landing-footer-v2-social-grid">
                {LANDING_SOCIAL_LINKS.map(({ id, label, href, subtitle }) => (
                  <a
                    key={id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing-footer-v2-social-card"
                  >
                    <span className="landing-footer-v2-social-icon" aria-hidden>
                      <SocialIcon id={id} />
                    </span>
                    <span className="landing-footer-v2-social-text">
                      <span className="landing-footer-v2-social-name">{label}</span>
                      {subtitle && (
                        <span className="landing-footer-v2-social-sub">{subtitle}</span>
                      )}
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="landing-footer-v2-social-arrow"
                      aria-hidden
                    />
                  </a>
                ))}
              </div>

              <nav className="landing-footer-v2-nav" aria-label="Navegación del sitio">
                {FOOTER_NAV.map(({ label, action }) => (
                  <button key={label} type="button" onClick={action}>
                    {label}
                  </button>
                ))}
              </nav>
            </section>

            <section
              className="landing-footer-v2-mailbox"
              aria-labelledby="footer-mailbox-title"
            >
              <div className="landing-footer-v2-mailbox-card">
                <div className="landing-footer-v2-mailbox-head">
                  <span className="landing-footer-v2-mailbox-icon" aria-hidden>
                    <Mail size={18} />
                  </span>
                  <div>
                    <h3 id="footer-mailbox-title" className="landing-footer-v2-label">
                      Buzón
                    </h3>
                    <p className="landing-footer-v2-mailbox-hint">
                      Novedades clínicas, actualizaciones del producto y recursos para MVZ.
                    </p>
                  </div>
                </div>

                <form className="landing-footer-v2-form" onSubmit={handleNewsletterSubmit}>
                  <label htmlFor="landing-newsletter-email" className="sr-only">
                    Correo electrónico
                  </label>
                  <input
                    id="landing-newsletter-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Tu correo profesional"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (newsletterState !== "idle") setNewsletterState("idle");
                    }}
                    className="landing-footer-v2-input"
                    disabled={newsletterState === "sent"}
                  />
                  <button type="submit" className="landing-footer-v2-submit">
                    Enviar
                  </button>
                </form>

                {newsletterState === "error" && (
                  <p
                    className="landing-footer-v2-form-msg landing-footer-v2-form-msg--error"
                    role="alert"
                  >
                    Introduce un correo válido.
                  </p>
                )}
                {newsletterState === "sent" && (
                  <p
                    className="landing-footer-v2-form-msg landing-footer-v2-form-msg--ok"
                    role="status"
                  >
                    ¡Gracias! Abrimos tu cliente de correo para confirmar.
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="landing-footer-v2-bottom">
            <p className="landing-footer-v2-copy">
              © {year} GUIAA. Todos los derechos reservados.
            </p>
            <div className="landing-footer-v2-legal">
              <button type="button" onClick={() => setLegalModal("terms")}>
                Términos de uso
              </button>
              <span className="landing-footer-v2-legal-dot" aria-hidden>
                ·
              </span>
              <button type="button" onClick={() => setLegalModal("privacy")}>
                Política de privacidad
              </button>
              <span className="landing-footer-v2-legal-dot" aria-hidden>
                ·
              </span>
              <a href="mailto:soporte@guiaa.vet">soporte@guiaa.vet</a>
            </div>
          </div>
        </div>
      </div>

      <TermsAndConditionsModal
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        readOnly
        variant={legalModal === "privacy" ? "privacy" : "terms"}
      />
    </footer>
  );
}
