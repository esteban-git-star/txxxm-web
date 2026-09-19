/**
 * Öffentliche API-Basis – gleiche Zone wie die Website (kein *.workers.dev).
 * Cloudflare: Routes `tivim-web.com/api` + `tivim-web.com/api/*` → tivim-chatbot
 * (nicht `api*` – das würde Dateien wie api-config.js mitfangen)
 */
window.TIVIM_API = "https://tivim-web.com/api";
