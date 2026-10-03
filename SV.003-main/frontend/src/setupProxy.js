/**
 * Solo proxy de API al backend. Sin esto, CRA reenvía /login, /registro, etc.
 * al uvicorn y el hard-refresh de rutas SPA falla con 405.
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function setupProxy(app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
    }),
  );
};
