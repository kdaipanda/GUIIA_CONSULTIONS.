import React from "react";
import { useTranslation } from "react-i18next";

function LegalList({ items }) {
  if (!Array.isArray(items)) return null;
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalIntro({ privacy = false }) {
  const { t } = useTranslation("legal");
  return (
    <div className="legal-modal__intro">
      <h2>{t("intro.title")}</h2>
      <p>
        <strong>{t("intro.grade")}</strong>
        {privacy ? t("intro.privacyDoc") : t("intro.termsDoc")}
      </p>
      <p className="legal-modal__intro-meta">{t("intro.updated")}</p>
    </div>
  );
}

export function PrivacyPolicyBody() {
  const { t } = useTranslation("legal");

  return (
    <>
      <h3 id="legal-privacy">{t("privacyPolicy.title")}</h3>
      <h4>{t("privacyPolicy.frameworkTitle")}</h4>
      <p>{t("privacyPolicy.frameworkIntro")}</p>
      <LegalList items={t("privacyPolicy.frameworkItems", { returnObjects: true })} />

      <h4>{t("privacyPolicy.collectedTitle")}</h4>
      <p>{t("privacyPolicy.collectedIntro")}</p>
      <LegalList items={t("privacyPolicy.collectedItems", { returnObjects: true })} />

      <h4>{t("privacyPolicy.useTitle")}</h4>
      <p>{t("privacyPolicy.useIntro")}</p>
      <LegalList items={t("privacyPolicy.useItems", { returnObjects: true })} />

      <h4>{t("privacyPolicy.securityTitle")}</h4>
      <p>{t("privacyPolicy.securityIntro")}</p>
      <LegalList items={t("privacyPolicy.securityItems", { returnObjects: true })} />

      <h4>{t("privacyPolicy.rightsTitle")}</h4>
      <p>{t("privacyPolicy.rightsIntro")}</p>
      <LegalList items={t("privacyPolicy.rightsItems", { returnObjects: true })} />

      <div className="legal-modal__contact">
        <p>
          {t("privacyPolicy.contact")}{" "}
          <a href="mailto:privacidad@guiaa.com">privacidad@guiaa.com</a>.
        </p>
      </div>
    </>
  );
}
