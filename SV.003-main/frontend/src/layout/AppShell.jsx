import React from "react";

/**
 * Contenedor común para vistas autenticadas: ancho máximo y padding horizontal homogéneos.
 * `fullBleed` evita el max-width cuando la vista ya define su propio layout (p. ej. dashboard).
 */
export function AppShell({ children, fullBleed = false }) {
  if (fullBleed) {
    return <div className="app-shell app-shell--full w-full">{children}</div>;
  }
  return (
    <div className="app-shell w-full">
      <div className="app-shell-inner mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
