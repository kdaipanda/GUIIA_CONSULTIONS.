import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import "./lib/loadI18nNamespace";
import "./index.css";
import App from "./App";
import { initMetaPixel } from "./lib/metaPixel";
import { initNativeApp } from "./lib/nativeApp";

initMetaPixel();
void initNativeApp();

/** Evita pantalla blanca tras deploys: chunk viejo/cacheado → recarga limpia una vez. */
window.addEventListener("error", (event) => {
  const message = String(event?.message || event?.error?.message || "");
  const isChunkError =
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch dynamically imported module");
  if (!isChunkError) return;
  try {
    const key = "guiaa_chunk_reload";
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  } catch {
    window.location.reload();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
