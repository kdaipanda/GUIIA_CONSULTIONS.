import React from "react";
import { useLocation } from "react-router-dom";

/**
 * Reinicia la animación de entrada al cambiar de ruta.
 */
export function PageEnter({ children, className = "" }) {
  const { pathname } = useLocation();

  return (
    <div
      key={pathname}
      className={`premium-page-enter ${className}`.trim()}
    >
      {children}
    </div>
  );
}
