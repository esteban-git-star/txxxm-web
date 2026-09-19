/**
 * Öffentliche API-Basis – gleiche Zone wie die Website (kein *.workers.dev).
 * Cloudflare: Worker-Route `tivim-web.com/api*` → tivim-chatbot
 * (Custom Domain api.tivim-web.com bleibt optional parallel möglich.)
 */
window.TIVIM_API = "https://tivim-web.com/api";
