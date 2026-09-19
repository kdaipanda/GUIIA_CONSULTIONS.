function mockLocation(url) {
  Object.defineProperty(window, "location", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
}

describe("backendUrl", () => {
  const originalLocation = window.location;
  const originalBackendEnv = process.env.REACT_APP_BACKEND_URL;

  afterEach(() => {
    jest.resetModules();
    localStorage.clear();
    if (originalBackendEnv === undefined) {
      delete process.env.REACT_APP_BACKEND_URL;
    } else {
      process.env.REACT_APP_BACKEND_URL = originalBackendEnv;
    }
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("ignora backend_url controlado por querystring en previews de Vercel", () => {
    delete process.env.REACT_APP_BACKEND_URL;
    localStorage.setItem("backend_url", "https://evil.example");
    mockLocation("https://guiia-preview.vercel.app/?backend_url=https://evil.example");

    const { getBackendUrl } = require("./backendUrl");

    expect(getBackendUrl()).toBe("https://guiia-preview.vercel.app");
    expect(localStorage.getItem("backend_url")).toBeNull();
  });

  it("mantiene override local solo en desarrollo", () => {
    delete process.env.REACT_APP_BACKEND_URL;
    mockLocation("http://localhost:3000/?backend_url=http://localhost:8001");

    const { getBackendUrl } = require("./backendUrl");

    expect(getBackendUrl()).toBe("http://localhost:8001");
    expect(localStorage.getItem("backend_url")).toBe("http://localhost:8001");
  });

  it("usa siempre la API oficial en dominios de produccion", () => {
    delete process.env.REACT_APP_BACKEND_URL;
    localStorage.setItem("backend_url", "https://evil.example");
    mockLocation("https://guiaa.vet/?backend_url=https://evil.example");

    const { getBackendUrl } = require("./backendUrl");

    expect(getBackendUrl()).toBe("https://api.guiaa.vet");
  });
});
