import React from "react";
import { cn } from "../../lib/utils";

/**
 * Card with photo background and hover-reveal emphasis.
 * Used in the landing species carousel.
 */
export function HoverRevealCard({
  title,
  subtitle,
  imageUrl,
  href,
  onClick,
  className,
  decorative = false,
}) {
  const label = subtitle ? `${title}, ${subtitle}` : title;
  const classNames = cn(
    "landing-species-card group/card relative h-80 w-[13.5rem] shrink-0 cursor-pointer overflow-hidden rounded-xl bg-cover bg-center shadow-lg outline-none transition-all duration-500 ease-in-out sm:w-[15rem]",
    "focus-visible:ring-2 focus-visible:ring-[#3d9b8f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc]",
    className,
  );

  const content = (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover/card:scale-105"
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0c2d4d]/90 via-[#0c2d4d]/35 to-transparent"
        aria-hidden
      />
      <div className="absolute bottom-0 left-0 p-5 text-white">
        {subtitle ? (
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white/80">
            {subtitle}
          </p>
        ) : null}
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {title}
        </h3>
      </div>
    </>
  );

  if (decorative) {
    return (
      <div className={classNames} role="presentation" aria-hidden>
        {content}
      </div>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={classNames}
        role="listitem"
        aria-label={label}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-label={label}
      className={classNames}
    >
      {content}
    </div>
  );
}

/**
 * Grid of hover-reveal cards (static). For the landing marquee, prefer
 * mapping HoverRevealCard inside the animated track.
 */
export function HoverRevealCards({ items, className, cardClassName }) {
  return (
    <div
      role="list"
      className={cn(
        "landing-hover-reveal-grid group grid w-full max-w-6xl grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <HoverRevealCard
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          imageUrl={item.imageUrl}
          href={item.href}
          onClick={item.onClick}
          className={cn("h-80 w-full", cardClassName)}
        />
      ))}
    </div>
  );
}

export default HoverRevealCards;
