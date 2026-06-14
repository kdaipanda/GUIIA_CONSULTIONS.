import React from "react";

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img src="/GuiaLogo-mark.png" alt="GUIAA" className="loading-logo" />
      <div className="loading-spinner"></div>
      <p>Cargando GUIAA...</p>
    </div>
  );
}
