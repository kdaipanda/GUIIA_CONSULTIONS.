import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { BACKEND_URL } from "../lib/backendUrl";
import { notifyError, notifySuccess } from "../lib/appToast";
import { LegacySpeciesFormBridge } from "./LegacySpeciesFormBridge";

const DEFAULT_SPECIES_IDS = [
  "perro",
  "gato",
  "tortuga",
  "erizo",
  "huron",
  "iguana",
  "hamster",
  "patos_pollos",
  "aves",
  "conejo",
];

const AnimalConsultForm = ({ veterinarianId, onSuccess }) => {
  const { t } = useTranslation("clinic");
  const [species, setSpecies] = useState("");
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultSpecies = useMemo(
    () =>
      DEFAULT_SPECIES_IDS.map((id) => ({
        id,
        name: t(`legacyAnimalForm.species.${id}`),
      })),
    [t],
  );

  useEffect(() => {
    loadSpecies();
  }, [defaultSpecies]);

  const loadSpecies = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/species`);
      const apiSpecies = response.data || defaultSpecies;
      setSpeciesList(
        apiSpecies.map((item) => ({
          ...item,
          name: t(`legacyAnimalForm.species.${item.id}`, { defaultValue: item.name }),
        })),
      );
    } catch (err) {
      console.warn("No se pudo cargar la lista de especies desde el API, usando lista por defecto");
      setSpeciesList(defaultSpecies);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (consultationData) => {
    try {
      const payload = {
        veterinarian_id: veterinarianId,
        species: species,
        consultation_data: consultationData,
      };

      const response = await axios.post(`${BACKEND_URL}/api/animal-consults`, payload);

      notifySuccess(t("legacyAnimalForm.saveSuccess"));

      if (onSuccess) {
        onSuccess(response.data);
      }

      setTimeout(() => {
        setSpecies("");
      }, 2000);
    } catch (err) {
      notifyError(err.response?.data?.detail || t("legacyAnimalForm.saveError"));
      console.error("Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {t("legacyAnimalForm.title")}
        </h2>

        {!species && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              {t("legacyAnimalForm.selectLabel")}
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("legacyAnimalForm.selectPlaceholder")}</option>
              {speciesList.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {species && (
          <LegacySpeciesFormBridge
            speciesId={species}
            onSubmit={handleSubmit}
            onCancel={() => setSpecies("")}
          />
        )}
      </div>
    </div>
  );
};

export default AnimalConsultForm;
