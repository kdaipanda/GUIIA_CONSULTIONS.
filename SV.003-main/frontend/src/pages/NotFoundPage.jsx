import React, { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GuiaaLogoImg } from "../components/GuiaaBrandLockup";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useVet } from "../context/VetContext";
import "./notFoundPage.css";

const SEARCH_DESTINATIONS = [
  { keys: ["dashboard", "inicio", "panel", "home"], view: "dashboard", path: "/app/dashboard" },
  { keys: ["clientes", "pacientes", "clients", "patients"], view: "clients", path: "/app/clientes" },
  { keys: ["agenda", "citas", "calendar"], view: "agenda", path: "/app/agenda" },
  { keys: ["consulta", "cds", "diagnostico", "consultation"], view: "new-consultation", path: "/app/consultas/nueva" },
  { keys: ["historial", "history"], view: "consultation-history", path: "/app/historial" },
  { keys: ["membresia", "planes", "membership", "pricing"], view: "membership", path: "/app/membresia" },
  { keys: ["ayuda", "help", "faq", "soporte", "support"], view: "help", path: "/app/ayuda" },
  { keys: ["perfil", "profile", "cuenta"], view: "profile", path: "/app/perfil" },
];

export function NotFoundPage({ setView }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { veterinarian } = useVet();
  const [query, setQuery] = useState("");

  const home = useMemo(() => {
    if (veterinarian) {
      return { view: "dashboard", path: "/app/dashboard" };
    }
    return { view: "landing", path: "/" };
  }, [veterinarian]);

  const goHome = () => {
    if (typeof setView === "function") setView(home.view);
    navigate(home.path);
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    goHome();
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;

    if (veterinarian) {
      const hit = SEARCH_DESTINATIONS.find((dest) =>
        dest.keys.some((key) => q.includes(key) || key.includes(q)),
      );
      if (hit) {
        if (typeof setView === "function") setView(hit.view);
        navigate(hit.path);
        return;
      }
      if (typeof setView === "function") setView("help");
      navigate(`/app/ayuda?q=${encodeURIComponent(query.trim())}`);
      return;
    }

    if (typeof setView === "function") setView("landing");
    navigate("/#faq");
  };

  return (
    <div className="guiaa-not-found">
      <header className="guiaa-not-found-top">
        <button type="button" className="guiaa-not-found-brand" onClick={goHome}>
          <GuiaaLogoImg tone="auto" className="guiaa-not-found-logo" alt="" />
          <span>GUIAA</span>
        </button>
        <LanguageSwitcher />
      </header>

      <div className="guiaa-not-found-stage" aria-hidden>
        <span className="guiaa-not-found-watermark">404</span>
      </div>

      <main className="guiaa-not-found-main">
        <p className="guiaa-not-found-kicker">{t("notFound.kicker")}</p>
        <h1 className="guiaa-not-found-title">{t("notFound.title")}</h1>
        <p className="guiaa-not-found-lead">{t("notFound.lead")}</p>

        <form className="guiaa-not-found-search" onSubmit={handleSearch} role="search">
          <label className="sr-only" htmlFor="guiaa-not-found-q">
            {t("notFound.searchPlaceholder")}
          </label>
          <div className="guiaa-not-found-search-field">
            <Search size={16} aria-hidden />
            <input
              id="guiaa-not-found-q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("notFound.searchPlaceholder")}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="guiaa-not-found-search-btn">
            {t("notFound.search")}
          </button>
        </form>

        <div className="guiaa-not-found-actions">
          <button type="button" className="guiaa-not-found-btn guiaa-not-found-btn--ghost" onClick={goBack}>
            <ArrowLeft size={16} aria-hidden />
            {t("notFound.goBack")}
          </button>
          <button type="button" className="guiaa-not-found-btn guiaa-not-found-btn--primary" onClick={goHome}>
            {t("notFound.goHome")}
          </button>
        </div>
      </main>
    </div>
  );
}

export default NotFoundPage;
