import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANDING_PRESENTATION_YOUTUBE } from "./landingBrandAssets";

function presentationEmbedSrc() {
  const { id, startSeconds } = LANDING_PRESENTATION_YOUTUBE;
  const params = new URLSearchParams({
    autoplay: "1",
    start: String(startSeconds || 0),
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    controls: "1",
    fs: "1",
    iv_load_policy: "3",
    cc_load_policy: "0",
    color: "white",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function LandingVideoModal({ open, onClose }) {
  const { t } = useTranslation("landing");
  const embedSrc = useMemo(() => (open ? presentationEmbedSrc() : ""), [open]);
  const closeRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeRef.current?.focus();
    }, 0);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }
      if (event.key !== "Tab" || !closeRef.current) return;

      // Single focusable control in chrome — keep focus in dialog
      const focusables = closeRef.current
        .closest(".landing-video-modal")
        ?.querySelectorAll(
          'button, [href], iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
      if (!focusables?.length) return;
      const list = Array.from(focusables);
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="landing-video-modal"
      role="dialog"
      aria-modal="true"
      aria-label={t("hero.presentationTitle")}
      onClick={onClose}
    >
      <div className="landing-video-modal-stage" onClick={(e) => e.stopPropagation()}>
        <div className="landing-video-modal-panel">
          <button
            ref={closeRef}
            type="button"
            className="landing-video-modal-close"
            onClick={onClose}
            aria-label={t("hero.closeVideo")}
          >
            <X size={22} strokeWidth={2.5} aria-hidden />
            <span className="landing-video-modal-close-label">{t("hero.closeVideo")}</span>
          </button>

          <div className="landing-video-modal-embed">
            <iframe
              key={embedSrc}
              className="landing-video-modal-player landing-video-modal-player--youtube"
              src={embedSrc}
              title={t("hero.presentationTitle")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>

        <p className="landing-video-modal-footnote">{t("hero.presentationCaption")}</p>
      </div>
    </div>,
    document.body,
  );
}

export { LANDING_HERO_VIDEO, LANDING_HERO_VIDEO_POSTER } from "./landingBrandAssets";
