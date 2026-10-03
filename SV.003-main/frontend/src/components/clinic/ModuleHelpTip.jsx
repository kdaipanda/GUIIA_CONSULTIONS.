import React from "react";
import { useTranslation } from "react-i18next";
import { CircleHelp } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { dispatchOpenHelp } from "../../lib/supportReadState";
import "../../pages/clinic/helpCenterPage.css";

/**
 * Tip contextual (?) en cabeceras de módulo — abre la guía en el chat de ayuda.
 * @param {{ topicId: string, setView?: (view: string) => void }} props
 */
export function ModuleHelpTip({ topicId }) {
  const { t } = useTranslation("help");

  if (!topicId) return null;

  const openGuide = () => {
    dispatchOpenHelp(topicId);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="module-help-tip-btn" aria-label={t("tipAria")}>
          <CircleHelp size={18} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="module-help-tip-panel">
        <p className="module-help-tip-title">{t(`topics.${topicId}.title`)}</p>
        <p className="module-help-tip-body">{t(`topics.${topicId}.tip`)}</p>
        <Button type="button" size="sm" className="w-full min-h-11" onClick={openGuide}>
          {t("tipCta")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
