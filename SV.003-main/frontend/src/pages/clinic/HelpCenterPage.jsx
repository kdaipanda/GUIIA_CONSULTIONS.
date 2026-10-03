import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dispatchOpenHelp } from "../../lib/supportReadState";
import { HELP_TOPIC_IDS } from "../../lib/helpCenter";
import "./clinicPageShared.css";
import "./helpCenterPage.css";

/**
 * /app/ayuda abre el centro de ayuda dentro del chat y vuelve al dashboard.
 */
export function HelpCenterPage({ setView }) {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const topic = searchParams.get("tema");
    dispatchOpenHelp(HELP_TOPIC_IDS.includes(topic) ? topic : null);
    setView?.("dashboard");
    navigate("/app/dashboard", { replace: true });
  }, [searchParams, setView, navigate]);

  return (
    <div className="clinic-page clinic-page-guiaa help-center-page">
      <div className="clinic-page-header">
        <div>
          <h1>{t("title")}</h1>
          <p>{t("openingChat")}</p>
        </div>
      </div>
    </div>
  );
}
