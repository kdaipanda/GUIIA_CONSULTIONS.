import { useEffect, useState } from "react";

export function useLandingScrollSpy(sectionIds, { rootMargin = "-24% 0px -58% 0px" } = {}) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin, threshold: [0, 0.15, 0.35, 0.55] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionIds, rootMargin]);

  return activeId;
}
