import {
  LANDING_DEFERRED_REVEAL_EVENT,
  scrollToLandingHash,
  scrollToLandingSection,
} from "./landingScroll";

describe("landingScroll", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("pide revelar una seccion diferida cuando el ancla aun no existe", () => {
    const revealHandler = jest.fn();
    window.addEventListener(LANDING_DEFERRED_REVEAL_EVENT, revealHandler);

    scrollToLandingSection("#pricing");

    expect(revealHandler).toHaveBeenCalledTimes(1);
    expect(revealHandler.mock.calls[0][0].detail).toBe("#pricing");

    window.removeEventListener(LANDING_DEFERRED_REVEAL_EVENT, revealHandler);
  });

  it("resuelve hashes de producto hacia la seccion product", () => {
    const product = document.createElement("section");
    product.id = "product";
    product.scrollIntoView = jest.fn();
    document.body.appendChild(product);

    scrollToLandingHash("#product-species", { behavior: "auto" });

    expect(product.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });
});
