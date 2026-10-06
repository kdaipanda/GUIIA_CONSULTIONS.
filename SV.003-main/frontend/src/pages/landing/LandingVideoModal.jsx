import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LANDING_PRESENTATION_POSTER,
  LANDING_PRESENTATION_VIDEO,
  LANDING_PRESENTATION_YOUTUBE,
} from "./landingBrandAssets";

function presentationEmbedSrc() {
  const { id, startSeconds } = LANDING_PRESENTATION_YOUTUBE;
  if (!id) return "";
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

/**
 * @param {"launch" | "presentation"} [initialSource]
 */
export function LandingVideoModal({ open, onClose, initialSource = "launch" }) {
  const { t } = useTranslation("landing");
  const [source, setSource] = useState(initialSource);
  const [mediaReady, setMediaReady] = useState(false);
  const closeRef = useRef(null);
  const videoRef = useRef(null);
  const previouslyFocused = useRef(null);
  const youtubeWatchUrl = LANDING_PRESENTATION_YOUTUBE?.watchUrl?.trim() || "";
  const youtubeEmbedSrc = useMemo(
    () => (open && mediaReady && source === "presentation" ? presentationEmbedSrc() : ""),
    [open, mediaReady, source],
  );

  useEffect(() => {
    if (!open) return;
    setSource(initialSource);
  }, [open, initialSource]);

  useEffect(() => {
    if (!open) {
      setMediaReady(false);
      return undefined;
    }
    const id = window.requestAnimationFrame(() => setMediaReady(true));
    return () => window.cancelAnimationFrame(id);
  }, [open, source]);

  useEffect(() => {
    if (!open || !mediaReady || source !== "launch") return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise?.catch) playPromise.catch(() => {});
    return undefined;
  }, [open, mediaReady, source]);

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

      const focusables = closeRef.current
        .closest(".landing-video-modal")
        ?.querySelectorAll(
          'button, [href], video, iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

  const title =
    source === "presentation"
      ? t("hero.presentationTitle")
      : t("hero.launchTitle");
  const caption =
    source === "presentation"
      ? t("hero.presentationCaption")
      : t("hero.launchCaption");

  return createPortal(
    <div
      className="landing-video-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="landing-video-modal-stage" onClick={(e) => e.stopPropagation()}>
        <div
          className="landing-video-modal-tabs"
          role="tablist"
          aria-label={t("hero.videoSourcesLabel")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={source === "launch"}
            className={`landing-video-modal-tab${source === "launch" ? " is-active" : ""}`}
            onClick={() => setSource("launch")}
          >
            {t("hero.playLaunch")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={source === "presentation"}
            className={`landing-video-modal-tab${source === "presentation" ? " is-active" : ""}`}
            onClick={() => setSource("presentation")}
          >
            {t("hero.playPresentation")}
          </button>
        </div>

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
            {!mediaReady ? (
              <div className="landing-video-modal-loading" aria-hidden />
            ) : source === "launch" ? (
              <video
                key="launch"
                ref={videoRef}
                className="landing-video-modal-player landing-video-modal-player--native"
                src={LANDING_PRESENTATION_VIDEO}
                poster={LANDING_PRESENTATION_POSTER}
                controls
                playsInline
                preload="metadata"
                title={t("hero.launchTitle")}
              />
            ) : youtubeEmbedSrc ? (
              <iframe
                key={youtubeEmbedSrc}
                className="landing-video-modal-player landing-video-modal-player--youtube"
                src={youtubeEmbedSrc}
                title={t("hero.presentationTitle")}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="landing-video-modal-loading" aria-hidden />
            )}
          </div>
        </div>

        <p className="landing-video-modal-footnote">
          {caption}
          {source === "presentation" && youtubeWatchUrl ? (
            <>
              {" "}
              <a
                className="landing-video-modal-watch-link"
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("hero.watchOnYoutube")}
              </a>
            </>
          ) : null}
        </p>
      </div>
    </div>,
    document.body,
  );
}

export { LANDING_HERO_VIDEO, LANDING_HERO_VIDEO_POSTER } from "./landingBrandAssets";
