import { useEffect, useState } from "react";
import { LANDING_DEFERRED_READY_EVENT } from "./landingScroll";

export function useLandingScrollSpy(sectionIds, { rootMargin = "-24% 0px -58% 0px" } = {}) {
  const [activeId, setActiveId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const sectionKey = Array.isArray(sectionIds) ? sectionIds.join("|") : "";

  useEffect(() => {
    const refreshSections = () => setRefreshKey((key) => key + 1);
    window.addEventListener(LANDING_DEFERRED_READY_EVENT, refreshSections);
    return () => window.removeEventListener(LANDING_DEFERRED_READY_EVENT, refreshSections);
  }, []);

  useEffect(() => {
    const ids = sectionKey ? sectionKey.split("|") : [];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const nextId = visible[0]?.target?.id || null;
        if (nextId) {
          setActiveId((prev) => (prev === nextId ? prev : nextId));
        }
      },
      { rootMargin, threshold: [0, 0.15, 0.35, 0.55] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionKey, rootMargin, refreshKey]);

  return activeId;
}
