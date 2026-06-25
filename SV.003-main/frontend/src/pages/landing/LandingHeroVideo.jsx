import React, { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { LANDING_HERO_VIDEO, LANDING_HERO_VIDEO_POSTER } from "./landingBrandAssets";

function useIsMobileCoarse() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}

export function LandingHeroVideo({ onFailed }) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const isMobile = useIsMobileCoarse();
  const [inView, setInView] = useState(false);
  const [userStarted, setUserStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;

    if (isMobile) {
      if (!userStarted) {
        video.pause();
        return;
      }
      if (inView) {
        const p = video.play();
        if (p?.catch) p.catch(() => {});
      } else {
        video.pause();
      }
      return;
    }

    if (inView) {
      const p = video.play();
      if (p?.catch) p.catch(() => {});
    } else {
      video.pause();
    }
  }, [inView, isMobile, userStarted, failed]);

  const handleError = () => {
    setFailed(true);
    onFailed?.();
  };

  const startMobile = () => {
    setUserStarted(true);
    const video = videoRef.current;
    const p = video?.play?.();
    if (p?.catch) p.catch(() => handleError());
  };

  if (failed) {
    return (
      <img
        src={LANDING_HERO_VIDEO_POSTER}
        alt="Doctor Plumitas presenta GUIAA"
        loading="eager"
        decoding="async"
      />
    );
  }

  return (
    <div ref={wrapRef} className="landing-hero-video-wrap">
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload={inView ? "metadata" : "none"}
        poster={LANDING_HERO_VIDEO_POSTER}
        onError={handleError}
      >
        <source src={LANDING_HERO_VIDEO} type="video/mp4" />
      </video>

      {isMobile && !userStarted && (
        <button
          type="button"
          className="landing-hero-video-play-overlay"
          onClick={startMobile}
          aria-label="Reproducir video de presentación"
        >
          <Play size={22} fill="currentColor" aria-hidden />
        </button>
      )}
    </div>
  );
}
