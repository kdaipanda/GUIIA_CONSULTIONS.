import React, { useRef } from "react";
import { PawPrint } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Palabra a palabra con pull-up al entrar en viewport.
 * Usado en el hero GUIAA (estilo Prisma adaptado).
 */
export function WordsPullUp({
  text,
  className = "",
  showAsterisk = false,
  showPaw = false,
  style,
  as: Comp = "span",
}) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const words = String(text || "")
    .split(" ")
    .filter(Boolean);

  return (
    <Comp ref={ref} className={`landing-words-pullup ${className}`.trim()} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={`${word}-${i}`}
            initial={reduceMotion ? false : { y: "0.55em", opacity: 0 }}
            animate={
              reduceMotion || isInView
                ? { y: 0, opacity: 1 }
                : { y: "0.55em", opacity: 0 }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.65,
              delay: reduceMotion ? 0 : i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="landing-words-pullup__word"
            style={{ marginRight: isLast ? 0 : "0.22em" }}
          >
            {word}
            {showPaw && isLast ? (
              <span className="landing-words-pullup__paw" aria-hidden>
                <PawPrint />
              </span>
            ) : null}
            {!showPaw && showAsterisk && isLast ? (
              <span className="landing-words-pullup__asterisk" aria-hidden>
                *
              </span>
            ) : null}
          </motion.span>
        );
      })}
    </Comp>
  );
}

/**
 * Varias frases con clases distintas, misma animación.
 */
export function WordsPullUpMultiStyle({ segments = [], className = "", style }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.35 });

  const words = [];
  segments.forEach((seg) => {
    String(seg.text || "")
      .split(" ")
      .forEach((w) => {
        if (w) words.push({ word: w, className: seg.className });
      });
  });

  return (
    <div
      ref={ref}
      className={`landing-words-pullup landing-words-pullup--multi ${className}`.trim()}
      style={style}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w.word}-${i}`}
          initial={reduceMotion ? false : { y: "0.55em", opacity: 0 }}
          animate={
            reduceMotion || isInView
              ? { y: 0, opacity: 1 }
              : { y: "0.55em", opacity: 0 }
          }
          transition={{
            duration: reduceMotion ? 0 : 0.65,
            delay: reduceMotion ? 0 : i * 0.07,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`landing-words-pullup__word ${w.className || ""}`.trim()}
          style={{ marginRight: "0.22em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
}
