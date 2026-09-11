import { useTranslation } from "react-i18next";

/**
 * Helpers for species consultation form labels (namespace: speciesForms).
 */
export function useSpeciesFormI18n(speciesKey = "perros") {
  const { t } = useTranslation("speciesForms");

  const field = (id) => t(`fields.${id}`, { defaultValue: id });
  const placeholder = (id) => t(`placeholders.${id}`, { defaultValue: "" });
  const section = (id) => t(`sections.${id}`, { defaultValue: id });
  const category = (id) => t(`categories.${id}`, { defaultValue: id });
  const title = (id = speciesKey) =>
    t(`titles.${id}`, { defaultValue: t("categoryTitle") });
  const sex = (id) => t(`sex.${id}`, { defaultValue: id });
  const reproductive = (id) => t(`reproductive.${id}`, { defaultValue: id });
  const bodyCondition = (id) => t(`bodyCondition.${id}`, { defaultValue: id });

  return {
    t,
    field,
    placeholder,
    section,
    category,
    title,
    sex,
    reproductive,
    bodyCondition,
  };
}
