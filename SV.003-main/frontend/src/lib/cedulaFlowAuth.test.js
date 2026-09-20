import { finalizeCedulaFlowEntry } from "./cedulaFlowAuth";

describe("finalizeCedulaFlowEntry", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("hidrata el perfil completo cuando verify/skip devuelve un JWT", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "vet-1",
        email: "vet@example.com",
        nombre: "Dra. Vet",
        membership_type: null,
        consultations_remaining: 3,
      }),
    });

    const result = await finalizeCedulaFlowEntry({
      email: "vet@example.com",
      veterinarian_id: "vet-1",
      authPayload: {
        access_token: "token-123",
        token_type: "bearer",
        expires_in: 3600,
        id: "vet-1",
        email: "vet@example.com",
        nombre: "Dra. Vet",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/profile"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
          "x-veterinarian-id": "vet-1",
        }),
      }),
    );
    expect(result).toMatchObject({
      id: "vet-1",
      membership_type: null,
      consultations_remaining: 3,
      access_token: "token-123",
      token_type: "bearer",
      expires_in: 3600,
    });
  });
});
