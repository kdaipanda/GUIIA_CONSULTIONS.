import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import "./star-rating.css";

const starRatingVariants = cva("star-rating", {
  variants: {
    size: {
      sm: "star-rating--sm",
      md: "star-rating--md",
      lg: "star-rating--lg",
    },
    layout: {
      stack: "star-rating--stack",
      inline: "star-rating--inline",
    },
  },
  defaultVariants: {
    size: "md",
    layout: "inline",
  },
});

const SIZE_PX = {
  sm: 14,
  md: 20,
  lg: 28,
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundToHalf(n) {
  return Math.round(n * 2) / 2;
}

function StarGlyph({
  dimension,
  fillAmount,
  color,
  emptyColor,
  gradientId,
}) {
  const path =
    "M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.77l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z";

  if (fillAmount >= 0.99) {
    return (
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        aria-hidden
        className="star-rating__glyph"
      >
        <path d={path} fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (fillAmount <= 0.01) {
    return (
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        aria-hidden
        className="star-rating__glyph"
      >
        <path
          d={path}
          fill="none"
          stroke={emptyColor}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const pct = clamp(fillAmount, 0, 1) * 100;

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      aria-hidden
      className="star-rating__glyph"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset={`${pct}%`} stopColor={color} />
          <stop offset={`${pct}%`} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill={`url(#${gradientId})`}
        stroke={emptyColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d={path}
        fill="none"
        stroke={emptyColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Star rating GUIAA — lectura e interacción.
 *
 * @param {object} props
 * @param {number} [props.value=0] — valor actual (admite medios si allowHalf)
 * @param {number} [props.max=5] — cantidad de estrellas
 * @param {"sm"|"md"|"lg"} [props.size="md"]
 * @param {"stack"|"inline"} [props.layout="inline"]
 * @param {string} [props.color] — color de relleno (default token)
 * @param {string} [props.emptyColor] — color de contorno vacío
 * @param {boolean} [props.allowHalf=true] — muestra medios en modo lectura
 * @param {boolean} [props.readOnly=false]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.label] — texto bajo/al lado
 * @param {string} [props["aria-label"]]
 * @param {(value: number) => void} [props.onChange]
 * @param {string} [props.className]
 */
export function StarRating({
  value = 0,
  max = 5,
  size = "md",
  layout = "inline",
  color,
  emptyColor,
  allowHalf = true,
  readOnly = false,
  disabled = false,
  label,
  "aria-label": ariaLabel,
  onChange,
  className,
  getStarAriaLabel,
}) {
  const uid = React.useId();
  const [hoverValue, setHoverValue] = React.useState(0);
  const starCount = Math.max(1, Math.floor(Number(max) || 5));
  const dimension = SIZE_PX[size] || SIZE_PX.md;
  const interactive = !readOnly && typeof onChange === "function" && !disabled;

  const numericValue = Number(value) || 0;
  const displaySource = interactive && hoverValue > 0 ? hoverValue : numericValue;
  const displayValue = allowHalf
    ? roundToHalf(clamp(displaySource, 0, starCount))
    : Math.round(clamp(displaySource, 0, starCount));

  const fillColor = color || "var(--star-rating-fill, #f5c518)";
  const voidColor = emptyColor || "var(--star-rating-empty, currentColor)";

  const handleSelect = (next) => {
    if (!interactive) return;
    onChange(next);
  };

  return (
    <div
      className={cn(starRatingVariants({ size, layout }), className, {
        "star-rating--interactive": interactive,
        "star-rating--disabled": disabled,
      })}
      style={{
        "--star-rating-active": fillColor,
        "--star-rating-void": voidColor,
      }}
    >
      <div
        className="star-rating__stars"
        role={interactive ? "radiogroup" : "img"}
        aria-label={
          ariaLabel ||
          (label
            ? undefined
            : `${displayValue} de ${starCount}`)
        }
        onMouseLeave={() => interactive && setHoverValue(0)}
      >
        {Array.from({ length: starCount }, (_, index) => {
          const starIndex = index + 1;
          const rawFill = displayValue - index;
          const fillAmount = clamp(rawFill, 0, 1);
          const selected = numericValue >= starIndex;

          if (!interactive) {
            return (
              <span key={starIndex} className="star-rating__star" aria-hidden>
                <StarGlyph
                  dimension={dimension}
                  fillAmount={fillAmount}
                  color={fillColor}
                  emptyColor={voidColor}
                  gradientId={`${uid}-g-${starIndex}`}
                />
              </span>
            );
          }

          return (
            <button
              key={starIndex}
              type="button"
              className={cn("star-rating__star", "star-rating__star--btn", {
                "is-active": selected || hoverValue >= starIndex,
              })}
              role="radio"
              aria-checked={numericValue === starIndex}
              aria-label={
                getStarAriaLabel?.(starIndex) ||
                `${starIndex} de ${starCount}`
              }
              disabled={disabled}
              onMouseEnter={() => setHoverValue(starIndex)}
              onFocus={() => setHoverValue(starIndex)}
              onClick={() => handleSelect(starIndex)}
            >
              <StarGlyph
                dimension={dimension}
                fillAmount={
                  (hoverValue || numericValue) >= starIndex ? 1 : 0
                }
                color={fillColor}
                emptyColor={voidColor}
                gradientId={`${uid}-g-${starIndex}`}
              />
            </button>
          );
        })}
      </div>
      {label ? <span className="star-rating__label">{label}</span> : null}
    </div>
  );
}

export default StarRating;
