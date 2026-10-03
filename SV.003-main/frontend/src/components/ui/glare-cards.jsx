import React, { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

const GlareCard = React.forwardRef(
  (
    {
      children,
      className,
      glareColor = "rgba(38, 91, 147, 0.22)",
      tiltIntensity = 8,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef(null);
    const prefersReducedMotion = useReducedMotion();
    const [isHovered, setIsHovered] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 28, stiffness: 160, mass: 0.55 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const rotateX = useTransform(springY, (y) => y * -tiltIntensity);
    const rotateY = useTransform(springX, (x) => x * tiltIntensity);
    const glareX = useTransform(springX, (x) => x * 100);
    const glareY = useTransform(springY, (y) => y * 100);
    const borderX = useTransform(springX, (x) => x * 50);
    const borderY = useTransform(springY, (y) => y * 50);
    const shimmerX = useTransform(springX, (x) => `${x * -16}%`);

    const backgroundGlare = useMotionTemplate`radial-gradient(
      circle at calc(50% + ${glareX}%) calc(50% + ${glareY}%),
      ${glareColor} 0%,
      transparent 72%
    )`;

    const borderHighlight = useMotionTemplate`conic-gradient(
      from 0deg at calc(50% + ${borderX}%) calc(50% + ${borderY}%),
      transparent,
      ${glareColor},
      transparent
    )`;

    const handleMouseMove = (e) => {
      if (!internalRef.current || prefersReducedMotion) return;

      const rect = internalRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      mouseX.set((e.clientX - centerX) / (rect.width / 2));
      mouseY.set((e.clientY - centerY) / (rect.height / 2));
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      mouseX.set(0);
      mouseY.set(0);
    };

    return (
      <motion.div
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
          perspective: 1000,
        }}
        className={cn(
          "relative group isolate overflow-hidden rounded-[14px] border border-[color-mix(in_srgb,#265b93_12%,transparent)] bg-white/95 p-5 transition-all duration-300",
          "shadow-[0_2px_12px_-6px_rgba(12,45,77,0.08)]",
          "hover:border-[color-mix(in_srgb,#265b93_28%,transparent)] hover:shadow-[0_10px_28px_-14px_rgba(12,45,77,0.22)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#265b93]",
          className,
        )}
        {...props}
      >
        <motion.div
          className="absolute inset-[-1px] z-30 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
          style={{
            background: borderHighlight,
            WebkitMaskImage:
              "linear-gradient(#fff, #fff), linear-gradient(#fff, #fff)",
            WebkitMaskComposite: "destination-out",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />

        <motion.div
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
          style={{ background: backgroundGlare }}
        />

        <motion.div
          className="pointer-events-none absolute inset-[-50%] z-0 rotate-[12deg] opacity-0 transition-opacity duration-700 group-hover:opacity-[0.08]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(38,91,147,0.45), transparent)",
            x: shimmerX,
          }}
        />

        <div
          className="relative z-40 h-full w-full"
          style={{
            transform: prefersReducedMotion ? "none" : "translateZ(28px)",
            filter: isHovered
              ? "drop-shadow(0 10px 18px rgba(12,45,77,0.12))"
              : "none",
            transition: "filter 0.35s ease",
          }}
        >
          {children}
        </div>
      </motion.div>
    );
  },
);

GlareCard.displayName = "GlareCard";

export { GlareCard };
