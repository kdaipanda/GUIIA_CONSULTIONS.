import React from "react";
import { cn } from "../lib/utils";

/**
 * Pastilla de oferta Premium (FRIENDS40) — UI GUIAA (navy / teal).
 */
export function MembershipPromoOffer({
  badge,
  message,
  code,
  className,
}) {
  return (
    <div
      className={cn("guiaa-promo-offer", className)}
      role="status"
      aria-label={`${badge}. ${message}${code ? ` ${code}` : ""}`}
    >
      <span className="guiaa-promo-offer-badge">{badge}</span>
      <p className="guiaa-promo-offer-text">
        {message}
        {code ? (
          <>
            {" "}
            <strong className="guiaa-promo-offer-code">{code}</strong>
          </>
        ) : null}
      </p>
    </div>
  );
}

export default MembershipPromoOffer;
