import { hydrateFormDataFromChart } from "./clinicalChartSync";

describe("clinicalChartSync", () => {
  it("ignora snapshots guardados para otra categoria de especie", () => {
    const result = hydrateFormDataFromChart(
      "gatos",
      {
        form_category: "perros",
        form_snapshot: {
          raza: "Labrador",
          vacunas_vigentes: "NO",
          solo_perro: "no debe persistir",
        },
        allergies: [{ label: "Polen" }],
        vaccines: [{ label: "Rabia" }],
      },
      {
        name: "Michi",
        breed: "Siames",
        sex: "hembra",
        weight_kg: 4.2,
        clients: { name: "Ana" },
      },
      null,
    );

    expect(result.raza).toBe("Siames");
    expect(result.vacunas_vigentes).toBe("SI");
    expect(result.vacunas_cual).toBe("Rabia");
    expect(result.alergias).toBe("Polen");
    expect(result.solo_perro).toBeUndefined();
  });

  it("reutiliza snapshots de la misma especie incluso con alias legacy", () => {
    const result = hydrateFormDataFromChart(
      "perros",
      {
        form_category: "perro",
        form_snapshot: {
          raza: "Mestizo",
          vacunas_vigentes: "NO",
        },
        vaccines: [{ label: "Rabia" }],
      },
      { breed: "Pastor" },
      null,
    );

    expect(result.raza).toBe("Mestizo");
    expect(result.vacunas_vigentes).toBe("NO");
    expect(result.vacunas_cual).toBe("Rabia");
  });
});
