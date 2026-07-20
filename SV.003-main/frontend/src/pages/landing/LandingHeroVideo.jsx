import React, { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import {
  LANDING_HERO_VIDEO,
  LANDING_HERO_VIDEO_MOBILE,
  LANDING_HERO_VIDEO_POSTER,
} from "./landingBrandAssets";

function useIsMobileCoarse() {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}

async function tryPlay(video, { retries = 2 } = {}) {
  if (!video) return false;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await video.play();
      return true;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 180 * (attempt + 1)));
      }
    }
  }
  return false;
}

export function LandingHeroVideo({ onFailed }) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const isMobile = useIsMobileCoarse();
  const [inView, setInView] = useState(false);
  const [userStarted, setUserStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);

  const videoSrc = isMobile ? LANDING_HERO_VIDEO_MOBILE : LANDING_HERO_VIDEO;
  const shouldAutoplay = !isMobile && inView && !failed;
  const preload = inView ? (isMobile && !userStarted ? "metadata" : "auto") : "none";

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25, rootMargin: "80px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleError = useCallback(() => {
    setFailed(true);
    onFailed?.();
  }, [onFailed]);

  const attemptPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video || failed) return;

    const ok = await tryPlay(video);
    if (!ok) {
      setPlayBlocked(true);
    } else {
      setPlayBlocked(false);
    }
  }, [failed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;

    if (isMobile) {
      if (!userStarted) {
        video.pause();
        return;
      }
      if (inView) {
        attemptPlayback();
      } else {
        video.pause();
      }
      return;
    }

    if (inView) {
      attemptPlayback();
    } else {
      video.pause();
    }
  }, [inView, isMobile, userStarted, failed, videoSrc, attemptPlayback]);

  const startMobile = async () => {
    setUserStarted(true);
    setPlayBlocked(false);
    const ok = await tryPlay(videoRef.current);
    if (!ok) setPlayBlocked(true);
  };

  const handleManualPlay = async () => {
    setPlayBlocked(false);
    const ok = await tryPlay(videoRef.current, { retries: 3 });
    if (!ok) handleError();
  };

  if (failed) {
    return (
      <img
        src={LANDING_HERO_VIDEO_POSTER}
        alt="Doctor Plumitas presenta GUIAA"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    );
  }

  return (
    <div ref={wrapRef} className="landing-hero-video-wrap">
      <video
        key={videoSrc}
        ref={videoRef}
        loop
        muted
        playsInline
        autoPlay={shouldAutoplay}
        preload={preload}
        poster={LANDING_HERO_VIDEO_POSTER}
        onError={handleError}
        onLoadedData={() => {
          if (shouldAutoplay || (isMobile && userStarted && inView)) {
            attemptPlayback();
          }
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {isMobile && !userStarted && (
        <button
          type="button"
          className="landing-hero-video-play-overlay"
          onClick={startMobile}
          aria-label="Reproducir video en el panel"
        >
          <Play size={22} fill="currentColor" aria-hidden />
          <span className="sr-only">Reproducir video en el panel</span>
        </button>
      )}

      {!isMobile && playBlocked && (
        <button
          type="button"
          className="landing-hero-video-play-overlay landing-hero-video-play-overlay--desktop"
          onClick={handleManualPlay}
          aria-label="Reproducir video en el panel"
        >
          <Play size={22} fill="currentColor" aria-hidden />
          <span className="sr-only">Reproducir video en el panel</span>
        </button>
      )}
    </div>
  );
}
