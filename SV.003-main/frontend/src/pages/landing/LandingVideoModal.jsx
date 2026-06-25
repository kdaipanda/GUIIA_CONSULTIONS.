import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { LANDING_HERO_VIDEO, LANDING_HERO_VIDEO_POSTER } from "./landingBrandAssets";

export function LandingVideoModal({ open, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const video = videoRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    const playPromise = video?.play?.();
    if (playPromise?.catch) playPromise.catch(() => {});

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="landing-video-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Video de presentación GUIAA"
      onClick={onClose}
    >
      <div className="landing-video-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="landing-video-modal-close"
          onClick={onClose}
          aria-label="Cerrar video"
        >
          <X size={20} aria-hidden />
        </button>
        <video
          ref={videoRef}
          className="landing-video-modal-player"
          controls
          playsInline
          poster={LANDING_HERO_VIDEO_POSTER}
        >
          <source src={LANDING_HERO_VIDEO} type="video/mp4" />
          Tu navegador no reproduce video HTML5.
        </video>
        <p className="landing-video-modal-caption">
          Doctor Plumitas te presenta GUIAA: software clínico veterinario con CDS L4·L5.
        </p>
      </div>
    </div>
  );
}

export { LANDING_HERO_VIDEO, LANDING_HERO_VIDEO_POSTER } from "./landingBrandAssets";
