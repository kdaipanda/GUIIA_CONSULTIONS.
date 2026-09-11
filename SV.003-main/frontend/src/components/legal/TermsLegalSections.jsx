import React from "react";
import { useTranslation } from "react-i18next";
import { TermsLegalSectionsEs } from "./TermsLegalSectionsEs";
import { TermsLegalSectionsEn } from "./TermsLegalSectionsEn";

export function TermsLegalSections() {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("en") ? <TermsLegalSectionsEn /> : <TermsLegalSectionsEs />;
}
