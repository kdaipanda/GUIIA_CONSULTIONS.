import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { LegalIntro, PrivacyPolicyBody } from "./legal/LegalContent";
import { TermsLegalSections } from "./legal/TermsLegalSections";
import "./TermsAndConditionsModal.css";

export function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
  readOnly = false,
  variant = "terms",
}) {
  const { t } = useTranslation("legal");
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const contentRef = useRef(null);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setScrolledToBottom(true);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setScrolledToBottom(false);
      return undefined;
    }

    if (readOnly || variant === "privacy") {
      setScrolledToBottom(true);
    }

    const frame = window.requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, readOnly, variant, onClose]);

  if (!isOpen) return null;

  const isPrivacy = variant === "privacy";
  const modalTitle = isPrivacy ? t("termsModal.titlePrivacy") : t("termsModal.titleTerms");
  const modalSubtitle = isPrivacy
    ? t("termsModal.subtitlePrivacy")
    : t("termsModal.subtitleTerms");

  return createPortal(
    <div
      className="modal-overlay legal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal-content terms-modal legal-modal${isPrivacy ? " legal-modal--privacy" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <div className="modal-header legal-modal__header">
          <div className="legal-modal__header-text">
            <h2 id="legal-modal-title" className="legal-modal__title">
              {modalTitle}
            </h2>
            <p className="legal-modal__subtitle">{modalSubtitle}</p>
          </div>
          <button
            type="button"
            className="modal-close legal-modal__close"
            onClick={onClose}
            aria-label={t("termsModal.closeAria")}
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="modal-body terms-content legal-modal__body"
        >
          <LegalIntro privacy={isPrivacy} />

          {isPrivacy ? <PrivacyPolicyBody /> : <TermsLegalSections />}

          {isPrivacy && (
            <p className="legal-modal__meta">{t("privacyPolicy.copyright")}</p>
          )}
        </div>

        <div
          className={`modal-footer legal-modal__footer${readOnly ? " legal-modal__footer--readonly" : ""}`}
        >
          {readOnly ? (
            <Button type="button" className="legal-modal__btn-close" onClick={onClose}>
              {t("termsModal.close")}
            </Button>
          ) : (
            <>
              <span className="legal-modal__hint">
                {!scrolledToBottom && t("termsModal.scrollHint")}
              </span>
              <div className="legal-modal__actions">
                <Button type="button" variant="outline" onClick={onClose}>
                  {t("termsModal.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={onAccept}
                  disabled={!scrolledToBottom}
                  className={!scrolledToBottom ? "opacity-50" : ""}
                >
                  {t("termsModal.accept")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
