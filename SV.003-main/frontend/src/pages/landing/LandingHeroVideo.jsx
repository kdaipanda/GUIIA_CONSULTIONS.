import React, { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LANDING_HERO_VIDEO,
  LANDING_HERO_VIDEO_POSTER,
} from "./landingBrandAssets";

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

function scheduleIdle(callback, timeout = 600) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 120);
  return () => window.clearTimeout(id);
}

export function LandingHeroVideo({ onFailed }) {
  const { t } = useTranslation("landing");
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [canLoadVideo, setCanLoadVideo] = useState(false);
  const [userStarted, setUserStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05, rootMargin: "80px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Mount video when in view (or user asked to play). Skip auto-mount under reduced-motion until opt-in.
  useEffect(() => {
    if (failed || canLoadVideo) return undefined;
    if (userStarted) {
      setCanLoadVideo(true);
      return undefined;
    }
    if (reduceMotion) return undefined;
    if (!inView) return undefined;
    return scheduleIdle(() => setCanLoadVideo(true));
  }, [inView, canLoadVideo, failed, reduceMotion, userStarted]);

  const handleError = useCallback(() => {
    setFailed(true);
    setIsPlaying(false);
    onFailed?.();
  }, [onFailed]);

  const attemptPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video || failed) return false;
    const ok = await tryPlay(video);
    setPlayBlocked(!ok);
    setIsPlaying(ok && !video.paused);
    return ok;
  }, [failed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed || !canLoadVideo) return undefined;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    // Reduced-motion / mobile: only play after explicit user gesture.
    if ((reduceMotion || isMobile) && !userStarted) {
      video.pause();
      return () => {
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
      };
    }

    if (inView || userStarted) {
      attemptPlayback();
    } else {
      video.pause();
    }

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [
    inView,
    isMobile,
    userStarted,
    failed,
    canLoadVideo,
    reduceMotion,
    attemptPlayback,
  ]);

  const startPlayback = async () => {
    setUserStarted(true);
    setCanLoadVideo(true);
    setPlayBlocked(false);
    setFailed(false);

    // Wait for <video> to mount if it was poster-only.
    requestAnimationFrame(async () => {
      let tries = 0;
      while (!videoRef.current && tries < 8) {
        await new Promise((r) => setTimeout(r, 40));
        tries += 1;
      }
      const ok = await tryPlay(videoRef.current, { retries: 3 });
      setPlayBlocked(!ok);
      setIsPlaying(ok);
      if (!ok && videoRef.current) {
        // Source may still be loading — retry on loadeddata once.
        const video = videoRef.current;
        const once = async () => {
          video.removeEventListener("loadeddata", once);
          const retryOk = await tryPlay(video, { retries: 2 });
          setPlayBlocked(!retryOk);
          setIsPlaying(retryOk);
          if (!retryOk) handleError();
        };
        video.addEventListener("loadeddata", once);
      } else if (!ok) {
        handleError();
      }
    });
  };

  const needsGesture = reduceMotion || isMobile;
  const showPlayOverlay =
    !failed &&
    !isPlaying &&
    (needsGesture ? !userStarted || playBlocked || !canLoadVideo : playBlocked || !canLoadVideo);

  if (failed) {
    return (
      <div ref={wrapRef} className="landing-hero-video-wrap">
        <img
          src={LANDING_HERO_VIDEO_POSTER}
          alt="Doctor Plumitas presenta GUIAA"
          width={800}
          height={1000}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <button
          type="button"
          className="landing-hero-video-play-overlay"
          onClick={startPlayback}
          aria-label={t("hero.playHeroVideo")}
        >
          <Play size={22} fill="currentColor" aria-hidden />
          <span className="landing-hero-video-play-label">{t("hero.playHeroVideo")}</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="landing-hero-video-wrap">
      {canLoadVideo ? (
        <video
          key={LANDING_HERO_VIDEO}
          ref={videoRef}
          loop={!reduceMotion}
          muted
          playsInline
          autoPlay={!reduceMotion && !isMobile && inView}
          preload="metadata"
          poster={LANDING_HERO_VIDEO_POSTER}
          onError={handleError}
          onLoadedData={() => {
            if (userStarted || (!reduceMotion && !isMobile && inView)) {
              attemptPlayback();
            }
          }}
        >
          <source src={LANDING_HERO_VIDEO} type="video/mp4" />
        </video>
      ) : (
        <img
          src={LANDING_HERO_VIDEO_POSTER}
          alt=""
          aria-hidden
          width={800}
          height={1000}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="landing-hero-video-poster"
        />
      )}

      {showPlayOverlay && (
        <button
          type="button"
          className="landing-hero-video-play-overlay"
          onClick={startPlayback}
          aria-label={t("hero.playHeroVideo")}
        >
          <Play size={22} fill="currentColor" aria-hidden />
          <span className="landing-hero-video-play-label">{t("hero.playHeroVideo")}</span>
        </button>
      )}
    </div>
  );
}
